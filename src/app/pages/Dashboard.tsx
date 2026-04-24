import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Plus, Copy, ChevronRight, Shield, AlertTriangle,
  RefreshCw, Key, Globe, Tag, Clock, TrendingUp, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { useVault } from '../context/VaultContext';

type SortMode = 'updated' | 'name' | 'recent';

function getCategoryColor(cat: string): string {
  const map: Record<string, string> = {
    'Personnel': '#6C63FF', 'Travail': '#60A5FA', 'Finance': '#34D399',
    'Social': '#F472B6', 'Shopping': '#FBBF24', 'Jeux': '#F87171',
  };
  return map[cat] || '#9595BE';
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? 'var(--msp-green)' : score >= 60 ? 'var(--msp-yellow)' : 'var(--msp-red)';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: color }} />
      </div>
      <span className="text-xs font-mono tabular-nums" style={{ color, minWidth: 26 }}>{score}</span>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { entries, securitySummary, recordEntryAccess, sessionWarning } = useVault();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState<SortMode>('updated');
  const [copied, setCopied] = useState<string | null>(null);
  const [revealedId, setRevealedId] = useState<string | null>(null);

  const categories = useMemo(() => ['all', ...new Set(entries.map(e => e.category))], [entries]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...entries]
      .filter(e => category === 'all' || e.category === category)
      .filter(e => !q || [e.service, e.username, e.url, e.category, e.tags.join(' ')].join(' ').toLowerCase().includes(q))
      .sort((a, b) => {
        if (sort === 'name') return a.service.localeCompare(b.service);
        if (sort === 'recent') return (b.lastAccessedAt || '').localeCompare(a.lastAccessedAt || '');
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [entries, search, category, sort]);

  const handleCopy = async (id: string, pwd: string, service: string) => {
    await navigator.clipboard.writeText(pwd);
    await recordEntryAccess(id, `Copie du mot de passe pour ${service}.`);
    setCopied(id);
    toast.success(`Copié : ${service}`);
    setTimeout(() => setCopied(c => (c === id ? null : c)), 2000);
  };

  const stats = [
    { label: 'Entrées', value: securitySummary.totalEntries, icon: Key, color: 'var(--msp-accent)' },
    { label: 'Faibles', value: securitySummary.weakEntries.length, icon: AlertTriangle, color: 'var(--msp-red)' },
    { label: 'Réutilisés', value: securitySummary.reusedPasswords, icon: RefreshCw, color: 'var(--msp-yellow)' },
    { label: 'Suspects', value: securitySummary.suspiciousEntries.length, icon: Globe, color: 'var(--msp-yellow)' },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-8 pt-7 pb-5">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--msp-text1)' }}>Mon Coffre</h1>
          <motion.button
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/generate')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'var(--msp-accent)' }}
          >
            <Plus size={17} /> Nouvelle entrée
          </motion.button>
        </div>
        <p className="text-sm" style={{ color: 'var(--msp-text2)' }}>
          {entries.length} mot{entries.length !== 1 ? 's' : ''} de passe stocké{entries.length !== 1 ? 's' : ''}
        </p>

        {sessionWarning && (
          <div className="mt-3 px-4 py-2.5 rounded-xl text-sm flex items-center gap-2"
            style={{ background: 'var(--msp-yellow-dim)', color: 'var(--msp-yellow)' }}>
            <Clock size={15} /> Session expire bientôt sans activité.
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="flex-shrink-0 px-8 pb-5">
        <div className="grid grid-cols-4 gap-3">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-xl px-4 py-3"
              style={{ background: 'var(--msp-surface)', border: '1px solid var(--msp-border)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Icon size={14} style={{ color }} />
                <span className="text-xs" style={{ color: 'var(--msp-text3)' }}>{label}</span>
              </div>
              <div className="text-2xl font-bold" style={{ color: value > 0 && label !== 'Entrées' ? color : 'var(--msp-text1)' }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & filters */}
      <div className="flex-shrink-0 px-8 pb-4 flex gap-3">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--msp-text3)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher service, identifiant, tag…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: 'var(--msp-surface)',
              border: '1px solid var(--msp-border)',
              color: 'var(--msp-text1)',
            }}
          />
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortMode)}
          className="px-3 py-2.5 rounded-xl text-sm outline-none"
          style={{
            background: 'var(--msp-surface)',
            border: '1px solid var(--msp-border)',
            color: 'var(--msp-text2)',
          }}
        >
          <option value="updated">Modifié</option>
          <option value="recent">Accédé</option>
          <option value="name">Nom</option>
        </select>
      </div>

      {/* Category pills */}
      <div className="flex-shrink-0 px-8 pb-4 flex gap-2 overflow-x-auto">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: category === cat ? 'var(--msp-accent-dim)' : 'var(--msp-surface)',
              border: `1px solid ${category === cat ? 'var(--msp-accent-glow)' : 'var(--msp-border)'}`,
              color: category === cat ? 'var(--msp-accent2)' : 'var(--msp-text3)',
            }}
          >
            {cat === 'all' ? 'Toutes' : cat}
          </button>
        ))}
      </div>

      {/* Entry list */}
      <div className="flex-1 overflow-auto px-8 pb-8">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'var(--msp-surface)' }}>
                <Shield size={28} style={{ color: 'var(--msp-text3)' }} />
              </div>
              <p className="font-medium mb-1" style={{ color: 'var(--msp-text2)' }}>
                {search ? 'Aucun résultat' : 'Coffre vide'}
              </p>
              <p className="text-sm" style={{ color: 'var(--msp-text3)' }}>
                {search ? 'Essayez une autre recherche' : 'Ajoutez votre première entrée'}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-2">
              {filtered.map((entry, i) => {
                const catColor = getCategoryColor(entry.category);
                const isRevealed = revealedId === entry.id;
                return (
                  <motion.div
                    key={entry.id}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: i * 0.03 }}
                    className="group rounded-2xl transition-all cursor-pointer"
                    style={{ background: 'var(--msp-surface)', border: '1px solid var(--msp-border)' }}
                  >
                    <div className="flex items-center gap-4 p-4"
                      onClick={async () => {
                        await recordEntryAccess(entry.id, `Consultation de ${entry.service}.`);
                        navigate(`/entry/${entry.id}`);
                      }}>
                      {/* Avatar */}
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                        style={{ background: `${catColor}20`, color: catColor }}>
                        {entry.service[0]?.toUpperCase() || '?'}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-semibold text-sm truncate" style={{ color: 'var(--msp-text1)' }}>
                            {entry.service}
                          </span>
                          {entry.domainWarnings.length > 0 && (
                            <AlertTriangle size={12} style={{ color: 'var(--msp-yellow)', flexShrink: 0 }} />
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs truncate" style={{ color: 'var(--msp-text3)' }}>
                            {entry.username || 'Identifiant non renseigné'}
                          </span>
                          <span className="text-xs font-mono" style={{ color: 'var(--msp-text3)' }}>
                            {isRevealed ? entry.password : '••••••••'}
                          </span>
                        </div>
                        <div className="mt-1.5">
                          <ScoreBar score={entry.passwordScore} />
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="hidden md:flex items-center gap-1.5">
                        {entry.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="px-2 py-0.5 rounded-lg text-xs"
                            style={{ background: 'var(--msp-elevated)', color: 'var(--msp-text3)' }}>
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setRevealedId(id => id === entry.id ? null : entry.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                          style={{ color: 'var(--msp-text3)' }}
                          title={isRevealed ? 'Masquer' : 'Révéler'}
                        >
                          {isRevealed ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button
                          onClick={() => handleCopy(entry.id, entry.password, entry.service)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                          style={{
                            background: copied === entry.id ? 'var(--msp-green-dim)' : 'var(--msp-elevated)',
                            color: copied === entry.id ? 'var(--msp-green)' : 'var(--msp-text2)',
                          }}
                          title="Copier le mot de passe"
                        >
                          <Copy size={14} />
                        </button>
                        <ChevronRight size={15} style={{ color: 'var(--msp-text3)' }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* FAB */}
      <div className="fixed bottom-8 right-8">
        <motion.button
          whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.93 }}
          onClick={() => navigate('/generate')}
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl"
          style={{
            background: 'var(--msp-accent)',
            boxShadow: '0 8px 32px rgba(108,99,255,0.4)',
          }}
        >
          <Plus size={26} />
        </motion.button>
      </div>
    </div>
  );
}
