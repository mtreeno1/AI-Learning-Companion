from fastapi import FastAPI, HTTPException, status, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from passlib.context import CryptContext
from sqlalchemy import create_engine, Column, String, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import secrets
import os
from datetime import datetime, timedelta

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost/focusflow")

# Create SQLAlchemy engine
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# Database Models
class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class SessionToken(Base):
    __tablename__ = "sessions"
    
    token = Column(String, primary_key=True, index=True)
    user_id = Column(String, nullable=False)
    email = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)


# Create tables
Base.metadata.create_all(bind=engine)


# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


app = FastAPI(title="FocusFlow Authentication API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    return {"status": "ok", "service": "FocusFlow Authentication API", "database": "PostgreSQL"}


@app.post("/api/auth/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user_id = secrets.token_urlsafe(16)
    hashed_password = hash_password(request.password)
    
    new_user = User(
        id=user_id,
        email=request.email,
        name=request.name,
        password=hashed_password,
        created_at=datetime.utcnow()
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create session token
    token = generate_token()
    new_session = SessionToken(
        token=token,
        user_id=user_id,
        email=request.email,
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    
    db.add(new_session)
    db.commit()
    
    return UserResponse(
        id=user_id,
        email=request.email,
        name=request.name,
        token=token
    )


@app.post("/api/auth/login", response_model=UserResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Login an existing user"""
    # Check if user exists
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(request.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create session token
    token = generate_token()
    new_session = SessionToken(
        token=token,
        user_id=user.id,
        email=request.email,
        expires_at=datetime.utcnow() + timedelta(days=7)
    )
    
    db.add(new_session)
    db.commit()
    
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        token=token
    )


class LogoutRequest(BaseModel):
    token: str


@app.post("/api/auth/logout", response_model=MessageResponse)
def logout(request: LogoutRequest, db: Session = Depends(get_db)):
    """Logout a user by invalidating their session"""
    session = db.query(SessionToken).filter(SessionToken.token == request.token).first()
    
    if session:
        db.delete(session)
        db.commit()
        return MessageResponse(message="Logged out successfully")
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token"
    )


@app.get("/api/auth/verify", response_model=UserResponse)
def verify_token(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Verify a session token and return user info"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )
    
    token = authorization.replace("Bearer ", "")
    session = db.query(SessionToken).filter(SessionToken.token == token).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    # Check if token is expired
    if datetime.utcnow() > session.expires_at:
        db.delete(session)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    
    # Get user info
    user = db.query(User).filter(User.email == session.email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        token=token
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
