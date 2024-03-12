# Pong Competition Website

Bienvenue sur le dépôt GitHub du projet de site web pour la compétition du jeu Pong ! Ce site permet aux utilisateurs de jouer à Pong entre eux en temps réel, d'utiliser un chat et de participer à des parties multijoueurs en ligne.

## Vue d'ensemble

<div>
  <img src="screenshot/dashboard.png" width="400" height="200">
  <img src="screenshot/game.png" width="400" height="200">
<div>

Ce projet intègre une interface utilisateur interactive, un système de chat, et la possibilité de jouer à Pong en ligne avec d'autres joueurs. Voici les principales technologies utilisées :

- **Backend** : NestJS
- **Frontend** : NextJS
- **Base de données** : PostgreSQL

## Installation et lancement

Pour exécuter ce projet, vous devez avoir Docker installé sur votre machine. Lancez le projet avec la commande suivante :

```bash
docker-compose up --build
```

## Caractéristiques
- Jeu en temps réel : Les utilisateurs peuvent jouer à Pong en temps réel.
- Chat : Création de channels publics, privés, ou protégés par mot de passe, envoi de messages directs, et gestion des utilisateurs (bloquer, administrer).
- Authentification : Connexion via le système OAuth de l'intranet 42/GitHub et possibilité d'activer l'authentification à deux facteurs avec google authenticator.
- Profil utilisateur : Affichage de statistiques, d'un avatar (téléchargeable ou par défaut), et d'un historique de matchs.

## Sécurité
Tous les mots de passe sont chiffrés dans la base de données.
Protection contre les injections SQL.

Validation côté serveur pour les formulaires et toutes les requêtes utilisateurs.

## Configuration
Les informations d’identification, clés API, et variables d’environnement sont stockées dans un fichier .env et ignorées par git pour des raisons de sécurité.
Pour configurer correctement l'application, vous devez définir les variables d'environnement suivantes dans un fichier `.env` à la racine du projet. Ce fichier contient des informations sensibles et ne doit pas être inclus dans le contrôle de version.

- `POSTGRES_PASSWORD`: Le mot de passe pour l'utilisateur de la base de données PostgreSQL.
- `POSTGRES_USER`: Le nom de l'utilisateur pour se connecter à la base de données PostgreSQL.
- `POSTGRES_DB`: Le nom de la base de données PostgreSQL à utiliser.
- `PGDATA`: Le chemin du dossier où PostgreSQL stocke ses fichiers de données.
- `REVERSE_PROXY_URL`: L'URL du reverse proxy utilisé pour rediriger les requêtes vers l'application.

### Frontend

- `API_BASE_URL`: L'URL de base de l'API backend utilisée par le frontend pour les requêtes HTTP.

### Backend

- `DATABASE_URL`: L'URL de connexion à la base de données PostgreSQL, formatée selon l'environnement de déploiement (production ou développement).

### API
- `42_CLIENT_ID`: Les identifiants client OAuth pour l'authentification via l'intranet 42. Ces valeurs sont fournies par l'API de 42 lors de l'enregistrement de votre application.
- `API42_CLIENT_SECRET`: Ces valeurs sont fournies par l'API de 42 lors de l'enregistrement de votre application.
- `API_GITHUB_CLIENT_ID`: Les identifiants client OAuth pour l'authentification via GitHub. Ces valeurs sont fournies par l'API de GitHub lors de l'enregistrement de votre application.
- `API_GITHUB_CLIENT_SECRET`: Ces valeurs sont fournies par l'API de GitHub lors de l'enregistrement de votre application.
- `TWO_FACTOR_AUTHENTICATION_APP_NAME`: Le nom de votre application tel qu'il apparaîtra dans les applications d'authentification à deux facteurs telles que Google Authenticator.
- `NODE_ENV`: Définit l'environnement dans lequel l'application s'exécute (production pour la mise en production, development pour le développement).
