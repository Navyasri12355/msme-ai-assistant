# Project Structure

This document describes the organization of the MSME AI Assistant codebase.

## Root Directory

```
msme-ai-assistant/
├── backend/                 # Node.js + Express backend
├── frontend/                # React frontend
├── scripts/                 # Setup and utility scripts
├── .kiro/                   # Kiro specs and configuration
├── docker-compose.yml       # Docker services configuration
├── package.json             # Root package.json (workspaces)
├── README.md                # Main documentation
├── QUICKSTART.md            # Quick start guide
└── PROJECT_STRUCTURE.md     # This file
```

## Backend Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.ts      # PostgreSQL connection
│   │   ├── redis.ts         # Redis connection
│   │   └── env.ts           # Environment variables
│   ├── middleware/          # Express middleware
│   │   ├── errorHandler.ts # Error handling
│   │   └── validation.ts   # Request validation
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts         # Common types
│   ├── utils/               # Utility functions
│   │   └── logger.ts        # Logging utility
│   └── index.ts             # Application entry point
├── db/
│   └── init.sql             # Database initialization
├── package.json             # Backend dependencies
├── tsconfig.json            # TypeScript configuration
├── jest.config.js           # Jest test configuration
├── .env.example             # Environment variables template
└── .gitignore               # Git ignore rules

Future structure (to be added):
├── src/
│   ├── routes/              # API route handlers
│   ├── controllers/         # Business logic controllers
│   ├── services/            # Service layer
│   │   ├── conversational-ai/
│   │   ├── finance-analysis/
│   │   ├── marketing-advisor/
│   │   └── dashboard/
│   ├── models/              # Data models
│   └── repositories/        # Data access layer
```

## Frontend Structure

```
frontend/
├── src/
│   ├── components/          # React components (to be added)
│   ├── pages/               # Page components (to be added)
│   ├── hooks/               # Custom React hooks (to be added)
│   ├── services/            # API services (to be added)
│   ├── utils/               # Utility functions (to be added)
│   ├── types/               # TypeScript types (to be added)
│   ├── test/                # Test utilities
│   │   └── setup.ts         # Test setup
│   ├── App.tsx              # Main App component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles (Tailwind)
├── public/                  # Static assets (to be added)
├── index.html               # HTML template
├── package.json             # Frontend dependencies
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── postcss.config.js        # PostCSS configuration
├── .env.example             # Environment variables template
└── .gitignore               # Git ignore rules
```

## Configuration Files

### Docker Compose (`docker-compose.yml`)
- PostgreSQL database (port 5432)
- Redis cache (port 6379)
- Volume mounts for data persistence
- Health checks for services

### Backend Configuration

**`backend/tsconfig.json`**
- TypeScript compiler options
- Target: ES2022
- Module: CommonJS
- Strict mode enabled

**`backend/jest.config.js`**
- Test framework configuration
- Coverage thresholds: 80%
- ts-jest preset for TypeScript

**`backend/.env`**
- Server port and environment
- Database credentials
- Redis configuration
- JWT secrets
- AI service API keys

### Frontend Configuration

**`frontend/tsconfig.json`**
- TypeScript compiler options
- Target: ES2020
- JSX: react-jsx
- Strict mode enabled

**`frontend/vite.config.ts`**
- Vite build tool configuration
- React plugin
- Proxy for API requests
- Vitest test configuration

**`frontend/tailwind.config.js`**
- Tailwind CSS configuration
- Content paths for purging
- Theme customization

**`frontend/.env`**
- API base URL

## Key Technologies

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 16
- **Cache**: Redis 7
- **Testing**: Jest + fast-check (PBT)
- **Validation**: Zod
- **Authentication**: JWT + bcrypt

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS
- **State Management**: React Query
- **HTTP Client**: Axios
- **Charts**: Recharts
- **Testing**: Vitest + Testing Library

## Development Workflow

1. **Start Services**: `docker-compose up -d`
2. **Install Dependencies**: `npm install`
3. **Start Development**: `npm run dev`
4. **Run Tests**: `npm test`
5. **Build**: `npm run build`

## Testing Strategy

### Backend Tests
- **Unit Tests**: Jest for individual functions
- **Property Tests**: fast-check for universal properties
- **Integration Tests**: API endpoint testing
- **Location**: `backend/src/**/*.test.ts`

### Frontend Tests
- **Component Tests**: Testing Library
- **Unit Tests**: Vitest for utilities
- **Location**: `frontend/src/**/*.test.tsx`

## Environment Variables

### Backend Required Variables
- `PORT`: Server port (default: 3000)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Database config
- `REDIS_HOST`, `REDIS_PORT`: Redis config
- `JWT_SECRET`: JWT signing secret
- `ENCRYPTION_KEY`: Data encryption key

### Frontend Required Variables
- `VITE_API_URL`: Backend API URL

## Scripts

### Root Level
- `npm run dev`: Start both backend and frontend
- `npm run dev:backend`: Start backend only
- `npm run dev:frontend`: Start frontend only
- `npm test`: Run all tests
- `npm run build`: Build both projects
- `npm run verify`: Verify project setup

### Backend
- `npm run dev`: Start development server with hot reload
- `npm run build`: Compile TypeScript to JavaScript
- `npm start`: Run production build
- `npm test`: Run Jest tests

### Frontend
- `npm run dev`: Start Vite dev server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm test`: Run Vitest tests

## Database Schema

Initial schema includes:
- `users`: User accounts with authentication
- `business_profiles`: Business information per user

Additional tables will be added in subsequent tasks:
- `transactions`: Financial transactions
- `customers`: Customer data
- `products`: Product/service catalog
- `conversations`: AI conversation history
- `insights`: Generated business insights
- `marketing_strategies`: Saved marketing recommendations

## Next Steps

Follow the implementation tasks in `.kiro/specs/msme-ai-assistant/tasks.md`:
1. ✅ Task 1: Project structure and environment (COMPLETE)
2. Task 2: Authentication and user management
3. Task 3: Business profile management
4. Task 4: Transaction management
5. ... (see tasks.md for full list)
