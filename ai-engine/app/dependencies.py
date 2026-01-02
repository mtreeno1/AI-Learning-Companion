# from passlib.context import CryptContext
# import secrets

# pwd_context = CryptContext(
#     schemes=["argon2"],
#     deprecated="auto"
# )

# def hash_password(password: str) -> str:
#     return pwd_context.hash(password)

# def verify_password(password: str, hashed_password: str) -> bool:
#     return pwd_context.verify(password, hashed_password)

# def generate_token() -> str:
#     return secrets.token_urlsafe(32)

# def generate_user_id() -> str:
#     return secrets.token_urlsafe(16)


"""
Dependencies for FastAPI routes
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext
import secrets

from app.config import settings
from app.database import get_db
from app.models.user import User

# Password hashing
pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto"
)

# JWT Bearer token scheme
security = HTTPBearer()


def hash_password(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a password against a hash"""
    return pwd_context.verify(password, hashed_password)


def generate_token() -> str:
    """Generate a random token"""
    return secrets.token_urlsafe(32)


def generate_user_id() -> str:
    """Generate a random user ID"""
    return secrets.token_urlsafe(16)


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get current authenticated user from JWT token
    
    Usage:
        @router.get("/protected")
        def protected_route(current_user: User = Depends(get_current_user)):
            return {"user":  current_user. username}
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate":  "Bearer"},
    )
    
    try:
        # Get token from Authorization header
        token = credentials.credentials
        
        # Decode JWT token
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        # Extract user_id from token
        user_id:  str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception
    
    # Get user from database
    user = db.query(User).filter(User.user_id == user_id).first()
    
    if user is None:
        raise credentials_exception
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )
    
    return user


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User | None:
    """
    Optional authentication - returns None if no valid token
    """
    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None