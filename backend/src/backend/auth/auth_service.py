"""
Authentication Service for MySafePass
Handles user registration, login, and session management.
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from flask import current_app
import jwt
import secrets
import base64
from ..crypto.password_hashing import PasswordHasher
from ..crypto.key_derivation import KeyDerivation
from ..crypto.encryption import AESGCMCipher
from ..database.models import User, VaultEntry, AuditLog
from ..database.connection import DatabaseManager
from .security import SecurityManager


class AuthService:
    """Service for handling user authentication and registration."""

    def __init__(self, db_manager: DatabaseManager):
        """
        Initialize the authentication service.
        
        Args:
            db_manager: Database manager instance
        """
        self.db_manager = db_manager
        self.password_hasher = PasswordHasher()
        self.key_derivation = KeyDerivation()
        self.security_manager = SecurityManager()

    def register_user(self, username: str, email=None, password: str = "") -> Dict[str, Any]:
        """
        Register a new user. Email is OPTIONAL (RGPD data minimisation).

        Args:
            username: Username for the new user
            email: Optional email address (None or empty allowed)
            password: Master password for the new user

        Returns:
            Dictionary with user info and encryption keys
        """
        # Validate password requirements
        is_valid, error_msg = self.security_manager.validate_master_password_requirements(password)
        if not is_valid:
            return {"success": False, "error": error_msg}

        # Normalise email: empty string -> None
        email = (email or None) if email else None

        with self.db_manager.get_session() as session:
            # Check if username already exists, and only check email collision if provided
            username_clash = session.query(User).filter(User.username == username).first()
            if username_clash:
                return {"success": False, "error": "Ce nom d'utilisateur est déjà utilisé"}
            if email:
                email_clash = session.query(User).filter(User.email == email).first()
                if email_clash:
                    return {"success": False, "error": "Cette adresse email est déjà utilisée"}

            # Generate salts
            verifier_salt = self.key_derivation.generate_salt()
            encryption_salt = self.key_derivation.generate_salt()

            # Hash password for verification
            password_hash = self.password_hasher.hash(password)

            # Create user
            user = User(
                username=username,
                email=email,
                password_hash=password_hash,
                verifier_salt=self.key_derivation.encode_bytes(verifier_salt),
                encryption_salt=self.key_derivation.encode_bytes(encryption_salt)
            )

            session.add(user)
            session.commit()

            # Log registration event
            self._log_auth_event(
                session=session,
                user_id=user.id,
                event_type="user.register",
                message=f"Utilisateur enregistré: {username}",
                severity="info"
            )

            return {
                "success": True,
                "user_id": user.id,
                "username": user.username,
                "email": user.email,
                "encryption_salt": self.key_derivation.encode_bytes(encryption_salt)
            }

    def authenticate_user(self, username: str, password: str, ip_address: str = None) -> Dict[str, Any]:
        """
        Authenticate a user and return JWT token and encryption keys.
        
        Args:
            username: Username or email
            password: Master password
            ip_address: IP address for logging
            
        Returns:
            Dictionary with authentication result
        """
        with self.db_manager.get_session() as session:
            # Find user by username or email
            user = session.query(User).filter(
                (User.username == username) | (User.email == username)
            ).first()

            if not user:
                return {"success": False, "error": "Nom d'utilisateur ou mot de passe incorrect"}

            # Check if account is locked
            if self.security_manager.is_locked(user):
                remaining_seconds = self.security_manager.get_lock_remaining_seconds(user)
                return {
                    "success": False, 
                    "error": f"Compte temporairement bloqué. Temps restant: {remaining_seconds} secondes"
                }

            # Verify password
            if not self.password_hasher.verify(password, user.password_hash):
                # Register failed attempt
                self.security_manager.register_failed_attempt(session, user, ip_address)
                return {"success": False, "error": "Nom d'utilisateur ou mot de passe incorrect"}

            # Check if rehash is needed
            if self.password_hasher.needs_rehash(user.password_hash):
                user.password_hash = self.password_hasher.hash(password)
                session.commit()

            # Reset failed attempts on successful login
            self.security_manager.reset_failed_attempts(session, user)

            # Generate JWT token
            token = self._generate_jwt_token(user)

            # Get encryption keys
            encryption_salt = self.key_derivation.decode_bytes(user.encryption_salt)

            return {
                "success": True,
                "user_id": user.id,
                "username": user.username,
                "email": user.email,
                "token": token,
                "encryption_salt": self.key_derivation.encode_bytes(encryption_salt)
            }

    def refresh_encryption_keys(self, user_id: int) -> Dict[str, Any]:
        """
        Refresh encryption keys for a user (e.g., after password change).
        
        Args:
            user_id: ID of the user
            
        Returns:
            Dictionary with new encryption keys
        """
        with self.db_manager.get_session() as session:
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                return {"success": False, "error": "Utilisateur non trouvé"}

            encryption_salt = self.key_derivation.decode_bytes(user.encryption_salt)
            
            return {
                "success": True,
                "encryption_salt": self.key_derivation.encode_bytes(encryption_salt)
            }

    def change_password(self, user_id: int, old_password: str, new_password: str) -> Dict[str, Any]:
        """
        Change user's master password.
        
        Args:
            user_id: ID of the user
            old_password: Current master password
            new_password: New master password
            
        Returns:
            Dictionary with operation result
        """
        # Validate new password
        is_valid, error_msg = self.security_manager.validate_master_password_requirements(new_password)
        if not is_valid:
            return {"success": False, "error": error_msg}

        with self.db_manager.get_session() as session:
            user = session.query(User).filter(User.id == user_id).first()
            if not user:
                return {"success": False, "error": "Utilisateur non trouvé"}

            # Verify old password
            if not self.password_hasher.verify(old_password, user.password_hash):
                return {"success": False, "error": "Ancien mot de passe incorrect"}

            # Update password hash
            user.password_hash = self.password_hasher.hash(new_password)
            
            # Generate new encryption salt
            user.encryption_salt = self.key_derivation.encode_bytes(self.key_derivation.generate_salt())
            
            session.commit()

            # Log password change
            self._log_auth_event(
                session=session,
                user_id=user.id,
                event_type="user.password_change",
                message="Mot de passe maître modifié",
                severity="info"
            )

            return {"success": True, "message": "Mot de passe mis à jour avec succès"}

    def _generate_jwt_token(self, user: User) -> str:
        """
        Generate JWT token for authenticated user.
        
        Args:
            user: User object
            
        Returns:
            JWT token string
        """
        payload = {
            'user_id': user.id,
            'username': user.username,
            'email': user.email,
            'exp': datetime.utcnow() + timedelta(hours=1),  # 1 hour expiration
            'iat': datetime.utcnow()
        }
        
        secret_key = current_app.config['JWT_SECRET_KEY']
        return jwt.encode(payload, secret_key, algorithm='HS256')

    def _log_auth_event(self, session: Session, user_id: int, event_type: str, 
                       message: str, severity: str = "info"):
        """
        Log an authentication event.
        
        Args:
            session: Database session
            user_id: ID of the user
            event_type: Type of event
            message: Event description
            severity: Event severity
        """
        audit_log = AuditLog(
            user_id=user_id,
            event_type=event_type,
            message=message,
            severity=severity
        )
        session.add(audit_log)
        session.commit()