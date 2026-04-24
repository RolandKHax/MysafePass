"""
Password Analyzer Module
Implements password strength analysis as per the cahier des charges:
- Entropy calculation in bits
- Weak pattern detection (dates, dictionary words, sequences)
- Score 0-100 with recommendations
- Crack time estimation
"""

import math
import re
from typing import List, Dict, Any
from dataclasses import dataclass


@dataclass
class PasswordAnalysis:
    """Result of password strength analysis."""
    score: int  # 0-100
    entropy_bits: float
    label: str  # 'Faible', 'Moyen', 'Fort', 'Très fort'
    crack_time_label: str
    warnings: List[str]
    recommendations: List[str]


class PasswordAnalyzer:
    """Password strength analyzer."""

    # Common patterns and dictionary words
    COMMON_PATTERNS = [
        'password', 'azerty', 'qwerty', 'admin', 'welcome', 'secret',
        'mysafepass', '123456', '12345678', '123456789', '1234567890',
        'abc123', 'password1', 'iloveyou', 'princess', 'football',
        'shadow', 'sunshine', 'dragon', 'monkey', 'master', 'login'
    ]

    # Sequential patterns
    SEQUENCES = [
        '0123', '1234', '2345', '3456', '4567', '5678', '6789', '7890',
        'abcd', 'bcde', 'cdef', 'defg', 'efgh', 'fghi', 'ghij', 'hijk',
        'ijkl', 'jklm', 'klmn', 'lmno', 'mnop', 'nopq', 'opqr', 'pqrs',
        'qrst', 'rstu', 'stuv', 'tuvw', 'uvwx', 'vwxy', 'wxyz',
        'qwer', 'werty', 'asdf', 'sdfg', 'dfgh', 'fghj', 'ghjk', 'hjkl',
        'jkl;', 'zxcv', 'xcvb', 'cvbn', 'vbnm', 'azer', 'zert', 'erty',
        'rtyu', 'tyui', 'yuio', 'uiop'
    ]

    def analyze(self, password: str) -> PasswordAnalysis:
        """
        Analyze password strength.
        
        Args:
            password: The password to analyze
            
        Returns:
            PasswordAnalysis result
        """
        # Calculate entropy
        entropy_bits = self._calculate_entropy(password)
        
        # Detect warnings
        warnings = self._detect_warnings(password)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(password, warnings)
        
        # Calculate score
        score = self._calculate_score(entropy_bits, warnings)
        
        # Determine label
        label = self._get_label(score)
        
        # Estimate crack time
        crack_time_label = self._estimate_crack_time(entropy_bits)
        
        return PasswordAnalysis(
            score=score,
            entropy_bits=round(entropy_bits, 1),
            label=label,
            crack_time_label=crack_time_label,
            warnings=warnings,
            recommendations=recommendations
        )

    def _calculate_entropy(self, password: str) -> float:
        """
        Calculate password entropy in bits.
        
        Args:
            password: The password to analyze
            
        Returns:
            Entropy in bits
        """
        pool_size = 0
        
        if any(c.islower() for c in password):
            pool_size += 26
        if any(c.isupper() for c in password):
            pool_size += 26
        if any(c.isdigit() for c in password):
            pool_size += 10
        if any(not c.isalnum() for c in password):
            pool_size += 32  # Common special characters

        if pool_size == 0:
            return 0.0

        return len(password) * math.log2(pool_size)

    def _detect_warnings(self, password: str) -> List[str]:
        """
        Detect weak patterns in the password.
        
        Args:
            password: The password to analyze
            
        Returns:
            List of warning messages
        """
        warnings = []
        lowered = password.lower()

        # Check for character repetition
        if re.search(r'(.)\1{2,}', password):
            warnings.append('Contient des répétitions de caractères.')

        # Check for sequential patterns
        if any(seq in lowered for seq in self.SEQUENCES):
            warnings.append('Contient une séquence prévisible.')

        # Check for years/dates
        if re.search(r'(19|20)\d{2}', password):
            warnings.append('Contient une année ou une date identifiable.')

        # Check for common patterns
        if any(pattern in lowered for pattern in self.COMMON_PATTERNS):
            warnings.append('Contient un mot trop commun.')

        # Check length
        if len(password) < 12:
            warnings.append('La longueur est inférieure à 12 caractères.')

        return warnings

    def _generate_recommendations(self, password: str, warnings: List[str]) -> List[str]:
        """
        Generate recommendations for improving password strength.
        
        Args:
            password: The password to analyze
            warnings: List of detected warnings
            
        Returns:
            List of recommendation messages
        """
        recommendations = []

        if not any(c.isupper() for c in password):
            recommendations.append('Ajoute au moins une majuscule.')

        if not any(c.islower() for c in password):
            recommendations.append('Ajoute au moins une minuscule.')

        if not any(c.isdigit() for c in password):
            recommendations.append('Ajoute au moins un chiffre.')

        if not any(not c.isalnum() for c in password):
            recommendations.append('Ajoute un symbole pour augmenter l\'entropie.')

        if len(password) < 16:
            recommendations.append('Vise 16 caractères ou plus pour un mot de passe principal.')

        if not warnings and self._calculate_entropy(password) >= 80:
            recommendations.append('Le mot de passe respecte un niveau robuste pour un usage standard.')

        return recommendations

    def _calculate_score(self, entropy_bits: float, warnings: List[str]) -> int:
        """
        Calculate password strength score (0-100).
        
        Args:
            entropy_bits: Password entropy in bits
            warnings: List of detected warnings
            
        Returns:
            Score from 0 to 100
        """
        # Base score from entropy (max 100 at 128 bits)
        score = min(100, round((entropy_bits / 128) * 100))

        # Deduct points for warnings
        score -= len(warnings) * 12

        # Clamp to 0-100
        return max(0, min(100, score))

    def _get_label(self, score: int) -> str:
        """
        Get password strength label from score.
        
        Args:
            score: Password strength score (0-100)
            
        Returns:
            Label string
        """
        if score >= 80:
            return 'Très fort'
        elif score >= 60:
            return 'Fort'
        elif score >= 35:
            return 'Moyen'
        else:
            return 'Faible'

    def _estimate_crack_time(self, entropy_bits: float) -> str:
        """
        Estimate time to crack the password.
        
        Args:
            entropy_bits: Password entropy in bits
            
        Returns:
            Human-readable crack time estimate
        """
        # Assume 10 billion guesses per second (modern GPU cluster)
        guesses_per_second = 1e10
        seconds = max(1, (2 ** entropy_bits) / guesses_per_second)

        if seconds < 60:
            return 'moins d\'une minute'
        elif seconds < 3600:
            return f'{round(seconds / 60)} minutes'
        elif seconds < 86400:
            return f'{round(seconds / 3600)} heures'
        elif seconds < 31536000:
            return f'{round(seconds / 86400)} jours'
        elif seconds < 3153600000:
            return f'{round(seconds / 31536000)} années'
        else:
            return 'plusieurs siècles'