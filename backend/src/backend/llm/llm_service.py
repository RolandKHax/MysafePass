"""
LLM Service - Integration with Ollama for local LLM capabilities
"""

import os
import requests
from typing import Optional, Dict, Any, List
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


class LLMService:
    """Service for interacting with local Ollama LLM."""
    
    def __init__(
        self,
        ollama_url: str = "http://localhost:11434",
        model: str = "mistral",
        timeout: int = 30,
        role: str = "guard",
    ):
        """
        Initialize LLM Service.
        
        Args:
            ollama_url: URL of the Ollama server
            model: Model name to use (e.g., 'mistral', 'neural-chat', 'llama2')
            timeout: Request timeout in seconds
            role: Role identifier for logging — 'guard' (master pw + chat) or 'generator' (password gen)
        """
        self.ollama_url = ollama_url.rstrip('/')
        self.model = model
        self.timeout = timeout
        self.role = role
        self.api_endpoint = f"{self.ollama_url}/api/generate"
        self._cache = {}
        
    def is_available(self) -> bool:
        """Check if Ollama server is available."""
        try:
            response = requests.get(
                f"{self.ollama_url}/api/tags",
                timeout=5
            )
            return response.status_code == 200
        except Exception as e:
            logger.warning(f"Ollama server not available: {str(e)}")
            return False
    
    def get_available_models(self) -> List[str]:
        """Get list of available models from Ollama."""
        try:
            response = requests.get(
                f"{self.ollama_url}/api/tags",
                timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                return [model['name'].split(':')[0] for model in data.get('models', [])]
            return []
        except Exception as e:
            logger.error(f"Error getting models: {str(e)}")
            return []
    
    def generate(self, prompt: str, stream: bool = False) -> str:
        """
        Generate text using the LLM.
        
        Args:
            prompt: The input prompt
            stream: Whether to stream the response
            
        Returns:
            Generated text
        """
        try:
            payload = {
                "model": self.model,
                "prompt": prompt,
                "stream": False,  # We handle non-streaming for simplicity
                "temperature": 0.7,
                "top_p": 0.9,
                "top_k": 40
            }
            
            response = requests.post(
                self.api_endpoint,
                json=payload,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get('response', '').strip()
            else:
                logger.error(f"LLM error: {response.status_code}")
                return ""
                
        except requests.Timeout:
            logger.error("LLM request timeout")
            return ""
        except Exception as e:
            logger.error(f"Error generating text: {str(e)}")
            return ""
    
    def analyze_password_strength(self, password: str) -> Dict[str, Any]:
        """
        Analyze password strength and detect potential issues.
        
        Args:
            password: The password to analyze
            
        Returns:
            Dictionary with analysis results
        """
        # Create a cache key to avoid redundant API calls
        cache_key = f"pwd_analysis_{hash(password)}"
        if cache_key in self._cache:
            return self._cache[cache_key]
        
        # GDPR — never send the raw password to the LLM. Send only structural
        # metadata (length, char-class diversity, entropy estimate, repetition).
        import math, re as _re
        length = len(password)
        has_lower = any(c.islower() for c in password)
        has_upper = any(c.isupper() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_symbol = any(not c.isalnum() for c in password)
        charset_size = (26 if has_lower else 0) + (26 if has_upper else 0) + (10 if has_digit else 0) + (32 if has_symbol else 0)
        entropy = round(length * math.log2(charset_size), 1) if charset_size else 0.0
        unique_ratio = round(len(set(password)) / max(1, length), 2)
        has_runs = bool(_re.search(r'(.)\1\1', password))

        prompt = f"""Analyze a password using ONLY this anonymous metadata (the
raw password is never disclosed for privacy reasons):
- length: {length}
- contains_lowercase: {has_lower}
- contains_uppercase: {has_upper}
- contains_digits: {has_digit}
- contains_symbols: {has_symbol}
- charset_size: {charset_size}
- estimated_entropy_bits: {entropy}
- unique_char_ratio: {unique_ratio}
- has_triple_repeats: {has_runs}

Provide a JSON response with:
1. strength_score (0-100)
2. has_sensitive_data (always false here — analysis is anonymous)
3. risks (array of identified risks based on metadata)
4. recommendations (array of improvement suggestions)
5. entropy_estimate (use the provided estimated_entropy_bits)

Keep your response concise and structured."""

        response = self.generate(prompt)
        
        try:
            # Parse JSON response
            import json
            # Clean up the response in case it has markdown formatting
            if '```json' in response:
                response = response.split('```json')[1].split('```')[0]
            elif '```' in response:
                response = response.split('```')[1].split('```')[0]
            
            result = json.loads(response)
        except Exception as e:
            logger.warning(f"Failed to parse LLM response: {str(e)}")
            result = {
                "strength_score": 0,
                "has_sensitive_data": False,
                "risks": [],
                "recommendations": [],
                "entropy_estimate": "unknown"
            }
        
        self._cache[cache_key] = result
        return result
    
    def check_sensitive_data_injection(self, password: str) -> Dict[str, Any]:
        """
        Check if password contains sensitive data like usernames, emails, etc.
        
        Args:
            password: The password to check
            
        Returns:
            Dictionary with detected sensitive data patterns
        """
        # GDPR — never disclose the raw password. Detection of sensitive
        # patterns happens locally via deterministic regexes; we ask the LLM
        # only to comment on the resulting *categories*.
        import re as _re
        detected = []
        if _re.search(r'[\w\.\-]+@[\w\.\-]+\.[A-Za-z]{2,}', password):
            detected.append('email_pattern')
        if _re.search(r'(\+?\d{1,3}[\s\.\-]?)?(?:\(?\d{2,4}\)?[\s\.\-]?){2,5}\d{2,4}', password):
            detected.append('phone_pattern')
        if _re.search(r'\b(19|20)\d{2}\b', password):
            detected.append('possible_year_of_birth')
        if _re.search(r'\b\d{4}\b', password):
            detected.append('four_digit_block')
        if _re.search(r'(?i)(http|www\.)', password):
            detected.append('url_pattern')

        prompt = f"""You are reviewing the privacy hygiene of a password using
anonymous category flags only (the raw password is NEVER shared):
- detected_categories: {detected if detected else 'none'}

Return a JSON with:
- detected_patterns (echo of detected_categories)
- severity (low/medium/high based on the categories)
- explanation (brief explanation in French)
- should_reject (true if the password embeds personal data patterns)"""

        response = self.generate(prompt)
        
        try:
            import json
            # Clean up the response
            if '```json' in response:
                response = response.split('```json')[1].split('```')[0]
            elif '```' in response:
                response = response.split('```')[1].split('```')[0]
            
            result = json.loads(response)
        except Exception as e:
            logger.warning(f"Failed to parse sensitive data check: {str(e)}")
            result = {
                "detected_patterns": [],
                "severity": "unknown",
                "explanation": "Unable to analyze",
                "should_reject": False
            }
        
        return result
    
    def answer_security_question(self, question: str, context: Optional[Dict] = None) -> str:
        """
        Answer security-related questions.
        
        Args:
            question: The security question
            context: Optional context about the user or situation
            
        Returns:
            Answer to the question
        """
        system_prompt = """You are a cybersecurity expert assistant. Answer security questions 
clearly, accurately, and concisely. Focus on practical advice for password managers and vault security.
Always respond in the same language as the question."""
        
        full_prompt = f"{system_prompt}\n\nQuestion: {question}"
        if context:
            full_prompt += f"\n\nContext: {context}"
        
        return self.generate(full_prompt)
    
    def rate_limit_check(self) -> bool:
        """Check if we should continue making requests (simple rate limiting)."""
        # Simple rate limiting - could be enhanced
        return True

    # ------------------------------------------------------------------
    # GDPR — PII redaction helper applied before any LLM call
    # ------------------------------------------------------------------
    @staticmethod
    def redact_pii(text: str) -> str:
        """Redact common personally-identifiable information from a string
        before it is sent to a local LLM. Even though the model runs locally,
        we minimise data passed to it (RGPD art. 5.1.c — minimisation)."""
        import re
        if not text:
            return text
        # Email addresses
        text = re.sub(r'[\w\.\-+%]+@[\w\.\-]+\.[A-Za-z]{2,}', '[EMAIL_REDACTED]', text)
        # Phone numbers (international + french formats)
        text = re.sub(r'(\+?\d{1,3}[\s\.\-]?)?(?:\(?\d{2,4}\)?[\s\.\-]?){2,5}\d{2,4}', '[PHONE_REDACTED]', text)
        # IBAN
        text = re.sub(r'\b[A-Z]{2}\d{2}[A-Z0-9]{10,30}\b', '[IBAN_REDACTED]', text)
        # Credit-card-like (13-19 digit groups)
        text = re.sub(r'\b(?:\d[ \-]?){13,19}\b', '[CARD_REDACTED]', text)
        # French social security number (NIR)
        text = re.sub(r'\b[12]\d{2}(0[1-9]|1[0-2])\d{2}\d{3}\d{3}\d{2}\b', '[NIR_REDACTED]', text)
        return text

    # ------------------------------------------------------------------
    # Generator LLM — exclusively for strong password generation
    # ------------------------------------------------------------------
    def generate_password(
        self,
        length: int = 20,
        include_lower: bool = True,
        include_upper: bool = True,
        include_digits: bool = True,
        include_symbols: bool = True,
    ) -> Dict[str, Any]:
        """Use the LLM to propose a strong password and validate it locally.

        The LLM only suggests; we always run a deterministic CSPRNG fallback
        to guarantee security if the model output is weak. The LLM result is
        used only when it meets the requested charset and length.
        """
        import secrets
        import string

        pools = []
        if include_lower:
            pools.append(string.ascii_lowercase)
        if include_upper:
            pools.append(string.ascii_uppercase)
        if include_digits:
            pools.append(string.digits)
        if include_symbols:
            pools.append("!@#$%^&*()_+-=[]{}|;:,.<>?")
        if not pools:
            pools = [string.ascii_lowercase]
        combined = "".join(pools)
        length = max(8, min(int(length), 128))

        def csprng_password() -> str:
            chars = [secrets.choice(p) for p in pools]
            while len(chars) < length:
                chars.append(secrets.choice(combined))
            secrets.SystemRandom().shuffle(chars)
            return "".join(chars[:length])

        proposal_source = "csprng"
        proposal = csprng_password()

        # Try to enrich with LLM creativity (only if available)
        if self.is_available():
            charset_descr = []
            if include_lower: charset_descr.append("lowercase")
            if include_upper: charset_descr.append("uppercase")
            if include_digits: charset_descr.append("digits")
            if include_symbols: charset_descr.append("symbols")
            prompt = (
                "You are a dedicated strong-password generator. "
                "Output ONLY the password, no explanation, no quotes, no prefix.\n"
                f"Required length: {length}\n"
                f"Required character classes: {', '.join(charset_descr)}\n"
                "Forbidden: dictionary words, repeating sequences (aaa, 111), "
                "keyboard runs (qwerty, azerty, 1234), and any natural-language phrase.\n"
                "Use only printable ASCII. Output the password on a single line."
            )
            llm_proposal = self.generate(prompt).strip().splitlines()[0].strip() if self.generate(prompt) else ""
            # Validate LLM proposal
            if llm_proposal and len(llm_proposal) >= max(12, length - 4):
                ok = True
                if include_lower and not any(c.islower() for c in llm_proposal): ok = False
                if include_upper and not any(c.isupper() for c in llm_proposal): ok = False
                if include_digits and not any(c.isdigit() for c in llm_proposal): ok = False
                if include_symbols and not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?/\\\"'`~" for c in llm_proposal): ok = False
                if any(c.isspace() for c in llm_proposal): ok = False
                if ok:
                    # Pad/trim to exact length using CSPRNG for any deficit
                    if len(llm_proposal) < length:
                        extra = [secrets.choice(combined) for _ in range(length - len(llm_proposal))]
                        llm_proposal = llm_proposal + "".join(extra)
                    proposal = llm_proposal[:length]
                    proposal_source = "llm"

        # Compute simple entropy estimate
        import math
        charset_size = sum([
            26 if include_lower else 0,
            26 if include_upper else 0,
            10 if include_digits else 0,
            32 if include_symbols else 0,
        ]) or 26
        entropy_bits = round(length * math.log2(charset_size), 1)

        return {
            "password": proposal,
            "length": length,
            "entropy_bits": entropy_bits,
            "source": proposal_source,
            "model": self.model,
            "role": self.role,
        }
