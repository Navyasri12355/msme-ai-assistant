# MSME AI Assistant

The MSME AI Assistant is a web-based application that provides small and micro enterprises with AI-powered business intelligence capabilities. The system consists of four primary modules: a Conversational AI interface for natural language queries, a Finance Analysis Engine for financial insights and forecasting, a Marketing Advisor for strategy and content recommendations, and a Dashboard Service for visualizing key metrics. The architecture follows a microservices pattern with a React-based frontend, Node.js backend services, and integration with AI/ML models for natural language processing, sentiment analysis, and predictive analytics.

## Features

- Conversational AI for business queries
- Financial analysis and cash flow forecasting
- Marketing strategy recommendations
- Customer sentiment analysis
- Business intelligence dashboard

## Project Structure

```
msme-ai-assistant/
├── backend/          # Node.js + Express + TypeScript backend
├── frontend/         # React + TypeScript + TailwindCSS frontend
├── docker-compose.yml
└── README.md
```

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- Git

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd msme-ai-assistant
```

### 2. Set up environment variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your configuration
```

### 3. Start the database services

```bash
docker-compose up -d
```

This will start PostgreSQL and Redis containers.

### 4. Install dependencies

```bash
npm install
```

This will install dependencies for both backend and frontend using npm workspaces.

### 5. Run the development servers

```bash
npm run dev
```

This will start both backend (port 3000) and frontend (port 5173) in development mode.

Alternatively, you can run them separately:

```bash
# Backend only
npm run dev:backend

# Frontend only
npm run dev:frontend
```

## Development

### Backend

- **Location**: `backend/`
- **Port**: 3000
- **Tech**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (port 5432)
- **Cache**: Redis (port 6379)

### Frontend

- **Location**: `frontend/`
- **Port**: 5173
- **Tech**: React, TypeScript, TailwindCSS, Vite

### Testing

```bash
# Run all tests
npm test

# Run backend tests
npm run test --workspace=backend

# Run frontend tests
npm run test --workspace=frontend
```

### Building for Production

```bash
npm run build
```

## Database Management

### Access PostgreSQL

```bash
docker exec -it msme-postgres psql -U postgres -d msme_assistant
```

### Access Redis CLI

```bash
docker exec -it msme-redis redis-cli
```

### Stop services

```bash
docker-compose down
```

### Stop and remove volumes (WARNING: deletes all data)

```bash
docker-compose down -v
```

## API Documentation

API endpoints will be documented as they are implemented.

Base URL: `http://localhost:3000/api`

