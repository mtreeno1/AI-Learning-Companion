# FocusFlow Authentication API

A FastAPI-based authentication backend for the FocusFlow AI Learning Companion.

## Features

- User registration (signup)
- User login with password hashing
- Session management with tokens
- Token verification
- User logout

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

**Query Parameters:**
- `token`: Session token

**Response:**
```json
{
  "id": "user_id",
  "email": "john@example.com",
  "name": "John Doe",
  "token": "session_token"
}
```

## Security Notes

- Passwords are hashed using SHA-256
- Session tokens are generated using secure random methods
- Tokens expire after 7 days
- CORS is configured to allow requests from localhost:3000 and localhost:3001

## Storage

User data and sessions are stored in JSON files:
- `users.json`: User credentials and profile data
- `sessions.json`: Active session tokens

**Note:** This is a simple implementation for development. In production, use a proper database (PostgreSQL, MongoDB, etc.) and implement additional security measures.
