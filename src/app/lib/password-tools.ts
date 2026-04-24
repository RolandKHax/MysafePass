export interface PasswordOptions {
  length: number;
  includeLowercase: boolean;
  includeUppercase: boolean;
  includeDigits: boolean;
  includeSymbols: boolean;
}

export interface PasswordAnalysis {
  score: number;
  entropyBits: number;
  label: 'Faible' | 'Moyen' | 'Fort' | 'Très fort';
  crackTimeLabel: string;
  warnings: string[];
  recommendations: string[];
}

const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const COMMON_PATTERNS = [
  'password',
  'azerty',
  'qwerty',
  'admin',
  'welcome',
  'secret',
  'mysafepass',
];

function randomInt(max: number) {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return bytes[0] % max;
}

function shuffle(chars: string[]) {
  for (let index = chars.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [chars[index], chars[swapIndex]] = [chars[swapIndex], chars[index]];
  }

  return chars;
}

function buildPools(options: PasswordOptions) {
  const pools = [
    options.includeLowercase ? LOWERCASE : '',
    options.includeUppercase ? UPPERCASE : '',
    options.includeDigits ? DIGITS : '',
    options.includeSymbols ? SYMBOLS : '',
  ].filter(Boolean);

  if (pools.length === 0) {
    return [LOWERCASE];
  }

  return pools;
}

export function generateSecurePassword(options: PasswordOptions) {
  const pools = buildPools(options);
  const combinedPool = pools.join('');
  const effectiveLength = Math.min(Math.max(options.length, 8), 64);
  const passwordChars: string[] = [];

  pools.forEach((pool) => {
    passwordChars.push(pool[randomInt(pool.length)]);
  });

  while (passwordChars.length < effectiveLength) {
    passwordChars.push(combinedPool[randomInt(combinedPool.length)]);
  }

  return shuffle(passwordChars).join('');
}

function estimateCrackTime(entropyBits: number) {
  const guessesPerSecond = 1e10;
  const seconds = Math.max(1, Math.pow(2, entropyBits) / guessesPerSecond);

  if (seconds < 60) return 'moins d’une minute';
  if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
  if (seconds < 86400) return `${Math.round(seconds / 3600)} heures`;
  if (seconds < 31536000) return `${Math.round(seconds / 86400)} jours`;
  if (seconds < 3153600000) return `${Math.round(seconds / 31536000)} années`;
  return 'plusieurs siècles';
}

function detectWarnings(password: string) {
  const lowered = password.toLowerCase();
  const warnings: string[] = [];

  if (/(.)\1{2,}/.test(password)) warnings.push('Contient des répétitions de caractères.');
  if (/0123|1234|2345|3456|abcd|qwer|azer/i.test(password)) warnings.push('Contient une séquence prévisible.');
  if (/(19|20)\d{2}/.test(password)) warnings.push('Contient une année ou une date identifiable.');
  if (COMMON_PATTERNS.some((pattern) => lowered.includes(pattern))) warnings.push('Contient un mot trop commun.');
  if (password.length < 12) warnings.push('La longueur est inférieure à 12 caractères.');

  return warnings;
}

export function analyzePasswordStrength(password: string, options?: Partial<PasswordOptions>): PasswordAnalysis {
  const pools = buildPools({
    length: password.length || 0,
    includeLowercase: options?.includeLowercase ?? /[a-z]/.test(password),
    includeUppercase: options?.includeUppercase ?? /[A-Z]/.test(password),
    includeDigits: options?.includeDigits ?? /\d/.test(password),
    includeSymbols: options?.includeSymbols ?? /[^A-Za-z0-9]/.test(password),
  });
  const poolSize = pools.join('').length || 1;
  const entropyBits = Number((password.length * Math.log2(poolSize)).toFixed(1));
  const warnings = detectWarnings(password);
  const recommendations: string[] = [];

  if (!/[A-Z]/.test(password)) recommendations.push('Ajoute au moins une majuscule.');
  if (!/[a-z]/.test(password)) recommendations.push('Ajoute au moins une minuscule.');
  if (!/\d/.test(password)) recommendations.push('Ajoute au moins un chiffre.');
  if (!/[^A-Za-z0-9]/.test(password)) recommendations.push('Ajoute un symbole pour augmenter l’entropie.');
  if (password.length < 16) recommendations.push('Vise 16 caractères ou plus pour un mot de passe principal.');
  if (warnings.length === 0 && entropyBits >= 80) {
    recommendations.push('Le mot de passe respecte un niveau robuste pour un usage standard.');
  }

  let score = Math.min(100, Math.round((entropyBits / 128) * 100));
  score -= warnings.length * 12;
  score = Math.max(0, Math.min(100, score));

  let label: PasswordAnalysis['label'] = 'Faible';
  if (score >= 80) label = 'Très fort';
  else if (score >= 60) label = 'Fort';
  else if (score >= 35) label = 'Moyen';

  return {
    score,
    entropyBits,
    label,
    crackTimeLabel: estimateCrackTime(entropyBits),
    warnings,
    recommendations,
  };
}

export function getDefaultPasswordOptions(): PasswordOptions {
  return {
    length: 16,
    includeLowercase: true,
    includeUppercase: true,
    includeDigits: true,
    includeSymbols: true,
  };
}
