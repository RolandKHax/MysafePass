"""
Password Generator Module
Implements secure password generation as per the cahier des charges:
- Cryptographically secure random generation
- Configurable length (8-64 characters)
- Configurable character types
- Minimum entropy of 80 bits for default parameters
"""

import secrets
import string
from typing import List, Dict, Any
from dataclasses import dataclass


@dataclass
class PasswordOptions:
    """Options for password generation."""
    length: int = 16
    include_lowercase: bool = True
    include_uppercase: bool = True
    include_digits: bool = True
    include_symbols: bool = True


class PasswordGenerator:
    """Secure password generator using cryptographically secure random numbers."""

    # Character sets
    LOWERCASE = string.ascii_lowercase
    UPPERCASE = string.ascii_uppercase
    DIGITS = string.digits
    SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?'

    # Minimum and maximum password length
    MIN_LENGTH = 8
    MAX_LENGTH = 64

    def __init__(self):
        """Initialize the password generator."""
        pass

    def generate(self, options: PasswordOptions = None) -> str:
        """
        Generate a secure random password.
        
        Args:
            options: Password generation options
            
        Returns:
            Generated password string
        """
        if options is None:
            options = PasswordOptions()

        # Validate and constrain length
        length = max(self.MIN_LENGTH, min(options.length, self.MAX_LENGTH))

        # Build character pools
        pools = []
        all_chars = ""

        if options.include_lowercase:
            pools.append(self.LOWERCASE)
            all_chars += self.LOWERCASE
        if options.include_uppercase:
            pools.append(self.UPPERCASE)
            all_chars += self.UPPERCASE
        if options.include_digits:
            pools.append(self.DIGITS)
            all_chars += self.DIGITS
        if options.include_symbols:
            pools.append(self.SYMBOLS)
            all_chars += self.SYMBOLS

        # Fallback if no character types selected
        if not pools:
            pools = [self.LOWERCASE]
            all_chars = self.LOWERCASE

        # Generate password ensuring at least one character from each pool
        password_chars = []

        # Add at least one character from each selected pool
        for pool in pools:
            password_chars.append(secrets.choice(pool))

        # Fill remaining length with random characters from all pools
        remaining_length = length - len(password_chars)
        for _ in range(remaining_length):
            password_chars.append(secrets.choice(all_chars))

        # Shuffle the password characters
        password_chars = self._shuffle(password_chars)

        return ''.join(password_chars)

    def _shuffle(self, chars: List[str]) -> List[str]:
        """
        Shuffle a list of characters using Fisher-Yates algorithm.
        
        Args:
            chars: List of characters to shuffle
            
        Returns:
            Shuffled list of characters
        """
        chars = chars.copy()
        for i in range(len(chars) - 1, 0, -1):
            j = secrets.randbelow(i + 1)
            chars[i], chars[j] = chars[j], chars[i]
        return chars

    def generate_multiple(self, count: int, options: PasswordOptions = None) -> List[str]:
        """
        Generate multiple passwords.
        
        Args:
            count: Number of passwords to generate
            options: Password generation options
            
        Returns:
            List of generated passwords
        """
        return [self.generate(options) for _ in range(count)]

    def get_default_options(self) -> PasswordOptions:
        """
        Get default password generation options.
        
        Returns:
            Default PasswordOptions
        """
        return PasswordOptions(
            length=16,
            include_lowercase=True,
            include_uppercase=True,
            include_digits=True,
            include_symbols=True
        )

    def calculate_entropy(self, password: str) -> float:
        """
        Calculate the entropy of a password in bits.
        
        Args:
            password: The password to analyze
            
        Returns:
            Entropy in bits
        """
        pool_size = 0
        
        if any(c.islower() for c in password):
            pool_size += len(self.LOWERCASE)
        if any(c.isupper() for c in password):
            pool_size += len(self.UPPERCASE)
        if any(c.isdigit() for c in password):
            pool_size += len(self.DIGITS)
        if any(not c.isalnum() for c in password):
            pool_size += len(self.SYMBOLS)

        if pool_size == 0:
            return 0.0

        return len(password) * (pool_size.bit_length() - 1)