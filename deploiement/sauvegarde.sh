#!/usr/bin/env bash
# Sauvegarde de la plateforme : base de données et images.
# Usage : ./deploiement/sauvegarde.sh            (à lancer depuis la racine du projet, ou par cron)
# Les sauvegardes vont dans deploiement/sauvegardes/ ; celles de plus de 14 jours sont supprimées.
set -euo pipefail

cd "$(dirname "$0")/.."
COMPOSE="${COMPOSE:-docker compose -f docker-compose.prod.yml}"
SERVICE_STOCKAGE="${SERVICE_STOCKAGE:-stockage}"
DOSSIER="deploiement/sauvegardes"
DATE="$(date +%Y-%m-%d_%H%M)"
mkdir -p "$DOSSIER"

# Base de données : export complet, compressé.
$COMPOSE exec -T postgres pg_dump -U hlm --clean --if-exists hlm | gzip > "$DOSSIER/base_$DATE.sql.gz"

# Images : archive du dossier de données du stockage (inutile avec Cloudflare R2).
if $COMPOSE ps --services --status running | grep -qx "$SERVICE_STOCKAGE"; then
  $COMPOSE exec -T "$SERVICE_STOCKAGE" tar -czf - -C /data . > "$DOSSIER/images_$DATE.tar.gz"
fi

# Ménage : on garde 14 jours.
find "$DOSSIER" -type f -mtime +14 -delete

echo "Sauvegarde terminée :"
ls -lh "$DOSSIER" | grep "$DATE"
