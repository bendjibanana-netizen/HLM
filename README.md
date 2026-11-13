# Plateforme de lecture — webtoons, mangas, manhwas

Plateforme web de lecture de BD numériques, publiées par des équipes et des auteurs invités,
avec une dimension communautaire (notes, critiques, listes). Mobile d'abord.

**État : phases 1 et 2 terminées** (socle, catalogue, recherche et lecteur). L'espace équipe arrive en phase 3.

## Démarrer en local

Prérequis : Node.js 22 ou plus récent, Docker.

```bash
# 1. Dépendances
npm install

# 2. Configuration
cp .env.example .env
# Puis, dans .env :
#   BETTER_AUTH_SECRET  → générer avec : openssl rand -base64 32
#   ADMIN_MOT_DE_PASSE  → mot de passe du compte administrateur (8 caractères minimum)

# 3. Services (Postgres, Redis, stockage S3, Meilisearch, boîte mail de test)
docker compose up -d

# 4. Base de données : tables, puis compte admin et genres
npm run db:deploy
npm run db:seed

# 5. Séries de démonstration (facultatif, environ 5 minutes : génère et encode 236 planches)
npm run db:demo

# 6. Lancer le site
npm run dev
```

Le site est sur http://localhost:3000.

| Service | Adresse | Rôle |
|---|---|---|
| Site | http://localhost:3000 | Application |
| Mailpit | http://localhost:8025 | Tous les emails envoyés en local arrivent ici |
| Stockage (console) | http://localhost:9001 | Images, compatible S3 |
| Meilisearch | http://localhost:7700 | Recherche instantanée |
| Postgres | localhost:5432 | Base de données (`hlm` / `hlm`) |
| Redis | localhost:6379 | Files d'attente et vues — utilisé à partir de la phase 3 |

## Commandes

| Commande | Effet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` puis `npm start` | Version de production |
| `npm run lint` | Vérification du style de code |
| `npm run typecheck` | Vérification des types |
| `npm test` | Tests unitaires |
| `npm run db:migrate` | Crée et applique une migration après modification du schéma |
| `npm run db:deploy` | Applique les migrations existantes |
| `npm run db:seed` | Compte admin et genres (relançable sans doublon) |
| `npm run db:demo` | Séries de démonstration (remplace la démo précédente) |
| `npm run recherche:reindexer` | Reconstruit l'index de recherche depuis la base |
| `npm run db:studio` | Explorateur de la base dans le navigateur |

## Connexion avec Google et Discord

Les boutons n'apparaissent que si les identifiants sont renseignés dans `.env`.

- Google : créer un identifiant OAuth, URL de retour `http://localhost:3000/api/auth/callback/google`
- Discord : créer une application, URL de retour `http://localhost:3000/api/auth/callback/discord`

## Organisation du code

```
prisma/               Schéma de la base (42 modèles), migrations, données initiales et de démo
messages/             Traductions de l'interface (fr.json, en.json)
src/app/[locale]/     Pages, par langue
  (site)/             Pages avec en-tête et navigation
  (auth)/             Connexion, inscription, mot de passe oublié
  (lecteur)/          Lecteur plein écran (défilement vertical et page par page)
src/app/api/auth/     Point d'entrée de l'authentification
src/components/ui/    Design system (boutons, champs, badges, étoiles, panneau modal…)
src/components/       Mise en page et formulaires
src/lib/              Base de données, authentification, emails, stockage, images, recherche
src/server/           Requêtes du catalogue
src/i18n/             Langues et adresses traduites
tests/                Tests unitaires
```

La page `/design` rassemble tous les composants du design system.

## Images

Chaque image est déclinée une fois, à l'envoi, en AVIF et en WebP et en plusieurs largeurs
(`src/lib/images/`). Le navigateur choisit la déclinaison adaptée à l'écran ; les fichiers sont
servis directement par le stockage (un CDN en production), avec un cache d'un an.

Les données de démonstration sont entièrement inventées et leurs images sont dessinées par code
(`prisma/demo/`).

## Conventions

- Code et commentaires en français.
- Toute navigation interne passe par `@/i18n/navigation` (liens traduits), pas par `next/link`.
- Les textes de l'interface vont dans `messages/fr.json` et `messages/en.json`, jamais en dur.
- Les couleurs viennent des variables du thème (`bg-fond`, `text-texte-doux`, `bg-accent`…),
  définies dans `src/app/globals.css`.
- Le rôle global d'un compte (lecteur, modérateur, admin) est distinct de l'appartenance à une équipe.
