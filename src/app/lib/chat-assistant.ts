import { VaultEntry, getSecuritySummary } from './vault';
import { generateSecurePassword, getDefaultPasswordOptions } from './password-tools';
import { LLMService, AIContext } from './llm-service';

export interface AssistantReply {
  message: string;
  suggestions: string[];
}

function formatEntryList(entries: VaultEntry[]) {
  if (entries.length === 0) return 'Aucune entrée trouvée.';
  return entries.map((entry) => `• ${entry.service} (${entry.username || 'identifiant non renseigné'})`).join('\n');
}

async function buildLLMResponse(input: string, entries: VaultEntry[]): Promise<AssistantReply | null> {
  try {
    // Build context for LLM
    const summary = getSecuritySummary(entries);
    const context: AIContext = {
      entries_count: entries.length,
      weak_entries: summary.weakEntries,
      reused_count: summary.reusedPasswords,
      total_entries: summary.totalEntries,
      suspicious_entries: summary.suspiciousEntries,
      entries: entries.map(e => ({ 
        service: e.service, 
        username: e.username || 'unknown' 
      }))
    };

    const response = await LLMService.chat(input, context, true);
    
    return {
      message: response.message,
      suggestions: response.suggestions
    };
  } catch (error) {
    console.warn('LLM response generation failed, using fallback:', error);
    return null;
  }
}

export async function buildAssistantReply(input: string, entries: VaultEntry[]): Promise<AssistantReply> {
  const normalized = input.trim().toLowerCase();
  const summary = getSecuritySummary(entries);

  // Try LLM-powered response first
  const llmResponse = await buildLLMResponse(input, entries);
  if (llmResponse) {
    return llmResponse;
  }

  // Fallback to heuristic responses
  return buildHeuristicReply(normalized, entries, summary);
}

function buildHeuristicReply(normalized: string, entries: VaultEntry[], summary: any): AssistantReply {
  if (!normalized) {
    return {
      message: 'Je peux lister tes comptes, repérer les mots de passe faibles, détecter les doublons ou proposer un mot de passe fort.',
      suggestions: ['Liste mes comptes', 'Montre les mots de passe faibles', 'Génère un mot de passe fort'],
    };
  }

  if (normalized.includes('liste') || normalized.includes('list')) {
    return {
      message: `Voici les services actuellement dans ton coffre :\n${formatEntryList(entries)}`,
      suggestions: ['Cherche GitHub', 'Résumé sécurité', 'Montre les doublons'],
    };
  }

  if (normalized.includes('faible') || normalized.includes('weak')) {
    const weak = summary.weakEntries;
    return {
      message:
        weak.length === 0
          ? 'Bonne nouvelle: aucun mot de passe faible n’a été détecté dans le coffre.'
          : `J’ai trouvé ${weak.length} entrée(s) à renforcer :\n${weak
              .map((entry) => `• ${entry.service} (${entry.passwordScore}/100)`) 
              .join('\n')}`,
      suggestions: ['Génère un mot de passe fort', 'Montre les services suspects', 'Résumé sécurité'],
    };
  }

  if (normalized.includes('doublon') || normalized.includes('reuse') || normalized.includes('réutil')) {
    return {
      message:
        summary.reusedPasswords === 0
          ? 'Je ne vois aucun mot de passe réutilisé dans les entrées chargées.'
          : `${summary.reusedPasswords} groupe(s) de mots de passe réutilisés ont été détectés. Je recommande une rotation immédiate.`,
      suggestions: ['Montre les mots de passe faibles', 'Génère un mot de passe fort', 'Résumé sécurité'],
    };
  }

  if (normalized.includes('suspect') || normalized.includes('phishing') || normalized.includes('domaine')) {
    return {
      message:
        summary.suspiciousEntries.length === 0
          ? 'Aucun domaine suspect détecté pour le moment.'
          : `Services à surveiller :\n${summary.suspiciousEntries
              .map((entry) => `• ${entry.service}: ${entry.domainWarnings.join(' ')}`)
              .join('\n')}`,
      suggestions: ['Résumé sécurité', 'Liste mes comptes', 'Cherche google'],
    };
  }

  if (normalized.includes('résumé') || normalized.includes('summary') || normalized.includes('sécurité')) {
    return {
      message: `Résumé actuel:
• ${summary.totalEntries} entrée(s) dans le coffre
• ${summary.weakEntries.length} mot(s) de passe faibles
• ${summary.reusedPasswords} groupe(s) de doublons
• ${summary.suspiciousEntries.length} service(s) avec risque de domaine`,
      suggestions: ['Montre les mots de passe faibles', 'Montre les doublons', 'Liste mes comptes'],
    };
  }

  if (normalized.includes('génère') || normalized.includes('generate')) {
    const suggestion = generateSecurePassword(getDefaultPasswordOptions());
    return {
      message: `Voici une proposition robuste que tu peux enregistrer dans le générateur:\n${suggestion}`,
      suggestions: ['Résumé sécurité', 'Liste mes comptes', 'Montre les mots de passe faibles'],
    };
  }

  if (normalized.includes('cherche') || normalized.includes('search')) {
    const query = normalized.replace('cherche', '').replace('search', '').trim();
    const results = entries.filter((entry) => entry.service.toLowerCase().includes(query));
    return {
      message: query ? formatEntryList(results) : 'Précise un service à rechercher, par exemple: cherche github.',
      suggestions: ['Liste mes comptes', 'Résumé sécurité', 'Montre les services suspects'],
    };
  }

  return {
    message:
      'Je n’ai pas compris cette demande précisément. Essaie une commande comme "liste mes comptes", "résumé sécurité" ou "génère un mot de passe fort".',
    suggestions: ['Liste mes comptes', 'Résumé sécurité', 'Génère un mot de passe fort'],
  };
}
