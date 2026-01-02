from passlib.context import CryptContext
import secrets

pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto"
)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)

def generate_token() -> str:
    return secrets.token_urlsafe(32)

def generate_user_id() -> str:
    return secrets.token_urlsafe(16)
