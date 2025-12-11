# Error Codes Reference - MSME AI Assistant API

## Overview

This document provides a comprehensive reference for all error codes returned by the MSME AI Assistant API. Each error includes the HTTP status code, description, common causes, and suggested solutions.

---

## Error Response Format

All errors follow this consistent structure:

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

## Authentication Errors (401)

### UNAUTHORIZED

**HTTP Status:** 401

**Description:** Missing or invalid authentication token

**Common Causes:**
- No Authorization header provided
- Invalid or malformed JWT token
- Token signature verification failed

**Solution:**
```
Include a valid access token in the Authorization header:
Authorization: Bearer <your_access_token>
```

**Example:**
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

---

### LOGIN_FAILED

**HTTP Status:** 401

**Description:** Invalid email or password during login

**Common Causes:**
- Incorrect email address
- Incorrect password
- Account doesn't exist

**Solution:**
```
Verify your email and password are correct. If you forgot your password, use the password reset feature.
```

**Example:**
```json
{
  "error": {
    "code": "LOGIN_FAILED",
    "message": "Invalid email or password",
    "suggestion": "Please check your email and password and try again",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### REFRESH_FAILED

**HTTP Status:** 401

**Description:** Invalid or expired refresh token

**Common Causes:**
- Refresh token has expired (>30 days old)
- Invalid refresh token format
- Token has been revoked

**Solution:**
```
Log in again to obtain new tokens.
```

**Example:**
```json
{
  "error": {
    "code": "REFRESH_FAILED",
    "message": "Invalid or expired refresh token",
    "suggestion": "Please log in again",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

---

## Validation Errors (400)

### VALIDATION_ERROR

**HTTP Status:** 400

**Description:** Invalid input data or missing required fields

**Common Causes:**
- Missing required fields
- Invalid data types
- Data doesn't meet validation rules (e.g., email format, password length)

**Solution:**
```
Check the 'details' field for specific validation errors and correct your input.
```

**Example:**
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

---

### INVALID_QUERY

**HTTP Status:** 400

**Description:** Invalid query format or parameters

**Common Causes:**
- Empty query string
- Query exceeds maximum length (500 characters)
- Invalid query format

**Solution:**
```
Ensure your query is a non-empty string under 500 characters.
```

---

### INVALID_PARAMETERS

**HTTP Status:** 400

**Description:** Missing or invalid query parameters

**Common Causes:**
- Required query parameters not provided
- Invalid parameter values
- Invalid date formats

**Solution:**
```
Check the API documentation for required parameters and their formats.
```

**Example:**
```json
{
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "startDate and endDate are required",
    "suggestion": "Provide both startDate and endDate in ISO format",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### INVALID_INPUT

**HTTP Status:** 400

**Description:** Invalid input format

**Common Causes:**
- Expected array but received object
- Expected object but received array
- Invalid JSON structure

**Solution:**
```
Check the API documentation for the correct input format.
```

---

### INSUFFICIENT_DATA

**HTTP Status:** 400

**Description:** Not enough data to perform the requested operation

**Common Causes:**
- Trying to generate forecast with less than 3 months of data
- Insufficient transactions for analysis
- No historical data available

**Solution:**
```
Add more historical data before attempting this operation. Check the 'details' field for minimum requirements.
```

**Example:**
```json
{
  "error": {
    "code": "INSUFFICIENT_DATA",
    "message": "Insufficient data for forecasting. Need at least 3 months of transaction history.",
    "suggestion": "Add more historical transactions to generate accurate forecasts",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

---

## Authorization Errors (403)

### FORBIDDEN

**HTTP Status:** 403

**Description:** User doesn't have permission to access this resource

**Common Causes:**
- Trying to access another user's data
- Insufficient permissions for the operation
- Account restrictions

**Solution:**
```
Ensure you're accessing only your own resources. Contact support if you believe this is an error.
```

---

## Not Found Errors (404)

### NOT_FOUND

**HTTP Status:** 404

**Description:** Requested resource not found

**Common Causes:**
- Invalid resource ID
- Resource has been deleted
- Typo in the endpoint URL

**Solution:**
```
Verify the resource ID and endpoint URL are correct.
```

---

### PROFILE_NOT_FOUND

**HTTP Status:** 404

**Description:** Business profile not found for the user

**Common Causes:**
- User hasn't created a business profile yet
- Profile was deleted

**Solution:**
```
Create a business profile using POST /api/profile before accessing profile-dependent features.
```

**Example:**
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

## Conflict Errors (409)

### USER_EXISTS

**HTTP Status:** 409

**Description:** User with this email already exists

**Common Causes:**
- Attempting to register with an email that's already in use

**Solution:**
```
Try logging in instead, or use a different email address.
```

**Example:**
```json
{
  "error": {
    "code": "USER_EXISTS",
    "message": "User with this email already exists",
    "suggestion": "Try logging in instead or use a different email",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

---

### PROFILE_EXISTS

**HTTP Status:** 409

**Description:** Business profile already exists for this user

**Common Causes:**
- Attempting to create a second profile
- Profile already exists

**Solution:**
```
Use PUT /api/profile to update your existing profile instead.
```

**Example:**
```json
{
  "error": {
    "code": "PROFILE_EXISTS",
    "message": "Business profile already exists for this user",
    "suggestion": "Use PUT /api/profile to update your existing profile",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

---

## Rate Limiting Errors (429)

### RATE_LIMIT_EXCEEDED

**HTTP Status:** 429

**Description:** Too many requests in a short time period

**Common Causes:**
- Exceeding 60 requests per minute (general endpoints)
- Exceeding 5 requests per minute (auth endpoints)
- Automated scripts making too many requests

**Solution:**
```
Wait before making more requests. Implement exponential backoff in your client.
```

**Example:**
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

**Retry Strategy:**
```typescript
async function retryWithBackoff(fn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.response?.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}
```

---

## Server Errors (500)

### INTERNAL_ERROR

**HTTP Status:** 500

**Description:** Unexpected server error

**Common Causes:**
- Database connection issues
- Unhandled exceptions
- Service unavailability

**Solution:**
```
Try again later. If the problem persists, contact support with the timestamp from the error.
```

**Example:**
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "suggestion": "Please try again later",
    "timestamp": "2024-01-01T12:00:00.000Z"
  }
}
```

---

## Service-Specific Errors

### REGISTRATION_FAILED

**HTTP Status:** 400

**Description:** User registration failed

**Common Causes:**
- Database error during user creation
- Invalid data format
- System constraints violated

**Solution:**
```
Check your input data and try again. Contact support if the problem persists.
```

---

### PROFILE_CREATION_FAILED

**HTTP Status:** 400

**Description:** Failed to create business profile

**Common Causes:**
- Invalid business type or industry
- Database constraints violated
- Missing required fields

**Solution:**
```
Verify all required fields are provided with valid values.
```

---

### PROFILE_UPDATE_FAILED

**HTTP Status:** 400

**Description:** Failed to update business profile

**Common Causes:**
- Invalid field values
- Attempting to update non-existent profile
- Database error

**Solution:**
```
Check your input data and ensure the profile exists.
```

---

### STRATEGY_GENERATION_FAILED

**HTTP Status:** 400

**Description:** Failed to generate marketing strategies

**Common Causes:**
- Invalid budget value
- Missing business profile
- AI service unavailable

**Solution:**
```
Ensure you have a complete business profile and valid budget (if provided).
```

---

### CONTENT_GENERATION_FAILED

**HTTP Status:** 400

**Description:** Failed to generate content suggestions

**Common Causes:**
- Invalid count parameter
- Missing business profile
- AI service unavailable

**Solution:**
```
Ensure you have a complete business profile and valid count parameter.
```

---

### SENTIMENT_ANALYSIS_FAILED

**HTTP Status:** 400

**Description:** Failed to analyze sentiment

**Common Causes:**
- Empty feedback array
- Invalid feedback format
- Sentiment analysis service unavailable

**Solution:**
```
Ensure feedback array contains valid text entries.
```

---

### QUERY_PROCESSING_ERROR

**HTTP Status:** 500

**Description:** Failed to process conversational AI query

**Common Causes:**
- AI service timeout
- Invalid query format
- Service unavailable

**Solution:**
```
Try rephrasing your question or try again later.
```

---

### METRICS_ERROR

**HTTP Status:** 500

**Description:** Failed to calculate financial metrics

**Common Causes:**
- Database query error
- Invalid date range
- No transaction data

**Solution:**
```
Verify your date range and ensure you have transaction data.
```

---

### FORECAST_ERROR

**HTTP Status:** 500

**Description:** Failed to generate cash flow forecast

**Common Causes:**
- Insufficient historical data
- Invalid parameters
- Calculation error

**Solution:**
```
Ensure you have at least 3 months of transaction history.
```

---

### DASHBOARD_ERROR

**HTTP Status:** 500

**Description:** Failed to fetch dashboard data

**Common Causes:**
- Database error
- Service unavailable
- Data aggregation failure

**Solution:**
```
Try refreshing the dashboard or try again later.
```

---

## Error Handling Best Practices

### 1. Always Check Status Codes

```typescript
try {
  const response = await apiClient.get('/endpoint');
  // Handle success
} catch (error: any) {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;
    console.error(`Error ${status}:`, data.error);
  } else if (error.request) {
    // Request made but no response
    console.error('No response from server');
  } else {
    // Request setup error
    console.error('Request error:', error.message);
  }
}
```

### 2. Display User-Friendly Messages

```typescript
const getErrorMessage = (error: any): string => {
  if (error.response?.data?.error) {
    const apiError = error.response.data.error;
    return apiError.suggestion || apiError.message;
  }
  return 'An unexpected error occurred. Please try again.';
};
```

### 3. Implement Retry Logic

```typescript
const shouldRetry = (error: any): boolean => {
  const status = error.response?.status;
  return status === 429 || status >= 500;
};
```

### 4. Log Errors for Debugging

```typescript
const logError = (error: any, context: string) => {
  console.error(`[${context}]`, {
    code: error.response?.data?.error?.code,
    message: error.response?.data?.error?.message,
    timestamp: error.response?.data?.error?.timestamp,
    url: error.config?.url,
    method: error.config?.method,
  });
};
```

---

## Quick Reference Table

| Code | Status | Category | Retry? |
|------|--------|----------|--------|
| UNAUTHORIZED | 401 | Auth | No |
| LOGIN_FAILED | 401 | Auth | No |
| REFRESH_FAILED | 401 | Auth | No |
| VALIDATION_ERROR | 400 | Input | No |
| INVALID_QUERY | 400 | Input | No |
| INVALID_PARAMETERS | 400 | Input | No |
| INSUFFICIENT_DATA | 400 | Data | No |
| FORBIDDEN | 403 | Auth | No |
| NOT_FOUND | 404 | Resource | No |
| PROFILE_NOT_FOUND | 404 | Resource | No |
| USER_EXISTS | 409 | Conflict | No |
| PROFILE_EXISTS | 409 | Conflict | No |
| RATE_LIMIT_EXCEEDED | 429 | Rate Limit | Yes |
| INTERNAL_ERROR | 500 | Server | Yes |
| QUERY_PROCESSING_ERROR | 500 | Server | Yes |
| METRICS_ERROR | 500 | Server | Yes |
| FORECAST_ERROR | 500 | Server | Yes |
| DASHBOARD_ERROR | 500 | Server | Yes |

---

*Last Updated: January 2024*
