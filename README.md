# MySafePass

**Your Passwords, Your Control**

MySafePass est un gestionnaire de mots de passe sécurisé et intelligent, développé dans le cadre d'un projet académique à l'École Nationale des Sciences Appliquées - Béni Mellal.

## Fonctionnalités

### Module 1 : Génération de Mots de Passe
- Génération aléatoire cryptographiquement sécurisée
- Longueur configurable (8 à 64 caractères)
- Types de caractères sélectionnables (minuscules, majuscules, chiffres, symboles)
- Évaluation de force avec calcul d'entropie et détection de patterns faibles
- Score 0-100 avec recommandations personnalisées
- Estimation du temps de crack

### Module 2 : Stockage Sécurisé
- Chiffrement AES-256-GCM pour chaque entrée
- Architecture zero-knowledge
- Base de données chiffrée avec SQLCipher
- Dérivation de clés robuste avec Argon2id
- Recherche, filtrage et tri des entrées
- Historique des modifications

### Module 3 : Chatbot Intelligent
- Interface conversationnelle naturelle
- Compréhension du langage naturel
- Support bilingue (français/anglais)
- Suggestions contextuelles
- Gestion de session avec timeout automatique (3h)

### Module 4 : Protection Contre les Attaques
- **Brute Force** : Rate limiting, blocage temporaire après échecs multiples
- **Fuite de Données** : Chiffrement complet, pas de stockage en clair
- **Phishing** : Avertissements, vérification de domaines suspects
- **Audit** : Journalisation complète de toutes les actions sensibles

## Architecture

MySafePass suit une architecture hybride :

- **Frontend** : React/Vite avec TypeScript, interface utilisateur moderne et réactive
- **Backend** : Python/Flask avec chiffrement AES-256-GCM, Argon2id, SQLCipher
- **Communication** : API REST sécurisée avec JWT

### Stack Technologique

| Composant | Technologie |
|-----------|-------------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | Python 3.11+, Flask, SQLAlchemy |
| Cryptographie | AES-256-GCM, Argon2id, SQLCipher |
| Base de données | SQLite avec SQLCipher |
| Conteneurisation | Docker, Docker Compose |

## Installation

### Prérequis

- Node.js 18+ et npm/pnpm
- Python 3.11+ (pour le backend)
- Docker et Docker Compose (optionnel)

### Option 1 : Développement local (Frontend + Backend)

#### 1. Cloner le repository

```bash
git clone https://github.com/fox-im-ma/MysafePass.git
cd MysafePass
```

#### 2. Installer et démarrer le Frontend

```bash
# Installer les dépendances
pnpm install
# ou
npm install

# Copier le fichier d'environnement
cp .env.example .env.local

# Démarrer le serveur de développement
pnpm dev
# ou
npm run dev
```

Le frontend sera disponible sur `http://localhost:5173`.

#### 3. Installer et démarrer le Backend

```bash
cd backend

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows

# Installer les dépendances
pip install -r requirements.txt

# Copier le fichier d'environnement
cp .env.example .env

# Démarrer le serveur
python run.py
```

Le backend sera disponible sur `http://localhost:5000`.

### Option 2 : Docker (Backend uniquement)

```bash
cd backend

# Construire et démarrer avec Docker Compose
docker-compose up --build
```

Le backend sera disponible sur `http://localhost:5000`.

## Structure du projet

```
MSP/
├── src/                    # Frontend React
│   ├── app/
│   │   ├── components/     # Composants UI
│   │   ├── context/        # Contextes React (VaultContext)
│   │   ├── lib/            # Utilitaires (vault, password-tools, api)
│   │   └── pages/          # Pages de l'application
│   ├── styles/             # Feuilles de style
│   └── main.tsx            # Point d'entrée
├── backend/                # Backend Python
│   ├── src/backend/
│   │   ├── auth/           # Authentification et sécurité
│   │   ├── crypto/         # Modules cryptographiques
│   │   ├── database/       # Modèles et connexion DB
│   │   ├── api/            # Routes API
│   │   └── utils/          # Utilitaires
│   ├── tests/              # Tests backend
│   ├── Dockerfile          # Configuration Docker
│   ├── docker-compose.yml  # Orchestration Docker
│   ├── run.py              # Point d'entrée Flask
│   └── requirements.txt    # Dépendances Python
├── guidelines/             # Guidelines de développement
├── index.html              # Page HTML principale
├── package.json            # Dépendances frontend
├── vite.config.ts          # Configuration Vite
└── README.md               # Ce fichier
```

## Configuration

### Frontend (.env.local)

```env
VITE_API_URL=http://localhost:5000
```

### Backend (.env)

```env
# Flask Configuration
FLASK_ENV=development
SECRET_KEY=votre-clé-secrète-unique

# Database Configuration
DATABASE_PATH=data/mysafepass.db
DATABASE_ENCRYPTION_KEY=votre-clé-de-chiffrement-32-caractères

# JWT Configuration
JWT_SECRET_KEY=votre-clé-jwt-secrète

# CORS Configuration
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

## Sécurité

MySafePass implémente les meilleures pratiques de sécurité :

- **Argon2id** pour le hachage des mots de passe maître (time_cost=3, memory_cost=64MiB, parallelism=4)
- **AES-256-GCM** pour le chiffrement des entrées (256-bit key, 96-bit IV, 128-bit tag)
- **SQLCipher** pour le chiffrement de la base de données
- **Rate limiting** : 5 tentatives par minute sur les endpoints d'authentification
- **Blocage automatique** : 3 échecs → 15 min, 5 échecs → 1h, 10 échecs → 24h
- **Audit trail** : Toutes les actions sensibles sont journalisées

## Tests

### Frontend

Les tests frontend ne sont pas encore configurés. La vérification actuelle se fait via :

```bash
pnpm build
```

### Backend

```bash
cd backend
pytest tests/ -v --cov=src/backend
```

### Audit de sécurité

```bash
cd backend
bandit -r src/
```

## API Documentation

### Authentification

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth/register` | Inscription d'un nouvel utilisateur |
| POST | `/api/auth/login` | Connexion d'un utilisateur |
| POST | `/api/auth/change-password` | Changement du mot de passe maître |

### Coffre-fort

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/vault/entries` | Récupérer toutes les entrées |
| POST | `/api/vault/entries` | Ajouter une nouvelle entrée |

### Utilitaires

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/health` | Vérifier l'état du serveur |
| GET | `/api/version` | Obtenir la version de l'API |

## Équipe

- **KPADENOU Kossi Roland**
- **MAJID Imane**

Encadré par **Pr. OUNACHAD**

## Licence

MIT License - Voir le fichier LICENSE pour plus de détails.

## Remerciements

Nous remercions notre encadrant Pr. OUNACHAD pour son accompagnement tout au long de ce projet académique.
