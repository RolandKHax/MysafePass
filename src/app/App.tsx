import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router';
import { AuthModal } from './components/AuthModal';
import { useVault } from './context/VaultContext';

const themes = {
  indigo: '#6C63FF',
  blue: '#0066CC',
  purple: '#7B2FBE',
  green: '#00A86B',
};

const placeholderTexts = [
  'Générez un mot de passe fort...',
  'Gérez vos comptes en sécurité...',
  'Posez une question à votre vault...',
];

type AuthMode = 'login' | 'signup';

export default function App() {
  const navigate = useNavigate();
  const { status, authRecord } = useVault();
  const [currentTheme, setCurrentTheme] = useState<keyof typeof themes>('indigo');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('signup');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const featureChips = ['Génération', 'Gestion', 'Conversation'];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const accentColor = themes[currentTheme];

  const openAuth = (mode: AuthMode) => {
    if (status === 'unlocked') {
      navigate('/dashboard');
      return;
    }
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  return (
    <div
      className="h-[100dvh] overflow-hidden"
      style={{ backgroundColor: '#0D0D0D', fontFamily: 'Inter, sans-serif' }}
    >
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ backgroundColor: accentColor }}
          >
            <svg width="24" height="24" viewBox="0 0 48 48" fill="none">
              <path
                d="M24 4L40 14V26C40 35 34 42 24 44C14 42 8 35 8 26V14L24 4Z"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
              <path
                d="M24 14V24M24 24V34M24 24H34M24 24H14"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
              />
            </svg>
          </motion.div>
          <span className="text-xl font-bold text-white">MySafePass</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            {(Object.keys(themes) as Array<keyof typeof themes>).map((theme) => (
              <motion.button
                key={theme}
                onClick={() => setCurrentTheme(theme)}
                className="relative h-6 w-6 rounded-full transition-all"
                style={{ backgroundColor: themes[theme] }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                {currentTheme === theme && (
                  <motion.div
                    layoutId="theme-ring"
                    className="absolute inset-0 rounded-full"
                    style={{
                      border: `2px solid ${themes[theme]}`,
                      outline: '2px solid rgba(255, 255, 255, 0.3)',
                      outlineOffset: '2px',
                    }}
                  />
                )}
              </motion.button>
            ))}
          </div>

          <button
            onClick={() => openAuth('login')}
            className="text-sm font-medium text-gray-300 transition-colors hover:text-white"
          >
            {status === 'unlocked' ? 'Ouvrir le coffre' : 'Se connecter'}
          </button>
          <motion.button
            onClick={() => openAuth('signup')}
            className="rounded-full px-6 py-2.5 text-sm font-medium text-white"
            style={{ backgroundColor: accentColor }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {status === 'unlocked' ? 'Accéder au dashboard' : 'Inscription gratuite'}
          </motion.button>
        </div>
      </nav>

      <div className="flex h-[calc(100dvh-72px)] flex-col items-center justify-center px-6 pb-8 pt-2">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-4 text-center text-5xl font-bold leading-tight md:text-6xl"
        >
          <span className="text-white">MySafePass protège</span>
          <br />
          <span style={{ color: accentColor }}>vos mots de passe.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mx-auto mb-8 max-w-2xl text-center text-base text-gray-400 md:text-lg"
        >
          Générez, gérez et discutez avec votre coffre-fort intelligent.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-3xl"
        >
          <div className="relative">
            <div
              className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 transition-all duration-300"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <motion.input
                key={placeholderIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                type="text"
                placeholder={placeholderTexts[placeholderIndex]}
                className="flex-1 bg-transparent text-base text-white placeholder-gray-500 focus:outline-none md:text-lg"
                onFocus={() => openAuth(authRecord ? 'login' : 'signup')}
                readOnly
              />
              <motion.button
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: accentColor }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => openAuth(authRecord ? 'login' : 'signup')}
              >
                <ArrowRight className="h-5 w-5 text-white" />
              </motion.button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-5 flex flex-wrap items-center justify-center gap-3"
          >
            {featureChips.map((chip, index) => (
              <motion.div
                key={chip}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + index * 0.1 }}
                className="rounded-full px-4 py-2 text-sm font-medium text-gray-300"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
                whileHover={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderColor: accentColor,
                }}
              >
                {chip}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      <AuthModal
        isOpen={isAuthModalOpen}
        mode={authMode}
        onClose={() => setIsAuthModalOpen(false)}
        accentColor={accentColor}
      />
    </div>
  );
}
