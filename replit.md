# MySafePass - Gestionnaire de mots de passe sécurisé

## Overview
MySafePass est un gestionnaire de mots de passe sécurisé développé comme projet académique à l'ENSA Béni Mellal. Architecture zéro-connaissance, stockage chiffré AES-256-GCM, assistant IA conversationnel.

## Architecture

### Frontend (React + Vite)
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 6 (port 5000)
- **Styling:** Tailwind CSS v4 + custom dark design system (CSS vars `--msp-*`)
- **Icons:** Lucide React
- **Animation:** Framer Motion (`motion/react`)
- **State:** React Context (VaultContext)
- **Routing:** React Router v7 (layout route pattern with AppLayout)
- **API Proxy:** Vite proxies `/api` → backend localhost:8000

### Backend (Python + Flask)
- **Framework:** Flask 3.0 (port 8000)
- **Database:** SQLite + SQLCipher (SQLAlchemy)
- **Auth:** JWT + Argon2id
- **AI:** Ollama integration (optional)
- **Entry point:** `backend/run.py`

## Design System (MSP)
Dark theme using CSS variables in `src/styles/theme.css`:
- `--msp-void: #07070D` — Body background
- `--msp-base: #0B0B14` — Page background
- `--msp-surface: #111120` — Card surface
- `--msp-elevated: #181828` — Elevated elements
- `--msp-accent: #6C63FF` — Primary indigo accent
- Golden ratio spacing: 5, 8, 13, 21, 34, 55, 89px
- Sidebar width: 240px (`--msp-sidebar-w`)
- Session timeout: 3 hours (`SESSION_TIMEOUT_MS = 3 * 60 * 60 * 1000`), 5-min warning
- Homepage default theme: `indigo` (#6C63FF) — bridges to MSP design system in app

## Key Files
- `src/app/components/AppLayout.tsx` — Shared layout: sidebar nav + lock screen overlay
- `src/app/context/VaultContext.tsx` — All vault state + crypto operations
- `src/app/lib/vault.ts` — Core vault logic (AES-256-GCM, PBKDF2, session)
- `src/app/lib/chat-assistant.ts` — Heuristic + LLM-powered assistant
- `src/app/lib/llm-service.ts` — Ollama/backend AI API hooks
- `src/app/lib/password-tools.ts` — Password generation + analysis
- `src/app/lib/phishing.ts` — Service risk analysis
- `src/styles/theme.css` — Design system CSS variables

## Pages
- `/` → `App.tsx` — Landing page (home)
- `/auth` → `Login.tsx` — Setup (new vault) or unlock (existing)
- `/dashboard` → `Dashboard.tsx` — Vault list + search + stats (AppLayout)
- `/generate` → `GeneratePassword.tsx` — Generator with save form (AppLayout)
- `/assistant` → `Assistant.tsx` — ChatGPT-like AI chatbot (AppLayout)
- `/entry/:id` → `EntryDetail.tsx` — Entry view/edit/delete (AppLayout)

## Key Architecture Decisions
- **Lock screen:** Rendered as overlay inside AppLayout when `status === 'locked'` (not a redirect)
- **Registration:** Backend call is non-fatal; vault always creates locally even if backend fails
- **Login flow:** Distinct visual identity (deep-blue gradient header, `LogIn` icon, dedicated tab) vs Inscription (indigo→purple gradient, `ShieldCheck` icon). Login form takes username + master password in a single step, with quick-pick chips for any locally registered profiles.
- **Session:** 3-hour inactivity timeout, 5-min warning period, 5 user activity events tracked
- **Two local LLMs (privacy-by-design):**
  - `guard_llm` (env `GUARD_LLM_MODEL`, default `mistral`) — master-password robustness analysis & chat assistant
  - `generator_llm` (env `GENERATOR_LLM_MODEL`, default `llama2`) — strong-password generation only
  - Both run locally via Ollama. Falls back to heuristic / CSPRNG if unavailable.
- **GDPR / RGPD compliance:**
  - Email is **optional** at registration (data minimisation, art. 5.1.c). DB column `users.email` is nullable.
  - PII redaction (`LLMService.redact_pii`) is applied to chat input and to all log lines containing exception data (emails, phone numbers, IBAN, card numbers, NIR).
  - Raw passwords are **never** sent to the LLM — only structural metadata (length, charset diversity, entropy estimate, repetition flags) is forwarded to `guard_llm` for robustness analysis.
  - Article 9 sensitive-data categories explicitly forbidden in Terms of Use.
  - Privacy Policy and Terms of Service rewritten in French with 12 sections each, covering art. 6 lawful basis, art. 9 prohibition, rights (15-22), no transfer outside EU, CNIL contact.

## Workflows
- **Start application** — `pnpm run dev` on port 5000 (webview)
- **Backend API** — `cd backend && python run.py` on port 8000 (console)

## Environment Variables
- `HOST`, `PORT` — Backend host/port
- `SECRET_KEY`, `JWT_SECRET_KEY` — Flask/JWT keys
- `DATABASE_PATH` — SQLite path (default: data/mysafepass.db)
- `DATABASE_ENCRYPTION_KEY` — SQLCipher key
- `OLLAMA_URL` — Ollama server URL (default: http://localhost:11434)
- `GUARD_LLM_MODEL` — Master-password & chat model (default: mistral)
- `GENERATOR_LLM_MODEL` — Password-generator model (default: llama2)
- `LLM_MODEL` — (legacy) fallback for `GUARD_LLM_MODEL`

## Recent changes (April 2026)
- Real distinct **Login** flow with deep-blue gradient header & username + master-password fields; quick-pick chips for local profiles.
- GDPR-compliant **Privacy Policy** & **Terms of Use** rewritten in French (12 sections each).
- Two dedicated local LLMs (`guard_llm`, `generator_llm`) wired via `GUARD_LLM_MODEL` / `GENERATOR_LLM_MODEL` env vars.
- New `/api/ai/generate-password` endpoint + `LLMService.generatePassword` frontend client.
- Added "Générer avec IA" button on the password generator.
- Session timeout extended from 10 minutes to **3 hours**.
- Email is now **optional** at registration (frontend + backend + DB nullable).
- PII redaction (`LLMService.redact_pii`) applied to logs, chat input, and password analysis prompts (raw passwords never reach the LLM).
- Visual unification: indigo (`#6C63FF`) added to homepage themes (default), `/privacy` & `/terms` rewritten on `#0D0D0D` background to match the rest of the app.
