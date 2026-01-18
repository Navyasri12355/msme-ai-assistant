# MSME AI Assistant

An AI-powered business assistant designed specifically for Micro, Small, and Medium Enterprises (MSMEs). This comprehensive platform helps business owners manage their finances, customers, products, and receive intelligent business advice through conversational AI.

## 🚀 Features

### 💰 Financial Management
- **Transaction Tracking**: Record and categorize income and expenses with batch upload support
- **Financial Analytics**: Real-time profit/loss analysis and cash flow insights
- **Automated Calculations**: Profit margins, expense breakdowns, and financial trends
- **Currency Support**: Indian Rupee (₹) formatting and calculations
- **Secure Data**: All financial data is encrypted at rest

### 👥 Customer Management
- **Customer Database**: Comprehensive customer information management
- **Customer Analytics**: Track customer statistics and engagement
- **Search & Filter**: Advanced customer search and filtering capabilities
- **Customer Insights**: Integration with transaction history for customer analysis

### 📦 Product Management
- **Product Catalog**: Complete product inventory management
- **Stock Tracking**: Monitor stock levels with low-stock alerts
- **Product Analytics**: Track top-performing products and revenue
- **Category Management**: Organize products by categories
- **Pricing Management**: Encrypted price and cost tracking

### 🤖 AI-Powered Business Advisor
- **Conversational AI**: Natural language business queries and advice
- **Context-Aware Responses**: AI understands your business profile and financial history
- **Personalized Recommendations**: Tailored advice based on your industry and business size
- **Cost-Cutting Strategies**: AI-generated suggestions to reduce expenses
- **Growth Strategies**: Actionable recommendations for business expansion
- **Fallback System**: Basic business advice when AI models are unavailable

### 📊 Business Intelligence Dashboard
- **Interactive Dashboard**: Visual representation of key business metrics
- **Real-time Customer Count**: Accurate customer statistics from database
- **Performance Insights**: Automated analysis of business trends
- **Revenue Forecasting**: Predictive analytics for future performance
- **Expense Analysis**: Detailed breakdown of spending patterns
- **Product Performance**: Top products by revenue and sales volume

### 📈 Marketing Support
- **Marketing Strategy Generator**: Industry-specific marketing recommendations
- **Content Suggestions**: AI-generated content ideas for social media and marketing
- **Customer Sentiment Analysis**: Analyze customer feedback and reviews
- **Budget-Friendly Campaigns**: Cost-effective marketing strategies for small businesses

### 👤 User Management
- **Secure Authentication**: JWT-based authentication with bcrypt password hashing
- **Business Profiles**: Comprehensive business information management
- **Multi-tenant Architecture**: Secure data isolation between users

## 🌟 Key Highlights

### 🎯 MSME-Focused Design
- **Tailored for Small Businesses**: Every feature designed specifically for MSME needs
- **Cost-Effective Solutions**: Emphasis on budget-friendly strategies and tools
- **Indian Market Ready**: INR currency support and local business context

### 🤖 Intelligent AI System
- **Multiple Model Fallbacks**: Automatic switching between AI models for reliability
- **Context-Aware Advice**: AI understands your specific business situation
- **Graceful Degradation**: Provides basic business advice when AI is unavailable
- **Smart Error Handling**: Robust error recovery and user-friendly messages

### 🔒 Enterprise-Grade Security
- **Data Encryption**: AES-256-GCM encryption for sensitive financial data
- **Secure Authentication**: JWT tokens with refresh mechanism
- **Input Validation**: Comprehensive validation using Zod schemas
- **Rate Limiting**: Protection against API abuse

### 📊 Comprehensive Analytics
- **Real-Time Dashboard**: Live business metrics and insights
- **Customer Intelligence**: Track customer behavior and engagement
- **Product Performance**: Monitor inventory and sales analytics
- **Financial Forecasting**: Predictive analytics for business planning

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- **React 18** with TypeScript
- **Vite** for fast development and building
- **TailwindCSS** for responsive styling
- **React Router** for navigation
- **TanStack Query** for data fetching and caching
- **Recharts** for data visualization

**Backend:**
- **Node.js** with Express.js
- **TypeScript** for type safety
- **PostgreSQL** for primary database
- **Redis** for caching and session management
- **OpenRouter AI** for conversational AI capabilities

**Infrastructure:**
- **Docker Compose** for local development
- **JWT** for authentication
- **AES-256-GCM** encryption for sensitive data
- **Rate limiting** and security middleware

### Project Structure

```
msme-ai-assistant/
├── backend/                 # Node.js/Express API server
│   ├── src/
│   │   ├── config/         # Database, Redis, environment configuration
│   │   ├── middleware/     # Authentication, validation, error handling
│   │   ├── models/         # Data models (User, Transaction, Customer, Product, BusinessProfile)
│   │   ├── routes/         # API route handlers
│   │   ├── schemas/        # Validation schemas (Zod)
│   │   ├── services/       # Business logic and AI services
│   │   ├── types/          # TypeScript type definitions
│   │   └── utils/          # Utility functions (encryption, caching)
│   ├── db/                 # Database initialization scripts
│   └── package.json
├── frontend/               # React application
│   ├── src/
│   │   ├── api/           # API client functions
│   │   ├── components/    # Reusable React components
│   │   ├── contexts/      # React context providers
│   │   ├── pages/         # Page components (Dashboard, Customers, Products, etc.)
│   │   ├── types/         # TypeScript type definitions
│   │   └── utils/         # Utility functions
│   └── package.json
├── data/                  # Sample data files
├── scripts/               # Setup and utility scripts
├── docker-compose.yml     # Docker services configuration
└── package.json          # Root package.json with workspaces
```

## 🛠️ Prerequisites

Before running this project, make sure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Docker** and **Docker Compose**
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd msme-ai-assistant
```

### 2. Install Dependencies

```bash
npm install
```

This will install dependencies for both frontend and backend using npm workspaces.

### 3. Set Up Environment Variables

#### Backend Configuration

Copy the example environment file and configure it:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your configuration:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration (matches docker-compose.yml)
DB_HOST=localhost
DB_PORT=5434
DB_NAME=msme_assistant
DB_USER=postgres
DB_PASSWORD=postgres

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# JWT Configuration (CHANGE IN PRODUCTION)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=30d

# Encryption (CHANGE IN PRODUCTION)
ENCRYPTION_KEY=your-32-character-encryption-key-here

# AI Service Configuration
OPENROUTER_API_KEY=your-openrouter-api-key-here
OPENROUTER_MODEL=meta-llama/llama-3.2-3b-instruct:free
```

#### Frontend Configuration

Create a frontend environment file:

```bash
cp frontend/.env.example frontend/.env
```

Or create `frontend/.env` with:

```env
VITE_API_URL=http://localhost:3000
```

### 4. Start Database Services

Start PostgreSQL and Redis using Docker Compose:

```bash
docker-compose up -d
```

This will start:
- PostgreSQL on port 5434
- Redis on port 6379

### 5. Run the Application

Start both frontend and backend in development mode:

```bash
npm run dev
```

This will start:
- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173

## 🔧 Development

### Available Scripts

#### Root Level Scripts

```bash
npm run dev          # Start both frontend and backend
npm run dev:backend  # Start only backend
npm run dev:frontend # Start only frontend
npm run build        # Build both applications
npm run test         # Run tests for both applications
npm run verify       # Verify project setup
```

#### Backend Scripts

```bash
cd backend
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run start        # Start production server
npm run test         # Run Jest tests
npm run test:watch   # Run tests in watch mode
```

#### Frontend Scripts

```bash
cd frontend
npm run dev          # Start Vite development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run Vitest tests
npm run test:watch   # Run tests in watch mode
```

### Database Management

#### View Database

Connect to PostgreSQL:

```bash
docker exec -it msme-postgres psql -U postgres -d msme_assistant
```

#### Reset Database

```bash
docker-compose down -v  # Remove containers and volumes
docker-compose up -d    # Restart with fresh database
```

#### View Redis Cache

Connect to Redis:

```bash
docker exec -it msme-redis redis-cli
```

## 🤖 AI Configuration

### OpenRouter Setup

1. **Get API Key**: Visit [OpenRouter.ai](https://openrouter.ai/) and create an account
2. **Generate Key**: Create an API key in your dashboard
3. **Configure**: Add your key to `backend/.env`:

```env
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=xiaomi/mimo-v2-flash:free
```

**Important Notes:**
- **Free Tier Limitations**: OpenRouter's free models have limited quotas and may require account verification
- **Fallback System**: If AI models are unavailable, the system provides basic business advice
- **Multiple Models**: The system tries multiple free models automatically if one fails
- **Account Issues**: New accounts may experience 402 errors initially - this is normal and the system handles it gracefully

**Troubleshooting:**
- If you get 402 errors with a new account, the system will use basic responses
- Check your OpenRouter dashboard for usage and account status
- Free models may be temporarily unavailable due to high demand

### Available Models

The system uses a robust fallback system with multiple free models:

**Primary Model:**
- `xiaomi/mimo-v2-flash:free` (Fast and efficient)

**Fallback Models:**
- `meta-llama/llama-3.2-3b-instruct:free`
- `meta-llama/llama-3.2-1b-instruct:free`
- `microsoft/phi-3-mini-128k-instruct:free`
- `qwen/qwen-2-7b-instruct:free`
- `huggingfaceh4/zephyr-7b-beta:free`
- `openchat/openchat-7b:free`

**Paid Models (Better Performance):**
- `openai/gpt-4o-mini`
- `anthropic/claude-3-haiku`
- `meta-llama/llama-3.1-70b-instruct`

### API Documentation

### Authentication Endpoints

```
POST /api/auth/register    # Register new user
POST /api/auth/login       # User login
POST /api/auth/refresh     # Refresh JWT token
POST /api/auth/logout      # User logout
```

### Business Profile Endpoints

```
GET    /api/business-profile     # Get user's business profile
POST   /api/business-profile     # Create business profile
PUT    /api/business-profile     # Update business profile
DELETE /api/business-profile     # Delete business profile
```

### Transaction Endpoints

```
GET    /api/transactions          # Get user's transactions with filters
POST   /api/transactions          # Create new transaction
POST   /api/transactions/batch    # Create multiple transactions
PUT    /api/transactions/:id      # Update transaction
DELETE /api/transactions/:id      # Delete transaction
```

### Customer Management Endpoints

```
GET    /api/customers             # Get user's customers with search/filter
POST   /api/customers             # Create new customer
PUT    /api/customers/:id         # Update customer
DELETE /api/customers/:id         # Delete customer
GET    /api/customers/stats       # Get customer statistics
```

### Product Management Endpoints

```
GET    /api/products              # Get user's products with filters
POST   /api/products              # Create new product
PUT    /api/products/:id          # Update product
DELETE /api/products/:id          # Delete product
GET    /api/products/stats        # Get product statistics
GET    /api/products/categories   # Get product categories
```

### AI Chat Endpoints

```
POST /api/conversational-ai/query  # Send query to AI assistant
GET  /api/conversational-ai/history # Get conversation history
DELETE /api/conversational-ai/history # Clear conversation history
```

### Dashboard Endpoints

```
GET /api/dashboard               # Get complete dashboard data
GET /api/dashboard/metrics       # Get key business metrics
GET /api/dashboard/insights      # Get AI-generated insights
GET /api/dashboard/trends        # Get performance trends
POST /api/dashboard/refresh      # Refresh dashboard metrics
```

### Marketing Endpoints

```
GET  /api/marketing/strategies     # Get marketing strategies
GET  /api/marketing/content        # Get content suggestions
POST /api/marketing/sentiment      # Analyze customer sentiment
```

### Finance Endpoints

```
GET /api/finance/summary          # Get financial summary
GET /api/finance/trends           # Get financial trends
GET /api/finance/forecast         # Get financial forecasts
```

## 🔒 Security Features

### Data Protection
- **Encryption at Rest**: Sensitive data encrypted using AES-256-GCM
- **Password Security**: bcrypt hashing with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Zod schema validation for all inputs
- **SQL Injection Prevention**: Parameterized queries
- **Rate Limiting**: API rate limiting to prevent abuse

### Environment Security
- **Environment Variables**: Sensitive configuration in environment files
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Error Handling**: Secure error messages without sensitive data exposure

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm run test        # Run all tests
npm run test:watch  # Run tests in watch mode
```

### Frontend Testing

```bash
cd frontend
npm run test        # Run all tests
npm run test:watch  # Run tests in watch mode
```

## 🚀 Production Deployment

### Environment Setup

1. **Set Production Environment Variables**:
   ```env
   NODE_ENV=production
   JWT_SECRET=your-production-jwt-secret
   ENCRYPTION_KEY=your-production-encryption-key
   ```

2. **Build Applications**:
   ```bash
   npm run build
   ```

3. **Database Migration**:
   - Set up production PostgreSQL database
   - Run initialization scripts from `backend/db/init.sql`

4. **Redis Setup**:
   - Configure production Redis instance
   - Update connection settings

### Docker Production

Create a production docker-compose file:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    depends_on:
      - postgres
      - redis
  
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: msme_assistant
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database logs
docker logs msme-postgres

# Restart database
docker-compose restart postgres
```

#### Redis Connection Issues
```bash
# Check if Redis is running
docker ps | grep redis

# Test Redis connection
docker exec -it msme-redis redis-cli ping

# Restart Redis
docker-compose restart redis
```

#### Port Conflicts
```bash
# Check what's using port 3000
lsof -i :3000

# Check what's using port 5173
lsof -i :5173

# Kill process using port
kill -9 <PID>
```

#### AI API Issues
- Verify OpenRouter API key is correct
- Check API key has sufficient credits
- Ensure model name is spelled correctly
- Check network connectivity

### Logs

#### Backend Logs
```bash
# Development logs are shown in terminal
npm run dev:backend

# Production logs
pm2 logs  # if using PM2
```

#### Database Logs
```bash
docker logs msme-postgres
```

#### Redis Logs
```bash
docker logs msme-redis
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm run test`
6. Commit your changes: `git commit -m 'Add new feature'`
7. Push to the branch: `git push origin feature/new-feature`
8. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Use meaningful commit messages
- Update documentation for API changes
- Ensure code passes linting and formatting

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

1. Check the troubleshooting section above
2. Review the API documentation
3. Check existing GitHub issues
4. Create a new issue with detailed information

## 🔄 Changelog

### Version 1.0.0
- Complete MSME business management platform
- AI-powered business advisor with fallback system
- Financial tracking and analytics with INR currency support
- Customer management system with search and analytics
- Product management with inventory tracking
- Marketing strategy generator
- Interactive dashboard with real-time metrics
- Secure user authentication and data encryption
- Docker-based development environment
- Batch transaction upload support
- Comprehensive error handling and recovery

---

**Built with ❤️ for MSME businesses**