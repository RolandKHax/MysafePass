import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  Wand2,
  MessageSquare,
  Lock,
  LogOut,
  Download,
  Shield,
  ChevronRight,
  Eye,
  EyeOff,
  Sparkles,
  UserCircle2,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { useVault } from '../context/VaultContext';
import { getCaptchaRequired, getRemainingAttempts } from '../context/VaultContext';

function generateCaptcha() {
  const a = Math.floor(Math.random() * 8) + 2;
  const b = Math.floor(Math.random() * 8) + 1;
  return { label: `${a} + ${b}`, answer: String(a + b) };
}

function LockScreen() {
  const { authRecord, profileName, users, selectUser, unlockVault, lockMessage } = useVault();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [captcha] = useState(generateCaptcha);
  const [captchaVal, setCaptchaVal] = useState('');
  const requiresCaptcha = getCaptchaRequired(authRecord);
  const remaining = getRemainingAttempts(authRecord);
  const locked = authRecord?.lockUntil && authRecord.lockUntil > Date.now();

  const userNotSelected = !authRecord && users.length > 0;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    if (requiresCaptcha && captchaVal.trim() !== captcha.answer) {
      toast.error('CAPTCHA incorrect.');
      return;
    }
    setLoading(true);
    const result = await unlockVault(password);
    setLoading(false);
    if (!result.ok) {
      toast.error(result.error || 'Mot de passe incorrect.');
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'var(--msp-void)' }}>
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 40%, rgba(108,99,255,0.08) 0%, transparent 70%)' }} />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm mx-4"
      >
        <AnimatePresence mode="wait">
          {userNotSelected ? (
            <motion.div key="user-select"
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
              <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--msp-accent-dim)', border: '1px solid var(--msp-accent-glow)', boxShadow: '0 20px 60px rgba(108,99,255,0.15)' }}>
                  <UserCircle2 size={36} style={{ color: 'var(--msp-accent)' }} />
                </div>
                <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--msp-text1)' }}>Choisir un compte</h1>
                <p className="text-sm text-center" style={{ color: 'var(--msp-text2)' }}>
                  Sélectionnez votre profil pour continuer
                </p>
              </div>
              <div className="rounded-2xl p-4 space-y-2"
                style={{ background: 'var(--msp-surface)', border: '1px solid var(--msp-border)' }}>
                {users.map(user => (
                  <button
                    key={user.username}
                    onClick={() => selectUser(user.username)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
                    style={{ background: 'var(--msp-elevated)', border: '1px solid var(--msp-border)' }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold flex-shrink-0"
                      style={{ background: 'var(--msp-accent)', color: 'white' }}>
                      {user.profileName[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: 'var(--msp-text1)' }}>{user.profileName}</div>
                      <div className="text-xs" style={{ color: 'var(--msp-text3)' }}>@{user.username}</div>
                    </div>
                    <ChevronRight size={15} className="ml-auto" style={{ color: 'var(--msp-text3)' }} />
                  </button>
                ))}
              </div>
              <button onClick={() => navigate('/')}
                className="mt-4 w-full text-center text-xs transition-colors"
                style={{ color: 'var(--msp-text3)' }}>
                ← Retour à l'accueil
              </button>
            </motion.div>
          ) : (
            <motion.div key="password-form"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
              <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-4"
                  style={{ background: 'var(--msp-accent-dim)', border: '1px solid var(--msp-accent-glow)', boxShadow: '0 20px 60px rgba(108,99,255,0.15)' }}>
                  <Lock size={36} style={{ color: 'var(--msp-accent)' }} />
                </div>
                <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--msp-text1)' }}>
                  Coffre verrouillé
                </h1>
                <p className="text-sm text-center" style={{ color: 'var(--msp-text2)' }}>
                  {profileName ? `Bonjour ${profileName}` : 'Entrez votre mot de passe maître'}
                </p>
              </div>

              <div className="rounded-2xl p-6" style={{ background: 'var(--msp-surface)', border: '1px solid var(--msp-border)' }}>
                {(lockMessage || locked) && (
                  <div className="mb-4 px-3 py-2 rounded-lg text-sm"
                    style={{ background: 'var(--msp-yellow-dim)', color: 'var(--msp-yellow)' }}>
                    {lockMessage || 'Coffre temporairement verrouillé.'}
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
                        placeholder="••••••••••••"
                        autoFocus
                        className="w-full px-4 py-3 rounded-xl text-sm pr-11 outline-none transition-all"
                        style={{ background: 'var(--msp-elevated)', border: '1px solid var(--msp-border2)', color: 'var(--msp-text1)' }}
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--msp-text3)' }}>
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  {requiresCaptcha && (
                    <div>
                      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--msp-text2)' }}>
                        CAPTCHA: {captcha.label} = ?
                      </label>
                      <input type="text" value={captchaVal} onChange={e => setCaptchaVal(e.target.value)}
                        placeholder="Résultat"
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                        style={{ background: 'var(--msp-elevated)', border: '1px solid var(--msp-border2)', color: 'var(--msp-text1)' }} />
                    </div>
                  )}
                  {!locked && remaining < 3 && (
                    <p className="text-xs" style={{ color: 'var(--msp-yellow)' }}>
                      {remaining} tentative(s) restante(s) avant blocage.
                    </p>
                  )}
                  <button type="submit" disabled={loading || !password || !!locked}
                    className="w-full py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50"
                    style={{ background: 'var(--msp-accent)', boxShadow: '0 4px 20px rgba(108,99,255,0.3)' }}>
                    {loading ? 'Vérification…' : 'Déverrouiller'}
                  </button>
                </form>
              </div>

              <div className="mt-4 flex items-center justify-between">
                {users.length > 1 && (
                  <button onClick={() => selectUser('')}
                    className="flex items-center gap-1 text-xs transition-colors"
                    style={{ color: 'var(--msp-text3)' }}>
                    <ArrowLeft size={12} /> Changer de compte
                  </button>
                )}
                <button onClick={() => navigate('/')}
                  className="ml-auto text-xs transition-colors"
                  style={{ color: 'var(--msp-text3)' }}>
                  Retour à l'accueil
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

const NAV = [
  { path: '/dashboard', label: 'Coffre', icon: LayoutDashboard },
  { path: '/generate', label: 'Générer', icon: Wand2 },
  { path: '/assistant', label: 'Assistant', icon: MessageSquare },
  { path: '/suggestions', label: 'Suggestions', icon: Sparkles },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { status, profileName, exportEncryptedBackup, lockVault, sessionExpiresAt, sessionWarning } = useVault();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (status === 'new') navigate('/auth');
  }, [status, navigate]);

  useEffect(() => {
    if (!sessionExpiresAt || status !== 'unlocked') return;
    const interval = setInterval(() => {
      const ms = Math.max(0, sessionExpiresAt - Date.now());
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setTimeLeft(`${m}:${s.toString().padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionExpiresAt, status]);

  const handleExport = () => {
    const backup = exportEncryptedBackup();
    navigator.clipboard.writeText(backup);
    toast.success('Backup chiffré copié.');
  };

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--msp-void)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--msp-accent)', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <div className="flex h-screen" style={{ background: 'var(--msp-void)' }}>
      <AnimatePresence>
        {status === 'locked' && <LockScreen />}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="flex flex-col flex-shrink-0 h-full"
        style={{ width: 'var(--msp-sidebar-w)', background: 'var(--msp-surface)', borderRight: '1px solid var(--msp-border)' }}>
        <div className="flex items-center gap-3 px-5 py-5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--msp-accent)' }}>
            <Shield size={18} color="white" />
          </div>
          <div>
            <div className="text-sm font-bold leading-tight" style={{ color: 'var(--msp-text1)' }}>MySafePass</div>
            <div className="text-xs leading-tight" style={{ color: 'var(--msp-text3)' }}>Coffre sécurisé</div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-2 space-y-0.5">
          {NAV.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <button key={path} onClick={() => navigate(path)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{
                  background: active ? 'var(--msp-accent-dim)' : 'transparent',
                  color: active ? 'var(--msp-accent2)' : 'var(--msp-text2)',
                  border: active ? '1px solid var(--msp-accent-glow)' : '1px solid transparent',
                }}>
                <Icon size={17} />
                {label}
                {active && <ChevronRight size={14} className="ml-auto" />}
              </button>
            );
          })}
        </nav>

        {sessionWarning && (
          <div className="mx-3 mb-2 px-3 py-2 rounded-xl text-xs text-center"
            style={{ background: 'var(--msp-yellow-dim)', color: 'var(--msp-yellow)' }}>
            Session expire dans {timeLeft}
          </div>
        )}

        <div className="px-3 py-3 space-y-1" style={{ borderTop: '1px solid var(--msp-border)' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-1"
            style={{ background: 'var(--msp-elevated)' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: 'var(--msp-accent)', color: 'white' }}>
              {profileName ? profileName[0].toUpperCase() : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate" style={{ color: 'var(--msp-text1)' }}>{profileName || 'Profil'}</div>
              <div className="text-xs" style={{ color: 'var(--msp-text3)' }}>{timeLeft ? `Expire: ${timeLeft}` : 'Actif'}</div>
            </div>
          </div>
          <button onClick={handleExport}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-colors"
            style={{ color: 'var(--msp-text3)' }}>
            <Download size={15} /> Export chiffré
          </button>
          <button onClick={() => lockVault('Coffre verrouillé manuellement.')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-colors"
            style={{ color: 'var(--msp-red)' }}>
            <LogOut size={15} /> Verrouiller
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto" style={{ background: 'var(--msp-base)' }}>
        <Outlet />
      </main>
    </div>
  );
}
