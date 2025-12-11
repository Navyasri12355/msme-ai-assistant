# Google Gemini API Setup Guide

This guide explains how to set up Google's Gemini API (which includes Gemma models) for the MSME AI Assistant's conversational AI features.

## 🚀 Quick Setup

### Step 1: Get Your Google API Key

1. **Go to Google AI Studio:**
   Visit: https://makersuite.google.com/app/apikey
   
2. **Sign in with your Google account**

3. **Create API Key:**
   - Click "Create API Key"
   - Choose "Create API key in new project" (or select an existing project)
   - Copy the generated API key

### Step 2: Add API Key to Your `.env` File

Open `backend/.env` and add your API key:

```env
# AI Service Configuration
GOOGLE_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-pro
```

**Example:**
```env
GOOGLE_API_KEY=AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY
GEMINI_MODEL=gemini-pro
```

### Step 3: Restart Your Backend

```bash
cd backend
npm run dev
```

That's it! Your conversational AI will now use Gemini for enhanced responses! 🎉

---

## 🤖 Available Models

You can change the model in your `.env` file:

### Gemini Pro (Recommended)
```env
GEMINI_MODEL=gemini-pro
```
- Best for text generation
- Fast and efficient
- Free tier available

### Gemini Pro Vision
```env
GEMINI_MODEL=gemini-pro-vision
```
- Supports image inputs
- Good for multimodal tasks

---

## 💡 How It Works

The system uses a **hybrid approach**:

1. **Rule-based intent detection** - Fast classification of user queries
2. **Gemini AI enhancement** - Generates contextual, personalized responses
3. **Fallback mechanism** - If Gemini is unavailable, uses rule-based responses

### Example Flow:

```
User: "How can I reduce my costs?"
  ↓
System detects intent: "cost_cutting"
  ↓
Gathers business context (profile, financial data)
  ↓
Sends to Gemini with context
  ↓
Gemini generates personalized advice
  ↓
Returns enhanced response to user
```

---

## 🔒 API Key Security

### ⚠️ NEVER:
- Commit your API key to Git
- Share your API key publicly
- Use the same key for development and production

### ✅ DO:
- Keep your `.env` file in `.gitignore`
- Use different API keys for dev/staging/production
- Rotate keys regularly
- Monitor your API usage

---

## 💰 Pricing & Limits

### Free Tier:
- **60 requests per minute**
- **1,500 requests per day**
- Perfect for development and small-scale use

### Paid Tier:
- Higher rate limits
- More requests per day
- Production-ready

Check current pricing: https://ai.google.dev/pricing

---

## 🐛 Troubleshooting

### Error: "API key not valid"
**Solution:** 
- Check that you copied the entire API key
- Make sure there are no extra spaces
- Verify the key is enabled in Google Cloud Console

### Error: "Quota exceeded"
**Solution:**
- You've hit the free tier limit
- Wait for the quota to reset (daily/minute limits)
- Or upgrade to a paid plan

### No AI responses (falling back to rules)
**Solution:**
- Check that `GOOGLE_API_KEY` is set in `.env`
- Restart your backend server
- Check console logs for error messages

### Error: "Model not found"
**Solution:**
- Verify `GEMINI_MODEL` is set correctly
- Use `gemini-pro` for text generation
- Check https://ai.google.dev/models for available models

---

## 🧪 Testing the Integration

### Test 1: Basic Query
```bash
curl -X POST http://localhost:3000/api/conversational-ai/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"query": "How can I reduce my business costs?"}'
```

### Test 2: Growth Strategy
```bash
curl -X POST http://localhost:3000/api/conversational-ai/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"query": "What strategies can help me grow my business?"}'
```

---

## 📚 Additional Resources

- **Google AI Studio:** https://makersuite.google.com/
- **Gemini API Documentation:** https://ai.google.dev/docs
- **Available Models:** https://ai.google.dev/models/gemini
- **Pricing:** https://ai.google.dev/pricing
- **Best Practices:** https://ai.google.dev/docs/best_practices

---

## 🎯 Features Enabled by Gemini

With Gemini integrated, your conversational AI can:

✅ Generate personalized business advice based on your specific context  
✅ Provide industry-specific recommendations  
✅ Adapt responses based on your business profile and financial data  
✅ Answer complex business questions with nuanced understanding  
✅ Offer creative solutions tailored to your situation  

---

## 🔄 Switching Models

Want to try different models? Just update your `.env`:

```env
# For standard text generation (recommended)
GEMINI_MODEL=gemini-pro

# For experimental features
GEMINI_MODEL=gemini-1.5-pro

# For faster responses (when available)
GEMINI_MODEL=gemini-1.5-flash
```

Then restart your server!

---

## 💬 Need Help?

If you encounter issues:
1. Check the console logs for detailed error messages
2. Verify your API key is valid and active
3. Ensure you haven't exceeded rate limits
4. Review the Google AI documentation

The system will automatically fall back to rule-based responses if Gemini is unavailable, so your app will always work! 🚀
