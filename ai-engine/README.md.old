# FocusFlow Authentication API

A FastAPI-based authentication backend for the FocusFlow AI Learning Companion with PostgreSQL database.

## Features

- User registration (signup)
- User login with password hashing
- Session management with tokens
- Token verification
- User logout
- PostgreSQL database storage

## Prerequisites

- Python 3.8+
- PostgreSQL database

## Database Setup

1. Install PostgreSQL if you haven't already:
```bash
# On Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# On macOS
brew install postgresql
```

2. Create the database:
```bash
# Access PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE focusflow;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE focusflow TO postgres;
\q
```

3. Set the database URL (optional):
```bash
# Default: postgresql://postgres:postgres@localhost/focusflow
export DATABASE_URL="postgresql://username:password@localhost/dbname"
```

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the API

Start the API server:
```bash
python auth_api.py
```

The API will be available at `http://localhost:8000`

The database tables will be created automatically on first run.

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### POST /api/auth/signup
Register a new user.

**Request Body:**
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

### POST /api/auth/login
Login an existing user.

**Request Body:**
```json
{
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

### POST /api/auth/logout
Logout a user by invalidating their session.

**Request Body:**
```json
{
  "token": "session_token"
}
```

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### GET /api/auth/verify
Verify a session token.

**Headers:**
- `Authorization`: Bearer {token}

**Response:**
```json
{
  "id": "user_id",
  "email": "john@example.com",
  "name": "John Doe",
  "token": "session_token"
}
```

## Security Features

- ✅ **Bcrypt password hashing**: Resistant to brute force attacks
- ✅ **Secure token generation**: Cryptographically secure random tokens
- ✅ **Authorization header**: Tokens passed via Bearer token to avoid exposure in logs
- ✅ **Token expiration**: 7-day session timeout
- ✅ **PostgreSQL database**: ACID-compliant, production-ready storage
- ✅ **SQLAlchemy ORM**: Protection against SQL injection
- ✅ **Input validation**: Pydantic models with type checking

## Database Schema

### users table
- `id` (String, Primary Key): Unique user identifier
- `email` (String, Unique): User email address
- `name` (String): User full name
- `password` (String): Bcrypt hashed password
- `created_at` (DateTime): Account creation timestamp

### sessions table
- `token` (String, Primary Key): Session token
- `user_id` (String): Reference to user ID
- `email` (String): User email
- `expires_at` (DateTime): Token expiration time

## Production Deployment

For production use, consider:
- Use environment variables for database credentials
- Enable SSL/TLS for database connections
- Implement rate limiting to prevent brute force attacks
- Use HTTPS for encrypted communication
- Add proper logging and monitoring
- Set up database backups
- Configure connection pooling
- Add database migrations with Alembic

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string (default: `postgresql://postgres:postgres@localhost/focusflow`)

Example:
```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/focusflow"
```
