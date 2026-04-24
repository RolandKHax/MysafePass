export interface ServiceRiskAnalysis {
  warnings: string[];
  level: 'low' | 'medium' | 'high';
}

function looksLikeIpAddress(value: string) {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(value);
}

export function analyzeServiceRisk(service: string, url?: string): ServiceRiskAnalysis {
  const warnings: string[] = [];
  const target = (url || service).trim().toLowerCase();

  if (!target) {
    return { warnings, level: 'low' };
  }

  if (target.includes('xn--')) warnings.push('Le domaine contient du punycode, potentiellement utilisé en phishing.');
  if (target.startsWith('http://')) warnings.push('Le service utilise HTTP au lieu de HTTPS.');
  if (looksLikeIpAddress(target.replace(/^https?:\/\//, '').split('/')[0])) {
    warnings.push('Le service pointe vers une adresse IP brute, comportement inhabituel.');
  }
  if (/paypa1|g00gle|micr0soft|faceb00k/.test(target)) {
    warnings.push('Le nom ressemble à un domaine typosquatté.');
  }
  if (target.includes('@')) warnings.push('Présence d’un caractère @ dans l’URL, indicateur fréquent de phishing.');

  let level: ServiceRiskAnalysis['level'] = 'low';
  if (warnings.length >= 3) level = 'high';
  else if (warnings.length >= 1) level = 'medium';

  return { warnings, level };
}
