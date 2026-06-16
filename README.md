# Knight Companion

Application Next.js 15 + TypeScript pour accompagner une campagne Knight RPG.

## Stack

- Next.js 15 avec App Router
- TypeScript
- TailwindCSS
- shadcn/ui
- Prisma + PostgreSQL

## Démarrage

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run dev
```

Les premières pages sont des maquettes fonctionnelles en français. La couche d'accès distingue déjà les rôles joueur en lecture seule et administrateur, et le modèle Prisma prévoit l'import JSON Foundry VTT.

## Déploiement Scalingo

Le dépôt contient les fichiers nécessaires au déploiement Node.js sur Scalingo :

- `Procfile` lance le serveur web et exécute les migrations Prisma après déploiement.
- `scalingo.json` déclare l'addon PostgreSQL, les variables d'environnement et la formation web.
- `prisma/migrations` contient la migration initiale pour `prisma migrate deploy`.

Variables attendues côté Scalingo :

```text
DATABASE_URL=$SCALINGO_POSTGRESQL_URL
NEXT_PUBLIC_APP_NAME=Knight Companion
NODE_ENV=production
```

La commande de build exécute `prisma generate` puis `next build`. Le serveur écoute le port fourni par Scalingo via `PORT`.
