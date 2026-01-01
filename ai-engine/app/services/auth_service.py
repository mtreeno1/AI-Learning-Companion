"""
Authentication business logic
"""
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models.user import User
from app.models.session import SessionToken
from app.dependencies import (
    hash_password,
    verify_password,
    generate_token,
    generate_user_id
)
from app.config import settings


class AuthService:
    """Service for handling authentication logic"""
    
    @staticmethod
    def signup(db: Session, name: str, email: str, password: str) -> dict:
        """
        Register a new user
        
        Args:
            db: Database session
            name: User's full name
            email: User's email address
            password: User's password (plain text)
            
        Returns:
            dict with user data and session token
            
        Raises:
            HTTPException: If email already exists
        """
        # Check if user already exists
        existing_user = db.query(User).filter(User.email == email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Create new user
        user_id = generate_user_id()
        hashed_pwd = hash_password(password)
        
        new_user = User(
            id=user_id,
            email=email,
            name=name,
            password=hashed_pwd,
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
            email=email,
            expires_at=datetime.utcnow() + timedelta(days=settings.TOKEN_EXPIRY_DAYS)
        )
        
        db.add(new_session)
        db.commit()
        
        return {
            "id": user_id,
            "email": email,
            "name": name,
            "token": token
        }
    
    @staticmethod
    def login(db: Session, email: str, password: str) -> dict:
        """
        Login an existing user
        
        Args:
            db: Database session
            email: User's email address
            password: User's password (plain text)
            
        Returns:
            dict with user data and session token
            
        Raises:
            HTTPException: If credentials are invalid
        """
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verify password
        if not verify_password(password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Create session token
        token = generate_token()
        new_session = SessionToken(
            token=token,
            user_id=user.id,
            email=email,
            expires_at=datetime.utcnow() + timedelta(days=settings.TOKEN_EXPIRY_DAYS)
        )
        
        db.add(new_session)
        db.commit()
        
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "token": token
        }
    
    @staticmethod
    def logout(db: Session, token: str) -> dict:
        """
        Logout a user by invalidating their session
        
        Args:
            db: Database session
            token: Session token to invalidate
            
        Returns:
            dict with success message
            
        Raises:
            HTTPException: If token is invalid
        """
        session = db.query(SessionToken).filter(SessionToken.token == token).first()
        
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token"
            )
        
        db.delete(session)
        db.commit()
        
        return {"message": "Logged out successfully"}
    
    @staticmethod
    def verify_token(db: Session, token: str) -> dict:
        """
        Verify a session token and return user info
        
        Args:
            db: Database session
            token: Session token to verify
            
        Returns:
            dict with user data and token
            
        Raises:
            HTTPException: If token is invalid or expired
        """
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
        
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "token": token
        }
