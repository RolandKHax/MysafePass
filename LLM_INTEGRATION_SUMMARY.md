# Integration LLM Local - Résumé des modifications

## 🎯 Objectif
Intégration d'un modèle LLM local (Ollama) pour:
1. **Vérification avancée du mot de passe Master** - Détection de données sensibles et analyse de robustesse
2. **Assistant AI amélioré** - Réponses plus intelligentes et contextuelles

## 📦 Modifications effectuées

### Backend (`/backend/`)

#### Nouveaux fichiers:
- **`src/backend/llm/llm_service.py`** - Service d'intégration Ollama
- **`src/backend/llm/password_analyzer.py`** - Analyseur avancé de mots de passe
- **`src/backend/llm/ai_assistant.py`** - Assistant IA avec support LLM
- **`src/backend/llm/__init__.py`** - Module LLM

#### Modifications:
- **`requirements.txt`** - Ajout de `ollama==0.1.48` et `requests==2.31.0`
- **`src/backend/api/routes.py`** - Ajout de 3 nouvelles routes:
  - `POST /api/security/check-password` - Vérify le mot de passe
  - `GET /api/ai/llm-status` - Statut du LLM
  - `POST /api/ai/chat` - Assistant conversationnel
- **`.env`** - Ajout des variables LLM

#### Nouvelles routes API:

```bash
# Vérifier un mot de passe
POST /api/security/check-password
{
  "password": "MySecurePass123!",
  "username": "john_doe",
  "email": "john@example.com"
}

# Obtenir le statut du LLM
GET /api/ai/llm-status

# Chat avec l'assistant
POST /api/ai/chat
{
  "query": "Montre les mots de passe faibles",
  "context": { ... },
  "use_llm": true
}
```

### Frontend (`/src/app/`)

#### Nouveaux fichiers:
- **`lib/llm-service.ts`** - Client TypeScript pour les endpoints LLM
- **`components/PasswordVerification.tsx`** - Composant d'analyse de mot de passe en temps réel
- **`components/LLMStatusIndicator.tsx`** - Indicateur de statut Ollama

#### Modifications:
- **`lib/chat-assistant.ts`** - Support asynchrone du LLM
- **`pages/Assistant.tsx`** - Gestion asynchrone des réponses

### Documentation:
- **`LLM_SETUP.md`** - Guide complet d'installation et configuration
- **`install-ollama.sh`** - Script d'installation Ollama (Linux/macOS)
- **`start-msp.sh`** - Script de démarrage complet (Linux/macOS)
- **`start-msp.bat`** - Script de démarrage Windows
- **`backend/.env`** - Variables LLM

## 🚀 Pour démarrer

### 1. Installation Ollama

**Linux/macOS:**
```bash
bash install-ollama.sh
```

**Windows:**
- Téléchargez depuis https://ollama.ai/download/windows
- Lancez l'installateur et suivez les instructions

### 2. Démarrage de l'application

**Linux/macOS:**
```bash
bash start-msp.sh
```

**Windows:**
```cmd
start-msp.bat
```

**Manuel (tout système):**
```bash
# Terminal 1: Ollama
ollama serve

# Terminal 2: Backend
cd backend
pip install -r requirements.txt
python run.py

# Terminal 3: Frontend
npm run dev
# ou
pnpm run dev
```

### 3. Configuration (optionnel)

Fichier `backend/.env`:
```env
LLM_MODEL=mistral              # Modèle à utiliser
OLLAMA_URL=http://localhost:11434  # URL du serveur
```

## ✨ Fonctionnalités

### Vérification de mot de passe Master
- Score de robustesse (0-100)
- Détection des données sensibles (email, téléphone, dates, etc.)
- Analyse d'entropie
- Recommandations d'amélioration
- Patterns détectés (clavier, séquences, etc.)

### Assistant IA amélioré
- Réponses enrichies par le LLM
- Compréhension contextuelle
- Support multi-langue (français/anglais)
- Fallback heuristique si Ollama indisponible

## 📊 Architecture

```
Backend:
  routes.py (API endpoints)
    ↓
  llm_service.py (Ollama integration)
    ↓
  password_analyzer.py (Advanced analysis)
  ai_assistant.py (Context-aware AI)
    ↓
  Ollama (Port 11434)

Frontend:
  PasswordVerification.tsx (Real-time analysis UI)
  LLMStatusIndicator.tsx (Status & settings)
  Assistant.tsx (Chat interface)
    ↓
  llm-service.ts (API client)
    ↓
  chat-assistant.ts (LLM integration)
```

## 🔧 Variables d'environnement

### Backend
```env
# LLM Configuration
LLM_MODEL=mistral
OLLAMA_URL=http://localhost:11434
RATE_LIMIT_AI=20 per minute
```

### Modèles recommandés
| Modèle | Taille | Vitesse | Score |
|--------|--------|---------|-------|
| **mistral** | 4GB | ⚡⚡⚡ | ⭐⭐⭐ |
| neural-chat | 3.8GB | ⚡⚡⚡ | ⭐⭐⭐ |
| llama2 | 3.8GB | ⚡⚡ | ⭐⭐⭐ |

## 🐛 Dépannage

### Ollama not connecting
```bash
# Vérifier que Ollama est lancé
curl http://localhost:11434/api/tags

# Redémarrer Ollama
ollama serve
```

### Modèle not found
```bash
# Lister les modèles disponibles
ollama list

# Télécharger un modèle
ollama pull mistral
```

### Performance lente
- Utilisez un modèle plus léger (mistral/neural-chat)
- Augmentez la RAM disponible
- Vérifiez les ressources système

## 👥 Intégration dans vos composants

### Vérification de mot de passe
```tsx
import { PasswordVerification } from '@/app/components/PasswordVerification';

<PasswordVerification
  password={password}
  username={username}
  email={email}
  onAnalysisComplete={(analysis) => {
    if (analysis.approved) {
      // Proceed with signup
    }
  }}
/>
```

### Assistant AI
L'assistant utilise automatiquement le LLM si disponible, sinon fallback heuristique.

### Indicateur LLM
```tsx
import { LLMStatusIndicator } from '@/app/components/LLMStatusIndicator';

<LLMStatusIndicator />  // Click to see details
```

## 📝 Notes

- Le LLM fonctionne **hors ligne** (entièrement local)
- **Zéro données envoyées** à des serveurs externes
- Cache des réponses pour optimiser les performances
- Support du fallback heuristique si Ollama indisponible
- Rate limiting pour éviter les abus (20 req/min par défaut)

## 🔐 Sécurité

- Les mots de passe **ne sont jamais envoyés** au LLM
- Analyse purement locale
- Aucun logging des données sensibles
- Ollama s'exécute sur `localhost` uniquement par défaut

## 📚 Ressources

- [Ollama Documentation](https://ollama.ai)
- [Guide LLM MSP](./LLM_SETUP.md)
- [Code source backend](./backend/src/backend/llm/)
- [Code source frontend](./src/app/lib/llm-service.ts)
