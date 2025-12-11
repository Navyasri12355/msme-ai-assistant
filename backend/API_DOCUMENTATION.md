# MSME AI Assistant - API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Error Handling](#error-handling)
4. [Rate Limiting](#rate-limiting)
5. [API Endpoints](#api-endpoints)
   - [Authentication](#authentication-endpoints)
   - [Business Profile](#business-profile-endpoints)
   - [Transactions](#transaction-endpoints)
   - [Finance](#finance-endpoints)
   - [Marketing](#marketing-endpoints)
   - [Dashboard](#dashboard-endpoints)
   - [Conversational AI](#conversational-ai-endpoints)

---

## Overview

The MSME AI Assistant API is a RESTful API that provides business intelligence capabilities for small and micro enterprises. All API requests should be made to:

```
Base URL: http://localhost:3000/api
Production URL: https://your-domain.com/api
```

### Content Type

All requests and responses use JSON format:
```
Content-Type: application/json
```

### Response Format

All successful responses follow this structure:
```json
{
  "success": true,
  "data": { ... }
}
```

All error responses follow this structure:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error details (optional)",
    "suggestion": "How to fix the error",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

---

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. After logging in or registering, you'll receive an access token and a refresh token.

### Authentication Flow

1. **Register** or **Login** to receive tokens
2. Include the access token in the `Authorization` header for protected endpoints
3. When the access token expires, use the refresh token to get a new access token

### Using Access Tokens

Include the access token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

### Token Expiration

- **Access Token**: Expires after 24 hours
- **Refresh Token**: Expires after 30 days

### Example Authentication Request

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### Example Authenticated Request

```bash
curl -X GET http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Error Handling

### Standard Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid input data or missing required fields |
| `INVALID_QUERY` | 400 | Invalid query format or parameters |
| `INVALID_PARAMETERS` | 400 | Missing or invalid query parameters |
| `INSUFFICIENT_DATA` | 400 | Not enough data to perform the requested operation |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `LOGIN_FAILED` | 401 | Invalid email or password |
| `REFRESH_FAILED` | 401 | Invalid or expired refresh token |
| `FORBIDDEN` | 403 | User doesn't have permission to access this resource |
| `NOT_FOUND` | 404 | Requested resource not found |
| `PROFILE_NOT_FOUND` | 404 | Business profile not found |
| `USER_EXISTS` | 409 | User with this email already exists |
| `PROFILE_EXISTS` | 409 | Business profile already exists |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests, please slow down |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

### Error Response Examples

**Validation Error:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": "email: Invalid email format, password: Password must be at least 8 characters long",
    "suggestion": "Please check your input and try again",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

**Authentication Error:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "suggestion": "Please provide a valid access token in the Authorization header",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

**Not Found Error:**
```json
{
  "error": {
    "code": "PROFILE_NOT_FOUND",
    "message": "Business profile not found",
    "suggestion": "Create a profile using POST /api/profile",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

---

## Rate Limiting

To ensure fair usage and system stability, the API implements rate limiting:

- **Authentication endpoints** (`/api/auth/*`): 5 requests per minute per IP
- **All other endpoints**: 60 requests per minute per user

When rate limit is exceeded, you'll receive a `429 Too Many Requests` response:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests",
    "suggestion": "Please wait before making more requests",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

---

## API Endpoints

### Authentication Endpoints

#### Register User

Create a new user account.

**Endpoint:** `POST /api/auth/register`

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Validation Rules:**
- `email`: Must be a valid email format
- `password`: Minimum 8 characters

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "createdAt": "2024-01-01T12:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR`: Invalid email or password format
- `409 USER_EXISTS`: User with this email already exists

---

#### Login User

Authenticate and receive access tokens.

**Endpoint:** `POST /api/auth/login`

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "lastLogin": "2024-01-01T12:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR`: Invalid email format
- `401 LOGIN_FAILED`: Invalid email or password

---

#### Refresh Access Token

Get a new access token using a refresh token.

**Endpoint:** `POST /api/auth/refresh`

**Authentication:** Not required (uses refresh token)

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR`: Missing refresh token
- `401 REFRESH_FAILED`: Invalid or expired refresh token

---

### Business Profile Endpoints

#### Create Business Profile

Create a business profile for the authenticated user.

**Endpoint:** `POST /api/profile`

**Authentication:** Required

**Request Body:**
```json
{
  "businessName": "My Shop",
  "businessType": "retail",
  "industry": "food-beverage",
  "location": "Mumbai, Maharashtra",
  "targetAudience": "Local residents and office workers",
  "monthlyRevenue": 50000,
  "employeeCount": 3,
  "establishedDate": "2020-01-15"
}
```

**Valid Business Types:**
- `retail`, `restaurant`, `service`, `manufacturing`, `wholesale`, `e-commerce`, `consulting`, `other`

**Valid Industries:**
- `food-beverage`, `retail`, `technology`, `healthcare`, `education`, `construction`, `agriculture`, `textiles`, `automotive`, `hospitality`, `professional-services`, `other`

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "uuid-string",
      "userId": "uuid-string",
      "businessName": "My Shop",
      "businessType": "retail",
      "industry": "food-beverage",
      "location": "Mumbai, Maharashtra",
      "targetAudience": "Local residents and office workers",
      "monthlyRevenue": 50000,
      "employeeCount": 3,
      "establishedDate": "2020-01-15T00:00:00.000Z",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR`: Invalid or missing required fields
- `401 UNAUTHORIZED`: Missing or invalid authentication token
- `409 PROFILE_EXISTS`: Profile already exists for this user

---

#### Get Business Profile

Retrieve the authenticated user's business profile.

**Endpoint:** `GET /api/profile`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "uuid-string",
      "userId": "uuid-string",
      "businessName": "My Shop",
      "businessType": "retail",
      "industry": "food-beverage",
      "location": "Mumbai, Maharashtra",
      "targetAudience": "Local residents and office workers",
      "monthlyRevenue": 50000,
      "employeeCount": 3,
      "establishedDate": "2020-01-15T00:00:00.000Z",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED`: Missing or invalid authentication token
- `404 PROFILE_NOT_FOUND`: No profile exists for this user

---

#### Update Business Profile

Update the authenticated user's business profile.

**Endpoint:** `PUT /api/profile`

**Authentication:** Required

**Request Body:** (All fields optional)
```json
{
  "businessName": "My Updated Shop",
  "monthlyRevenue": 60000,
  "employeeCount": 5
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "uuid-string",
      "userId": "uuid-string",
      "businessName": "My Updated Shop",
      "businessType": "retail",
      "industry": "food-beverage",
      "location": "Mumbai, Maharashtra",
      "targetAudience": "Local residents and office workers",
      "monthlyRevenue": 60000,
      "employeeCount": 5,
      "establishedDate": "2020-01-15T00:00:00.000Z",
      "createdAt": "2024-01-01T12:00:00.000Z",
      "updatedAt": "2024-01-02T12:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR`: Invalid field values
- `401 UNAUTHORIZED`: Missing or invalid authentication token
- `404 PROFILE_NOT_FOUND`: No profile exists for this user

---

### Transaction Endpoints

#### Create Transaction

Create a single transaction.

**Endpoint:** `POST /api/transactions`

**Authentication:** Required

**Request Body:**
```json
{
  "amount": 1500.50,
  "type": "income",
  "category": "sales",
  "description": "Product sale",
  "date": "2024-01-01T10:30:00.000Z",
  "paymentMethod": "cash",
  "customerId": "customer-123",
  "productId": "product-456",
  "metadata": {
    "notes": "Regular customer"
  }
}
```

**Required Fields:**
- `amount`: Positive number
- `type`: Either "income" or "expense"
- `category`: Non-empty string
- `description`: Non-empty string

**Optional Fields:**
- `date`: ISO date string (defaults to current date)
- `paymentMethod`: String
- `customerId`: String
- `productId`: String
- `metadata`: Object

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "userId": "uuid-string",
    "amount": 1500.50,
    "type": "income",
    "category": "sales",
    "description": "Product sale",
    "date": "2024-01-01T10:30:00.000Z",
    "paymentMethod": "cash",
    "customerId": "customer-123",
    "productId": "product-456",
    "metadata": {
      "notes": "Regular customer"
    },
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR`: Invalid or missing required fields
- `401 UNAUTHORIZED`: Missing or invalid authentication token

---

#### Create Batch Transactions

Create multiple transactions at once.

**Endpoint:** `POST /api/transactions/batch`

**Authentication:** Required

**Request Body:**
```json
{
  "transactions": [
    {
      "amount": 1500.50,
      "type": "income",
      "category": "sales",
      "description": "Product sale 1",
      "date": "2024-01-01T10:30:00.000Z"
    },
    {
      "amount": 500.00,
      "type": "expense",
      "category": "supplies",
      "description": "Office supplies",
      "date": "2024-01-01T14:00:00.000Z"
    }
  ]
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid-1",
        "userId": "uuid-string",
        "amount": 1500.50,
        "type": "income",
        "category": "sales",
        "description": "Product sale 1",
        "date": "2024-01-01T10:30:00.000Z",
        "createdAt": "2024-01-01T12:00:00.000Z"
      },
      {
        "id": "uuid-2",
        "userId": "uuid-string",
        "amount": 500.00,
        "type": "expense",
        "category": "supplies",
        "description": "Office supplies",
        "date": "2024-01-01T14:00:00.000Z",
        "createdAt": "2024-01-01T12:00:00.000Z"
      }
    ],
    "count": 2
  }
}
```

**Error Responses:**
- `400 INVALID_INPUT`: Transactions must be an array
- `400 VALIDATION_ERROR`: One or more transactions failed validation
- `401 UNAUTHORIZED`: Missing or invalid authentication token

---

#### Get Transactions

Retrieve transactions with optional filters.

**Endpoint:** `GET /api/transactions`

**Authentication:** Required

**Query Parameters:**
- `startDate`: ISO date string (optional)
- `endDate`: ISO date string (optional)
- `category`: String (optional)
- `type`: "income" or "expense" (optional)

**Example Request:**
```
GET /api/transactions?startDate=2024-01-01&endDate=2024-01-31&type=income
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid-string",
        "userId": "uuid-string",
        "amount": 1500.50,
        "type": "income",
        "category": "sales",
        "description": "Product sale",
        "date": "2024-01-01T10:30:00.000Z",
        "createdAt": "2024-01-01T12:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED`: Missing or invalid authentication token

---

#### Get Single Transaction

Retrieve a specific transaction by ID.

**Endpoint:** `GET /api/transactions/:id`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "userId": "uuid-string",
    "amount": 1500.50,
    "type": "income",
    "category": "sales",
    "description": "Product sale",
    "date": "2024-01-01T10:30:00.000Z",
    "createdAt": "2024-01-01T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED`: Missing or invalid authentication token
- `404 NOT_FOUND`: Transaction not found

---

#### Delete Transaction

Delete a specific transaction.

**Endpoint:** `DELETE /api/transactions/:id`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Transaction deleted successfully"
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED`: Missing or invalid authentication token
- `404 NOT_FOUND`: Transaction not found

---

### Finance Endpoints

#### Get Financial Metrics

Calculate financial metrics for a specific date range.

**Endpoint:** `GET /api/finance/metrics`

**Authentication:** Required

**Query Parameters:**
- `startDate`: ISO date string (required)
- `endDate`: ISO date string (required)

**Example Request:**
```
GET /api/finance/metrics?startDate=2024-01-01&endDate=2024-01-31
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalIncome": 45000.00,
    "totalExpenses": 28000.00,
    "netProfit": 17000.00,
    "profitMargin": 37.78,
    "period": {
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-01-31T23:59:59.999Z"
    },
    "categoryBreakdown": [
      {
        "category": "sales",
        "type": "income",
        "total": 45000.00,
        "count": 120
      },
      {
        "category": "supplies",
        "type": "expense",
        "total": 15000.00,
        "count": 45
      },
      {
        "category": "rent",
        "type": "expense",
        "total": 13000.00,
        "count": 1
      }
    ]
  }
}
```

**Error Responses:**
- `400 INVALID_PARAMETERS`: Missing startDate or endDate
- `401 UNAUTHORIZED`: Missing or invalid authentication token

---

#### Get Cash Flow Forecast

Generate cash flow projections for future months.

**Endpoint:** `GET /api/finance/forecast`

**Authentication:** Required

**Query Parameters:**
- `months`: Number of months to forecast (1-12, default: 3)

**Example Request:**
```
GET /api/finance/forecast?months=3
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "projections": [
      {
        "month": "2024-02",
        "projectedIncome": 46000.00,
        "projectedExpenses": 29000.00,
        "projectedNetCashFlow": 17000.00
      },
      {
        "month": "2024-03",
        "projectedIncome": 47500.00,
        "projectedExpenses": 29500.00,
        "projectedNetCashFlow": 18000.00
      },
      {
        "month": "2024-04",
        "projectedIncome": 49000.00,
        "projectedExpenses": 30000.00,
        "projectedNetCashFlow": 19000.00
      }
    ],
    "confidence": 0.85,
    "seasonalFactors": [
      {
        "month": 2,
        "factor": 1.02
      },
      {
        "month": 3,
        "factor": 1.05
      }
    ],
    "assumptions": [
      "Based on 6 months of historical data",
      "Seasonal trends detected and incorporated",
      "Growth rate: 3% per month"
    ]
  }
}
```

**Error Responses:**
- `400 INSUFFICIENT_DATA`: Not enough historical data for forecasting
- `401 UNAUTHORIZED`: Missing or invalid authentication token

---

#### Get Category Breakdown

Get spending or income breakdown by category.

**Endpoint:** `GET /api/finance/categories`

**Authentication:** Required

**Query Parameters:**
- `type`: "income" or "expense" (required)
- `startDate`: ISO date string (required)
- `endDate`: ISO date string (required)

**Example Request:**
```
GET /api/finance/categories?type=expense&startDate=2024-01-01&endDate=2024-01-31
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "category": "supplies",
        "total": 15000.00,
        "count": 45,
        "percentage": 53.57
      },
      {
        "category": "rent",
        "total": 13000.00,
        "count": 1,
        "percentage": 46.43
      }
    ]
  }
}
```

**Error Responses:**
- `400 INVALID_PARAMETERS`: Missing required parameters
- `400 INVALID_TYPE`: Type must be "income" or "expense"
- `401 UNAUTHORIZED`: Missing or invalid authentication token

---

### Marketing Endpoints

#### Generate Marketing Strategies

Get personalized marketing strategy recommendations.

**Endpoint:** `POST /api/marketing/strategies`

**Authentication:** Required

**Request Body:**
```json
{
  "budget": 5000
}
```

**Note:** Budget is optional. If not provided, strategies will include both free and paid options.

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "strategies": [
      {
        "id": "strategy-1",
        "title": "Social Media Engagement Campaign",
        "description": "Build presence on Instagram and Facebook with daily posts",
        "estimatedCost": 0,
        "expectedReach": 5000,
        "difficulty": "low",
        "actionSteps": [
          "Create business accounts on Instagram and Facebook",
          "Post daily content showcasing products",
          "Engage with local community groups",
          "Use relevant hashtags"
        ],
        "timeline": "2-4 weeks"
      },
      {
        "id": "strategy-2",
        "title": "Local SEO Optimization",
        "description": "Improve visibility in local search results",
        "estimatedCost": 2000,
        "expectedReach": 10000,
        "difficulty": "medium",
        "actionSteps": [
          "Claim Google My Business listing",
          "Optimize website for local keywords",
          "Collect customer reviews",
          "Build local citations"
        ],
        "timeline": "4-6 weeks"
      }
    ]
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR`: Invalid budget value
- `401 UNAUTHORIZED`: Missing or invalid authentication token
- `404 PROFILE_NOT_FOUND`: Business profile required

---

#### Get Content Suggestions

Get content ideas for marketing campaigns.

**Endpoint:** `POST /api/marketing/content-suggestions`

**Authentication:** Required

**Request Body:**
```json
{
  "count": 5
}
```

**Note:** Count is optional (default: 5).

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "id": "content-1",
        "title": "Behind-the-Scenes Product Creation",
        "platform": "social",
        "contentType": "video",
        "outline": "Show the process of creating your products from start to finish. Include interviews with team members and highlight quality control.",
        "estimatedEffort": "medium",
        "potentialReach": 3000,
        "relevance": "Builds trust and transparency with customers"
      },
      {
        "id": "content-2",
        "title": "Customer Success Stories",
        "platform": "blog",
        "contentType": "article",
        "outline": "Interview satisfied customers about their experience. Include before/after scenarios and specific benefits they gained.",
        "estimatedEffort": "low",
        "potentialReach": 2000,
        "relevance": "Social proof increases conversion rates"
      }
    ]
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR`: Invalid count value
- `401 UNAUTHORIZED`: Missing or invalid authentication token
- `404 PROFILE_NOT_FOUND`: Business profile required

---

#### Get Content Outline

Get detailed outline for a specific content suggestion.

**Endpoint:** `GET /api/marketing/content-outline/:contentId`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "outline": {
      "contentId": "content-1",
      "title": "Behind-the-Scenes Product Creation",
      "detailedOutline": "1. Introduction (30 seconds)\n   - Hook: Show finished product\n   - Tease the journey\n\n2. Raw Materials (1 minute)\n   - Source of materials\n   - Quality checks\n\n3. Creation Process (2 minutes)\n   - Step-by-step production\n   - Team member interviews\n\n4. Quality Control (1 minute)\n   - Testing procedures\n   - Standards maintained\n\n5. Conclusion (30 seconds)\n   - Final product showcase\n   - Call to action",
      "tips": [
        "Keep video under 5 minutes for better engagement",
        "Use natural lighting when possible",
        "Add captions for accessibility"
      ]
    }
  }
}
```

**Error Responses:**
- `400 OUTLINE_RETRIEVAL_FAILED`: Invalid content ID
- `401 UNAUTHORIZED`: Missing or invalid authentication token

---

#### Analyze Customer Sentiment

Analyze sentiment from customer feedback.

**Endpoint:** `POST /api/marketing/sentiment-analysis`

**Authentication:** Required

**Request Body:**
```json
{
  "feedback": [
    {
      "text": "Great service! Very happy with my purchase.",
      "language": "en",
      "source": "google-reviews"
    },
    {
      "text": "Product quality could be better.",
      "language": "en",
      "source": "email"
    },
    {
      "text": "बहुत अच्छा अनुभव था। धन्यवाद!",
      "language": "hi",
      "source": "whatsapp"
    }
  ]
}
```

**Note:** Language and source are optional fields.

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "analysis": {
      "overallScore": 0.67,
      "distribution": {
        "positive": 66.67,
        "neutral": 0,
        "negative": 33.33
      },
      "keyTopics": [
        {
          "topic": "service",
          "sentiment": "positive",
          "frequency": 2
        },
        {
          "topic": "quality",
          "sentiment": "negative",
          "frequency": 1
        }
      ],
      "negativeIssues": [
        {
          "issue": "Product quality concerns",
          "count": 1,
          "examples": ["Product quality could be better."]
        }
      ],
      "languageBreakdown": [
        {
          "language": "en",
          "count": 2,
          "averageSentiment": 0.5
        },
        {
          "language": "hi",
          "count": 1,
          "averageSentiment": 1.0
        }
      ]
    }
  }
}
```

**Error Responses:**
- `400 VALIDATION_ERROR`: Invalid feedback format
- `401 UNAUTHORIZED`: Missing or invalid authentication token

---

### Dashboard Endpoints

#### Get Complete Dashboard Data

Get all dashboard data including metrics, trends, insights, and alerts.

**Endpoint:** `GET /api/dashboard`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "keyMetrics": {
      "dailyRevenue": 1500.00,
      "totalCustomers": 45,
      "topProducts": [
        {
          "productId": "product-1",
          "name": "Product A",
          "revenue": 5000.00,
          "unitsSold": 50
        }
      ],
      "revenueChange": 12.5,
      "customerChange": 8.3
    },
    "trends": [
      {
        "metric": "revenue",
        "current": 45000.00,
        "previous": 40000.00,
        "change": 12.5,
        "direction": "up"
      }
    ],
    "insights": [
      {
        "id": "insight-1",
        "priority": "high",
        "title": "Revenue Growth Opportunity",
        "description": "Your sales have increased 12.5% this month",
        "recommendedAction": "Consider increasing inventory for top-selling products",
        "expectedImpact": "Potential 20% revenue increase",
        "category": "finance"
      }
    ],
    "alerts": [
      {
        "id": "alert-1",
        "type": "warning",
        "metric": "expenses",
        "message": "Expenses are 15% higher than last month",
        "threshold": 10,
        "currentValue": 15
      }
    ],
    "lastUpdated": "2024-01-01T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED`: Missing or invalid authentication token

---

#### Get Key Metrics Only

Get just the key business metrics.

**Endpoint:** `GET /api/dashboard/metrics`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "dailyRevenue": 1500.00,
    "totalCustomers": 45,
    "topProducts": [
      {
        "productId": "product-1",
        "name": "Product A",
        "revenue": 5000.00,
        "unitsSold": 50
      }
    ],
    "revenueChange": 12.5,
    "customerChange": 8.3
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED`: Missing or invalid authentication token

---

#### Get Metric Trends

Get trends for specific metrics.

**Endpoint:** `GET /api/dashboard/trends`

**Authentication:** Required

**Query Parameters:**
- `metrics`: Comma-separated list of metrics (default: "revenue,customers")

**Example Request:**
```
GET /api/dashboard/trends?metrics=revenue,customers,expenses
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "metric": "revenue",
      "current": 45000.00,
      "previous": 40000.00,
      "change": 12.5,
      "direction": "up"
    },
    {
      "metric": "customers",
      "current": 45,
      "previous": 42,
      "change": 7.14,
      "direction": "up"
    },
    {
      "metric": "expenses",
      "current": 30000.00,
      "previous": 28000.00,
      "change": 7.14,
      "direction": "up"
    }
  ]
}
```

**Error Responses:**
- `401 UNAUTHORIZED`: Missing or invalid authentication token

---

#### Get Insights

Get actionable business insights.

**Endpoint:** `GET /api/dashboard/insights`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "insight-1",
      "priority": "high",
      "title": "Revenue Growth Opportunity",
      "description": "Your sales have increased 12.5% this month",
      "recommendedAction": "Consider increasing inventory for top-selling products",
      "expectedImpact": "Potential 20% revenue increase",
      "category": "finance"
    },
    {
      "id": "insight-2",
      "priority": "medium",
      "title": "Customer Retention",
      "description": "Repeat customer rate is 65%",
      "recommendedAction": "Implement a loyalty program to increase retention",
      "expectedImpact": "5-10% increase in repeat purchases",
      "category": "marketing"
    }
  ]
}
```

**Error Responses:**
- `401 UNAUTHORIZED`: Missing or invalid authentication token

---

#### Refresh Dashboard Metrics

Manually refresh dashboard data (clears cache).

**Endpoint:** `POST /api/dashboard/refresh`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Dashboard metrics refreshed successfully"
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED`: Missing or invalid authentication token

---

### Conversational AI Endpoints

#### Process Query

Send a natural language business query to the AI assistant.

**Endpoint:** `POST /api/ai/query`

**Authentication:** Required

**Request Body:**
```json
{
  "query": "How can I reduce my operating costs?",
  "context": {
    "previousMessages": [
      {
        "id": "msg-1",
        "role": "user",
        "content": "What are my top expenses?",
        "timestamp": "2024-01-01T11:00:00.000Z"
      },
      {
        "id": "msg-2",
        "role": "assistant",
        "content": "Your top expenses are rent (46%) and supplies (54%).",
        "timestamp": "2024-01-01T11:00:05.000Z"
      }
    ],
    "currentTopic": "expenses"
  }
}
```

**Note:** Context is optional. If not provided, the system will fetch the user's business profile automatically.

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Based on your expense analysis, here are three cost-cutting strategies:\n\n1. Negotiate bulk discounts with suppliers - could save 10-15%\n2. Review and optimize utility usage - potential 5-8% savings\n3. Consider shared workspace options to reduce rent costs\n\nWould you like more details on any of these strategies?",
    "suggestions": [
      "Tell me more about bulk discounts",
      "How can I optimize utilities?",
      "What are shared workspace options?"
    ],
    "requiresClarification": false,
    "dataReferences": [
      {
        "type": "expense",
        "category": "supplies",
        "value": 15000
      }
    ]
  }
}
```

**Error Responses:**
- `400 INVALID_QUERY`: Missing or invalid query
- `401 UNAUTHORIZED`: Missing or invalid authentication token
- `500 QUERY_PROCESSING_ERROR`: Failed to process query

---

#### Get Conversation History

Retrieve recent conversation history.

**Endpoint:** `GET /api/ai/history`

**Authentication:** Required

**Query Parameters:**
- `limit`: Number of messages to retrieve (default: 10)

**Example Request:**
```
GET /api/ai/history?limit=20
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "msg-1",
      "role": "user",
      "content": "What are my top expenses?",
      "timestamp": "2024-01-01T11:00:00.000Z"
    },
    {
      "id": "msg-2",
      "role": "assistant",
      "content": "Your top expenses are rent (46%) and supplies (54%).",
      "timestamp": "2024-01-01T11:00:05.000Z"
    },
    {
      "id": "msg-3",
      "role": "user",
      "content": "How can I reduce my operating costs?",
      "timestamp": "2024-01-01T11:05:00.000Z"
    }
  ]
}
```

**Error Responses:**
- `401 UNAUTHORIZED`: Missing or invalid authentication token

---

#### Clear Conversation Context

Clear the conversation history and context.

**Endpoint:** `DELETE /api/ai/context`

**Authentication:** Required

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Conversation context cleared"
  }
}
```

**Error Responses:**
- `401 UNAUTHORIZED`: Missing or invalid authentication token

---

## Usage Examples

### Complete Workflow Example

Here's a complete example of using the API from registration to getting insights:

#### 1. Register a new user

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "shop@example.com",
    "password": "securepass123"
  }'
```

Save the `accessToken` from the response.

#### 2. Create business profile

```bash
curl -X POST http://localhost:3000/api/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "businessName": "My Corner Shop",
    "businessType": "retail",
    "industry": "food-beverage",
    "location": "Mumbai, Maharashtra",
    "targetAudience": "Local residents",
    "employeeCount": 2,
    "establishedDate": "2020-01-01"
  }'
```

#### 3. Add transactions

```bash
curl -X POST http://localhost:3000/api/transactions/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "transactions": [
      {
        "amount": 1500,
        "type": "income",
        "category": "sales",
        "description": "Daily sales",
        "date": "2024-01-15"
      },
      {
        "amount": 500,
        "type": "expense",
        "category": "supplies",
        "description": "Inventory purchase",
        "date": "2024-01-15"
      }
    ]
  }'
```

#### 4. Get financial metrics

```bash
curl -X GET "http://localhost:3000/api/finance/metrics?startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 5. Get marketing strategies

```bash
curl -X POST http://localhost:3000/api/marketing/strategies \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "budget": 5000
  }'
```

#### 6. Ask AI assistant

```bash
curl -X POST http://localhost:3000/api/ai/query \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "query": "How can I improve my profit margins?"
  }'
```

#### 7. Get dashboard insights

```bash
curl -X GET http://localhost:3000/api/dashboard \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Best Practices

### Security

1. **Never expose access tokens**: Store tokens securely and never commit them to version control
2. **Use HTTPS in production**: Always use HTTPS to encrypt data in transit
3. **Rotate tokens regularly**: Implement token refresh logic to maintain security
4. **Validate input**: Always validate and sanitize user input on the client side

### Performance

1. **Cache responses**: Cache dashboard and metrics data on the client side
2. **Batch operations**: Use batch endpoints when creating multiple transactions
3. **Pagination**: Request only the data you need using query parameters
4. **Debounce requests**: Debounce search and filter operations to reduce API calls

### Error Handling

1. **Check status codes**: Always check HTTP status codes before processing responses
2. **Handle rate limits**: Implement exponential backoff when rate limited
3. **Display user-friendly errors**: Use the `suggestion` field from error responses
4. **Log errors**: Log errors for debugging but don't expose sensitive information

### Data Management

1. **Regular backups**: Regularly export your data using the API
2. **Validate before submission**: Validate transaction data before sending to API
3. **Handle offline scenarios**: Queue operations when offline and sync when online
4. **Monitor usage**: Track your API usage to stay within rate limits

---

## Support and Resources

### Additional Documentation

- [Setup Guide](../QUICKSTART.md)
- [Security Documentation](./SECURITY.md)
- [Caching Strategy](./CACHING.md)
- [HTTPS Configuration](./HTTPS_CONFIGURATION.md)

### Getting Help

If you encounter issues or have questions:

1. Check the error message and suggestion in the API response
2. Review this documentation for correct usage
3. Check the application logs for detailed error information
4. Contact support with specific error codes and request details

### API Versioning

Current API Version: **v1**

The API version is included in the base URL. Breaking changes will result in a new version number.

---

## Changelog

### Version 1.0.0 (Current)

- Initial API release
- Authentication endpoints
- Business profile management
- Transaction management
- Financial analysis and forecasting
- Marketing advisor features
- Dashboard and insights
- Conversational AI interface

---

*Last Updated: January 2024*
