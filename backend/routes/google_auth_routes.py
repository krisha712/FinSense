"""
google_auth_routes.py
---------------------
POST /api/auth/google

Accepts a Firebase ID token from the frontend, verifies it with the
Firebase Admin SDK, then finds-or-creates the user in the existing
`users` table and returns the same HS256 JWT the rest of the app uses.

No existing routes, middleware, or models are modified.
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import User
from auth import create_access_token          # same function used by email/password
from firebase_config import verify_google_token
import logging
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class GoogleTokenRequest(BaseModel):
    id_token: str   # Firebase ID token sent by the frontend


@router.post("/google")
async def google_signin(request: GoogleTokenRequest, db: Session = Depends(get_db)):
    """
    Flow:
    1. Verify the Firebase ID token with Google's public keys.
    2. Extract the user's email from the verified claims.
    3. Look up the user in the existing `users` table by email.
       - If not found, create a new user with a random password_hash
         (they can never log in with email/password — Google is their provider).
    4. Issue the same JWT that email/password login issues.
    5. Return token + user — identical shape to the existing login response.
    """
    # --- 1. Verify with Firebase ---
    try:
        claims = verify_google_token(request.id_token)
    except ValueError as exc:
        raise HTTPException(status_code=401, detail=str(exc))

    email = claims.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email address.")

    email_verified = claims.get("email_verified", False)
    if not email_verified:
        raise HTTPException(status_code=400, detail="Google email is not verified.")

    # --- 2 & 3. Find or create user ---
    user = db.query(User).filter(User.email == email).first()

    if not user:
        # New user — create with a locked password (bcrypt of a random UUID)
        import bcrypt
        locked_hash = bcrypt.hashpw(uuid.uuid4().hex.encode(), bcrypt.gensalt()).decode()
        user = User(
            email=email,
            password_hash=locked_hash,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        logger.info("Created new user via Google Sign-In: %s", email)
    else:
        logger.info("Existing user signed in via Google: %s", email)

    # --- 4. Issue JWT (same as email/password login) ---
    token = create_access_token({"sub": user.id})

    # --- 5. Return same shape as /api/auth/login ---
    return {
        "token": token,
        "user": {"id": user.id, "email": user.email},
    }
