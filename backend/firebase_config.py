"""
firebase_config.py
------------------
Verifies Firebase ID tokens without Firebase Admin SDK or ADC.

Steps:
  1. Fetch Google's public X.509 certs (PEM) from their well-known URL.
  2. Extract the RSA public key from each cert using `cryptography`.
  3. Verify the JWT signature + claims with PyJWT.
"""

import os
import logging
from pathlib import Path
from dotenv import load_dotenv

import requests
import jwt as pyjwt
from cryptography.x509 import load_pem_x509_certificate
from cryptography.hazmat.backends import default_backend

logger = logging.getLogger(__name__)

GOOGLE_CERTS_URL = (
    "https://www.googleapis.com/robot/v1/metadata/x509/"
    "securetoken@system.gserviceaccount.com"
)

# Cache: { kid: RSA public key object }
_key_cache: dict = {}


def _get_project_id() -> str:
    load_dotenv(Path(__file__).parent / ".env", override=True)
    return os.getenv("FIREBASE_PROJECT_ID", "").strip()


def _get_public_keys(force_refresh: bool = False) -> dict:
    """Fetch Google certs and extract RSA public keys. Returns {kid: public_key}."""
    global _key_cache
    if _key_cache and not force_refresh:
        return _key_cache

    try:
        r = requests.get(GOOGLE_CERTS_URL, timeout=10)
        r.raise_for_status()
        certs = r.json()  # { kid: "-----BEGIN CERTIFICATE-----\n..." }
    except Exception as exc:
        raise ValueError(f"Could not fetch Google public keys: {exc}")

    keys = {}
    for kid, pem_cert in certs.items():
        cert = load_pem_x509_certificate(pem_cert.encode("utf-8"), default_backend())
        keys[kid] = cert.public_key()   # RSAPublicKey object — PyJWT accepts this

    _key_cache = keys
    return _key_cache


def verify_google_token(id_token: str) -> dict:
    """
    Verify a Firebase ID token from the frontend (signInWithPopup).
    Returns decoded claims. Raises ValueError on any failure.
    """
    project_id = _get_project_id()
    if not project_id:
        raise ValueError(
            "Firebase is not configured on the server. "
            "Add FIREBASE_PROJECT_ID to backend/.env"
        )

    # 1. Read kid from header (no signature check yet)
    try:
        header = pyjwt.get_unverified_header(id_token)
    except pyjwt.exceptions.DecodeError as exc:
        raise ValueError(f"Malformed ID token: {exc}")

    kid = header.get("kid")
    if not kid:
        raise ValueError("ID token header is missing 'kid'.")

    # 2. Find matching public key, refresh once if key has rotated
    keys = _get_public_keys()
    if kid not in keys:
        keys = _get_public_keys(force_refresh=True)
    if kid not in keys:
        raise ValueError(f"No Google public key found for kid={kid!r}")

    public_key = keys[kid]

    # 3. Verify signature + standard JWT claims
    issuer = f"https://securetoken.google.com/{project_id}"
    try:
        claims = pyjwt.decode(
            id_token,
            public_key,
            algorithms=["RS256"],
            audience=project_id,
            issuer=issuer,
            options={"verify_exp": True},
        )
    except pyjwt.ExpiredSignatureError:
        raise ValueError("Google token has expired — please sign in again.")
    except pyjwt.InvalidAudienceError:
        raise ValueError(f"Token audience mismatch. Expected '{project_id}'.")
    except pyjwt.InvalidIssuerError:
        raise ValueError(f"Token issuer mismatch. Expected '{issuer}'.")
    except pyjwt.PyJWTError as exc:
        raise ValueError(f"Token verification failed: {exc}")

    # 4. Sanity-check email
    email = claims.get("email", "").strip()
    if not email:
        raise ValueError("Google account has no email address.")
    if not claims.get("email_verified", False):
        raise ValueError("Google email is not verified.")

    return claims
