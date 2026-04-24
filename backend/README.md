# MySafePass Backend

Backend Python pour MySafePass, un gestionnaire de mots de passe sécurisé avec chiffrement AES-256-GCM, authentification Argon2id, et architecture zero-knowledge.

## Architecture

Le backend implémente les modules suivants :

- **Authentification** : Argon2id pour le hachage des mots de passe maître
- **Stockage sécurisé** : SQLite avec SQLCipher pour le chiffrement de la base de données
- **Chiffrement des données** : AES-256-GCM pour chaque entrée du coffre-fort
- **Protection contre les attaques** : Rate limiting, blocage après échecs multiples
- **Audit** : Journalisation de toutes les actions sensibles

## Prérequis

- Python 3.11+
- Docker et Docker Compose (optionnel)
- libsqlcipher-dev (pour SQLCipher)

## Installation

### Option 1 : Développement local

1. Créer un environnement virtuel :
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate  # Windows
```

2. Installer les dépendances :
```bash
pip install -r requirements.txt
```

3. Copier le fichier d'environnement :
```bash
cp .env.example .env
```

4. Modifier `.env` avec vos propres valeurs de sécurité.

5. Démarrer le serveur :
```bash
python run.py
```

Le serveur sera disponible sur `http://localhost:5000`.

### Option 2 : Docker

1. Construire et démarrer avec Docker Compose :
```bash
docker-compose up --build
```

2. Le backend sera disponible sur `http://localhost:5000`.

## API Endpoints

### Authentification

- `POST /api/auth/register` - Inscription d'un nouvel utilisateur
- `POST /api/auth/login` - Connexion d'un utilisateur
- `POST /api/auth/change-password` - Changement du mot de passe maître

### Coffre-fort

- `GET /api/vault/entries` - Récupérer toutes les entrées
- `POST /api/vault/entries` - Ajouter une nouvelle entrée

### Utilitaires

- `GET /api/health` - Vérifier l'état du serveur
- `GET /api/version` - Obtenir la version de l'API

## Structure du projet

```
backend/
├── src/
│   └── backend/
│       ├── auth/           # Authentification et sécurité
│       ├── crypto/         # Modules cryptographiques
│       ├── database/       # Modèles et connexion DB
│       ├── api/            # Routes API
│       └── utils/          # Utilitaires (générateur, analyseur)
├── tests/                  # Tests backend
├── requirements.txt        # Dépendances Python
├── Dockerfile             # Configuration Docker
├── docker-compose.yml     # Orchestration Docker
└── run.py                 # Point d'entrée
```

## Sécurité

- **Argon2id** pour le hachage des mots de passe (time_cost=3, memory_cost=64MiB, parallelism=4)
- **AES-256-GCM** pour le chiffrement des entrées (256-bit key, 96-bit IV, 128-bit tag)
- **SQLCipher** pour le chiffrement de la base de données
- **Rate limiting** : 5 tentatives par minute sur les endpoints d'authentification
- **Blocage automatique** : 3 échecs → 15 min, 5 échecs → 1h, 10 échecs → 24h

## Tests

```bash
pytest tests/ -v --cov=src/backend
```

## Audit de sécurité

```bash
bandit -r src/
```

## Licence

MIT
