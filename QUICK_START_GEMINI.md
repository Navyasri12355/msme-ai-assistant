# 🚀 Quick Start: Gemini AI Setup

## 3-Step Setup

### 1️⃣ Get API Key
Visit: https://makersuite.google.com/app/apikey
- Sign in with Google
- Click "Create API Key"
- Copy the key

### 2️⃣ Update `.env`
Open `backend/.env` and add:
```env
GOOGLE_API_KEY=your_key_here
GEMINI_MODEL=gemini-pro
```

### 3️⃣ Restart Server
```bash
cd backend
npm run dev
```

## ✅ Done!

Your AI assistant is now powered by Gemini!

---

## 🧪 Test It

Try asking:
- "How can I reduce costs?"
- "What growth strategies should I use?"
- "Give me marketing advice"

---

## 📖 More Info

- **Full Setup Guide:** `GEMINI_SETUP_GUIDE.md`
- **Migration Details:** `GEMINI_MIGRATION_SUMMARY.md`
- **Environment Setup:** `ENV_SETUP_GUIDE.md`

---

## 💡 Features

✅ Personalized business advice  
✅ Context-aware responses  
✅ Industry-specific recommendations  
✅ Automatic fallback if AI unavailable  
✅ Free tier: 1,500 requests/day  

---

## 🆘 Issues?

**No AI responses?**
- Check API key is in `.env`
- Restart server
- Check console for errors

**API errors?**
- Verify key is valid
- Check rate limits
- System auto-falls back to rules

---

**Need help?** Check `GEMINI_SETUP_GUIDE.md` for detailed troubleshooting!
