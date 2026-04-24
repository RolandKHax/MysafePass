"""
Password Analyzer - Advanced password security analysis using LLM
"""

import re
from typing import Dict, Any, List, Tuple
from .llm_service import LLMService
import logging

logger = logging.getLogger(__name__)


class PasswordAnalyzer:
    """Advanced password analyzer with LLM capabilities."""
    
    # Patterns for detecting sensitive data
    EMAIL_PATTERN = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    PHONE_PATTERN = r'(\+?\d{1,3}[-.\s]?)?\d{3}[-.\s]\d{3}[-.\s]\d{4}'
    FOUR_DIGIT_PATTERN = r'\b\d{4}\b'
    COMMON_NAMES = ['jean', 'marie', 'pierre', 'paul', 'alice', 'bob', 'charlie', 
                    'john', 'david', 'michael', 'sarah', 'jessica', 'admin', 'root']
    
    def __init__(self, llm_service: LLMService = None):
        """
        Initialize Password Analyzer.
        
        Args:
            llm_service: Optional LLMService instance
        """
        self.llm = llm_service
        if not self.llm:
            self.llm = LLMService()
    
    def analyze_complete(self, password: str, username: str = None, email: str = None) -> Dict[str, Any]:
        """
        Perform complete password analysis.
        
        Args:
            password: Password to analyze
            username: Optional username for context
            email: Optional email for context
            
        Returns:
            Comprehensive analysis results
        """
        # Heuristic checks
        basic_analysis = self._basic_analysis(password)
        
        # Sensitive data detection
        sensitivity_check = self._detect_sensitive_patterns(password, username, email)
        
        # LLM-based analysis if available
        llm_analysis = None
        if self.llm and self.llm.is_available():
            try:
                llm_analysis = self.llm.analyze_password_strength(password)
                llm_sensitivity = self.llm.check_sensitive_data_injection(password)
            except Exception as e:
                logger.error(f"LLM analysis error: {str(e)}")
                llm_analysis = None
                llm_sensitivity = None
        else:
            llm_sensitivity = None
        
        # Combine results
        result = {
            "password_length": len(password),
            "basic_analysis": basic_analysis,
            "sensitive_data_detected": sensitivity_check,
            "llm_analysis": llm_analysis,
            "llm_sensitivity_check": llm_sensitivity,
            "overall_score": self._calculate_overall_score(basic_analysis, sensitivity_check, llm_analysis),
            "recommendation": self._generate_recommendation(basic_analysis, sensitivity_check, llm_analysis),
            "approved": self._should_approve_password(basic_analysis, sensitivity_check, llm_analysis)
        }
        
        return result
    
    def _basic_analysis(self, password: str) -> Dict[str, Any]:
        """Perform basic heuristic password analysis."""
        analysis = {
            "length": len(password),
            "has_uppercase": bool(re.search(r'[A-Z]', password)),
            "has_lowercase": bool(re.search(r'[a-z]', password)),
            "has_digits": bool(re.search(r'\d', password)),
            "has_special": bool(re.search(r'[!@#$%^&*()_+\-=\[\]{};:\'",.<>?/\\|`~]', password)),
            "has_spaces": ' ' in password,
            "consecutive_chars": self._check_consecutive_chars(password),
            "repeated_chars": self._check_repeated_chars(password),
            "keyboard_patterns": self._check_keyboard_patterns(password),
            "common_patterns": self._check_common_patterns(password),
            "entropy_bits": self._calculate_entropy(password),
        }
        
        return analysis
    
    def _detect_sensitive_patterns(self, password: str, username: str = None, email: str = None) -> Dict[str, Any]:
        """Detect if password contains sensitive personal data."""
        detected_patterns = []
        
        # Check for email patterns
        if re.search(self.EMAIL_PATTERN, password):
            detected_patterns.append("email_address")
        
        # Check for phone patterns
        if re.search(self.PHONE_PATTERN, password):
            detected_patterns.append("phone_number")
        
        # Check for 4-digit sequences (could be birthdates, PIN codes)
        if re.findall(self.FOUR_DIGIT_PATTERN, password):
            detected_patterns.append("four_digit_sequence")
        
        # Check for username in password
        if username and username.lower() in password.lower():
            detected_patterns.append("username_in_password")
        
        # Check for email username in password
        if email:
            email_username = email.split('@')[0]
            if email_username.lower() in password.lower():
                detected_patterns.append("email_username_in_password")
        
        # Check for common names
        password_lower = password.lower()
        for name in self.COMMON_NAMES:
            if name in password_lower:
                detected_patterns.append(f"common_name_{name}")
                break
        
        return {
            "detected_patterns": detected_patterns,
            "is_risky": len(detected_patterns) > 0,
            "pattern_count": len(detected_patterns)
        }
    
    def _check_consecutive_chars(self, password: str) -> List[str]:
        """Find consecutive character sequences."""
        consecutive = []
        for i in range(len(password) - 2):
            if ord(password[i+1]) == ord(password[i]) + 1 and ord(password[i+2]) == ord(password[i+1]) + 1:
                consecutive.append(password[i:i+3])
        return consecutive
    
    def _check_repeated_chars(self, password: str) -> int:
        """Count repeated character sequences."""
        count = 0
        for i in range(len(password) - 2):
            if password[i] == password[i+1] == password[i+2]:
                count += 1
        return count
    
    def _check_keyboard_patterns(self, password: str) -> List[str]:
        """Detect keyboard patterns like 'qwerty' or 'asdf'."""
        patterns = [
            'qwerty', 'qwertz', 'azerty', 'asdfgh', 'zxcvbn',
            '123456', '12345', '111111', '000000', '666666'
        ]
        found = []
        password_lower = password.lower()
        for pattern in patterns:
            if pattern in password_lower:
                found.append(pattern)
        return found
    
    def _check_common_patterns(self, password: str) -> List[str]:
        """Check for common weak password patterns."""
        patterns = []
        password_lower = password.lower()
        
        if password_lower in ['password', 'qwerty', '123456', 'admin', 'letmein', 'welcome']:
            patterns.append("extremely_common")
        
        if re.match(r'^[a-z]+\d+$', password_lower):
            patterns.append("word_then_numbers")
        
        if re.match(r'^\d+[a-z]+$', password_lower):
            patterns.append("numbers_then_word")
        
        return patterns
    
    def _calculate_entropy(self, password: str) -> float:
        """Calculate password entropy in bits."""
        import math
        
        charset_size = 0
        if any(c.isupper() for c in password):
            charset_size += 26
        if any(c.islower() for c in password):
            charset_size += 26
        if any(c.isdigit() for c in password):
            charset_size += 10
        if any(c in '!@#$%^&*()_+-=[]{};\'",./<>?\\|`~' for c in password):
            charset_size += 32
        
        if charset_size == 0:
            return 0
        
        return len(password) * math.log2(charset_size)
    
    def _calculate_overall_score(self, basic: Dict, sensitivity: Dict, llm_analysis: Dict = None) -> int:
        """Calculate overall password strength score (0-100)."""
        score = 50  # Base score
        
        # Length bonus
        if basic['length'] >= 16:
            score += 20
        elif basic['length'] >= 12:
            score += 15
        elif basic['length'] >= 8:
            score += 10
        
        # Character variety bonus
        variety = sum([
            basic['has_uppercase'],
            basic['has_lowercase'],
            basic['has_digits'],
            basic['has_special']
        ])
        score += variety * 10
        
        # Entropy bonus
        if basic['entropy_bits'] > 100:
            score += 10
        elif basic['entropy_bits'] > 50:
            score += 5
        
        # Deduct for patterns
        score -= len(basic['consecutive_chars']) * 5
        score -= basic['repeated_chars'] * 3
        score -= len(basic['keyboard_patterns']) * 15
        score -= len(basic['common_patterns']) * 20
        
        # Deduct for sensitive data
        if sensitivity['is_risky']:
            score -= sensitivity['pattern_count'] * 25
        
        # LLM-based adjustment
        if llm_analysis and 'strength_score' in llm_analysis:
            # Average with LLM score
            score = (score + llm_analysis['strength_score']) // 2
        
        return max(0, min(100, score))
    
    def _generate_recommendation(self, basic: Dict, sensitivity: Dict, llm_analysis: Dict = None) -> str:
        """Generate recommendation based on analysis."""
        if sensitivity['is_risky']:
            return f"Rejected: Password contains {sensitivity['pattern_count']} sensitive data pattern(s). Avoid personal information."
        
        if basic['has_spaces']:
            return "Rejected: Password contains spaces. Use passphrases without spaces."
        
        if len(basic['keyboard_patterns']) > 0:
            return f"Rejected: Password contains keyboard pattern(s): {', '.join(basic['keyboard_patterns'])}"
        
        if len(basic['common_patterns']) > 0:
            return f"Rejected: Password matches common weak pattern(s)"
        
        if basic['length'] < 12:
            return "Weak: Increase password length to at least 12 characters"
        
        if variety < 3 if (variety := sum([basic['has_uppercase'], basic['has_lowercase'], basic['has_digits'], basic['has_special']])) else False:
            return "Weak: Use a mix of uppercase, lowercase, digits, and special characters"
        
        if llm_analysis and 'recommendations' in llm_analysis:
            return llm_analysis['recommendations'][0] if llm_analysis['recommendations'] else "Password meets requirements"
        
        return "Strong: Password meets security requirements"
    
    def _should_approve_password(self, basic: Dict, sensitivity: Dict, llm_analysis: Dict = None) -> bool:
        """Determine if password should be approved."""
        # Reject if sensitive data detected
        if sensitivity['is_risky']:
            return False
        
        # Reject if spaces
        if basic['has_spaces']:
            return False
        
        # Reject if keyboard patterns
        if len(basic['keyboard_patterns']) > 0:
            return False
        
        # Reject if extremely common patterns
        if 'extremely_common' in basic['common_patterns']:
            return False
        
        # Check minimum requirements
        if basic['length'] < 12:
            return False
        
        variety = sum([
            basic['has_uppercase'],
            basic['has_lowercase'],
            basic['has_digits'],
            basic['has_special']
        ])
        
        if variety < 3:
            return False
        
        # Check LLM recommendation if available
        if llm_analysis and 'should_reject' in llm_analysis:
            if llm_analysis['should_reject']:
                return False
        
        return True
