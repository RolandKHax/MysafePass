import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Eye, EyeOff, Check, ArrowLeft, UserPlus, ShieldCheck, LogIn, User, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useVault } from '../context/VaultContext';
import { apiClient } from '../lib/api';
import { PolicyModal } from './PolicyModal';
import { normalizeUsername } from '../lib/vault';

interface AuthModalProps {
  isOpen: boolean;
  mode: 'login' | 'signup';
  onClose: () => void;
  accentColor: string;
}

function getPasswordStrength(password: string) {
  const checks = [/[a-z]/.test(password), /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)];
  const fulfilledChecks = checks.filter(Boolean).length;
  if (password.length === 0) return { level: 0, label: '', color: 'transparent' };
  if (password.length < 12) return { level: 1, label: 'Trop court', color: 'var(--msp-red)' };
  if (fulfilledChecks <= 2) return { level: 2, label: 'Moyen', color: 'var(--msp-yellow)' };
  if (password.length < 16) return { level: 3, label: 'Fort', color: '#a3e635' };
  return { level: 4, label: 'Très fort', color: 'var(--msp-green)' };
}

type ModalStep = 'login' | 'signup';

export function AuthModal({ isOpen, mode, onClose }: AuthModalProps) {
  const navigate = useNavigate();
  const { users, selectUser, setupVault, unlockVault } = useVault();

  const [step, setStep] = useState<ModalStep>(mode);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsSubmitting(false);
    setFormData({ username: '', email: '', password: '', confirmPassword: '' });
    setAgreedToTerms(false);
    setStep(mode);
  }, [isOpen, mode]);

  const passwordStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.confirmPassword.length > 0;
  const isMasterPasswordValid =
    formData.password.length >= 12 &&
    /[a-z]/.test(formData.password) &&
    /[A-Z]/.test(formData.password) &&
    /\d/.test(formData.password) &&
    /[^A-Za-z0-9]/.test(formData.password);

  const pickProfile = (username: string) => {
    setFormData(f => ({ ...f, username }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const cleanUsername = normalizeUsername(formData.username.trim());
      if (!cleanUsername) {
        toast.error("Saisissez votre nom d'utilisateur.");
        return;
      }
      if (!formData.password) {
        toast.error('Saisissez votre mot de passe maître.');
        return;
      }
      const knownUser = users.find(u => u.username === cleanUsername);
      if (!knownUser) {
        toast.error("Aucun coffre local pour ce nom d'utilisateur. Inscrivez-vous d'abord.");
        return;
      }
      selectUser(cleanUsername);
      const result = await unlockVault(formData.password, cleanUsername);
      if (!result.ok) {
        toast.error(result.error || 'Connexion impossible.');
        return;
      }
      toast.success('Coffre déverrouillé.');
      onClose();
      navigate('/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!formData.username.trim()) { toast.error('Choisissez un nom d\'utilisateur pour créer le compte.'); return; }
      if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        toast.error('Adresse email invalide.'); return;
      }
      if (!isMasterPasswordValid) {
        toast.error('Le mot de passe maître doit faire au moins 12 caractères avec majuscule, chiffre et symbole.');
        return;
      }
      if (!passwordsMatch) { toast.error('La confirmation du mot de passe ne correspond pas.'); return; }
      if (!agreedToTerms) { toast.error("Acceptez les conditions d'utilisation pour continuer."); return; }

      const username = normalizeUsername(formData.username.trim());
      if (users.find(u => u.username === username)) {
        toast.error('Ce nom d\'utilisateur est déjà pris. Choisissez-en un autre.');
        return;
      }

      try {
        const backendResponse = await apiClient.register({
          username: formData.username.trim(),
          email: formData.email.trim() || undefined,
          password: formData.password,
        });
        if (!backendResponse.success) console.warn('Backend registration warning:', backendResponse.error);
      } catch (err) {
        console.warn('Backend registration unavailable, proceeding locally:', err);
      }

      await setupVault(username, formData.username.trim(), formData.password);
      toast.success('Compte créé et coffre initialisé !');
      onClose();
      navigate('/dashboard');
    } catch (error) {
      console.error('Auth error:', error);
      toast.error('Erreur. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass = "w-full rounded-xl px-4 py-3 text-sm outline-none transition-all";
  const inputStyle = {
    background: 'var(--msp-elevated)',
    border: '1px solid var(--msp-border2)',
    color: 'var(--msp-text1)',
  };

  // Distinct visual headers per mode
  const isLogin = step === 'login';
  const headerGradient = isLogin
    ? 'linear-gradient(135deg, #1e3a8a 0%, #6C63FF 100%)'
    : 'linear-gradient(135deg, #6C63FF 0%, #7B2FBE 100%)';
  const accentBtn = isLogin
    ? 'linear-gradient(135deg, #4338ca 0%, #6C63FF 100%)'
    : 'linear-gradient(135deg, #6C63FF 0%, #7B2FBE 100%)';

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div key="auth-backdrop"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50" onClick={onClose}>
              <div className="absolute inset-0 backdrop-blur-sm" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} />
            </motion.div>

            <motion.div key="auth-modal"
              initial={{ opacity: 0, scale: 0.96, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 16 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div
                className="relative w-full max-w-md max-h-[92vh] rounded-2xl overflow-hidden flex flex-col"
                style={{ background: 'var(--msp-surface)', border: '1px solid var(--msp-border)' }}
                onClick={e => e.stopPropagation()}
              >
                {/* Header — distinct between login & signup */}
                <div className="flex-shrink-0 relative px-6 pt-6 pb-5"
                  style={{ background: headerGradient, borderBottom: '1px solid var(--msp-border)' }}>
                  <button onClick={onClose}
                    className="absolute right-5 top-5 w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-white/80 hover:text-white"
                    style={{ background: 'rgba(0,0,0,0.25)' }}>
                    <X size={16} />
                  </button>
                  <div className="flex flex-col items-center">
                    <div className="mb-3 w-14 h-14 flex items-center justify-center rounded-2xl"
                      style={{ background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.25)' }}>
                      {isLogin
                        ? <LogIn size={26} color="white" />
                        : <ShieldCheck size={26} color="white" />}
                    </div>
                    <h2 className="text-lg font-bold text-white">
                      {isLogin ? 'Connexion à votre coffre' : 'Créer un compte MySafePass'}
                    </h2>
                    <p className="text-xs mt-0.5 text-white/70">
                      {isLogin
                        ? 'Identifiez-vous pour déverrouiller votre coffre chiffré'
                        : 'Coffre chiffré AES-256-GCM · Zéro-connaissance · 100% local'}
                    </p>
                  </div>

                  {/* Tab switcher */}
                  <div className="mt-5 flex gap-1 p-1 rounded-xl"
                    style={{ background: 'rgba(0,0,0,0.3)' }}>
                    <button type="button" onClick={() => setStep('login')}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                      style={{
                        background: isLogin ? 'rgba(255,255,255,0.15)' : 'transparent',
                        color: isLogin ? 'white' : 'rgba(255,255,255,0.55)',
                      }}>
                      <LogIn size={13} /> Se connecter
                    </button>
                    <button type="button" onClick={() => setStep('signup')}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                      style={{
                        background: !isLogin ? 'rgba(255,255,255,0.15)' : 'transparent',
                        color: !isLogin ? 'white' : 'rgba(255,255,255,0.55)',
                      }}>
                      <UserPlus size={13} /> Inscription
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                  <AnimatePresence mode="wait">

                    {/* LOGIN — Real distinct form: username + master password */}
                    {isLogin && (
                      <motion.div key="login"
                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                        className="p-5">

                        {/* Quick-pick chips for saved local profiles */}
                        {users.length > 0 && (
                          <div className="mb-4">
                            <p className="text-xs mb-2" style={{ color: 'var(--msp-text3)' }}>Profils enregistrés sur cet appareil :</p>
                            <div className="flex flex-wrap gap-2">
                              {users.map(u => (
                                <button key={u.username} type="button"
                                  onClick={() => pickProfile(u.username)}
                                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                                  style={{
                                    background: formData.username === u.username ? 'var(--msp-accent-dim)' : 'var(--msp-elevated)',
                                    border: `1px solid ${formData.username === u.username ? 'var(--msp-accent-glow)' : 'var(--msp-border)'}`,
                                    color: formData.username === u.username ? 'var(--msp-accent2)' : 'var(--msp-text2)',
                                  }}>
                                  <div className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold"
                                    style={{ background: 'var(--msp-accent)', color: 'white' }}>
                                    {u.profileName[0].toUpperCase()}
                                  </div>
                                  @{u.username}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <form className="space-y-4" onSubmit={handleLogin} id="auth-form-login">
                          <div>
                            <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--msp-text2)' }}>
                              Nom d'utilisateur
                            </label>
                            <div className="relative">
                              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                                style={{ color: 'var(--msp-text3)' }} />
                              <input type="text" placeholder="ton_username" autoComplete="username"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                autoFocus
                                className={`${inputClass} pl-10`} style={inputStyle} />
                            </div>
                          </div>
                          <div>
                            <label className="mb-1.5 block text-xs font-medium" style={{ color: 'var(--msp-text2)' }}>
                              Mot de passe maître
                            </label>
                            <div className="relative">
                              <KeyRound size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
                                style={{ color: 'var(--msp-text3)' }} />
                              <input type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••••••" autoComplete="current-password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className={`${inputClass} pl-10 pr-11`} style={inputStyle} />
                              <button type="button" onClick={() => setShowPassword(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                                style={{ color: 'var(--msp-text3)' }}>
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>
                          <button type="submit" disabled={isSubmitting}
                            className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                            style={{ background: accentBtn, boxShadow: '0 4px 20px rgba(67,56,202,0.35)' }}>
                            <LogIn size={16} />
                            {isSubmitting ? 'Vérification…' : 'Déverrouiller mon coffre'}
                          </button>
                        </form>

                        <p className="mt-4 text-center text-xs" style={{ color: 'var(--msp-text3)' }}>
                          Pas encore de coffre ?{' '}
                          <button type="button" onClick={() => setStep('signup')}
                            className="font-semibold underline" style={{ color: 'var(--msp-accent2)' }}>
                            Créer un compte
                          </button>
                        </p>
                      </motion.div>
                    )}

                    {/* SIGNUP */}
                    {!isLogin && (
                      <motion.div key="signup"
                        initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
                        className="p-5">
                        <form className="space-y-3" onSubmit={handleSignup} id="auth-form-signup">
                          <div>
                            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--msp-text2)' }}>Nom d'utilisateur</label>
                            <input type="text" placeholder="ton_username"
                              value={formData.username}
                              onChange={e => setFormData({ ...formData, username: e.target.value })}
                              className={inputClass} style={inputStyle} />
                            {formData.username && (
                              <p className="mt-1 text-xs" style={{ color: 'var(--msp-text3)' }}>
                                Identifiant: @{normalizeUsername(formData.username)}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--msp-text2)' }}>
                              Email <span style={{ color: 'var(--msp-text3)', fontWeight: 400 }}>(facultatif — RGPD minimisation)</span>
                            </label>
                            <input type="email" placeholder="ton@email.com (optionnel)"
                              value={formData.email}
                              onChange={e => setFormData({ ...formData, email: e.target.value })}
                              className={inputClass} style={inputStyle} />
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--msp-text2)' }}>Mot de passe maître</label>
                            <div className="relative">
                              <input type={showPassword ? 'text' : 'password'} placeholder="••••••••••••"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className={`${inputClass} pr-11`} style={inputStyle} />
                              <button type="button" onClick={() => setShowPassword(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--msp-text3)' }}>
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                            {formData.password.length > 0 && (
                              <div className="mt-1.5">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs" style={{ color: 'var(--msp-text3)' }}>Robustesse</span>
                                  <span className="text-xs font-medium" style={{ color: passwordStrength.color }}>{passwordStrength.label}</span>
                                </div>
                                <div className="h-1 overflow-hidden rounded-full" style={{ background: 'var(--msp-elevated)' }}>
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(passwordStrength.level / 4) * 100}%` }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: passwordStrength.color }} />
                                </div>
                              </div>
                            )}
                          </div>
                          <div>
                            <label className="mb-1 block text-xs font-medium" style={{ color: 'var(--msp-text2)' }}>Confirmer le mot de passe</label>
                            <div className="relative">
                              <input type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••••••"
                                value={formData.confirmPassword}
                                onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                                className={`${inputClass} pr-20`} style={inputStyle} />
                              <button type="button" onClick={() => setShowConfirmPassword(v => !v)}
                                className="absolute right-10 top-1/2 -translate-y-1/2" style={{ color: 'var(--msp-text3)' }}>
                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                              {formData.confirmPassword.length > 0 && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  {passwordsMatch
                                    ? <Check size={16} style={{ color: 'var(--msp-green)' }} />
                                    : <X size={16} style={{ color: 'var(--msp-red)' }} />}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-start gap-2 pt-1">
                            <input type="checkbox" id="terms" checked={agreedToTerms}
                              onChange={e => setAgreedToTerms(e.target.checked)}
                              className="mt-1 h-3.5 w-3.5 rounded flex-shrink-0" />
                            <label htmlFor="terms" className="text-xs leading-relaxed" style={{ color: 'var(--msp-text3)' }}>
                              J'accepte la{' '}
                              <button type="button" onClick={() => setShowPrivacyModal(true)}
                                className="underline" style={{ color: 'var(--msp-text2)' }}>
                                politique de confidentialité
                              </button>{' '}et les{' '}
                              <button type="button" onClick={() => setShowTermsModal(true)}
                                className="underline" style={{ color: 'var(--msp-text2)' }}>
                                conditions d'utilisation
                              </button>
                            </label>
                          </div>
                          <button type="submit" disabled={isSubmitting}
                            className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                            style={{ background: accentBtn, boxShadow: '0 4px 20px rgba(108,99,255,0.3)' }}>
                            <UserPlus size={16} />
                            {isSubmitting ? 'Création…' : 'Créer mon compte'}
                          </button>
                        </form>
                        {users.length > 0 && (
                          <button type="button" onClick={() => setStep('login')}
                            className="mt-3 flex items-center gap-1.5 text-xs transition-colors mx-auto"
                            style={{ color: 'var(--msp-text3)' }}>
                            <ArrowLeft size={12} /> Déjà un compte ? Se connecter
                          </button>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <PolicyModal isOpen={showPrivacyModal} onClose={() => setShowPrivacyModal(false)} type="privacy" />
      <PolicyModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} type="terms" />
    </>
  );
}
