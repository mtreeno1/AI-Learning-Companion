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

## Security Notes

- Passwords are hashed using bcrypt (a slow, secure hashing algorithm designed for passwords)
- Session tokens are generated using cryptographically secure random methods
- Tokens are passed via Authorization header (Bearer token) to avoid exposure in logs
- Tokens expire after 7 days
- CORS is configured to allow requests from localhost:3000 and localhost:3001

**Important:** The file-based storage is not thread-safe. For production use:
- Replace JSON file storage with a proper database
- Add database transactions for data integrity
- Implement rate limiting to prevent brute force attacks
- Use HTTPS for encrypted communication
- Add proper logging and monitoring

## Storage

User data and sessions are stored in JSON files:
- `users.json`: User credentials and profile data
- `sessions.json`: Active session tokens

**Note:** This is a simple implementation for development. The file-based storage is not thread-safe and could lead to race conditions with concurrent requests. In production, use a proper database (PostgreSQL, MongoDB, etc.) and implement additional security measures such as:
- Database transactions for data integrity
- Rate limiting to prevent brute force attacks
- HTTPS for encrypted communication
- Environment-based configuration
- Proper logging and monitoring
