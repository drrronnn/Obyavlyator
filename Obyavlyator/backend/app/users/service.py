from sqlalchemy.orm import Session
from app.users.models import User
from app.core.security import get_password_hash, verify_password
from datetime import datetime
import secrets

def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, email: str, password: str, google_id: str | None = None) -> User:
    user = User(email=email, hashed_password=get_password_hash(password), google_id=google_id)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def update_user_name(db: Session, user: User, first_name: str | None, last_name: str | None) -> User:
    if first_name is not None:
        user.first_name = first_name
    if last_name is not None:
        user.last_name = last_name
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return user

def request_email_change(db: Session, user: User, new_email: str, current_password: str) -> tuple[bool, str]:
    if not verify_password(current_password, user.hashed_password):
        return False, "Invalid password"
    
    existing_user = get_user_by_email(db, new_email)
    if existing_user:
        return False, "Email already in use"
    
    token = secrets.token_urlsafe(32)
    user.pending_email = new_email
    user.pending_email_token = token
    user.updated_at = datetime.utcnow()
    db.commit()
    return True, token

def confirm_email_change(db: Session, user: User, token: str) -> bool:
    if not user.pending_email or not user.pending_email_token:
        return False
    
    if user.pending_email_token != token:
        return False
    
    user.email = user.pending_email
    user.pending_email = None
    user.pending_email_token = None
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return True

def store_pending_password(db: Session, user: User, new_password: str) -> str:
    token = secrets.token_urlsafe(32)
    user.pending_email_token = f"pwd:{token}:{get_password_hash(new_password)}"
    user.updated_at = datetime.utcnow()
    db.commit()
    return token

def confirm_password_change(db: Session, user: User) -> bool:
    if not user.pending_email_token or not user.pending_email_token.startswith("pwd:"):
        return False
    
    parts = user.pending_email_token.split(":")
    if len(parts) != 3:
        return False
    
    new_hashed_password = parts[2]
    user.hashed_password = new_hashed_password
    user.pending_email_token = None
    user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(user)
    return True