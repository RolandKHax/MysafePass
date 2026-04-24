import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, SendHorizonal, User, Sparkles, Cpu, RefreshCw } from 'lucide-react';
import { useVault } from '../context/VaultContext';
import { buildAssistantReply } from '../lib/chat-assistant';
import { LLMService } from '../lib/llm-service';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
  suggestions?: string[];
  loading?: boolean;
}

const STARTERS = [
  'Liste mes comptes',
  'Résumé sécurité',
  'Mots de passe faibles',
  'Génère un mot de passe fort',
  'Doublons détectés',
  'Services suspects',
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map(i => (
        <motion.div key={i} className="w-1.5 h-1.5 rounded-full"
          style={{ background: 'var(--msp-accent)' }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
      ))}
    </div>
  );
}

export default function Assistant() {
  const navigate = useNavigate();
  const { status, entries } = useVault();
  const [input, setInput] = useState('');
  const [llmAvailable, setLlmAvailable] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<Message[]>([{
    id: crypto.randomUUID(),
    role: 'assistant',
    content: 'Bonjour ! Je suis votre assistant MySafePass. Je peux analyser la sécurité de votre coffre, lister vos comptes, détecter les doublons et générer des mots de passe forts.',
    suggestions: STARTERS.slice(0, 4),
  }]);

  useEffect(() => {
    if (status === 'locked' || status === 'new') navigate('/auth');
  }, [navigate, status]);

  useEffect(() => {
    LLMService.getLLMStatus().then(s => setLlmAvailable(s.available)).catch(() => setLlmAvailable(false));
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (value = input) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: 'user', content: trimmed };
    const loadingId = crypto.randomUUID();
    const loadingMsg: Message = { id: loadingId, role: 'assistant', content: '', loading: true };

    setMessages(m => [...m, userMsg, loadingMsg]);
    setInput('');
    inputRef.current?.focus();

    try {
      const reply = await buildAssistantReply(trimmed, entries);
      setMessages(m => m.map(msg => msg.id === loadingId
        ? { ...msg, content: reply.message, suggestions: reply.suggestions, loading: false }
        : msg
      ));
    } catch {
      setMessages(m => m.map(msg => msg.id === loadingId
        ? { ...msg, content: 'Une erreur est survenue. Veuillez réessayer.', loading: false }
        : msg
      ));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const resetChat = () => {
    setMessages([{
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'Conversation réinitialisée. Comment puis-je vous aider ?',
      suggestions: STARTERS.slice(0, 4),
    }]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 px-8 pt-7 pb-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--msp-border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--msp-accent-dim)', border: '1px solid var(--msp-accent-glow)' }}>
            <Bot size={20} style={{ color: 'var(--msp-accent)' }} />
          </div>
          <div>
            <h1 className="text-base font-bold leading-tight" style={{ color: 'var(--msp-text1)' }}>Assistant IA</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              {llmAvailable === null ? (
                <span className="text-xs" style={{ color: 'var(--msp-text3)' }}>Vérification du LLM…</span>
              ) : llmAvailable ? (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  <span className="text-xs" style={{ color: 'var(--msp-green)' }}>LLM local connecté</span>
                  <Cpu size={11} style={{ color: 'var(--msp-green)' }} />
                </>
              ) : (
                <>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--msp-accent)' }} />
                  <span className="text-xs" style={{ color: 'var(--msp-text3)' }}>Mode heuristique</span>
                  <Sparkles size={11} style={{ color: 'var(--msp-accent)' }} />
                </>
              )}
            </div>
          </div>
        </div>
        <button onClick={resetChat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-colors"
          style={{ background: 'var(--msp-surface)', border: '1px solid var(--msp-border)', color: 'var(--msp-text3)' }}>
          <RefreshCw size={12} /> Effacer
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-auto px-8 py-6 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: msg.role === 'assistant' ? 'var(--msp-accent-dim)' : 'var(--msp-elevated)',
                  border: `1px solid ${msg.role === 'assistant' ? 'var(--msp-accent-glow)' : 'var(--msp-border)'}`,
                  marginTop: 2,
                }}>
                {msg.role === 'assistant'
                  ? <Bot size={14} style={{ color: 'var(--msp-accent)' }} />
                  : <User size={14} style={{ color: 'var(--msp-text2)' }} />}
              </div>

              {/* Bubble */}
              <div className={`flex flex-col gap-2 max-w-[78%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className="px-4 py-3 rounded-2xl text-sm leading-relaxed"
                  style={{
                    background: msg.role === 'user' ? 'var(--msp-accent)' : 'var(--msp-surface)',
                    border: msg.role === 'user' ? 'none' : '1px solid var(--msp-border)',
                    color: msg.role === 'user' ? 'white' : 'var(--msp-text1)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.loading ? <TypingDots /> : msg.content}
                </div>

                {/* Suggestions */}
                {msg.suggestions && msg.suggestions.length > 0 && !msg.loading && i === messages.length - 1 && (
                  <div className="flex flex-wrap gap-1.5">
                    {msg.suggestions.map(s => (
                      <button
                        key={s}
                        onClick={() => handleSend(s)}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all"
                        style={{
                          background: 'var(--msp-accent-dim)',
                          border: '1px solid var(--msp-accent-glow)',
                          color: 'var(--msp-accent2)',
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 px-8 pb-6 pt-3"
        style={{ borderTop: '1px solid var(--msp-border)' }}>
        {/* Quick prompts */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {STARTERS.map(s => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs transition-all"
              style={{
                background: 'var(--msp-surface)',
                border: '1px solid var(--msp-border)',
                color: 'var(--msp-text3)',
              }}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'; }}
              onKeyDown={handleKeyDown}
              placeholder="Posez une question sur votre coffre… (Entrée pour envoyer)"
              rows={1}
              className="w-full px-4 py-3 pr-12 rounded-2xl text-sm outline-none resize-none"
              style={{
                background: 'var(--msp-surface)',
                border: '1px solid var(--msp-border2)',
                color: 'var(--msp-text1)',
                lineHeight: '1.5',
                maxHeight: 160,
                overflow: 'auto',
              }}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }}
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white flex-shrink-0 disabled:opacity-40 transition-all"
            style={{ background: 'var(--msp-accent)' }}
          >
            <SendHorizonal size={18} />
          </motion.button>
        </div>
        <p className="mt-2 text-xs text-center" style={{ color: 'var(--msp-text3)' }}>
          Toutes les analyses sont réalisées localement. Aucune donnée n'est transmise.
        </p>
      </div>
    </div>
  );
}
