import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowLeft, Copy, Check, Eye, EyeOff, Edit3, Trash2, Save, X,
  Globe, AlertTriangle, ExternalLink, RefreshCw, Clock, History
} from 'lucide-react';
import { toast } from 'sonner';
import { useVault } from '../context/VaultContext';
import { getDefaultPasswordOptions } from '../lib/password-tools';

const CATEGORIES = ['Personnel', 'Travail', 'Finance', 'Social', 'Shopping', 'Jeux', 'Autre'];

export default function EntryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { status, entries, updateEntry, deleteEntry, recordEntryAccess, analyzePassword, createPassword } = useVault();
  const entry = useMemo(() => entries.find(e => e.id === id) || null, [entries, id]);

  const [showPw, setShowPw] = useState(false);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [form, setForm] = useState({
    service: '', username: '', password: '', url: '', category: 'Personnel', tags: '', notes: ''
  });

  useEffect(() => {
    if (status === 'locked' || status === 'new') navigate('/auth');
  }, [navigate, status]);

  useEffect(() => {
    if (!entry) return;
    setForm({
      service: entry.service, username: entry.username, password: entry.password,
      url: entry.url, category: entry.category, tags: entry.tags.join(', '), notes: entry.notes
    });
  }, [entry]);

  if (!entry) return null;

  const analysis = analyzePassword(entry.password);
  const scoreColor = analysis.score >= 80 ? 'var(--msp-green)' : analysis.score >= 60 ? 'var(--msp-yellow)' : 'var(--msp-red)';

  const copyField = async (field: string, value: string) => {
    await navigator.clipboard.writeText(value);
    await recordEntryAccess(entry.id, `Copie de ${field} pour ${entry.service}.`);
    setCopiedField(field);
    toast.success(`${field} copié`);
    setTimeout(() => setCopiedField(f => f === field ? null : f), 2000);
  };

  const handleSave = async () => {
    await updateEntry(entry.id, {
      service: form.service, username: form.username, password: form.password,
      url: form.url, category: form.category,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), notes: form.notes
    });
    toast.success('Entrée mise à jour.');
    setEditing(false);
  };

  const handleDelete = async () => {
    if (deleteConfirm !== entry.service) return;
    await deleteEntry(entry.id);
    toast.success('Entrée supprimée.');
    navigate('/dashboard');
  };

  const InputField = ({ label, fKey, placeholder = '', type = 'text' }: { label: string; fKey: string; placeholder?: string; type?: string }) => (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--msp-text2)' }}>{label}</label>
      <input
        type={type}
        value={(form as any)[fKey]}
        onChange={e => setForm(f => ({ ...f, [fKey]: e.target.value }))}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all"
        style={{ background: 'var(--msp-elevated)', border: '1px solid var(--msp-border)', color: 'var(--msp-text1)' }}
      />
    </div>
  );

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Back + actions */}
        <div className="flex items-center justify-between mb-7">
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-sm transition-colors"
            style={{ color: 'var(--msp-text2)' }}>
            <ArrowLeft size={16} /> Retour au coffre
          </button>
          <div className="flex items-center gap-2">
            {!editing ? (
              <>
                <button onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all"
                  style={{ background: 'var(--msp-surface)', border: '1px solid var(--msp-border)', color: 'var(--msp-text2)' }}>
                  <Edit3 size={14} /> Modifier
                </button>
                <button onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm transition-all"
                  style={{ background: 'var(--msp-red-dim)', border: '1px solid rgba(248,113,113,0.2)', color: 'var(--msp-red)' }}>
                  <Trash2 size={14} /> Supprimer
                </button>
              </>
            ) : (
              <>
                <button onClick={handleSave}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white"
                  style={{ background: 'var(--msp-accent)' }}>
                  <Save size={14} /> Sauvegarder
                </button>
                <button onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm"
                  style={{ background: 'var(--msp-surface)', border: '1px solid var(--msp-border)', color: 'var(--msp-text2)' }}>
                  <X size={14} /> Annuler
                </button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Left / main */}
          <div className="md:col-span-2 space-y-4">
            {/* Header card */}
            <div className="rounded-2xl p-6"
              style={{ background: 'var(--msp-surface)', border: '1px solid var(--msp-border)' }}>
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0"
                  style={{ background: 'var(--msp-accent-dim)', color: 'var(--msp-accent2)' }}>
                  {entry.service[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-bold truncate" style={{ color: 'var(--msp-text1)' }}>{entry.service}</h1>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-lg"
                      style={{ background: 'var(--msp-elevated)', color: 'var(--msp-text3)' }}>
                      {entry.category}
                    </span>
                    {entry.tags.map(t => (
                      <span key={t} className="text-xs px-2 py-0.5 rounded-lg"
                        style={{ background: 'var(--msp-elevated)', color: 'var(--msp-text3)' }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strength */}
              <div className="p-3 rounded-xl" style={{ background: 'var(--msp-elevated)' }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs" style={{ color: 'var(--msp-text3)' }}>Sécurité du mot de passe</span>
                  <span className="text-xs font-semibold" style={{ color: scoreColor }}>
                    {analysis.label} · {analysis.score}/100
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div className="h-full rounded-full" style={{ width: `${analysis.score}%`, background: scoreColor }} />
                </div>
                <div className="mt-1 text-xs" style={{ color: 'var(--msp-text3)' }}>
                  {analysis.entropyBits} bits · résistance estimée: {analysis.crackTimeLabel}
                </div>
              </div>

              {(entry.domainWarnings.length > 0 || entry.passwordWarnings.length > 0) && (
                <div className="mt-3 px-3 py-2.5 rounded-xl flex items-start gap-2 text-sm"
                  style={{ background: 'var(--msp-yellow-dim)', color: 'var(--msp-yellow)' }}>
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{[...entry.domainWarnings, ...entry.passwordWarnings].join(' ')}</span>
                </div>
              )}
            </div>

            {/* Fields */}
            {editing ? (
              <div className="rounded-2xl p-6 space-y-4"
                style={{ background: 'var(--msp-surface)', border: '1px solid var(--msp-border)' }}>
                <InputField label="Service *" fKey="service" placeholder="Nom du service" />
                <InputField label="Identifiant / Email" fKey="username" placeholder="votre@email.com" />

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--msp-text2)' }}>Mot de passe</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        className="w-full px-3.5 py-2.5 rounded-xl text-sm font-mono outline-none pr-10"
                        style={{ background: 'var(--msp-elevated)', border: '1px solid var(--msp-border)', color: 'var(--msp-text1)' }}
                      />
                      <button type="button" onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--msp-text3)' }}>
                        {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <button onClick={() => setForm(f => ({ ...f, password: createPassword(getDefaultPasswordOptions()) }))}
                      className="px-3 py-2.5 rounded-xl transition-colors"
                      style={{ background: 'var(--msp-elevated)', border: '1px solid var(--msp-border)', color: 'var(--msp-text2)' }}
                      title="Rotation automatique">
                      <RefreshCw size={15} />
                    </button>
                  </div>
                </div>

                <InputField label="URL" fKey="url" placeholder="https://..." />

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--msp-text2)' }}>Catégorie</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--msp-elevated)', border: '1px solid var(--msp-border)', color: 'var(--msp-text1)' }}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <InputField label="Tags (séparés par virgule)" fKey="tags" placeholder="pro, 2fa…" />

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--msp-text2)' }}>Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={3}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none"
                    style={{ background: 'var(--msp-elevated)', border: '1px solid var(--msp-border)', color: 'var(--msp-text1)' }}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl"
                style={{ background: 'var(--msp-surface)', border: '1px solid var(--msp-border)' }}>
                {[
                  { label: 'Identifiant / Email', value: entry.username, fieldKey: 'username' },
                  { label: 'Mot de passe', value: entry.password, fieldKey: 'password' },
                  { label: 'URL', value: entry.url, fieldKey: 'url' },
                  { label: 'Notes', value: entry.notes, fieldKey: 'notes' },
                ].map(({ label, value, fieldKey }) => (
                  <div key={fieldKey} className="px-6 py-4" style={{ borderBottom: '1px solid var(--msp-border)' }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium" style={{ color: 'var(--msp-text3)' }}>{label}</span>
                      {value && fieldKey !== 'url' && fieldKey !== 'notes' && (
                        <button onClick={() => copyField(label, value)}
                          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-lg transition-all"
                          style={{
                            background: copiedField === label ? 'var(--msp-green-dim)' : 'transparent',
                            color: copiedField === label ? 'var(--msp-green)' : 'var(--msp-text3)',
                          }}>
                          {copiedField === label ? <Check size={11} /> : <Copy size={11} />}
                          {copiedField === label ? 'Copié' : 'Copier'}
                        </button>
                      )}
                    </div>
                    {fieldKey === 'password' ? (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm flex-1 break-all"
                          style={{ color: 'var(--msp-text1)', letterSpacing: showPw ? '0.05em' : 'normal' }}>
                          {showPw ? entry.password : '•'.repeat(Math.min(entry.password.length, 20))}
                        </span>
                        <button onClick={async () => { setShowPw(v => !v); if (!showPw) await recordEntryAccess(entry.id, `Révélation mot de passe.`); }}
                          style={{ color: 'var(--msp-text3)' }}>
                          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                        <button onClick={() => copyField('Mot de passe', entry.password)}
                          style={{ color: copiedField === 'Mot de passe' ? 'var(--msp-green)' : 'var(--msp-text3)' }}>
                          {copiedField === 'Mot de passe' ? <Check size={15} /> : <Copy size={15} />}
                        </button>
                      </div>
                    ) : fieldKey === 'url' && value ? (
                      <a href={value} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm hover:underline"
                        style={{ color: 'var(--msp-accent2)' }}>
                        {value} <ExternalLink size={12} />
                      </a>
                    ) : (
                      <p className="text-sm" style={{ color: value ? 'var(--msp-text1)' : 'var(--msp-text3)' }}>
                        {value || 'Non renseigné'}
                      </p>
                    )}
                  </div>
                ))}
                <div className="px-6 py-4 flex items-center gap-6">
                  {[
                    ['Créé', entry.createdAt],
                    ['Modifié', entry.updatedAt],
                    ...(entry.lastAccessedAt ? [['Accédé', entry.lastAccessedAt]] : []),
                  ].map(([label, val]) => (
                    <div key={label}>
                      <span className="text-xs" style={{ color: 'var(--msp-text3)' }}>{label}</span>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--msp-text2)' }}>
                        {new Date(val).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: history */}
          <div>
            <div className="rounded-2xl"
              style={{ background: 'var(--msp-surface)', border: '1px solid var(--msp-border)' }}>
              <div className="px-5 py-4" style={{ borderBottom: '1px solid var(--msp-border)' }}>
                <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--msp-text1)' }}>
                  <History size={15} style={{ color: 'var(--msp-accent)' }} /> Historique
                </h2>
              </div>
              <div className="p-3 space-y-2 max-h-96 overflow-auto">
                {entry.history.length === 0 ? (
                  <p className="text-xs text-center py-4" style={{ color: 'var(--msp-text3)' }}>Aucune activité</p>
                ) : [...entry.history].reverse().map(h => (
                  <div key={h.id} className="px-3 py-2.5 rounded-xl"
                    style={{ background: 'var(--msp-elevated)' }}>
                    <p className="text-xs font-medium" style={{ color: 'var(--msp-text2)' }}>{h.action}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--msp-text3)' }}>
                      {new Date(h.at).toLocaleString('fr-FR')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
            style={{ background: 'rgba(7,7,13,0.85)', backdropFilter: 'blur(8px)' }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="rounded-2xl p-6 w-full max-w-sm"
              style={{ background: 'var(--msp-surface)', border: '1px solid var(--msp-border)' }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'var(--msp-red-dim)' }}>
                <Trash2 size={22} style={{ color: 'var(--msp-red)' }} />
              </div>
              <h2 className="text-lg font-bold mb-1" style={{ color: 'var(--msp-text1)' }}>Confirmer la suppression</h2>
              <p className="text-sm mb-4" style={{ color: 'var(--msp-text2)' }}>
                Tapez <strong style={{ color: 'var(--msp-text1)' }}>{entry.service}</strong> pour confirmer la suppression définitive.
              </p>
              <input
                value={deleteConfirm}
                onChange={e => setDeleteConfirm(e.target.value)}
                placeholder={entry.service}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none mb-4"
                style={{ background: 'var(--msp-elevated)', border: '1px solid var(--msp-border)', color: 'var(--msp-text1)' }}
              />
              <div className="flex gap-3">
                <button onClick={() => { setConfirmDelete(false); setDeleteConfirm(''); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: 'var(--msp-elevated)', color: 'var(--msp-text2)', border: '1px solid var(--msp-border)' }}>
                  Annuler
                </button>
                <button onClick={handleDelete}
                  disabled={deleteConfirm !== entry.service}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                  style={{ background: 'var(--msp-red)' }}>
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
