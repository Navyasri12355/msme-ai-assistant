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

  const res = await client.post('/chat/completions', payload);
  
  // Validate response content
  const responseContent = res.data.choices?.[0]?.message?.content || res.data?.response;
  if (responseContent && isCorruptedResponse(responseContent)) {
    console.warn('Detected corrupted AI response, retrying...');
    // Retry once with lower temperature
    const retryPayload = { ...payload, temperature: 0.3 };
    const retryRes = await client.post('/chat/completions', retryPayload);
    return retryRes.data;
  }
  
  return res.data;
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