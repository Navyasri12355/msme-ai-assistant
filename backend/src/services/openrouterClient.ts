import axios, { AxiosInstance } from 'axios';
import config from '../config/env';

let client: AxiosInstance | null = null;
let initialized = false;

/**
 * Initialize the OpenRouter HTTP client
 * - apiKey: use config.ai.openrouterApiKey or pass explicitly
 * - baseUrl: optional override (env OPENROUTER_API_URL)
 */
export function initOpenRouter(apiKey?: string, baseUrl?: string) {
  const key = apiKey || config.ai.openrouterApiKey;
  if (!key) {
    // Don't throw here; allow calling code to handle missing key
    return;
  }

  const url = baseUrl || process.env.OPENROUTER_API_URL || 'https://openrouter.ai/api/v1';

  client = axios.create({
    baseURL: url,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'http://localhost:3000', // Required for OpenRouter
      'X-Title': 'MSME AI Assistant', // Optional: helps with OpenRouter analytics
    },
    timeout: 15_000,
  });

  initialized = true;
}

export async function createChatCompletion(opts: {
  model: string;
  messages: any[];
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
}) {
  if (!initialized || !client) {
    throw new Error('OpenRouter client not initialized');
  }

  const payload = {
    model: opts.model,
    messages: opts.messages,
    max_tokens: opts.max_tokens || 1000,
    temperature: opts.temperature ?? 0.7,
    top_p: opts.top_p ?? 0.9,
  };

  // Try primary model first, then fallback models
  const modelsToTry = [opts.model, ...config.ai.fallbackModels.filter(m => m !== opts.model)];
  let globalLastError: any;
  
  for (const modelToTry of modelsToTry) {
    const currentPayload = { ...payload, model: modelToTry };
    
    // Retry logic for handling rate limits and temporary errors
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const res = await client.post('/chat/completions', currentPayload);
        
        // Validate response content
        const responseContent = res.data.choices?.[0]?.message?.content || res.data?.response;
        if (responseContent && isCorruptedResponse(responseContent)) {
          console.warn('Detected corrupted AI response, retrying...');
          // Retry once with lower temperature
          const retryPayload = { ...currentPayload, temperature: 0.3 };
          const retryRes = await client.post('/chat/completions', retryPayload);
          return retryRes.data;
        }
        
        // If we get here, the request was successful
        if (modelToTry !== opts.model) {
          console.log(`Successfully used fallback model: ${modelToTry}`);
        }
        return res.data;
      } catch (error: any) {
        lastError = error;
        globalLastError = error;
        
        // Handle specific error codes
        if (error.response?.status === 402) {
          console.error(`OpenRouter API: Payment required (402) for model ${modelToTry}. Trying next model...`);
          // For 402 errors, try next model instead of throwing immediately
          break; // Try next model
        } else if (error.response?.status === 400) {
          console.warn(`OpenRouter API: Bad request (400) for model ${modelToTry}. Message format issue. Trying next model...`);
          break; // Try next model
        } else if (error.response?.status === 404) {
          console.warn(`OpenRouter API: Model ${modelToTry} not found (404). Trying next model...`);
          break; // Try next model
        } else if (error.response?.status === 429) {
          // Rate limit - wait before retry
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
          console.warn(`OpenRouter API rate limit hit. Retrying in ${waitTime}ms... (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        } else if (error.response?.status >= 500) {
          // Server error - retry
          const waitTime = 1000 * attempt;
          console.warn(`OpenRouter API server error (${error.response.status}). Retrying in ${waitTime}ms... (attempt ${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        } else {
          // Other errors - try next model
          console.warn(`OpenRouter API error with model ${modelToTry}:`, error.response?.data || error.message);
          break; // Try next model
        }
      }
    }
    
    // If we get here, all retries for this model failed, try next model
    console.warn(`All retry attempts failed for model ${modelToTry}, trying next model...`);
  }

  // If we get here, all models failed
  console.error('OpenRouter API: All models and retry attempts failed');
  
  // Check if the last error was a 402 (payment required) for all models
  if (globalLastError?.response?.status === 402) {
    throw new Error('All available free models require payment. The service will use basic responses.');
  }
  
  throw globalLastError || new Error('All AI models failed');
}

export function isInitialized() {
  return initialized;
}

/**
 * Check if response contains corrupted or suspicious content
 */
function isCorruptedResponse(content: string): boolean {
  // Check for suspicious patterns that indicate corruption
  const suspiciousPatterns = [
    /[A-Za-z0-9+/]{20,}={1,2}/, // Base64-like strings
    /[A-Za-z0-9]{30,}/, // Long random alphanumeric strings
    /[^a-zA-Z0-9\s.,!?'"()-:;%₹$@#&*+=/\n\r]{5,}/, // Unusual character sequences
    /\b[A-Za-z0-9]{15,}\b/, // Single words with 15+ characters (likely corrupted)
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(content));
}