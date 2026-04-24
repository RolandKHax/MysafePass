"""
AI Assistant - Enhanced assistant with LLM capabilities
"""

from typing import Dict, List, Any, Optional
from .llm_service import LLMService
import logging

logger = logging.getLogger(__name__)


class AIAssistant:
    """Enhanced AI Assistant powered by local LLM."""
    
    def __init__(self, llm_service: LLMService = None):
        """
        Initialize AI Assistant.
        
        Args:
            llm_service: Optional LLMService instance
        """
        self.llm = llm_service
        if not self.llm:
            self.llm = LLMService()
    
    def process_query(
        self,
        query: str,
        context: Optional[Dict[str, Any]] = None,
        use_llm: bool = True
    ) -> Dict[str, Any]:
        """
        Process user query and generate response.
        
        Args:
            query: User's question or request
            context: Optional context (vault entries, user data, etc.)
            use_llm: Whether to use LLM for enhanced responses
            
        Returns:
            Dictionary with message and suggestions
        """
        # Try LLM-powered response first if available and enabled
        if use_llm and self.llm and self.llm.is_available():
            try:
                return self._generate_llm_response(query, context)
            except Exception as e:
                logger.warning(f"LLM response generation failed: {str(e)}, falling back to heuristic")
        
        # Fall back to heuristic-based responses
        return self._generate_heuristic_response(query, context)
    
    def _generate_llm_response(self, query: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """Generate response using LLM."""
        # GDPR — redact PII from user input and aggregate context BEFORE LLM call
        safe_query = self.llm.redact_pii(query) if self.llm else query

        # Build context string from non-personal aggregates only
        context_str = ""
        if context:
            if 'entries_count' in context:
                context_str += f"\nUser has {context['entries_count']} vault entries"
            if 'weak_entries' in context:
                context_str += f"\nFound {len(context['weak_entries'])} weak password(s)"
            if 'reused_count' in context:
                context_str += f"\nFound {context['reused_count']} reused password group(s)"

        system_prompt = """You are MySafePass, a friendly and helpful password manager AI assistant.
You help users manage their passwords and improve their security posture, and you also evaluate
the strength of master passwords when asked. NEVER repeat or store any personal data the user
provides. NEVER request a real password — analyse only meta information (length, character mix).
Always provide clear, actionable advice in the user's language.
Keep responses concise (1-3 sentences max for main response).
Provide 3 helpful follow-up suggestions."""
        
        full_prompt = f"""{system_prompt}

User's vault context:{context_str}

User's question: {query}

Please respond with:
1. A brief helpful answer
2. A JSON object with "suggestions" array (3 suggestions for follow-up questions)

Example format:
Your answer here.

{{"suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]}}"""
        
        llm_response = self.llm.generate(full_prompt)
        
        # Parse response
        message = llm_response
        suggestions = []
        
        try:
            if '{"suggestions"' in llm_response:
                import json
                json_start = llm_response.rfind('{"suggestions"')
                if json_start > 0:
                    message = llm_response[:json_start].strip()
                    json_str = llm_response[json_start:]
                    json_obj = json.loads(json_str)
                    suggestions = json_obj.get('suggestions', [])
        except Exception as e:
            logger.warning(f"Failed to parse LLM suggestions: {str(e)}")
        
        # Fallback suggestions if parsing failed
        if not suggestions:
            suggestions = self._default_suggestions(query)
        
        return {
            "message": message if message else "Je n'ai pas bien compris votre demande.",
            "suggestions": suggestions,
            "powered_by_llm": True
        }
    
    def _generate_heuristic_response(self, query: str, context: Optional[Dict] = None) -> Dict[str, Any]:
        """Generate response using heuristic rules."""
        query_lower = query.lower().strip()
        
        # List vault entries
        if any(word in query_lower for word in ['liste', 'list', 'show', 'affiche', 'voir']):
            return self._response_list_entries(context)
        
        # Check weak passwords
        if any(word in query_lower for word in ['faible', 'weak', 'force', 'strength']):
            return self._response_weak_passwords(context)
        
        # Check reused passwords
        if any(word in query_lower for word in ['doublon', 'reuse', 'réutil', 'duplicate']):
            return self._response_reused_passwords(context)
        
        # Check suspicious domains
        if any(word in query_lower for word in ['suspect', 'phishing', 'domaine', 'domain']):
            return self._response_suspicious_domains(context)
        
        # Security summary
        if any(word in query_lower for word in ['résumé', 'summary', 'sécurité', 'security']):
            return self._response_security_summary(context)
        
        # Generate password
        if any(word in query_lower for word in ['génère', 'generate', 'crée', 'create']):
            return self._response_generate_password()
        
        # Search
        if any(word in query_lower for word in ['cherche', 'search', 'trouve', 'find']):
            return self._response_search(query, context)
        
        # Help
        if any(word in query_lower for word in ['aide', 'help', 'quoi', 'what']):
            return self._response_help()
        
        # Default response
        return self._response_default()
    
    def _response_list_entries(self, context: Optional[Dict]) -> Dict[str, Any]:
        """Response for listing entries."""
        if not context or 'entries' not in context or len(context['entries']) == 0:
            message = "Aucune entrée trouvée dans votre coffre."
        else:
            entries = context['entries']
            entry_list = "\n".join([f"• {e.get('service', 'Unknown')} ({e.get('username', 'no account name')})" for e in entries])
            message = f"Voici les services dans votre coffre :\n{entry_list}"
        
        return {
            "message": message,
            "suggestions": ["Montre les mots de passe faibles", "Résumé sécurité", "Cherche un service"],
            "powered_by_llm": False
        }
    
    def _response_weak_passwords(self, context: Optional[Dict]) -> Dict[str, Any]:
        """Response for weak password check."""
        if not context or 'weak_entries' not in context or len(context['weak_entries']) == 0:
            message = "Bonne nouvelle ! Aucun mot de passe faible détecté."
        else:
            weak = context['weak_entries']
            weak_list = "\n".join([f"• {e.get('service')} (score: {e.get('score', '?')}/100)" for e in weak])
            message = f"J'ai trouvé {len(weak)} mot(s) de passe à renforcer :\n{weak_list}"
        
        return {
            "message": message,
            "suggestions": ["Génère un mot de passe fort", "Résumé sécurité", "Montre les doublons"],
            "powered_by_llm": False
        }
    
    def _response_reused_passwords(self, context: Optional[Dict]) -> Dict[str, Any]:
        """Response for reused password check."""
        if not context or not context.get('reused_count', 0):
            message = "Aucun mot de passe réutilisé détecté."
        else:
            message = f"J'ai détecté {context['reused_count']} groupe(s) de mots de passe réutilisés. Je recommande une rotation immédiate."
        
        return {
            "message": message,
            "suggestions": ["Montre les mots de passe faibles", "Génère un mot de passe fort", "Résumé sécurité"],
            "powered_by_llm": False
        }
    
    def _response_suspicious_domains(self, context: Optional[Dict]) -> Dict[str, Any]:
        """Response for suspicious domains check."""
        if not context or 'suspicious_entries' not in context or len(context['suspicious_entries']) == 0:
            message = "Aucun domaine suspect détecté pour le moment."
        else:
            suspicious = context['suspicious_entries']
            susp_list = "\n".join([f"• {e.get('service')}: {e.get('warning', 'Suspicious')}" for e in suspicious])
            message = f"Services à surveiller :\n{susp_list}"
        
        return {
            "message": message,
            "suggestions": ["Résumé sécurité", "Liste mes comptes", "Montre les mots de passe faibles"],
            "powered_by_llm": False
        }
    
    def _response_security_summary(self, context: Optional[Dict]) -> Dict[str, Any]:
        """Response for security summary."""
        summary = f"Résumé actuel:"
        if context:
            summary += f"\n• {context.get('total_entries', 0)} entrée(s) dans le coffre"
            summary += f"\n• {len(context.get('weak_entries', []))} mot(s) de passe faible(s)"
            summary += f"\n• {context.get('reused_count', 0)} groupe(s) de doublon(s)"
            summary += f"\n• {len(context.get('suspicious_entries', []))} service(s) avec risque"
        
        return {
            "message": summary,
            "suggestions": ["Montre les mots de passe faibles", "Montre les doublons", "Liste mes comptes"],
            "powered_by_llm": False
        }
    
    def _response_generate_password(self) -> Dict[str, Any]:
        """Response for password generation."""
        return {
            "message": "Voici une proposition robuste que tu peux utiliser :\n(Password generation is handled separately)",
            "suggestions": ["Résumé sécurité", "Liste mes comptes", "Montre les mots de passe faibles"],
            "powered_by_llm": False
        }
    
    def _response_search(self, query: str, context: Optional[Dict]) -> Dict[str, Any]:
        """Response for search."""
        search_term = query.lower().replace('cherche', '').replace('search', '').strip()
        message = f"Recherche pour : {search_term}"
        
        if context and 'entries' in context and search_term:
            results = [e for e in context['entries'] if search_term in e.get('service', '').lower()]
            if results:
                results_str = "\n".join([f"• {e.get('service')} ({e.get('username')})" for e in results])
                message += f"\n{results_str}"
            else:
                message += f"\nAucun résultat trouvé pour '{search_term}'"
        
        return {
            "message": message,
            "suggestions": ["Liste mes comptes", "Résumé sécurité", "Montre les services suspects"],
            "powered_by_llm": False
        }
    
    def _response_help(self) -> Dict[str, Any]:
        """Response for help."""
        return {
            "message": "Je peux t'aider avec :\n• Liste mes comptes\n• Montre les mots de passe faibles\n• Résumé sécurité\n• Cherche un service\n• Génère un mot de passe",
            "suggestions": ["Liste mes comptes", "Résumé sécurité", "Génère un mot de passe"],
            "powered_by_llm": False
        }
    
    def _response_default(self) -> Dict[str, Any]:
        """Default response."""
        return {
            "message": "Je n'ai pas bien compris ta demande. Essaie : 'liste mes comptes', 'résumé sécurité' ou 'montre les mots de passe faibles'.",
            "suggestions": ["Liste mes comptes", "Résumé sécurité", "Génère un mot de passe"],
            "powered_by_llm": False
        }
    
    def _default_suggestions(self, query: str) -> List[str]:
        """Generate default suggestions based on query."""
        return [
            "Liste mes comptes",
            "Résumé sécurité",
            "Montre les mots de passe faibles"
        ]
