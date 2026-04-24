import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  RefreshCw, Copy, Check, Save, Wand2, ChevronDown, ChevronUp,
  AlertTriangle, Info, Globe, Tag, Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { useVault } from '../context/VaultContext';
import { analyzeServiceRisk } from '../lib/phishing';
import { getDefaultPasswordOptions, type PasswordOptions } from '../lib/password-tools';
import { LLMService } from '../lib/llm-service';

const CATEGORIES = ['Personnel', 'Travail', 'Finance', 'Social', 'Shopping', 'Jeux', 'Autre'];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all text-sm font-medium"
      style={{
        background: checked ? 'var(--msp-accent-dim)' : 'var(--msp-elevated)',
        border: `1px solid ${checked ? 'var(--msp-accent-glow)' : 'var(--msp-border)'}`,
        color: checked ? 'var(--msp-accent2)' : 'var(--msp-text2)',
      }}
    >
      <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: checked ? 'var(--msp-accent)' : 'rgba(255,255,255,0.08)' }}>
        {checked && <Check size={13} color="white" />}
      </div>
      {label}
    </button>
  );
}

export default function GeneratePassword() {
  const navigate = useNavigate();
  const { status, addEntry, analyzePassword, createPassword } = useVault();
  const defaults = getDefaultPasswordOptions();
  const [options, setOptions] = useState<PasswordOptions>(defaults);
  const [generated, setGenerated] = useState('');
  const [copied, setCopied] = useState(false);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [service, setService] = useState('');
  const [username, setUsername] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Personnel');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiSource, setAiSource] = useState<'llm' | 'csprng' | null>(null);

  useEffect(() => {
    if (status === 'locked' || status === 'new') navigate('/auth');
  }, [status, navigate]);

  useEffect(() => {
    setGenerated(createPassword(defaults));
  }, []);

  const analysis = useMemo(() => analyzePassword(generated, options), [analyzePassword, generated, options]);
  const risk = useMemo(() => analyzeServiceRisk(service, url), [service, url]);

  const generate = () => {
    setGenerated(createPassword(options));
    setAiSource(null);
  };

  const generateWithAI = async () => {
    setAiGenerating(true);
    try {
      const result = await LLMService.generatePassword({
        length: options.length,
        include_lower: options.includeLowercase,
        include_upper: options.includeUppercase,
        include_digits: options.includeDigits,
        include_symbols: options.includeSymbols,
      });
      setGenerated(result.password);
      setAiSource(result.source);
      toast.success(
        result.source === 'llm'
          ? `Généré par l'IA (${result.model}) — ${result.entropy_bits} bits`
          : `IA indisponible — secours cryptographique sécurisé (${result.entropy_bits} bits)`
      );
    } catch (err) {
      console.error(err);
      toast.error('Génération IA indisponible. Repli local utilisé.');
      setGenerated(createPassword(options));
      setAiSource('csprng');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generated);
    setCopied(true);
    toast.success('Mot de passe copié.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    if (!service.trim()) { toast.error('Le nom du service est requis.'); return; }
    setSaving(true);
    await addEntry({
      service, username, password: generated, url, category,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean), notes,
    });
    toast.success('Entrée ajoutée au coffre.');
    setSaving(false);
    navigate('/dashboard');
  };

  const scoreColor = analysis.score >= 80 ? 'var(--msp-green)' : analysis.score >= 60 ? 'var(--msp-yellow)' : 'var(--msp-red)';
  const scoreLabel = analysis.score >= 80 ? 'Très fort' : analysis.score >= 60 ? 'Fort' : analysis.score >= 35 ? 'Moyen' : 'Faible';

  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--msp-text1)' }}>Générateur de mot de passe</h1>
        <p className="text-sm" style={{ color: 'var(--msp-text2)' }}>
          Cryptographiquement sécurisé, conforme NIST — 100% local
        </p>
      </div>

      {/* Password display */}
      <div className="rounded-2xl p-6 mb-5"
        style={{ background: 'var(--msp-surface)', border: '1px solid var(--msp-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--msp-text3)' }}>
            Mot de passe généré
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs px-2 py-0.5 rounded-lg font-medium"
              style={{ background: `${scoreColor}20`, color: scoreColor }}>
              {scoreLabel} · {analysis.score}/100
            </span>
          </div>
        </div>

        <div className="px-4 py-4 rounded-xl mb-4 font-mono text-lg break-all leading-relaxed select-all"
          style={{ background: 'var(--msp-elevated)', color: 'var(--msp-text1)', letterSpacing: '0.04em' }}>
          {generated || '—'}
        </div>

        {/* Strength bar */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <motion.div
              className="h-full rounded-full"
              animate={{ width: `${analysis.score}%` }}
              style={{ background: scoreColor }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-xs tabular-nums" style={{ color: 'var(--msp-text3)' }}>
            {analysis.entropyBits} bits · {analysis.crackTimeLabel}
          </span>
        </div>

        <div className="flex gap-2 flex-wrap">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={generate}
            className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: 'var(--msp-elevated)', color: 'var(--msp-text2)', border: '1px solid var(--msp-border)' }}
          >
            <RefreshCw size={15} /> Régénérer
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={generateWithAI}
            disabled={aiGenerating}
            className="flex-1 min-w-[160px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg, #6C63FF 0%, #7B2FBE 100%)' }}
            title="Utiliser le LLM dédié (local) à la génération de mots de passe"
          >
            <Sparkles size={15} className={aiGenerating ? 'animate-pulse' : ''} />
            {aiGenerating ? 'Génération…' : 'Générer avec IA'}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={handleCopy}
            className="flex-1 min-w-[120px] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{ background: copied ? 'var(--msp-green)' : 'var(--msp-accent)' }}
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
            {copied ? 'Copié !' : 'Copier'}
          </motion.button>
        </div>
        {aiSource && (
          <p className="mt-3 text-xs flex items-center gap-1.5" style={{ color: 'var(--msp-text3)' }}>
            <Sparkles size={11} />
            Source : {aiSource === 'llm' ? 'IA générateur (local)' : 'Repli cryptographique CSPRNG'}
          </p>
        )}
      </div>

      {/* Options */}
      <div className="rounded-2xl p-6 mb-5"
        style={{ background: 'var(--msp-surface)', border: '1px solid var(--msp-border)' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: 'var(--msp-text1)' }}>Paramètres</h2>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm" style={{ color: 'var(--msp-text2)' }}>Longueur</span>
            <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--msp-accent2)' }}>{options.length}</span>
          </div>
          <input
            type="range" min={8} max={64} step={1}
            value={options.length}
            onChange={e => setOptions(o => ({ ...o, length: +e.target.value }))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, var(--msp-accent) ${((options.length - 8) / 56) * 100}%, rgba(255,255,255,0.1) 0%)`,
            }}
          />
          <div className="flex justify-between mt-1">
            <span className="text-xs" style={{ color: 'var(--msp-text3)' }}>8</span>
            <span className="text-xs" style={{ color: 'var(--msp-text3)' }}>64</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Toggle checked={options.includeLowercase} onChange={v => setOptions(o => ({ ...o, includeLowercase: v }))} label="Minuscules (abc)" />
          <Toggle checked={options.includeUppercase} onChange={v => setOptions(o => ({ ...o, includeUppercase: v }))} label="Majuscules (ABC)" />
          <Toggle checked={options.includeDigits} onChange={v => setOptions(o => ({ ...o, includeDigits: v }))} label="Chiffres (123)" />
          <Toggle checked={options.includeSymbols} onChange={v => setOptions(o => ({ ...o, includeSymbols: v }))} label="Symboles (!@#)" />
        </div>
      </div>

      {/* Warnings */}
      <AnimatePresence>
        {analysis.warnings.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="rounded-xl px-4 py-3 mb-4 flex items-start gap-2 text-sm"
            style={{ background: 'var(--msp-yellow-dim)', color: 'var(--msp-yellow)' }}>
            <AlertTriangle size={15} className="flex-shrink-0 mt-0.5" />
            <span>{analysis.warnings.join(' ')}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save section */}
      <div className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--msp-surface)', border: '1px solid var(--msp-border)' }}>
        <button
          onClick={() => setShowSaveForm(v => !v)}
          className="w-full flex items-center justify-between px-6 py-4 text-sm font-semibold transition-colors"
          style={{ color: 'var(--msp-text1)' }}
        >
          <span className="flex items-center gap-2"><Save size={16} style={{ color: 'var(--msp-accent)' }} /> Enregistrer dans le coffre</span>
          {showSaveForm ? <ChevronUp size={16} style={{ color: 'var(--msp-text3)' }} /> : <ChevronDown size={16} style={{ color: 'var(--msp-text3)' }} />}
        </button>

        <AnimatePresence>
          {showSaveForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="px-6 pb-6 space-y-3"
              style={{ borderTop: '1px solid var(--msp-border)' }}
            >
              <div className="pt-4 space-y-3">
                {[
                  { label: 'Service *', value: service, onChange: setService, placeholder: 'GitHub, Google, Netflix…' },
                  { label: 'Identifiant / Email', value: username, onChange: setUsername, placeholder: 'votre@email.com' },
                ].map(({ label, value, onChange, placeholder }) => (
                  <div key={label}>
                    <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--msp-text2)' }}>{label}</label>
                    <input
                      value={value}
                      onChange={e => onChange(e.target.value)}
                      placeholder={placeholder}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: 'var(--msp-elevated)', border: '1px solid var(--msp-border)', color: 'var(--msp-text1)' }}
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--msp-text2)' }}>URL</label>
                  <div className="relative">
                    <Globe size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--msp-text3)' }} />
                    <input
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                      style={{ background: 'var(--msp-elevated)', border: '1px solid var(--msp-border)', color: 'var(--msp-text1)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--msp-text2)' }}>Catégorie</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--msp-elevated)', border: '1px solid var(--msp-border)', color: 'var(--msp-text1)' }}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--msp-text2)' }}>
                    <span className="flex items-center gap-1"><Tag size={11} /> Tags (séparés par virgule)</span>
                  </label>
                  <input
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    placeholder="pro, important, 2fa…"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
                    style={{ background: 'var(--msp-elevated)', border: '1px solid var(--msp-border)', color: 'var(--msp-text1)' }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--msp-text2)' }}>Notes</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Informations complémentaires…"
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-none"
                    style={{ background: 'var(--msp-elevated)', border: '1px solid var(--msp-border)', color: 'var(--msp-text1)' }}
                  />
                </div>

                {risk.warnings.length > 0 && (
                  <div className="px-3 py-2.5 rounded-xl text-sm flex items-start gap-2"
                    style={{ background: 'var(--msp-yellow-dim)', color: 'var(--msp-yellow)' }}>
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    <span>{risk.warnings.join(' ')}</span>
                  </div>
                )}

                <motion.button
                  whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  disabled={saving || !service.trim()}
                  className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
                  style={{ background: 'var(--msp-accent)' }}
                >
                  {saving ? 'Enregistrement…' : 'Sauvegarder dans le coffre'}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
