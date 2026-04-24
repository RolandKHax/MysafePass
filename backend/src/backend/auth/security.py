"""
Security Manager for brute force protection and rate limiting
Implements the protection requirements from the cahier des charges:
- 3 failed attempts → 15 minutes block
- 5 failed attempts → 1 hour block
- 10 failed attempts → 24 hours block
- CAPTCHA required after 2 failures
"""

from datetime import datetime, timedelta
from typing import Optional, Dict
from sqlalchemy.orm import Session
from ..database.models import User, AuditLog


class SecurityManager:
    """Manages security policies including brute force protection."""

    # Lock durations in milliseconds
    LOCK_DURATIONS = {
        3: 15 * 60 * 1000,      # 15 minutes
        5: 60 * 60 * 1000,      # 1 hour
        10: 24 * 60 * 60 * 1000, # 24 hours
    }

    # Thresholds for CAPTCHA requirement
    CAPTCHA_THRESHOLD = 2

    @staticmethod
    def get_lock_duration_ms(failed_attempts: int) -> int:
        """
        Get the lock duration in milliseconds for a given number of failed attempts.
        
        Args:
            failed_attempts: Number of consecutive failed login attempts
            
        Returns:
            Lock duration in milliseconds, 0 if no lock
        """
        for threshold, duration in sorted(SecurityManager.LOCK_DURATIONS.items(), reverse=True):
            if failed_attempts >= threshold:
                return duration
        return 0

    @staticmethod
    def is_locked(user: User) -> bool:
        """
        Check if a user account is currently locked.
        
        Args:
            user: The user to check
            
        Returns:
            True if the account is locked, False otherwise
        """
        if user.lock_until is None:
            return False
        return datetime.utcnow() < user.lock_until

    @staticmethod
    def get_lock_remaining_seconds(user: User) -> Optional[int]:
        """
        Get the remaining lock time in seconds.
        
        Args:
            user: The user to check
            
        Returns:
            Remaining seconds if locked, None if not locked
        """
        if user.lock_until is None:
            return None
        remaining = user.lock_until - datetime.utcnow()
        if remaining.total_seconds() <= 0:
            return None
        return int(remaining.total_seconds())

    @staticmethod
    def requires_captcha(user: User) -> bool:
        """
        Check if CAPTCHA is required for this user.
        
        Args:
            user: The user to check
            
        Returns:
            True if CAPTCHA is required
        """
        return user.failed_attempts >= SecurityManager.CAPTCHA_THRESHOLD

    def register_failed_attempt(self, session: Session, user: User, ip_address: str = None) -> User:
        """
        Register a failed login attempt and apply lock if necessary.
        
        Args:
            session: Database session
            user: The user who failed authentication
            ip_address: IP address of the login attempt
            
        Returns:
            Updated user object
        """
        user.failed_attempts += 1
        user.total_failed_attempts += 1
        
        # Calculate lock duration
        lock_duration_ms = self.get_lock_duration_ms(user.failed_attempts)
        
        if lock_duration_ms > 0:
            user.lock_until = datetime.utcnow() + timedelta(milliseconds=lock_duration_ms)
            
            # Log the lock event
            self._log_security_event(
                session=session,
                user_id=user.id,
                event_type="auth.lock",
                message=f"Compte bloqué pour {lock_duration_ms // 60000} minutes après {user.failed_attempts} échecs",
                severity="warning",
                ip_address=ip_address
            )
        else:
            # Log the failed attempt
            self._log_security_event(
                session=session,
                user_id=user.id,
                event_type="auth.failed",
                message="Échec de l'authentification",
                severity="warning",
                ip_address=ip_address
            )
        
        session.commit()
        return user

    def reset_failed_attempts(self, session: Session, user: User) -> User:
        """
        Reset failed attempts counter after successful login.
        
        Args:
            session: Database session
            user: The user who successfully authenticated
            
        Returns:
            Updated user object
        """
        user.failed_attempts = 0
        user.lock_until = None
        session.commit()
        return user

    def _log_security_event(self, session: Session, user_id: int, event_type: str, 
                           message: str, severity: str = "info", ip_address: str = None):
        """
        Log a security event to the audit trail.
        
        Args:
            session: Database session
            user_id: ID of the user
            event_type: Type of event (e.g., 'auth.failed', 'auth.lock')
            message: Description of the event
            severity: Severity level (info, warning, critical)
            ip_address: IP address of the client
        """
        audit_log = AuditLog(
            user_id=user_id,
            event_type=event_type,
            message=message,
            severity=severity,
            ip_address=ip_address
        )
        session.add(audit_log)
        session.commit()

    @staticmethod
    def validate_master_password_requirements(password: str) -> tuple:
        """
        Validate master password meets security requirements.
        
        Args:
            password: The password to validate
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        if len(password) < 12:
            return False, "Le mot de passe maître doit faire au moins 12 caractères"
        
        # Check for character diversity (at least 3 types)
        has_lower = any(c.islower() for c in password)
        has_upper = any(c.isupper() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(not c.isalnum() for c in password)
        
        char_types = sum([has_lower, has_upper, has_digit, has_special])
        
        if char_types < 3:
            return False, "Le mot de passe doit contenir au moins 3 types de caractères (minuscules, majuscules, chiffres, symboles)"
        
        return True, None