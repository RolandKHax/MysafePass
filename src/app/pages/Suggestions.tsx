import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, AlertTriangle, RefreshCw, Globe, TrendingUp, CheckCircle,
  ChevronRight, ArrowRight, Wand2, MessageSquare, Key, Lock
} from 'lucide-react';
import { useVault } from '../context/VaultContext';

type Tab = 'all' | 'weak' | 'reused' | 'suspicious';

export default function Suggestions() {
  const navigate = useNavigate();
  const { securitySummary, entries } = useVault();
  const [tab, setTab] = useState<Tab>('all');

  const overallScore = useMemo(() => {
    if (entries.length === 0) return 100;
    const avg = entries.reduce((s, e) => s + e.passwordScore, 0) / entries.length;
    const penalty = (securitySummary.weakEntries.length * 8)
      + (securitySummary.reusedPasswords * 5)
      + (securitySummary.suspiciousEntries.length * 4);
    return Math.max(0, Math.min(100, Math.round(avg - penalty)));
  }, [entries, securitySummary]);

  const scoreColor = overallScore >= 80 ? 'var(--msp-green)' : overallScore >= 60 ? 'var(--msp-yellow)' : 'var(--msp-red)';
  const scoreLabel = overallScore >= 80 ? 'Excellent' : overallScore >= 60 ? 'Correct' : overallScore >= 35 ? 'À améliorer' : 'Critique';

  const TABS = [
    { id: 'all', label: 'Tout', count: securitySummary.weakEntries.length + securitySummary.reusedPasswords + securitySummary.suspiciousEntries.length },
    { id: 'weak', label: 'Faibles', count: securitySummary.weakEntries.length },
    { id: 'reused', label: 'Réutilisés', count: securitySummary.reusedPasswords },
    { id: 'suspicious', label: 'Suspects', count: securitySummary.suspiciousEntries.length },
  ] as const;

  const suggestions: { id: string; type: Tab; icon: any; color: string; bg: string; title: string; detail: string; action: string; entryId?: string }[] = [];

  securitySummary.weakEntries.forEach(e => {
    suggestions.push({
      id: `weak-${e.id}`,
      type: 'weak',
      icon: AlertTriangle,
      color: 'var(--msp-red)',
      bg: 'var(--msp-red-dim)',
      title: `Mot de passe faible: ${e.service}`,
      detail: `Score ${e.passwordScore}/100 · ${e.crackTimeLabel}. Ce mot de passe est vulnérable aux attaques par force brute.`,
      action: 'Changer le mot de passe',
      entryId: e.id,
    });
  });

  if (securitySummary.reusedPasswords > 0) {
    const reused = entries.reduce((groups: Record<string, string[]>, e) => {
      if (!groups[e.password]) groups[e.password] = [];
      groups[e.password].push(e.service);
      return groups;
    }, {});
    Object.values(reused).filter(g => g.length > 1).forEach((group, i) => {
      suggestions.push({
        id: `reused-${i}`,
        type: 'reused',
        icon: RefreshCw,
        color: 'var(--msp-yellow)',
        bg: 'var(--msp-yellow-dim)',
        title: `Mot de passe réutilisé: ${group.join(', ')}`,
        detail: `Ce mot de passe est partagé entre ${group.length} services. Si un compte est compromis, tous les autres le seront aussi.`,
        action: 'Régénérer pour chaque service',
      });
    });
  }

  securitySummary.suspiciousEntries.forEach(e => {
    e.domainWarnings.forEach(warning => {
      suggestions.push({
        id: `suspicious-${e.id}`,
        type: 'suspicious',
        icon: Globe,
        color: 'var(--msp-yellow)',
        bg: 'var(--msp-yellow-dim)',
        title: `Service suspect: ${e.service}`,
        detail: warning,
        action: 'Vérifier et mettre à jour',
        entryId: e.id,
      });
    });
  });

  const filtered = tab === 'all' ? suggestions : suggestions.filter(s => s.type === tab);

  const bestPractices = [
    { done: entries.length > 0, label: 'Coffre initialisé et chiffré localement' },
    { done: securitySummary.weakEntries.length === 0, label: 'Aucun mot de passe faible détecté' },
    { done: securitySummary.reusedPasswords === 0, label: 'Pas de mots de passe réutilisés' },
    { done: securitySummary.suspiciousEntries.length === 0, label: 'Aucun domaine suspect détecté' },
    { done: entries.every(e => e.entropyBits >= 60), label: 'Entropie minimale de 60 bits sur tous les mots de passe' },
  ];

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--msp-text1)' }}>Audit de sécurité</h1>
          <p className="text-sm" style={{ color: 'var(--msp-text2)' }}>
            Analyse automatique de votre coffre basée sur les recommandations NIST SP 800-63B
          </p>
        </div>

        {/* Score card */}
        <div className="rounded-2xl p-6 mb-6"
          style={{ background: 'var(--msp-surface)', border: '1px solid var(--msp-border)' }}>
          <div className="flex items-center gap-6">
            {/* Circle score */}
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8"
                  stroke="rgba(255,255,255,0.06)" />
                <circle cx="50" cy="50" r="40" fill="none" strokeWidth="8"
                  stroke={scoreColor}
                  strokeDasharray={`${overallScore * 2.51} 251`}
                  strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold" style={{ color: scoreColor }}>{overallScore}</span>
                <span className="text-xs" style={{ color: 'var(--msp-text3)' }}>/100</span>
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xl font-bold" style={{ color: scoreColor }}>{scoreLabel}</span>
              </div>
              <p className="text-sm mb-3" style={{ color: 'var(--msp-text2)' }}>
                {securitySummary.totalEntries} entrée{securitySummary.totalEntries !== 1 ? 's' : ''} analysée{securitySummary.totalEntries !== 1 ? 's' : ''} dans le coffre.
                {suggestions.length > 0
                  ? ` ${suggestions.length} problème${suggestions.length !== 1 ? 's' : ''} détecté${suggestions.length !== 1 ? 's' : ''}.`
                  : ' Excellent état de sécurité !'}
              </p>
              <div className="flex gap-3 flex-wrap">
                {[
                  { label: 'Faibles', value: securitySummary.weakEntries.length, color: 'var(--msp-red)' },
                  { label: 'Réutilisés', value: securitySummary.reusedPasswords, color: 'var(--msp-yellow)' },
                  { label: 'Suspects', value: securitySummary.suspiciousEntries.length, color: 'var(--msp-yellow)' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-sm">
                    <span style={{ color }}>{value}</span>
                    <span style={{ color: 'var(--msp-text3)' }}> {label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Best practices */}
        <div className="rounded-2xl p-5 mb-6"
          style={{ background: 'var(--msp-surface)', border: '1px solid var(--msp-border)' }}>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--msp-text1)' }}>
            <TrendingUp size={15} style={{ color: 'var(--msp-accent)' }} /> Bonnes pratiques
          </h2>
          <div className="space-y-2">
            {bestPractices.map(({ done, label }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: done ? 'var(--msp-green-dim)' : 'var(--msp-red-dim)' }}>
                  {done
                    ? <CheckCircle size={12} style={{ color: 'var(--msp-green)' }} />
                    : <AlertTriangle size={11} style={{ color: 'var(--msp-red)' }} />
                  }
                </div>
                <span className="text-sm" style={{ color: done ? 'var(--msp-text2)' : 'var(--msp-text1)' }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestions tabs */}
        <div className="mb-4 flex gap-2 flex-wrap">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
              style={{
                background: tab === t.id ? 'var(--msp-accent-dim)' : 'var(--msp-surface)',
                border: `1px solid ${tab === t.id ? 'var(--msp-accent-glow)' : 'var(--msp-border)'}`,
                color: tab === t.id ? 'var(--msp-accent2)' : 'var(--msp-text3)',
              }}
            >
              {t.label}
              {t.count > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-xs"
                  style={{ background: tab === t.id ? 'var(--msp-accent)' : 'rgba(255,255,255,0.1)', color: 'white' }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-16 text-center rounded-2xl"
            style={{ background: 'var(--msp-surface)', border: '1px solid var(--msp-border)' }}
          >
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--msp-green-dim)' }}>
              <Shield size={28} style={{ color: 'var(--msp-green)' }} />
            </div>
            <p className="font-semibold mb-1" style={{ color: 'var(--msp-text1)' }}>Aucun problème détecté</p>
            <p className="text-sm" style={{ color: 'var(--msp-text3)' }}>
              {tab === 'all' ? 'Votre coffre est en excellent état !' : `Aucun problème dans cette catégorie.`}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filtered.map((s, i) => {
                const Icon = s.icon;
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ delay: i * 0.04 }}
                    className="rounded-2xl p-5"
                    style={{ background: 'var(--msp-surface)', border: '1px solid var(--msp-border)' }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: s.bg }}>
                        <Icon size={18} style={{ color: s.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--msp-text1)' }}>
                          {s.title}
                        </h3>
                        <p className="text-sm mb-3" style={{ color: 'var(--msp-text2)' }}>{s.detail}</p>
                        {s.entryId ? (
                          <button
                            onClick={() => navigate(`/entry/${s.entryId}`)}
                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-all"
                            style={{ background: 'var(--msp-accent-dim)', color: 'var(--msp-accent2)', border: '1px solid var(--msp-accent-glow)' }}
                          >
                            {s.action} <ChevronRight size={12} />
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate('/generate')}
                            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl transition-all"
                            style={{ background: 'var(--msp-accent-dim)', color: 'var(--msp-accent2)', border: '1px solid var(--msp-accent-glow)' }}
                          >
                            <Wand2 size={12} /> {s.action}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Quick actions */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { icon: Wand2, label: 'Générer un mot de passe fort', path: '/generate', color: 'var(--msp-accent)' },
            { icon: MessageSquare, label: 'Demander à l\'assistant', path: '/assistant', color: 'var(--msp-blue)' },
            { icon: Key, label: 'Voir le coffre', path: '/dashboard', color: 'var(--msp-green)' },
          ].map(({ icon: Icon, label, path, color }) => (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all text-left"
              style={{ background: 'var(--msp-surface)', border: '1px solid var(--msp-border)', color: 'var(--msp-text2)' }}
            >
              <Icon size={16} style={{ color }} />
              {label}
              <ArrowRight size={13} className="ml-auto flex-shrink-0" style={{ color: 'var(--msp-text3)' }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
