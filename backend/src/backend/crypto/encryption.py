"""
AES-256-GCM Encryption Module
Implements the encryption requirements from the cahier des charges:
- AES-256-GCM with 256-bit key
- 96-bit IV (Initialization Vector), unique per operation
- 128-bit authentication tag
"""

import os
import secrets
from typing import Tuple
from cryptography.hazmat.primitives.ciphers.aead import AESGCM


class AESGCMCipher:
    """AES-256-GCM cipher for encrypting and decrypting vault data."""

    # AES-256 key size in bytes
    KEY_SIZE = 32  # 256 bits = 32 bytes
    
    # IV size for GCM mode (96 bits recommended)
    IV_SIZE = 12  # 96 bits = 12 bytes
    
    # Authentication tag size
    TAG_SIZE = 16  # 128 bits = 16 bytes

    @staticmethod
    def generate_key() -> bytes:
        """Generate a cryptographically secure random key for AES-256."""
        return secrets.token_bytes(AESGCMCipher.KEY_SIZE)

    @staticmethod
    def generate_iv() -> bytes:
        """Generate a cryptographically secure random IV for each encryption operation."""
        return secrets.token_bytes(AESGCMCipher.IV_SIZE)

    @staticmethod
    def encrypt(plaintext: bytes, key: bytes, associated_data: bytes = b"") -> Tuple[bytes, bytes]:
        """
        Encrypt data using AES-256-GCM.
        
        Args:
            plaintext: The data to encrypt
            key: The 256-bit encryption key
            associated_data: Additional authenticated data (optional)
            
        Returns:
            Tuple of (iv, ciphertext) where ciphertext includes the authentication tag
            
        Raises:
            ValueError: If key size is invalid
        """
        if len(key) != AESGCMCipher.KEY_SIZE:
            raise ValueError(f"Key must be {AESGCMCipher.KEY_SIZE} bytes")
        
        iv = AESGCMCipher.generate_iv()
        aesgcm = AESGCM(key)
        
        # Encrypt and authenticate
        ciphertext = aesgcm.encrypt(iv, plaintext, associated_data)
        
        return iv, ciphertext

    @staticmethod
    def decrypt(iv: bytes, ciphertext: bytes, key: bytes, associated_data: bytes = b"") -> bytes:
        """
        Decrypt data using AES-256-GCM.
        
        Args:
            iv: The initialization vector used during encryption
            ciphertext: The encrypted data (includes authentication tag)
            key: The 256-bit encryption key
            associated_data: Additional authenticated data used during encryption
            
        Returns:
            The decrypted plaintext
            
        Raises:
            ValueError: If key size is invalid
            cryptography.exceptions.InvalidTag: If decryption fails (wrong key or tampered data)
        """
        if len(key) != AESGCMCipher.KEY_SIZE:
            raise ValueError(f"Key must be {AESGCMCipher.KEY_SIZE} bytes")
        
        aesgcm = AESGCM(key)
        
        # Decrypt and verify authentication tag
        plaintext = aesgcm.decrypt(iv, ciphertext, associated_data)
        
        return plaintext

    @staticmethod
    def encrypt_json(data: dict, key: bytes) -> Tuple[bytes, bytes]:
        """
        Encrypt a dictionary as JSON.
        
        Args:
            data: Dictionary to encrypt
            key: The 256-bit encryption key
            
        Returns:
            Tuple of (iv, ciphertext)
        """
        import json
        plaintext = json.dumps(data, separators=(',', ':')).encode('utf-8')
        return AESGCMCipher.encrypt(plaintext, key)

    @staticmethod
    def decrypt_json(iv: bytes, ciphertext: bytes, key: bytes) -> dict:
        """
        Decrypt data and parse as JSON.
        
        Args:
            iv: The initialization vector
            ciphertext: The encrypted data
            key: The 256-bit encryption key
            
        Returns:
            Decrypted dictionary
        """
        import json
        plaintext = AESGCMCipher.decrypt(iv, ciphertext, key)
        return json.loads(plaintext.decode('utf-8'))