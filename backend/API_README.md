# MSME AI Assistant - API Documentation Index

Welcome to the MSME AI Assistant API documentation. This index will help you find the information you need quickly.

## 📚 Documentation Overview

### 1. [API Documentation](./API_DOCUMENTATION.md)
**Complete API reference with all endpoints, request/response formats, and examples.**

Topics covered:
- Authentication flow and token management
- All API endpoints with detailed examples
- Request/response formats
- Query parameters and filters
- Complete workflow examples
- Best practices and tips

**Start here if:** You need detailed information about specific endpoints or want to understand the complete API structure.

---

### 2. [API Usage Guide](./API_USAGE_GUIDE.md)
**Practical guide with code examples for common integration scenarios.**

Topics covered:
- Quick start setup
- TypeScript/JavaScript integration examples
- React component examples
- Error handling patterns
- Performance optimization
- Caching strategies
- Testing examples
- Mobile app integration

**Start here if:** You're building an application and need practical code examples.

---

### 3. [Error Codes Reference](./ERROR_CODES.md)
**Comprehensive reference for all API error codes.**

Topics covered:
- All error codes with descriptions
- Common causes and solutions
- Error handling best practices
- Retry strategies
- Quick reference table

**Start here if:** You're debugging an error or want to implement robust error handling.

---

## 🚀 Quick Start

### 1. Authentication

```bash
# Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### 2. Create Business Profile

```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "businessName": "My Shop",
    "businessType": "retail",
    "industry": "food-beverage",
    "location": "Mumbai",
    "targetAudience": "Local residents",
    "employeeCount": 2,
    "establishedDate": "2020-01-01"
  }'
```

### 3. Add Transactions

```bash
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "amount": 1500,
    "type": "income",
    "category": "sales",
    "description": "Product sale"
  }'
```

### 4. Get Dashboard

```bash
curl -X GET http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📋 API Endpoints Summary

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token

### Business Profile
- `POST /api/profile` - Create profile
- `GET /api/profile` - Get profile
- `PUT /api/profile` - Update profile

### Transactions
- `POST /api/transactions` - Create transaction
- `POST /api/transactions/batch` - Create multiple transactions
- `GET /api/transactions` - Get transactions (with filters)
- `GET /api/transactions/:id` - Get single transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Finance
- `GET /api/finance/metrics` - Get financial metrics
- `GET /api/finance/forecast` - Get cash flow forecast
- `GET /api/finance/categories` - Get category breakdown

### Marketing
- `POST /api/marketing/strategies` - Generate marketing strategies
- `POST /api/marketing/content-suggestions` - Get content ideas
- `GET /api/marketing/content-outline/:id` - Get content outline
- `POST /api/marketing/sentiment-analysis` - Analyze sentiment

### Dashboard
- `GET /api/dashboard` - Get complete dashboard data
- `GET /api/dashboard/metrics` - Get key metrics
- `GET /api/dashboard/trends` - Get metric trends
- `GET /api/dashboard/insights` - Get insights
- `POST /api/dashboard/refresh` - Refresh metrics

### Conversational AI
- `POST /api/ai/query` - Process natural language query
- `GET /api/ai/history` - Get conversation history
- `DELETE /api/ai/context` - Clear conversation context

---

## 🔐 Authentication

All endpoints except `/api/auth/*` require authentication. Include your access token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

**Token Expiration:**
- Access Token: 24 hours
- Refresh Token: 30 days

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": "Additional details",
    "suggestion": "How to fix",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## ⚡ Rate Limits

- **Authentication endpoints**: 5 requests/minute per IP
- **All other endpoints**: 60 requests/minute per user

---

## 🛠️ Additional Resources

### Project Documentation
- [Quick Start Guide](../QUICKSTART.md) - Get the project running
- [Setup Guide](../QUICK_START_GEMINI.md) - Gemini API setup
- [Project Structure](../PROJECT_STRUCTURE.md) - Codebase overview

### Backend Documentation
- [Security Guide](./SECURITY.md) - Security best practices
- [Caching Strategy](./CACHING.md) - Caching implementation
- [HTTPS Configuration](./HTTPS_CONFIGURATION.md) - SSL/TLS setup

---

## 💡 Common Use Cases

### 1. Building a Dashboard
See: [API Usage Guide - Dashboard Integration](./API_USAGE_GUIDE.md#6-dashboard-integration)

### 2. Implementing Chat Interface
See: [API Usage Guide - Conversational AI](./API_USAGE_GUIDE.md#7-conversational-ai)

### 3. Financial Reporting
See: [API Usage Guide - Financial Analysis](./API_USAGE_GUIDE.md#4-financial-analysis)

### 4. Marketing Tools
See: [API Usage Guide - Marketing Features](./API_USAGE_GUIDE.md#5-marketing-features)

---

## 🐛 Troubleshooting

### Common Issues

**CORS Errors**
- Ensure backend CORS is configured for your domain
- Check that credentials are included in requests

**401 Unauthorized**
- Verify token is included in Authorization header
- Check if token has expired (implement refresh logic)

**429 Rate Limit**
- Implement exponential backoff
- Cache responses when possible

**500 Internal Error**
- Check server logs for details
- Verify all required services are running (PostgreSQL, Redis)

For detailed troubleshooting, see [API Usage Guide - Troubleshooting](./API_USAGE_GUIDE.md#troubleshooting)

---

## 📞 Support

If you encounter issues:

1. Check the error code in [Error Codes Reference](./ERROR_CODES.md)
2. Review relevant examples in [API Usage Guide](./API_USAGE_GUIDE.md)
3. Check the detailed endpoint documentation in [API Documentation](./API_DOCUMENTATION.md)
4. Review server logs for additional context

---

## 🔄 API Versioning

**Current Version:** v1

The API version is included in the base URL. Breaking changes will result in a new version number.

---

## 📝 Changelog

### Version 1.0.0 (Current)
- Initial API release
- Complete authentication system
- Business profile management
- Transaction management
- Financial analysis and forecasting
- Marketing advisor features
- Dashboard and insights
- Conversational AI interface

---

*Last Updated: January 2024*
