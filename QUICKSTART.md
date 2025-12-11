# Quick Start Guide

Get the MSME AI Assistant up and running in minutes.

## Prerequisites

- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))
- **Git** ([Download](https://git-scm.com/))

## Setup Steps

### 1. Clone and Navigate

```bash
git clone <repository-url>
cd msme-ai-assistant
```

### 2. Verify Setup

```bash
npm run verify
```

This checks if all required files are in place.

### 3. Install Dependencies

```bash
npm install
```

This installs dependencies for both backend and frontend using npm workspaces.

### 4. Configure Environment

**Backend:**
```bash
cp backend/.env.example backend/.env
```

**Frontend:**
```bash
cp frontend/.env.example frontend/.env
```

> **Note:** The default values work for local development. Update them if needed.

### 5. Start Database Services

```bash
docker-compose up -d
```

This starts PostgreSQL (port 5432) and Redis (port 6379).

### 6. Start Development Servers

```bash
npm run dev
```

This starts:
- **Backend** at http://localhost:3000
- **Frontend** at http://localhost:5173

## Verify Everything Works

1. **Check Backend Health:**
   ```bash
   curl http://localhost:3000/health
   ```
   Should return: `{"status":"ok",...}`

2. **Check Frontend:**
   Open http://localhost:5173 in your browser

3. **Run Tests:**
   ```bash
   npm test
   ```

## Common Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both backend and frontend |
| `npm run dev:backend` | Start backend only |
| `npm run dev:frontend` | Start frontend only |
| `npm test` | Run all tests |
| `npm run build` | Build for production |
| `docker-compose up -d` | Start database services |
| `docker-compose down` | Stop database services |
| `docker-compose logs` | View database logs |

## Troubleshooting

### Port Already in Use

If port 3000 or 5173 is already in use:
- Change `PORT` in `backend/.env`
- Change `server.port` in `frontend/vite.config.ts`

### Docker Connection Issues

```bash
# Check if Docker is running
docker info

# Restart Docker services
docker-compose down
docker-compose up -d
```

### Database Connection Failed

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# View PostgreSQL logs
docker logs msme-postgres
```

### Redis Connection Failed

```bash
# Check if Redis is running
docker ps | grep redis

# View Redis logs
docker logs msme-redis
```

## Next Steps

1. Review the [Requirements](.kiro/specs/msme-ai-assistant/requirements.md)
2. Check the [Design Document](.kiro/specs/msme-ai-assistant/design.md)
3. Follow the [Implementation Tasks](.kiro/specs/msme-ai-assistant/tasks.md)

## Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Review the spec documents in `.kiro/specs/msme-ai-assistant/`
