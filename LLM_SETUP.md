# Configuration LLM Local - MSP

Ce guide explique comment configurer Ollama et intégrer un LLM local pour la vérification des mots de passe et l'assistant IA.

## Fonctionnalités

- ✅ Vérification avancée des mots de passe Master avec détection de données sensibles
- ✅ Assistant IA conversationnel amélioré
- ✅ Analyse de robustesse des mots de passe
- ✅ Détection de patterns et de données personnelles injectées

## Installation

### 1. Installer Ollama

#### macOS / Linux
```bash
curl https://ollama.ai/install.sh | sh
```

#### Windows
Téléchargez l'installateur depuis [ollama.ai](https://ollama.ai)

### 2. Télécharger un modèle LLM

```bash
# Modèle léger et rapide (recommandé pour développement)
ollama pull mistral

# Autres options (plus gros, meilleur qualité)
ollama pull neural-chat
ollama pull llama2
ollama pull dolphin-mixtral
```

### 3. Démarrer Ollama

Ollama s'exécute en arrière-plan et écoute sur `http://localhost:11434`

```bash
# Sur macOS/Linux
ollama serve

# Sur Windows, Ollama s'exécute automatiquement au démarrage
```

## Configuration du Backend

### Variables d'environnement

Créez ou mettez à jour le fichier `.env` dans le dossier `backend/`:

```env
# LLM Configuration
LLM_MODEL=mistral
OLLAMA_URL=http://localhost:11434
```

### Dépendances Python

Les dépendances LLM sont déjà listées dans `requirements.txt`:

```
ollama==0.1.48
requests==2.31.0
```

Si vous n'avez pas encore installé les dépendances:

```bash
cd backend
pip install -r requirements.txt
```

## Utilisation

### Vérification des mots de passe

Pendant l'enregistrement, le mot de passe Master est automatiquement vérifié:

**Endpoint:** `POST /api/security/check-password`

```bash
curl -X POST http://localhost:5000/api/security/check-password \
  -H "Content-Type: application/json" \
  -d '{
    "password": "MySecurePassword123!@#",
    "username": "john_doe",
    "email": "john@example.com"
  }'
```

**Réponse:**
```json
{
  "success": true,
  "analysis": {
    "overall_score": 85,
    "recommendation": "Strong: Password meets security requirements",
    "approved": true,
    "basic_analysis": {
      "length": 22,
      "has_uppercase": true,
      "has_lowercase": true,
      "has_digits": true,
      "has_special": true,
      "entropy_bits": 145.3
    },
    "sensitive_data_detected": {
      "detected_patterns": [],
      "is_risky": false
    }
  }
}
```

### Assistant IA

L'assistant IA utilise le LLM pour des réponses plus intelligentes et contextuelles.

**Endpoint:** `POST /api/ai/chat`

```bash
curl -X POST http://localhost:5000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Montre les mots de passe faibles",
    "context": {
      "entries_count": 42,
      "weak_entries": [
        {"service": "Gmail", "score": 45}
      ]
    },
    "use_llm": true
  }'
```

### Vérifier le statut du LLM

**Endpoint:** `GET /api/ai/llm-status`

```bash
curl http://localhost:5000/api/ai/llm-status
```

## Composants Frontend

### PasswordVerification

Composant React pour afficher l'analyse en temps réel du mot de passe:

```tsx
import { PasswordVerification } from '@/app/components/PasswordVerification';

export function RegisterForm() {
  const [password, setPassword] = useState('');
  const [isApproved, setIsApproved] = useState(false);

  return (
    <>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <PasswordVerification
        password={password}
        username="john_doe"
        email="john@example.com"
        onAnalysisComplete={(analysis) => setIsApproved(analysis.approved)}
      />
    </>
  );
}
```

### LLMStatusIndicator

Affiche le statut du LLM et les informations du modèle:

```tsx
import { LLMStatusIndicator } from '@/app/components/LLMStatusIndicator';

export function Dashboard() {
  return (
    <>
      <LLMStatusIndicator />
      {/* Rest of component */}
    </>
  );
}
```

## Modèles Recommandés

| Modèle | Taille | Vitesse | Qualité | Usage |
|--------|--------|---------|---------|-------|
| **mistral** | 4GB | ⚡⚡⚡ | ⭐⭐⭐ | Recommandé pour dev |
| neural-chat | 3.8GB | ⚡⚡⚡ | ⭐⭐⭐ | Bon pour conversation |
| dolphin-mixtral | 27GB | ⚡ | ⭐⭐⭐⭐ | Meilleur choix |
| llama2 | 3.8GB | ⚡⚡ | ⭐⭐⭐ | Bon compromis |

## Architecture

### Backend (`src/backend/llm/`)

- **llm_service.py**: Service principal d'intégration avec Ollama
- **password_analyzer.py**: Analyseur avancé de mots de passe avec vérifications heuristiques et LLM
- **ai_assistant.py**: Assistant IA avec support LLM et fallback heuristique

### Frontend (`src/app/lib/`)

- **llm-service.ts**: Client TypeScript pour les endpoints LLM
- **chat-assistant.ts**: Assistant de conversation amélioré avec support LLM asynchrone

### Composants (`src/app/components/`)

- **PasswordVerification.tsx**: Composant d'analyse en temps réel
- **LLMStatusIndicator.tsx**: Indicateur de statut et configuration

## Dépannage

### Ollama n'est pas disponible

**Erreur:** `Connection refused to http://localhost:11434`

**Solution:**
1. Assurez-vous qu'Ollama est lancé: `ollama serve`
2. Vérifiez que Ollama écoute sur le port 11434
3. Testez la connexion: `curl http://localhost:11434/api/tags`

### Modèle non trouvé

**Erreur:** `model 'mistral' not found`

**Solution:**
1. Listez les modèles disponibles: `ollama list`
2. Téléchargez un modèle: `ollama pull mistral`

### Performance lente

**Solution:**
- Utilisez un modèle plus léger (mistral ou neural-chat)
- Augmentez la RAM disponible
- Utilisez une GPU si disponible (Ollama supporte CUDA, Metal, etc.)

### Le backend ne voit pas Ollama

**Solution:**
1. Vérifiez la variable `OLLAMA_URL` dans `.env`
2. Assurez-vous que Ollama écoute sur `0.0.0.0:11434` si sur une autre machine
3. Vérifiez les pare-feu et règles réseau

## Améliorations futures

- [ ] Support de plusieurs modèles simultanément
- [ ] Cache des réponses LLM
- [ ] Fine-tuning du modèle sur les patterns de sécurité
- [ ] Interface pour télécharger/changer de modèle
- [ ] Métriques et analytics du LLM
- [ ] Support des appels asynchrones pour les requêtes longues
