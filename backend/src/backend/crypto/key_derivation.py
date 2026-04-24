"""
Key Derivation Module using Argon2id
Implements the key derivation requirements from the cahier des charges:
- Argon2id for key derivation
- Robust salt management
- Support for both password verification and encryption key derivation
"""

import secrets
import base64
from typing import Tuple
from argon2 import PasswordHasher, Type
from argon2.low_level import hash_secret_raw


class KeyDerivation:
    """Key derivation using Argon2id for secure password-based key generation."""

    # Argon2id parameters (following OWASP recommendations)
    # Time cost (iterations)
    TIME_COST = 3
    
    # Memory cost in KiB (32 MiB recommended)
    MEMORY_COST = 65536  # 64 MiB
    
    # Parallelism (number of threads)
    PARALLELISM = 4
    
    # Hash length in bytes
    HASH_LEN = 32  # 256 bits for AES-256 key
    
    # Salt length in bytes
    SALT_LEN = 16  # 128 bits

    def __init__(self):
        """Initialize the password hasher with secure parameters."""
        self.ph = PasswordHasher(
            time_cost=KeyDerivation.TIME_COST,
            memory_cost=KeyDerivation.MEMORY_COST,
            parallelism=KeyDerivation.PARALLELISM,
            hash_len=KeyDerivation.HASH_LEN,
            salt_len=KeyDerivation.SALT_LEN,
            type=Type.ID  # Argon2id
        )

    def generate_salt(self) -> bytes:
        """Generate a cryptographically secure random salt."""
        return secrets.token_bytes(KeyDerivation.SALT_LEN)

    def derive_key(self, password: str, salt: bytes) -> bytes:
        """
        Derive an encryption key from a password using Argon2id.
        
        Args:
            password: The master password
            salt: A unique salt for this key derivation
            
        Returns:
            A 256-bit key suitable for AES-256 encryption
        """
        return hash_secret_raw(
            secret=password.encode('utf-8'),
            salt=salt,
            time_cost=KeyDerivation.TIME_COST,
            memory_cost=KeyDerivation.MEMORY_COST,
            parallelism=KeyDerivation.PARALLELISM,
            hash_len=KeyDerivation.HASH_LEN,
            type=Type.ID
        )

    def hash_password(self, password: str) -> str:
        """
        Hash a master password for storage (verification purposes).
        
        Args:
            password: The master password to hash
            
        Returns:
            The Argon2id hash string (includes salt and parameters)
        """
        return self.ph.hash(password)

    def verify_password(self, password: str, hash_string: str) -> bool:
        """
        Verify a password against a stored hash.
        
        Args:
            password: The password to verify
            hash_string: The stored Argon2id hash
            
        Returns:
            True if the password matches, False otherwise
        """
        try:
            return self.ph.verify(hash_string, password)
        except Exception:
            return False

    def needs_rehash(self, hash_string: str) -> bool:
        """
        Check if a hash needs to be rehashed (e.g., after parameter updates).
        
        Args:
            hash_string: The stored Argon2id hash
            
        Returns:
            True if the hash should be regenerated
        """
        return self.ph.check_needs_rehash(hash_string)

    @staticmethod
    def encode_bytes(data: bytes) -> str:
        """Encode bytes to base64 string for storage."""
        return base64.b64encode(data).decode('ascii')

    @staticmethod
    def decode_bytes(data_str: str) -> bytes:
        """Decode base64 string to bytes."""
        return base64.b64decode(data_str)