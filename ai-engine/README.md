# FocusFlow API

A FastAPI-based backend for the FocusFlow AI Learning Companion with modular, scalable architecture and PostgreSQL database.

## Features

- **Modular Architecture**: Well-organized code structure for easy maintenance and scalability
- **Authentication Service**: User registration, login, logout, and token verification
- **PostgreSQL Database**: Production-ready, ACID-compliant storage with SQLAlchemy ORM
- **Security**: Bcrypt password hashing, secure token generation, SQL injection protection
- **Auto Documentation**: Interactive API docs at `/docs` and `/redoc`
- **Extensible**: Easy to add new services (sessions, logs, analytics, etc.)

## Quick Start

### 1. Setup PostgreSQL

📖 **See [SETUP_POSTGRESQL.md](./SETUP_POSTGRESQL.md) for detailed PostgreSQL setup guide**

Quick setup:
```bash
# Create database
sudo -u postgres psql
CREATE DATABASE focusflow;
\q
```

### 2. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env if needed (default works for local PostgreSQL)
```

### 3. Install & Run

```bash
# Install dependencies
pip install -r requirements.txt

# Run the API
python run.py
```

API available at `http://localhost:8000/docs`

## Project Structure

```
ai-engine/
├── app/
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration management
│   ├── database.py          # Database connection & session
│   ├── dependencies.py      # Shared utilities
│   ├── models/              # SQLAlchemy models
│   │   ├── user.py         # User model
│   │   └── session.py      # Session token model
│   ├── schemas/             # Pydantic schemas
│   │   └── auth.py         # Auth request/response schemas
│   ├── routers/             # API endpoints
│   │   └── auth.py         # /api/auth/* endpoints
│   └── services/            # Business logic
│       └── auth_service.py  # Authentication service
├── run.py                   # Application runner
├── auth_api.py             # Legacy API (compatibility)
├── requirements.txt
├── .env.example            # Environment variables template
├── SETUP_POSTGRESQL.md     # PostgreSQL setup guide
└── README.md               # This file
```

## API Endpoints

### Authentication (`/api/auth/`)

#### POST /api/auth/signup
Register a new user.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "id": "user_id",
  "email": "john@example.com",
  "name": "John Doe",
  "token": "session_token"
}
```

#### POST /api/auth/login
Login an existing user.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

#### POST /api/auth/logout
Logout a user.

**Request:**
```json
{
  "token": "session_token"
}
```

#### GET /api/auth/verify
Verify a session token.

**Headers:**
- `Authorization`: `Bearer <token>`

## Running the API

### Recommended: Using run.py
```bash
python run.py
```

### Alternative: Using uvicorn directly
```bash
uvicorn app.main:app --reload
```

### Legacy: Single-file API
```bash
python auth_api.py
```

## Configuration

Environment variables (`.env`):

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost/focusflow

# API Server
API_HOST=0.0.0.0
API_PORT=8000

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Security
TOKEN_EXPIRY_DAYS=7
```

## Adding New Services

The modular architecture makes it easy to extend:

1. **Create Model**: `app/models/new_model.py`
2. **Create Schema**: `app/schemas/new_schema.py`
3. **Create Service**: `app/services/new_service.py`
4. **Create Router**: `app/routers/new_router.py`
5. **Register in main.py**: `app.include_router(new_router)`

**Example - Adding study sessions:**

```python
# app/models/study_session.py
class StudySession(Base):
    __tablename__ = "study_sessions"
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False)
    start_time = Column(DateTime)
    end_time = Column(DateTime)
    mode = Column(String)  # "pomodoro" or "manual"

# app/routers/sessions.py
router = APIRouter(prefix="/api/sessions", tags=["Sessions"])

@router.post("/start")
def start_session(...):
    pass

# app/main.py
from app.routers import auth_router, sessions_router
app.include_router(sessions_router)
```

## Database Schema

### users table
- `id` (String, PK): Unique user identifier
- `email` (String, Unique, Indexed): User email
- `name` (String): User full name
- `password` (String): Bcrypt hashed password
- `created_at` (DateTime): Account creation timestamp

### sessions table
- `token` (String, PK): Session token
- `user_id` (String): User ID reference
- `email` (String): User email
- `expires_at` (DateTime): Token expiration time

## Security Features

- ✅ Bcrypt password hashing
- ✅ Secure token generation
- ✅ Authorization via Bearer token
- ✅ Token expiration (7 days)
- ✅ PostgreSQL + SQLAlchemy (ACID, SQL injection protection)
- ✅ Input validation with Pydantic
- ✅ CORS configuration

## Troubleshooting

### PostgreSQL Connection Issues

See [SETUP_POSTGRESQL.md](./SETUP_POSTGRESQL.md) for detailed troubleshooting.

Common issues:
- **Connection refused**: PostgreSQL not running → `sudo systemctl start postgresql`
- **Authentication failed**: Wrong password in `.env`
- **Database not found**: Run `CREATE DATABASE focusflow;`

### Test PostgreSQL Connection

```bash
python -c "from app.database import engine; engine.connect(); print('✅ Connected!')"
```

## Documentation

- **API Docs**: `http://localhost:8000/docs` (Swagger UI)
- **Alternative Docs**: `http://localhost:8000/redoc`
- **PostgreSQL Setup**: [SETUP_POSTGRESQL.md](./SETUP_POSTGRESQL.md)

## Production Deployment

For production:
- Use strong passwords and secrets
- Enable SSL/TLS for database
- Implement rate limiting
- Use HTTPS for API
- Set up database backups
- Configure connection pooling
- Add monitoring and logging
- Consider managed PostgreSQL (AWS RDS, etc.)
