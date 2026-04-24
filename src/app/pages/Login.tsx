import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, ShieldCheck, Eye, EyeOff, AlertTriangle, UserPlus, ChevronRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  getCaptchaRequired,
  getCurrentLockMessage,
  getRemainingAttempts,
  getSupportingSecurityCopy,
  useVault,
} from '../context/VaultContext';
import { normalizeUsername } from '../lib/vault';

function passwordLooksStrong(password: string) {
  const checks = [/[a-z]/.test(password), /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)];
  return password.length >= 12 && checks.filter(Boolean).length >= 3;
}

function generateCaptcha() {
  const a = Math.floor(Math.random() * 8) + 2;
  const b = Math.floor(Math.random() * 8) + 1;
  return { label: `${a} + ${b}`, answer: String(a + b) };
}

function StrengthBar({ password }: { password: string }) {
  const checks = [
    { label: 'min. 12 car.', ok: password.length >= 12 },
    { label: 'Majuscule', ok: /[A-Z]/.test(password) },
    { label: 'Chiffre', ok: /\d/.test(password) },
    { label: 'Symbole', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['var(--msp-red)', 'var(--msp-red)', 'var(--msp-yellow)', 'var(--msp-yellow)', 'var(--msp-green)'];
  if (!password) return null;
  return (
    <div>
      <div className="flex gap-1 mb-2">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all"
            style={{ background: i < score ? colors[score] : 'rgba(255,255,255,0.08)' }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {checks.map(c => (
          <span key={c.label} className="text-xs" style={{ color: c.ok ? 'var(--msp-green)' : 'var(--msp-text3)' }}>
            {c.ok ? '✓' : '○'} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

type Step = 'user-select' | 'setup' | 'unlock';

export default function Login() {
  const navigate = useNavigate();
  const { status, authRecord, profileName, users, selectUser, setupVault, unlockVault, lockMessage } = useVault();

  const [step, setStep] = useState<Step>('user-select');
  const [setupName, setSetupName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [captchaValue, setCaptchaValue] = useState('');
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [loading, setLoading] = useState(false);

  const requiresCaptcha = getCaptchaRequired(authRecord);
  const lockStatusMessage = useMemo(() => getCurrentLockMessage(authRecord), [authRecord]);
  const locked = authRecord?.lockUntil && authRecord.lockUntil > Date.now();
  const remaining = getRemainingAttempts(authRecord);

  useEffect(() => {
    if (status === 'unlocked') navigate('/dashboard');
  }, [navigate, status]);

  useEffect(() => {
    if (status === 'loading') return;
    if (users.length === 0) { setStep('setup'); return; }
    if (authRecord) { setStep('unlock'); return; }
    setStep('user-select');
  }, [status, users.length, authRecord]);

  useEffect(() => {
    if (requiresCaptcha) { setCaptcha(generateCaptcha()); setCaptchaValue(''); }
  }, [requiresCaptcha]);

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupName.trim()) { toast.error('Ajoute un nom de profil.'); return; }
    if (password !== confirmPassword) { toast.error('Les mots de passe ne correspondent pas.'); return; }
    if (!passwordLooksStrong(password)) {
      toast.error('Mot de passe trop faible: 12 caractères minimum, 3 catégories.');
      return;
    }
    setLoading(true);
    const username = normalizeUsername(setupName.trim());
    const existingUsernames = users.map(u => u.username);
    if (existingUsernames.includes(username)) {
      toast.error('Ce nom de profil est déjà utilisé. Choisissez-en un autre.');
      setLoading(false);
      return;
    }
    await setupVault(username, setupName.trim(), password);
    toast.success('Coffre chiffré et initialisé localement.');
    setLoading(false);
    navigate('/dashboard');
  };

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) { toast.error(lockStatusMessage || 'Coffre temporairement bloqué.'); return; }
    if (requiresCaptcha && captchaValue.trim() !== captcha.answer) {
      toast.error('CAPTCHA incorrect.'); setCaptcha(generateCaptcha()); setCaptchaValue(''); return;
    }
    setLoading(true);
    const result = await unlockVault(password);
    setLoading(false);
    if (!result.ok) { toast.error(result.error || 'Mot de passe incorrect.'); return; }
    toast.success('Coffre déverrouillé.');
    navigate('/dashboard');
  };

  const inputClass = "w-full px-4 py-3 rounded-xl text-sm outline-none transition-all";
  const inputStyle = { background: 'var(--msp-elevated)', border: '1px solid var(--msp-border2)', color: 'var(--msp-text1)' };

  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--msp-void)' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 30%, rgba(108,99,255,0.08) 0%, transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <AnimatePresence mode="wait">
          {/* ── USER SELECT ── */}
          {step === 'user-select' && (
            <motion.div key="user-select"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--msp-accent-dim)', border: '1px solid var(--msp-accent-glow)', boxShadow: '0 20px 60px rgba(108,99,255,0.2)' }}>
                  <Lock size={38} style={{ color: 'var(--msp-accent)' }} />
                </div>
                <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--msp-text1)' }}>Choisir un compte</h1>
                <p className="text-sm text-center" style={{ color: 'var(--msp-text2)' }}>
                  Sélectionnez votre profil pour déverrouiller le coffre
                </p>
              </div>
              <div className="rounded-2xl overflow-hidden"
                style={{ background: 'var(--msp-surface)', border: '1px solid var(--msp-border)' }}>
                {users.map((user, i) => (
                  <button
                    key={user.username}
                    onClick={() => { selectUser(user.username); setStep('unlock'); }}
                    className="w-full flex items-center gap-4 px-5 py-4 transition-all text-left"
                    style={{ borderBottom: i < users.length - 1 ? '1px solid var(--msp-border)' : 'none' }}
                  >
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0"
                      style={{ background: 'var(--msp-accent)', color: 'white' }}>
                      {user.profileName[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold" style={{ color: 'var(--msp-text1)' }}>{user.profileName}</div>
                      <div className="text-xs" style={{ color: 'var(--msp-text3)' }}>@{user.username}</div>
                    </div>
                    <ChevronRight size={16} style={{ color: 'var(--msp-text3)' }} />
                  </button>
                ))}
                <button
                  onClick={() => setStep('setup')}
                  className="w-full flex items-center gap-4 px-5 py-4 transition-all text-left"
                  style={{ borderTop: '1px solid var(--msp-border)' }}
                >
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--msp-elevated)', border: '1px solid var(--msp-border2)' }}>
                    <UserPlus size={18} style={{ color: 'var(--msp-text2)' }} />
                  </div>
                  <div className="text-sm font-medium" style={{ color: 'var(--msp-text2)' }}>Nouveau profil</div>
                  <ChevronRight size={16} className="ml-auto" style={{ color: 'var(--msp-text3)' }} />
                </button>
              </div>
              <button onClick={() => navigate('/')}
                className="mt-4 w-full text-center text-xs transition-colors"
                style={{ color: 'var(--msp-text3)' }}>
                ← Retour à l'accueil
              </button>
            </motion.div>
          )}

          {/* ── SETUP ── */}
          {step === 'setup' && (
            <motion.div key="setup"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--msp-accent-dim)', border: '1px solid var(--msp-accent-glow)', boxShadow: '0 20px 60px rgba(108,99,255,0.2)' }}>
                  <ShieldCheck size={38} style={{ color: 'var(--msp-accent)' }} />
                </div>
                <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--msp-text1)' }}>Initialiser MySafePass</h1>
                <p className="text-sm text-center max-w-xs" style={{ color: 'var(--msp-text2)' }}>
                  Créez votre mot de passe maître. Le coffre sera chiffré localement (AES-256-GCM + PBKDF2).
                </p>
              </div>
              <div className="rounded-2xl p-8"
                style={{ background: 'var(--msp-surface)', border: '1px solid var(--msp-border)' }}>
                <form onSubmit={handleSetup} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--msp-text2)' }}>
                      Nom du profil
                    </label>
                    <input
                      value={setupName}
                      onChange={e => setSetupName(e.target.value)}
                      placeholder="Ex. Roland"
                      className={inputClass}
                      style={inputStyle}
                      autoFocus
                    />
                    {setupName && (
                      <p className="mt-1 text-xs" style={{ color: 'var(--msp-text3)' }}>
                        Identifiant: @{normalizeUsername(setupName)}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--msp-text2)' }}>
                      Mot de passe maître
                    </label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••••••••••"
                        className={`${inputClass} pr-11`}
                        style={inputStyle}
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--msp-text3)' }}>
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <div className="mt-2"><StrengthBar password={password} /></div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--msp-text2)' }}>
                      Confirmer le mot de passe
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••••••"
                      className={inputClass}
                      style={{
                        ...inputStyle,
                        border: `1px solid ${confirmPassword && confirmPassword !== password ? 'rgba(248,113,113,0.4)' : 'var(--msp-border2)'}`,
                      }}
                    />
                    {confirmPassword && confirmPassword !== password && (
                      <p className="text-xs mt-1" style={{ color: 'var(--msp-red)' }}>Les mots de passe ne correspondent pas.</p>
                    )}
                  </div>
                  <div className="px-3 py-2.5 rounded-xl text-xs"
                    style={{ background: 'var(--msp-blue-dim)', color: 'var(--msp-blue)' }}>
                    Recommandation NIST: minimum 12 caractères avec majuscule, chiffre et symbole.
                  </div>
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    type="submit" disabled={loading}
                    className="w-full py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
                    style={{ background: 'var(--msp-accent)', boxShadow: '0 4px 20px rgba(108,99,255,0.3)' }}>
                    {loading ? 'Chiffrement en cours…' : 'Créer le coffre chiffré'}
                  </motion.button>
                </form>
              </div>
              {users.length > 0 && (
                <button onClick={() => setStep('user-select')}
                  className="mt-3 w-full text-center text-xs flex items-center justify-center gap-1 transition-colors"
                  style={{ color: 'var(--msp-text3)' }}>
                  <ArrowLeft size={12} /> Retour aux comptes existants
                </button>
              )}
              <button onClick={() => navigate('/')}
                className="mt-2 w-full text-center text-xs transition-colors"
                style={{ color: 'var(--msp-text3)' }}>
                ← Retour à l'accueil
              </button>
            </motion.div>
          )}

          {/* ── UNLOCK ── */}
          {step === 'unlock' && (
            <motion.div key="unlock"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--msp-accent-dim)', border: '1px solid var(--msp-accent-glow)', boxShadow: '0 20px 60px rgba(108,99,255,0.2)' }}>
                  <Lock size={38} style={{ color: 'var(--msp-accent)' }} />
                </div>
                <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--msp-text1)' }}>
                  {`Déverrouiller ${profileName || 'le coffre'}`}
                </h1>
                <p className="text-sm text-center" style={{ color: 'var(--msp-text2)' }}>
                  Entrez votre mot de passe maître pour accéder au coffre.
                </p>
              </div>
              <div className="rounded-2xl p-8"
                style={{ background: 'var(--msp-surface)', border: '1px solid var(--msp-border)' }}>
                {(lockStatusMessage || lockMessage) && (
                  <div className="mb-5 px-4 py-3 rounded-xl flex items-start gap-2 text-sm"
                    style={{ background: 'var(--msp-yellow-dim)', color: 'var(--msp-yellow)' }}>
                    <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
                    <span>{lockStatusMessage || lockMessage}</span>
                  </div>
                )}
                <form onSubmit={handleUnlock} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--msp-text2)' }}>
                      Mot de passe maître
                    </label>
                    <div className="relative">
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••••••••••"
                        autoFocus={!locked}
                        className={`${inputClass} pr-11`}
                        style={inputStyle}
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2"
                        style={{ color: 'var(--msp-text3)' }}>
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  {requiresCaptcha && (
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--msp-text2)' }}>
                        CAPTCHA: {captcha.label} = ?
                      </label>
                      <input
                        value={captchaValue}
                        onChange={e => setCaptchaValue(e.target.value)}
                        placeholder="Résultat"
                        className={inputClass}
                        style={inputStyle}
                      />
                    </div>
                  )}
                  {authRecord && !locked && (
                    <p className="text-xs" style={{ color: remaining <= 2 ? 'var(--msp-yellow)' : 'var(--msp-text3)' }}>
                      {getSupportingSecurityCopy(authRecord)}
                    </p>
                  )}
                  <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                    type="submit" disabled={loading || !!locked}
                    className="w-full py-3.5 rounded-xl font-semibold text-white transition-all disabled:opacity-50"
                    style={{ background: 'var(--msp-accent)', boxShadow: '0 4px 20px rgba(108,99,255,0.3)' }}>
                    {loading ? 'Vérification…' : 'Déverrouiller le coffre'}
                  </motion.button>
                </form>
              </div>
              <div className="mt-4 flex items-center justify-between px-1">
                {users.length > 1 && (
                  <button onClick={() => { selectUser(''); setStep('user-select'); }}
                    className="flex items-center gap-1 text-xs transition-colors"
                    style={{ color: 'var(--msp-text3)' }}>
                    <ArrowLeft size={12} /> Changer de compte
                  </button>
                )}
                <button onClick={() => navigate('/')}
                  className="ml-auto text-xs transition-colors"
                  style={{ color: 'var(--msp-text3)' }}>
                  ← Retour à l'accueil
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-4 text-center text-xs" style={{ color: 'var(--msp-text3)' }}>
          Chiffrement AES-256-GCM · Dérivation PBKDF2 · 100% local
        </p>
      </motion.div>
    </div>
  );
}
