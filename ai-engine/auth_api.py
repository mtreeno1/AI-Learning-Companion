from fastapi import FastAPI, HTTPException, status, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from passlib.context import CryptContext
import secrets
import json
import os
from datetime import datetime, timedelta

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="FocusFlow Authentication API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple file-based storage (in production, use a real database)
USERS_FILE = "users.json"
SESSIONS_FILE = "sessions.json"


def load_json_file(filename: str) -> dict:
    """Load data from JSON file"""
    if os.path.exists(filename):
        with open(filename, "r") as f:
            return json.load(f)
    return {}


def save_json_file(filename: str, data: dict):
    """Save data to JSON file"""
    with open(filename, "w") as f:
        json.dump(data, f, indent=2)


def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(plain_password, hashed_password)


def generate_token() -> str:
    """Generate a secure random token"""
    return secrets.token_urlsafe(32)


# Request/Response Models
class SignupRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    token: str


class MessageResponse(BaseModel):
    message: str


@app.get("/")
def read_root():
    """Health check endpoint"""
    return {"status": "ok", "service": "FocusFlow Authentication API"}


@app.post("/api/auth/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(request: SignupRequest):
    """Register a new user"""
    users = load_json_file(USERS_FILE)
    
    # Check if user already exists
    if request.email in users:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user_id = secrets.token_urlsafe(16)
    hashed_password = hash_password(request.password)
    
    users[request.email] = {
        "id": user_id,
        "email": request.email,
        "name": request.name,
        "password": hashed_password,
        "created_at": datetime.now().isoformat()
    }
    
    save_json_file(USERS_FILE, users)
    
    # Create session token
    token = generate_token()
    sessions = load_json_file(SESSIONS_FILE)
    sessions[token] = {
        "user_id": user_id,
        "email": request.email,
        "expires_at": (datetime.now() + timedelta(days=7)).isoformat()
    }
    save_json_file(SESSIONS_FILE, sessions)
    
    return UserResponse(
        id=user_id,
        email=request.email,
        name=request.name,
        token=token
    )


@app.post("/api/auth/login", response_model=UserResponse)
def login(request: LoginRequest):
    """Login an existing user"""
    users = load_json_file(USERS_FILE)
    
    # Check if user exists
    if request.email not in users:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    user = users[request.email]
    
    # Verify password
    if not verify_password(request.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create session token
    token = generate_token()
    sessions = load_json_file(SESSIONS_FILE)
    sessions[token] = {
        "user_id": user["id"],
        "email": request.email,
        "expires_at": (datetime.now() + timedelta(days=7)).isoformat()
    }
    save_json_file(SESSIONS_FILE, sessions)
    
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        token=token
    )


class LogoutRequest(BaseModel):
    token: str


@app.post("/api/auth/logout", response_model=MessageResponse)
def logout(request: LogoutRequest):
    """Logout a user by invalidating their session"""
    sessions = load_json_file(SESSIONS_FILE)
    
    if request.token in sessions:
        del sessions[request.token]
        save_json_file(SESSIONS_FILE, sessions)
        return MessageResponse(message="Logged out successfully")
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token"
    )


@app.get("/api/auth/verify", response_model=UserResponse)
def verify_token(authorization: Optional[str] = Header(None)):
    """Verify a session token and return user info"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )
    
    token = authorization.replace("Bearer ", "")
    sessions = load_json_file(SESSIONS_FILE)
    
    if token not in sessions:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    session = sessions[token]
    
    # Check if token is expired
    expires_at = datetime.fromisoformat(session["expires_at"])
    if datetime.now() > expires_at:
        del sessions[token]
        save_json_file(SESSIONS_FILE, sessions)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    
    # Get user info
    users = load_json_file(USERS_FILE)
    user = users.get(session["email"])
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        token=token
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
