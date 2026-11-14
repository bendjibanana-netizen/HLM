# Image de production : sert à la fois au site (npm start) et au worker (npm run worker).
# Construction : docker compose -f docker-compose.prod.yml build
FROM node:22-bookworm-slim AS base
WORKDIR /app
# openssl : requis par Prisma ; ca-certificates : appels HTTPS sortants (emails, robots, push).
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates && rm -rf /var/lib/apt/lists/*

# ── Dépendances ──
FROM base AS dependances
COPY package.json package-lock.json prisma.config.ts ./
COPY prisma ./prisma
# Les dépendances de développement restent : le worker et les scripts s'exécutent avec tsx.
RUN npm ci --ignore-scripts && npx prisma generate

# ── Compilation du site ──
FROM dependances AS construction
COPY . .
# Les variables NEXT_PUBLIC_* sont inscrites dans le code envoyé au navigateur : elles doivent être connues ici.
ARG NEXT_PUBLIC_NOM_SITE=HLM
ARG NEXT_PUBLIC_URL_IMAGES
ARG NEXT_PUBLIC_VAPID_CLE_PUBLIQUE=
ARG APP_URL
ENV NEXT_PUBLIC_NOM_SITE=$NEXT_PUBLIC_NOM_SITE NEXT_PUBLIC_URL_IMAGES=$NEXT_PUBLIC_URL_IMAGES NEXT_PUBLIC_VAPID_CLE_PUBLIQUE=$NEXT_PUBLIC_VAPID_CLE_PUBLIQUE APP_URL=$APP_URL
# Valeurs factices, utilisées uniquement pendant la compilation : aucune connexion n'est ouverte et rien n'est conservé dans l'image finale.
RUN DATABASE_URL=postgresql://construction:construction@localhost:5432/construction \
    BETTER_AUTH_SECRET=valeur-factice-pour-la-compilation-uniquement-0000 \
    NEXT_TELEMETRY_DISABLED=1 npm run build

# ── Image finale ──
FROM base AS production
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
COPY --from=construction --chown=node:node /app /app
# Le site ne tourne pas en administrateur dans le conteneur.
USER node
EXPOSE 3000
CMD ["npm", "start"]
