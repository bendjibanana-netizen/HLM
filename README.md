# Plateforme de lecture — webtoons, mangas, manhwas

Plateforme web de lecture de BD numériques, publiées par des équipes et des auteurs invités,
avec une dimension communautaire (notes, critiques, listes). Mobile d'abord.

**État : phase 1 terminée (socle).** Le catalogue et le lecteur arrivent en phase 2.

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

# 5. Lancer le site
npm run dev
```

Le site est sur http://localhost:3000.

| Service | Adresse | Rôle |
|---|---|---|
| Site | http://localhost:3000 | Application |
| Mailpit | http://localhost:8025 | Tous les emails envoyés en local arrivent ici |
| Stockage (console) | http://localhost:9001 | Images, compatible S3 — utilisé à partir de la phase 2 |
| Meilisearch | http://localhost:7700 | Recherche — utilisée à partir de la phase 2 |
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
| `npm run db:studio` | Explorateur de la base dans le navigateur |

## Connexion avec Google et Discord

Les boutons n'apparaissent que si les identifiants sont renseignés dans `.env`.

- Google : créer un identifiant OAuth, URL de retour `http://localhost:3000/api/auth/callback/google`
- Discord : créer une application, URL de retour `http://localhost:3000/api/auth/callback/discord`

## Organisation du code

```
prisma/               Schéma de la base (42 modèles), migrations, données initiales
messages/             Traductions de l'interface (fr.json, en.json)
src/app/[locale]/     Pages, par langue
  (site)/             Pages avec en-tête et navigation
  (auth)/             Connexion, inscription, mot de passe oublié
src/app/api/auth/     Point d'entrée de l'authentification
src/components/ui/    Design system (boutons, champs, badges, étoiles, panneau modal…)
src/components/       Mise en page et formulaires
src/lib/              Base de données, authentification, emails, règles d'accès
src/i18n/             Langues et adresses traduites
tests/                Tests unitaires
```

La page `/design` rassemble tous les composants du design system.

## Conventions

- Code et commentaires en français.
- Toute navigation interne passe par `@/i18n/navigation` (liens traduits), pas par `next/link`.
- Les textes de l'interface vont dans `messages/fr.json` et `messages/en.json`, jamais en dur.
- Les couleurs viennent des variables du thème (`bg-fond`, `text-texte-doux`, `bg-accent`…),
  définies dans `src/app/globals.css`.
- Le rôle global d'un compte (lecteur, modérateur, admin) est distinct de l'appartenance à une équipe.
