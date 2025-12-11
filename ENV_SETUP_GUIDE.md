# Environment Variables Setup Guide

This guide explains how to configure the `.env` files for the MSME AI Assistant application.

## 📁 Files to Configure

You need to configure two `.env` files:
1. `backend/.env` - Backend server configuration
2. `frontend/.env` - Frontend application configuration

---

## 🔧 Backend Configuration (`backend/.env`)

### 1. Server Configuration

```env
PORT=3000
NODE_ENV=development
```

**What to do:**
- `PORT`: Keep as `3000` (or change if port 3000 is already in use)
- `NODE_ENV`: Use `development` for local development, `production` for deployment

---

### 2. Database Configuration (PostgreSQL)

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=msme_assistant
DB_USER=postgres
DB_PASSWORD=postgres
```

**What to do:**

**Option A: Using Docker (Recommended)**
- Keep all values as shown above
- Docker Compose will automatically set up PostgreSQL with these credentials
- Run: `docker-compose up -d` to start the database

**Option B: Using Local PostgreSQL**
- `DB_HOST`: Keep as `localhost` (or your PostgreSQL server IP)
- `DB_PORT`: Keep as `5432` (default PostgreSQL port)
- `DB_NAME`: Keep as `msme_assistant` (or your preferred database name)
- `DB_USER`: Your PostgreSQL username (default is usually `postgres`)
- `DB_PASSWORD`: **CHANGE THIS** to your PostgreSQL password

**To set up the database:**
```bash
# If using local PostgreSQL, create the database:
psql -U postgres
CREATE DATABASE msme_assistant;
\q
```

---

### 3. Redis Configuration (Caching)

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

**What to do:**

**Option A: Using Docker (Recommended)**
- Keep all values as shown above
- Docker Compose will automatically set up Redis
- Run: `docker-compose up -d` to start Redis

**Option B: Using Local Redis**
- `REDIS_HOST`: Keep as `localhost` (or your Redis server IP)
- `REDIS_PORT`: Keep as `6379` (default Redis port)
- `REDIS_PASSWORD`: Leave empty if no password, or add your Redis password

**To install Redis locally (if not using Docker):**
- Windows: Download from https://github.com/microsoftarchive/redis/releases
- Mac: `brew install redis`
- Linux: `sudo apt-get install redis-server`

---

### 4. JWT Configuration (Authentication)

```env
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=30d
```

**What to do:**
- `JWT_SECRET`: **MUST CHANGE** - Generate a strong random string (at least 32 characters)
- `JWT_EXPIRES_IN`: Keep as `24h` (tokens expire after 24 hours)
- `JWT_REFRESH_EXPIRES_IN`: Keep as `30d` (refresh tokens expire after 30 days)

**How to generate a secure JWT_SECRET:**

**Option 1: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 2: Using OpenSSL**
```bash
openssl rand -hex 32
```

**Option 3: Using PowerShell (Windows)**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

**Example result:**
```env
JWT_SECRET=a7f3d8e9c2b1a4f6e8d9c3b2a5f7e9d1c4b6a8f2e7d9c1b3a6f8e2d4c7b9a1f5
```

---

### 5. Encryption Configuration (Data Security)

```env
ENCRYPTION_KEY=your-encryption-key-change-in-production
```

**What to do:**
- `ENCRYPTION_KEY`: **MUST CHANGE** - Generate a 32-byte (64 hex characters) key

**How to generate:**

**Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Example result:**
```env
ENCRYPTION_KEY=b8e4d7c9a2f1e6d8c3b5a7f9e2d4c6b8a1f3e5d7c9b2a4f6e8d1c3b5a7f9e2d4
```

⚠️ **IMPORTANT**: Never share or commit this key to version control!

---

### 6. AI Service Configuration (Optional for now)

```env
OPENAI_API_KEY=
HUGGINGFACE_API_KEY=
```

**What to do:**

**For Development:**
- You can leave these empty initially
- The app will work without AI features

**To Enable AI Features:**

**Google Gemini API Key** (for conversational AI):
1. Go to https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy and paste it:
```env
GOOGLE_API_KEY=AIzaSyD-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GEMINI_MODEL=gemini-pro
```

**Note:** See `GEMINI_SETUP_GUIDE.md` for detailed setup instructions!

**Hugging Face API Key** (for sentiment analysis):
1. Go to https://huggingface.co/settings/tokens
2. Sign up or log in
3. Create a new token
4. Copy and paste it:
```env
HUGGINGFACE_API_KEY=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🎨 Frontend Configuration (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3000/api
```

**What to do:**
- Keep as `http://localhost:3000/api` for local development
- Change to your production API URL when deploying (e.g., `https://api.yourdomain.com/api`)

---

## ✅ Quick Setup Checklist

### For Local Development (Easiest):

1. **Copy the example files:**
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. **Generate secrets:**
   ```bash
   # Generate JWT_SECRET
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Generate ENCRYPTION_KEY
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Update `backend/.env`:**
   - Replace `JWT_SECRET` with generated value
   - Replace `ENCRYPTION_KEY` with generated value
   - Leave database and Redis settings as default (if using Docker)

4. **Start services:**
   ```bash
   # Start PostgreSQL and Redis with Docker
   docker-compose up -d
   
   # Or install them locally if not using Docker
   ```

5. **Verify setup:**
   ```bash
   cd backend
   npm run dev
   ```

---

## 🔒 Security Best Practices

### ⚠️ NEVER commit these to Git:
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `DB_PASSWORD`
- `OPENAI_API_KEY`
- `HUGGINGFACE_API_KEY`

### ✅ DO:
- Use different secrets for development and production
- Store production secrets in a secure vault (AWS Secrets Manager, Azure Key Vault, etc.)
- Rotate secrets regularly
- Use strong, randomly generated values

### 🔐 For Production:
- Change `NODE_ENV` to `production`
- Use strong database passwords
- Enable Redis password authentication
- Use HTTPS for API URLs
- Store secrets in environment variables or secret management services

---

## 🐛 Troubleshooting

### Database Connection Issues:
```
Error: password authentication failed for user "postgres"
```
**Solution:** Check your `DB_PASSWORD` matches your PostgreSQL password

### Redis Connection Issues:
```
Error: Redis connection failed
```
**Solution:** 
- Make sure Redis is running: `redis-cli ping` (should return "PONG")
- Check `REDIS_HOST` and `REDIS_PORT` are correct

### Port Already in Use:
```
Error: Port 3000 is already in use
```
**Solution:** Change `PORT` to a different value (e.g., `3001`)

### JWT Errors:
```
Error: jwt malformed
```
**Solution:** Make sure `JWT_SECRET` is set and is a valid string

---

## 📚 Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Hugging Face Documentation](https://huggingface.co/docs)

---

## 🆘 Need Help?

If you encounter issues:
1. Check the console logs for specific error messages
2. Verify all required services are running
3. Ensure all environment variables are set correctly
4. Check the `backend/CACHING.md` for Redis-specific information
5. Review `backend/SECURITY.md` for security-related configurations
