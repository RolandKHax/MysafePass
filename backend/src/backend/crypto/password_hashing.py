"""
Password Hashing Module
Provides password hashing functionality for master password verification.
"""

from .key_derivation import KeyDerivation


class PasswordHasher:
    """Wrapper for password hashing operations using Argon2id."""

    def __init__(self):
        self.kd = KeyDerivation()

    def hash(self, password: str) -> str:
        """
        Hash a password using Argon2id.
        
        Args:
            password: The password to hash
            
        Returns:
            The Argon2id hash string
        """
        return self.kd.hash_password(password)

    def verify(self, password: str, hash_string: str) -> bool:
        """
        Verify a password against a hash.
        
        Args:
            password: The password to verify
            hash_string: The hash to verify against
            
        Returns:
            True if the password matches
        """
        return self.kd.verify_password(password, hash_string)

    def needs_rehash(self, hash_string: str) -> bool:
        """
        Check if a hash needs to be rehashed.
        
        Args:
            hash_string: The hash to check
            
        Returns:
            True if rehashing is needed
        """
        return self.kd.needs_rehash(hash_string)