# Design Document: MSME AI Assistant

## Overview

The MSME AI Assistant is a web-based application that provides small and micro enterprises with AI-powered business intelligence capabilities. The system consists of four primary modules: a Conversational AI interface for natural language queries, a Finance Analysis Engine for financial insights and forecasting, a Marketing Advisor for strategy and content recommendations, and a Dashboard Service for visualizing key metrics. The architecture follows a microservices pattern with a React-based frontend, Node.js backend services, and integration with AI/ML models for natural language processing, sentiment analysis, and predictive analytics.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│                     (React + TypeScript)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Chat   │  │ Finance  │  │ Marketing│  │Dashboard │   │
│  │    UI    │  │    UI    │  │    UI    │  │    UI    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │    API Gateway    │
                    │   (Express.js)    │
                    └─────────┬─────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│ Conversational │  │     Finance     │  │    Marketing    │
│   AI Service   │  │ Analysis Service│  │ Advisor Service │
│                │  │                 │  │                 │
│  - NLP Engine  │  │ - Transaction   │  │ - Strategy Gen  │
│  - Query       │  │   Processor     │  │ - Content Gen   │
│    Handler     │  │ - Forecasting   │  │ - Sentiment     │
│  - Context     │  │   Engine        │  │   Analysis      │
│    Manager     │  │ - Metrics Calc  │  │                 │
└────────┬───────┘  └────────┬────────┘  └────────┬────────┘
         │                   │                     │
         └───────────────────┼─────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Dashboard      │
                    │    Service      │
                    │                 │
                    │ - Aggregator    │
                    │ - Insight Gen   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   Data Layer    │
                    │                 │
                    │ - PostgreSQL    │
                    │ - Redis Cache   │
                    └─────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- TailwindCSS for styling
- React Query for data fetching
- Recharts for data visualization
- Axios for API communication

**Backend:**
- Node.js with Express.js
- TypeScript for type safety
- JWT for authentication
- bcrypt for password hashing

**AI/ML:**
- OpenAI API or similar LLM for conversational AI
- Hugging Face Transformers for sentiment analysis
- Prophet or simple time series models for forecasting

**Database:**
- PostgreSQL for persistent storage
- Redis for caching and session management

**Security:**
- TLS/HTTPS for all communications
- AES-256 encryption for sensitive data at rest
- Rate limiting and input validation

## Components and Interfaces

### 1. Conversational AI Service

**Responsibilities:**
- Process natural language business queries
- Maintain conversation context
- Generate data-driven responses
- Handle query disambiguation

**Key Interfaces:**

```typescript
interface ConversationalAIService {
  processQuery(userId: string, query: string, context?: ConversationContext): Promise<AIResponse>;
  getConversationHistory(userId: string, limit?: number): Promise<Message[]>;
  clearContext(userId: string): Promise<void>;
}

interface AIResponse {
  message: string;
  suggestions?: string[];
  requiresClarification: boolean;
  clarificationQuestions?: string[];
  dataReferences?: DataReference[];
}

interface ConversationContext {
  previousMessages: Message[];
  userBusinessProfile: BusinessProfile;
  currentTopic?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
```

### 2. Finance Analysis Service

**Responsibilities:**
- Categorize transactions
- Calculate financial metrics
- Generate cash flow forecasts
- Detect anomalies and trends

**Key Interfaces:**

```typescript
interface FinanceAnalysisService {
  categorizeTransactions(transactions: Transaction[]): Promise<CategorizedTransaction[]>;
  calculateMetrics(userId: string, period: DateRange): Promise<FinancialMetrics>;
  generateForecast(userId: string, months: number): Promise<CashFlowForecast>;
  analyzeSpending(userId: string, period: DateRange): Promise<SpendingAnalysis>;
}

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  date: Date;
  description: string;
  category?: string;
  type?: 'income' | 'expense';
}

interface CategorizedTransaction extends Transaction {
  category: string;
  type: 'income' | 'expense';
  confidence: number;
}

interface FinancialMetrics {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  period: DateRange;
  categoryBreakdown: CategoryTotal[];
}

interface CashFlowForecast {
  projections: MonthlyProjection[];
  confidence: number;
  seasonalFactors: SeasonalFactor[];
  assumptions: string[];
}

interface MonthlyProjection {
  month: string;
  projectedIncome: number;
  projectedExpenses: number;
  projectedNetCashFlow: number;
}
```

### 3. Marketing Advisor Service

**Responsibilities:**
- Generate marketing strategies
- Suggest content ideas
- Analyze customer sentiment
- Provide implementation guidance

**Key Interfaces:**

```typescript
interface MarketingAdvisorService {
  generateStrategies(businessProfile: BusinessProfile, budget?: number): Promise<MarketingStrategy[]>;
  suggestContent(businessProfile: BusinessProfile, count: number): Promise<ContentSuggestion[]>;
  analyzeSentiment(feedback: CustomerFeedback[]): Promise<SentimentAnalysis>;
  getImplementationGuide(strategyId: string): Promise<ImplementationGuide>;
}

interface MarketingStrategy {
  id: string;
  title: string;
  description: string;
  estimatedCost: number;
  expectedReach: number;
  difficulty: 'low' | 'medium' | 'high';
  actionSteps: string[];
  timeline: string;
}

interface ContentSuggestion {
  id: string;
  title: string;
  platform: 'social' | 'email' | 'blog' | 'sms';
  contentType: string;
  outline: string;
  estimatedEffort: 'low' | 'medium' | 'high';
  potentialReach: number;
  relevance: string;
}

interface SentimentAnalysis {
  overallScore: number;
  distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  keyTopics: TopicSentiment[];
  negativeIssues: Issue[];
  languageBreakdown: LanguageSentiment[];
}

interface CustomerFeedback {
  id: string;
  text: string;
  language: string;
  source: string;
  date: Date;
}
```

### 4. Dashboard Service

**Responsibilities:**
- Aggregate data from all services
- Generate actionable insights
- Calculate and display key metrics
- Prioritize recommendations

**Key Interfaces:**

```typescript
interface DashboardService {
  getDashboardData(userId: string): Promise<DashboardData>;
  generateInsights(userId: string): Promise<Insight[]>;
  getMetricTrends(userId: string, metrics: string[]): Promise<MetricTrend[]>;
  refreshMetrics(userId: string): Promise<void>;
}

interface DashboardData {
  keyMetrics: KeyMetrics;
  trends: MetricTrend[];
  insights: Insight[];
  alerts: Alert[];
  lastUpdated: Date;
}

interface KeyMetrics {
  dailyRevenue: number;
  totalCustomers: number;
  topProducts: ProductMetric[];
  revenueChange: number;
  customerChange: number;
}

interface Insight {
  id: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  recommendedAction: string;
  expectedImpact: string;
  category: 'finance' | 'marketing' | 'operations';
}

interface MetricTrend {
  metric: string;
  current: number;
  previous: number;
  change: number;
  direction: 'up' | 'down' | 'stable';
}
```

## Data Models

### User and Business Profile

```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  lastLogin: Date;
  businessProfile: BusinessProfile;
}

interface BusinessProfile {
  businessName: string;
  businessType: string;
  industry: string;
  location: string;
  targetAudience: string;
  monthlyRevenue?: number;
  employeeCount: number;
  establishedDate: Date;
}
```

### Transaction Data

```typescript
interface TransactionRecord {
  id: string;
  userId: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: Date;
  paymentMethod?: string;
  customerId?: string;
  productId?: string;
  metadata: Record<string, any>;
}
```

### Customer and Product Data

```typescript
interface Customer {
  id: string;
  userId: string;
  name: string;
  contact: string;
  totalPurchases: number;
  lastPurchaseDate: Date;
  feedback: CustomerFeedback[];
}

interface Product {
  id: string;
  userId: string;
  name: string;
  category: string;
  price: number;
  unitsSold: number;
  revenue: number;
}
```

## 
Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

After reviewing all acceptance criteria, I've identified properties that can be combined or are redundant. For example, multiple properties about "structure validation" (checking that responses contain required fields) can be consolidated. Properties about recommendations being "tailored" or "relevant" are difficult to test without subjective evaluation, so we focus on verifiable structural and behavioral properties.

### Conversational AI Properties

**Property 1: Cost-cutting recommendations completeness**
*For any* business data, when requesting cost-cutting strategies, the response should contain at least three distinct recommendations.
**Validates: Requirements 1.2**

**Property 2: Growth strategy contextualization**
*For any* business profile with specified industry and metrics, when requesting growth strategies, the response should reference the provided industry and at least one metric from the profile.
**Validates: Requirements 1.3**

### Finance Analysis Properties

**Property 3: Financial calculation consistency**
*For any* set of transactions, the calculated net profit should equal total income minus total expenses.
**Validates: Requirements 2.2**

**Property 4: Financial snapshot completeness**
*For any* financial data, the rendered snapshot should contain labeled fields for income, expenses, and the calculated values.
**Validates: Requirements 2.3**

**Property 5: Invalid transaction flagging**
*For any* transaction with missing required fields (amount, date, or description), the validation should flag it as invalid.
**Validates: Requirements 2.4**

**Property 6: Forecast structure completeness**
*For any* historical transaction data with sufficient history, generating a forecast should return exactly 3 monthly projections, each containing income, expenses, and net cash flow.
**Validates: Requirements 3.1**

**Property 7: Seasonal pattern incorporation**
*For any* historical data with a repeating monthly pattern, the forecast for the corresponding future month should reflect that pattern with a deviation of less than 30%.
**Validates: Requirements 3.2**

**Property 8: Forecast display completeness**
*For any* generated forecast, each projection period should include non-null values for projected income, projected expenses, and projected net cash flow.
**Validates: Requirements 3.3**

**Property 9: Forecast adaptation to actuals**
*For any* forecast where actual results deviate by more than 20%, regenerating the forecast should produce different projections that account for the new pattern.
**Validates: Requirements 3.5**

### Marketing Advisor Properties

**Property 10: Marketing strategy completeness**
*For any* business profile, requesting marketing advice should return at least three strategies, each containing a title, description, cost estimate, and action steps.
**Validates: Requirements 4.1, 4.4**

**Property 11: Marketing strategy cost ordering**
*For any* set of generated marketing strategies, they should be ordered such that each strategy's cost is less than or equal to the next strategy's cost.
**Validates: Requirements 4.2**

**Property 12: Budget constraint compliance**
*For any* specified budget amount, all returned marketing strategies should have an estimated cost less than or equal to that budget.
**Validates: Requirements 4.3**

**Property 13: Recommendation context sensitivity**
*For any* two different business profiles (differing in industry or target audience), the generated marketing strategies should be different.
**Validates: Requirements 4.5**

**Property 14: Content suggestion completeness**
*For any* business profile, requesting content suggestions should return at least five suggestions, each containing a title, platform, outline, effort level, and potential reach.
**Validates: Requirements 5.1, 5.2, 5.5**

**Property 15: Content outline provision**
*For any* valid content suggestion ID, requesting the detailed outline should return a non-empty outline or template.
**Validates: Requirements 5.3**

**Property 16: Sentiment classification validity**
*For any* customer feedback text, the sentiment analysis should classify it as exactly one of: positive, negative, or neutral.
**Validates: Requirements 6.1**

**Property 17: Sentiment aggregation**
*For any* set of customer feedback, the overall sentiment score should be calculated, and the distribution percentages (positive + neutral + negative) should sum to 100%.
**Validates: Requirements 6.2**

**Property 18: Topic frequency identification**
*For any* set of customer feedback with known topic mentions, the most frequently mentioned topics should be identified and ranked by frequency.
**Validates: Requirements 6.4**

### Dashboard Properties

**Property 19: Dashboard metric completeness**
*For any* business with transaction and customer data, the dashboard should display non-null values for daily revenue, total customers, and top products.
**Validates: Requirements 7.1**

**Property 20: Metric trend calculation**
*For any* metric with current and previous period values, the trend direction should be 'up' if current > previous, 'down' if current < previous, and 'stable' if equal.
**Validates: Requirements 7.2**

**Property 21: Alert generation for thresholds**
*For any* metric that exceeds or falls below its predefined threshold, an alert should be generated for that metric.
**Validates: Requirements 7.3**

**Property 22: Insight generation completeness**
*For any* business data, the dashboard should generate at least three insights, each containing a title, description, recommended action, and expected impact.
**Validates: Requirements 8.1, 8.2**

**Property 23: Insight prioritization**
*For any* set of generated insights with assigned priorities, they should be ordered such that 'high' priority insights appear before 'medium', which appear before 'low'.
**Validates: Requirements 8.3**

**Property 24: Declining metric insight structure**
*For any* insight generated for a declining metric, it should include a likely cause field and a corrective measures field, both non-empty.
**Validates: Requirements 8.4**

**Property 25: Performance improvement acknowledgment**
*For any* previously suggested action that is marked as implemented, if the related metric improves, an acknowledgment insight should be generated with next steps.
**Validates: Requirements 8.5**

### Security Properties

**Property 26: Password hashing**
*For any* user password, the stored password hash should not equal the plaintext password.
**Validates: Requirements 9.1**

**Property 27: Sensitive data encryption**
*For any* sensitive data field (financial amounts, customer contact info), the stored value in the database should be encrypted (not equal to the plaintext value).
**Validates: Requirements 9.3**

**Property 28: Authorization enforcement**
*For any* data access request, if the user is not authenticated or not authorized for that resource, the request should be denied with an appropriate error.
**Validates: Requirements 9.4**

### Usability Properties

**Property 29: Action feedback provision**
*For any* user action (create, update, delete), the system should return a confirmation response indicating success or failure.
**Validates: Requirements 10.3**

**Property 30: Error message structure**
*For any* error condition, the error message should contain both an explanation of what went wrong and a suggestion for how to fix it.
**Validates: Requirements 10.4**

## Error Handling

### Input Validation

**Transaction Data:**
- Validate required fields: amount (non-zero number), date (valid date), description (non-empty string)
- Sanitize text inputs to prevent injection attacks
- Reject transactions with future dates beyond current date
- Flag duplicate transactions based on amount, date, and description similarity

**User Queries:**
- Limit query length to 500 characters
- Detect and handle empty or whitespace-only queries
- Implement rate limiting: max 60 queries per minute per user
- Sanitize inputs before passing to AI models

**Business Profile:**
- Validate email format
- Ensure business type and industry are from predefined lists
- Validate date fields are in the past
- Require minimum profile completeness (name, type, industry) before enabling features

### Service-Level Error Handling

**AI Service Errors:**
- Timeout handling: If AI model doesn't respond within 10 seconds, return cached response or error message
- Fallback responses: Maintain a set of generic helpful responses for common query types
- Context overflow: If conversation history exceeds token limits, summarize older messages

**Finance Service Errors:**
- Insufficient data: Clearly communicate minimum data requirements (e.g., "Need at least 3 months of data for forecasting")
- Calculation errors: Log errors and return partial results with warnings
- Categorization failures: Allow manual category assignment for uncategorized transactions

**Marketing Service Errors:**
- Sentiment analysis failures: Default to neutral sentiment with confidence score of 0
- Language detection errors: Attempt English processing as fallback
- Strategy generation failures: Return template-based strategies if AI generation fails

**Dashboard Service Errors:**
- Missing data: Display "N/A" or placeholder with explanation
- Aggregation errors: Show partial dashboard with warnings for failed sections
- Stale data: Display last update timestamp and allow manual refresh

### Error Response Format

All API errors should follow a consistent format:

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: string;
    suggestion?: string;
    timestamp: Date;
  };
}
```

### Logging and Monitoring

- Log all errors with severity levels: ERROR, WARN, INFO
- Track error rates per service and endpoint
- Alert on error rate spikes (>5% of requests)
- Maintain audit logs for security-related events (failed logins, unauthorized access attempts)

## Testing Strategy

### Unit Testing

**Framework:** Jest with TypeScript support

**Coverage Goals:**
- Minimum 80% code coverage for business logic
- 100% coverage for security-critical functions (authentication, encryption, authorization)

**Key Areas:**
- Individual service methods
- Data validation functions
- Calculation logic (financial metrics, sentiment scoring)
- Error handling paths
- Edge cases: empty inputs, boundary values, invalid data

**Example Unit Tests:**
- Test that `calculateMetrics` correctly sums income and expenses
- Test that `categorizeTransaction` handles unknown categories
- Test that `generateForecast` rejects insufficient data
- Test that password hashing produces different hashes for same password (due to salt)

### Property-Based Testing

**Framework:** fast-check (JavaScript/TypeScript property-based testing library)

**Configuration:**
- Minimum 100 iterations per property test
- Use seed-based randomization for reproducibility
- Generate realistic test data using custom generators

**Property Test Implementation:**
- Each property test MUST be tagged with a comment referencing the design document property
- Tag format: `// Feature: msme-ai-assistant, Property {number}: {property_text}`
- Each correctness property MUST be implemented by a SINGLE property-based test

**Custom Generators:**
- `arbitraryTransaction`: Generates valid transaction objects with random amounts, dates, categories
- `arbitraryBusinessProfile`: Generates realistic business profiles with various industries and sizes
- `arbitraryFeedback`: Generates customer feedback text in multiple languages
- `arbitraryFinancialData`: Generates sets of transactions with controllable patterns (seasonal, trending, random)

**Example Property Tests:**

```typescript
// Feature: msme-ai-assistant, Property 3: Financial calculation consistency
it('net profit equals income minus expenses', () => {
  fc.assert(
    fc.property(fc.array(arbitraryTransaction()), async (transactions) => {
      const metrics = await financeService.calculateMetrics(userId, transactions);
      const expectedProfit = metrics.totalIncome - metrics.totalExpenses;
      expect(metrics.netProfit).toBeCloseTo(expectedProfit, 2);
    }),
    { numRuns: 100 }
  );
});

// Feature: msme-ai-assistant, Property 16: Sentiment classification validity
it('sentiment is classified as exactly one category', () => {
  fc.assert(
    fc.property(arbitraryFeedback(), async (feedback) => {
      const result = await marketingService.analyzeSentiment([feedback]);
      const categories = [result.distribution.positive, result.distribution.neutral, result.distribution.negative];
      const nonZeroCategories = categories.filter(c => c > 0).length;
      expect(nonZeroCategories).toBeGreaterThanOrEqual(1);
    }),
    { numRuns: 100 }
  );
});
```

### Integration Testing

**Scope:**
- API endpoint testing with real HTTP requests
- Database integration with test database
- Service-to-service communication
- Authentication and authorization flows

**Tools:**
- Supertest for API testing
- Test containers for PostgreSQL and Redis
- Mock AI services for predictable responses

**Key Integration Tests:**
- End-to-end user registration and login flow
- Transaction upload, categorization, and metric calculation flow
- Query submission and response generation flow
- Dashboard data aggregation from multiple services

### End-to-End Testing

**Framework:** Playwright for browser automation

**Scenarios:**
- New user onboarding: Register → Complete profile → View dashboard
- Financial analysis: Upload transactions → View metrics → Generate forecast
- Marketing workflow: Request strategies → Get content suggestions → Analyze sentiment
- Conversational AI: Ask multiple related questions → Verify context is maintained

**Accessibility Testing:**
- Keyboard navigation
- Screen reader compatibility
- Color contrast validation
- ARIA labels and roles

## Deployment Architecture

### Development Environment

- Local development with Docker Compose
- Hot reloading for frontend and backend
- Local PostgreSQL and Redis instances
- Mock AI services for faster development

### Production Environment

**Infrastructure:**
- Cloud platform: AWS, Google Cloud, or Azure
- Container orchestration: Kubernetes or managed container service
- Load balancer for API gateway
- CDN for frontend static assets

**Database:**
- Managed PostgreSQL with automated backups
- Read replicas for query performance
- Redis cluster for caching and sessions

**Scaling Strategy:**
- Horizontal scaling for stateless services
- Auto-scaling based on CPU and request metrics
- Database connection pooling
- Caching layer to reduce database load

**Monitoring:**
- Application performance monitoring (APM)
- Error tracking and alerting
- Usage analytics and metrics
- Security monitoring and intrusion detection

## Performance Considerations

### Response Time Targets

- API endpoints: < 500ms for 95th percentile
- Dashboard load: < 2 seconds
- AI query processing: < 5 seconds
- Forecast generation: < 3 seconds

### Optimization Strategies

**Caching:**
- Cache dashboard data for 5 minutes
- Cache marketing strategies for 1 hour
- Cache sentiment analysis results indefinitely (until new feedback)
- Use Redis for session storage and frequently accessed data

**Database Optimization:**
- Index on userId for all user-specific queries
- Index on date fields for time-range queries
- Partition transaction table by date for large datasets
- Use materialized views for complex aggregations

**AI Model Optimization:**
- Batch similar queries when possible
- Use smaller, faster models for real-time features
- Cache common query responses
- Implement request queuing for rate-limited APIs

**Frontend Optimization:**
- Code splitting and lazy loading
- Image optimization and lazy loading
- Minimize bundle size
- Use service workers for offline capability

## Security Considerations

### Authentication

- JWT tokens with 24-hour expiration
- Refresh tokens with 30-day expiration
- Secure token storage (httpOnly cookies)
- Multi-factor authentication option for sensitive operations

### Authorization

- Role-based access control (RBAC)
- Resource-level permissions (users can only access their own data)
- API rate limiting per user
- IP-based rate limiting for authentication endpoints

### Data Protection

- TLS 1.3 for all communications
- AES-256 encryption for sensitive data at rest
- Encrypted database backups
- Secure key management (AWS KMS, Google Cloud KMS, or Azure Key Vault)
- Regular security audits and penetration testing

### Compliance

- GDPR compliance for data privacy
- Data retention policies
- User data export and deletion capabilities
- Audit logging for compliance reporting

## Future Enhancements

### Phase 2 Features

- Multi-user support for businesses with employees
- Inventory management integration
- Invoice generation and tracking
- Payment gateway integration
- Mobile app (React Native)

### Advanced Analytics

- Competitor analysis
- Market trend analysis
- Customer segmentation
- Predictive analytics for demand forecasting
- Anomaly detection for fraud prevention

### AI Enhancements

- Voice interface for queries
- Image recognition for receipt scanning
- Automated report generation
- Personalized learning from user interactions
- Multi-language support expansion

### Integration Capabilities

- Accounting software integration (Tally, QuickBooks)
- E-commerce platform integration (Shopify, WooCommerce)
- Social media analytics integration
- Payment processor integration (Razorpay, Paytm)
- SMS and WhatsApp notifications
