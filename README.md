# AI-Powered Recruitment System

Signup and signin authentication built with FastAPI (backend) and React + TypeScript (frontend).

## CI/CD

- **CI** (on push/PR to `main`): Lint + build backend (ruff) and frontend (ESLint, Vite build)
- **CD** (on push to `main`): Build Docker images and push to [GitHub Container Registry](https://github.com/hopeIsCo0l/fyp103/pkgs/container/fyp103-backend)

## Prerequisites

- Docker & Docker Compose

## Quick Start (Docker – All-in-One)

**1. Free ports** (if 5432, 8000, or 5173 are in use):

```bash
# PowerShell (run as Administrator if needed)
.\scripts\free-ports.ps1

# Git Bash
bash scripts/free-ports.sh
```

**2. Run everything**

```bash
docker-compose up --build
```

- **Frontend:** http://localhost:5173  
- **API docs:** http://localhost:8000/docs  
- **PostgreSQL:** localhost:5432 (user: postgres, password: postgres, db: recruit_db)

To run in the background: `docker-compose up -d --build`

---

## Local Development (without Docker)

### Prerequisites

- Node.js 18+, Python 3.10+, PostgreSQL

### 1. Database

**Docker (PostgreSQL only):**
```bash
docker-compose up -d postgres
# Set DATABASE_URL=postgresql://postgres:postgres@localhost:5432/recruit_db in backend/.env
```

**Or local PostgreSQL:** Create `recruit_db`, set `DATABASE_URL` in `backend/.env`

### 2. Backend

```bash
cd backend
source venv/Scripts/activate   # Git Bash
# venv\Scripts\activate        # PowerShell
pip install -r requirements.txt
python init_db.py
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

## Auth Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/signin` | Login, returns JWT |
| GET | `/api/auth/me` | Current user (requires Bearer token) |

## Signup payload
```json
{
  "email": "user@example.com",
  "password": "min8chars",
  "full_name": "John Doe",
  "role": "candidate"  // or "recruiter"
}
```

## Signin payload
```json
{
  "email": "user@example.com",
  "password": "min8chars"
}
```
