# Installer la plateforme sur un serveur Linux

Ce guide part d'un serveur Linux neuf, sans interface graphique, et aboutit à un site en ligne en HTTPS.
Tout se fait en ligne de commande, par SSH. Comptez environ une heure.

Tout tourne dans Docker : le site, le worker (traitement des planches, publications programmées,
synchronisations, notifications), PostgreSQL, Redis, Meilisearch, le stockage des images, et Caddy
qui reçoit le trafic et gère les certificats HTTPS.

## 1. Ce qu'il vous faut

| Élément | Détail |
|---|---|
| Serveur | Debian 12 ou Ubuntu 24.04, 2 cœurs et 4 Go de mémoire au minimum, 40 Go de disque (davantage selon le volume d'images) |
| Nom de domaine | Par exemple `exemple.fr`, dont vous pouvez modifier les enregistrements DNS |
| Envoi d'emails | Un compte SMTP chez un fournisseur (Brevo, Mailjet, Scaleway, OVH…) : hôte, port, identifiant, mot de passe |
| Accès | Une connexion SSH au serveur avec les droits administrateur (`sudo`) |

L'encodage des images est gourmand : avec 2 cœurs, le traitement d'un gros chapitre prend quelques minutes.

## 2. Faire pointer le domaine vers le serveur

Chez votre registraire, créez deux enregistrements de type **A** vers l'adresse IP du serveur :

| Nom | Type | Valeur |
|---|---|---|
| `exemple.fr` | A | adresse IP du serveur |
| `images.exemple.fr` | A | adresse IP du serveur |

Si le serveur a une adresse IPv6, ajoutez les deux enregistrements **AAAA** correspondants.

Vérifiez depuis le serveur avant de continuer (la propagation peut prendre quelques minutes) :

```bash
getent hosts exemple.fr images.exemple.fr
```

Les certificats HTTPS ne pourront pas être obtenus tant que ces deux noms ne répondent pas.

## 3. Préparer le serveur

Connectez-vous en SSH, puis mettez le système à jour :

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl ufw
```

Ouvrez uniquement SSH et le web dans le pare-feu :

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443
sudo ufw enable
```

Installez Docker avec le script officiel, puis autorisez votre utilisateur à s'en servir :

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
```

Déconnectez-vous et reconnectez-vous pour que ce droit prenne effet, puis vérifiez :

```bash
docker --version && docker compose version
```

## 4. Récupérer le code

```bash
sudo mkdir -p /srv/hlm && sudo chown $USER: /srv/hlm
git clone https://github.com/bendjibanana-netizen/HLM.git /srv/hlm
cd /srv/hlm
git checkout claude/webtoon-manga-platform-4ruchx
```

Le dépôt est privé : GitHub demandera un identifiant et un jeton d'accès personnel
(à créer dans GitHub : *Settings → Developer settings → Personal access tokens*).
Une fois la branche fusionnée dans `main`, la dernière commande devient inutile.

Toutes les commandes suivantes se lancent depuis `/srv/hlm`.

## 5. Configurer

Créez le fichier de configuration à partir du modèle :

```bash
cp deploiement/env.production.exemple .env
chmod 600 .env
```

Générez les secrets. Chaque commande affiche une valeur à copier dans `.env` :

```bash
openssl rand -base64 32   # BETTER_AUTH_SECRET
openssl rand -hex 24      # POSTGRES_MOT_DE_PASSE
openssl rand -hex 24      # MEILISEARCH_CLE
openssl rand -hex 12      # S3_ACCESS_KEY_ID
openssl rand -hex 24      # S3_SECRET_ACCESS_KEY
```

Ouvrez le fichier (`nano .env`) et remplissez au minimum :

| Variable | Valeur |
|---|---|
| `DOMAINE` | votre domaine, sans `https://` |
| `EMAIL_CERTIFICATS` | une adresse que vous lisez (alertes de certificat) |
| les cinq secrets | les valeurs générées ci-dessus |
| `ADMIN_EMAIL`, `ADMIN_MOT_DE_PASSE` | le compte administrateur créé à l'étape 7 |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | fournis par votre service d'envoi d'emails |
| `EMAIL_EXPEDITEUR` | une adresse de votre domaine, autorisée chez ce service |
| `LEGAL_…` | éditeur, adresse, contact, directeur de la publication, hébergeur |

Deux points à connaître :

- **Ne changez plus `BETTER_AUTH_SECRET` après la mise en ligne.** Il sert aussi à chiffrer les IBAN des
  équipes et les jetons des sources de synchronisation : le changer les rendrait illisibles et déconnecterait
  tous les comptes.
- Les mentions `LEGAL_…` s'affichent dans les pages légales. Tant qu'elles sont vides, ces pages montrent
  « [à compléter …] ». Les textes fournis sont des modèles : faites-les relire avant d'ouvrir le site.

## 6. Construire et démarrer

Pour ne pas répéter le nom du fichier à chaque commande :

```bash
echo "alias dc='docker compose -f /srv/hlm/docker-compose.prod.yml'" >> ~/.bashrc && source ~/.bashrc
```

Puis :

```bash
dc up -d --build
```

La première construction prend 5 à 10 minutes. Les migrations de la base s'appliquent toutes seules avant
le démarrage du site. Vérifiez l'état :

```bash
dc ps
```

Tous les services doivent être `running`, sauf `migration` qui s'arrête normalement (`exited (0)`).

## 7. Initialiser

Trois commandes, à lancer une seule fois :

```bash
dc run --rm site npm run stockage:init    # crée l'espace de stockage des images
dc run --rm site npm run db:seed          # crée le compte admin et les genres
```

Ouvrez `https://exemple.fr` : le site répond en HTTPS (le premier certificat prend jusqu'à une minute).
Connectez-vous avec le compte administrateur ; l'administration est sur `/admin`.

Pour essayer le site avec des séries de démonstration inventées (facultatif, 5 à 10 minutes) :

```bash
dc run --rm site npm run db:demo
```

Relancer cette commande remplace la démo précédente. Pour la retirer, supprimez ses trois équipes
depuis la base, ou repartez d'une base vide avant l'ouverture.

## 8. Premiers réglages dans l'administration

1. **Mentions légales** : vérifiez `/mentions-legales`, `/cgu` et `/confidentialite`.
2. **Invitations** (`/admin/invitations`) : invitez vos premières équipes. Elles reçoivent un lien par email.
3. **Modération** (`/moderation`) : chaque nouvelle série attend votre validation avant d'être publique.
4. **Publicité** (`/admin/publicite`) : collez le code de votre régie dans les emplacements voulus.
5. **Revenus** (`/admin/revenus`) : chaque mois terminé, saisissez le revenu publicitaire à répartir.

## 9. Options

### Connexion avec Google et Discord

Créez une application chez chaque fournisseur avec ces adresses de retour, puis renseignez les identifiants
dans `.env` et relancez `dc up -d` :

- Google : `https://exemple.fr/api/auth/callback/google`
- Discord : `https://exemple.fr/api/auth/callback/discord`

### Notifications push

```bash
dc run --rm site npx web-push generate-vapid-keys
```

Copiez les deux clés dans `.env` (`NEXT_PUBLIC_VAPID_CLE_PUBLIQUE`, `VAPID_CLE_PRIVEE`), puis **reconstruisez** :
la clé publique est inscrite dans le code envoyé au navigateur.

```bash
dc up -d --build
```

### Synchronisation depuis Google Drive

Créez une clé d'API Google avec l'API Drive activée, mettez-la dans `GOOGLE_DRIVE_CLE_API`, puis `dc up -d`.

### Images sur Cloudflare R2 plutôt que sur le serveur

Utile si le volume d'images dépasse le disque du serveur. Créez un bucket R2, un jeton d'accès, et reliez
un domaine public au bucket. Dans `.env`, décommentez les quatre lignes de la section « Stockage externe »,
mettez les clés du jeton dans `S3_ACCESS_KEY_ID` et `S3_SECRET_ACCESS_KEY`, puis reconstruisez (`dc up -d --build`).
L'étape `stockage:init` ne s'applique pas à R2 : la lecture publique se règle chez Cloudflare.
Seuls les dossiers `series/`, `equipes/` et `demo/` doivent être publics ; `prive/` doit rester fermé.

## 10. Mettre à jour

```bash
cd /srv/hlm
./deploiement/sauvegarde.sh        # toujours sauvegarder avant
git pull
dc up -d --build
```

Les nouvelles migrations s'appliquent automatiquement. Le site est indisponible quelques secondes pendant
le redémarrage.

## 11. Sauvegarder et restaurer

Le script sauvegarde la base et les images dans `deploiement/sauvegardes/` et garde 14 jours :

```bash
./deploiement/sauvegarde.sh
```

Pour le lancer chaque nuit à 4 h :

```bash
(crontab -l 2>/dev/null; echo "0 4 * * * cd /srv/hlm && ./deploiement/sauvegarde.sh >> /var/log/hlm-sauvegarde.log 2>&1") | crontab -
```

Une sauvegarde qui reste sur le même serveur ne protège pas d'une panne de disque : copiez régulièrement ce
dossier ailleurs (autre serveur, stockage objet), par exemple avec `rsync` ou `rclone`.

**Restaurer** (remplace les données actuelles) :

```bash
dc stop site worker
gunzip -c deploiement/sauvegardes/base_AAAA-MM-JJ_HHMM.sql.gz | dc exec -T postgres psql -U hlm hlm
dc exec -T stockage sh -c "rm -rf /data/* && tar -xzf - -C /data" < deploiement/sauvegardes/images_AAAA-MM-JJ_HHMM.tar.gz
dc restart stockage
dc start site worker
dc run --rm site npm run recherche:reindexer   # reconstruit l'index de recherche depuis la base
```

## 12. Surveiller et dépanner

```bash
dc ps                         # état des services
dc logs -f site worker        # journaux en direct (Ctrl+C pour quitter)
dc logs --tail 100 caddy      # certificats et trafic
df -h /                       # place disponible sur le disque
docker system prune -f        # libère les anciennes images après plusieurs mises à jour
```

| Symptôme | Cause probable et remède |
|---|---|
| Le navigateur signale un certificat invalide | Le DNS ne pointe pas encore vers le serveur, ou les ports 80/443 sont fermés. Vérifiez l'étape 2 et `sudo ufw status`, puis `dc restart caddy`. |
| Les emails n'arrivent pas | Identifiants SMTP erronés, ou adresse d'expéditeur non autorisée chez le fournisseur. Voir `dc logs site`. |
| Un chapitre reste « Traitement en cours » | Le worker est arrêté ou saturé : `dc ps`, puis `dc logs worker`. Après un échec répété, le chapitre repasse en brouillon. |
| Les images ne s'affichent pas | `images.exemple.fr` ne pointe pas vers le serveur, ou `stockage:init` n'a pas été lancé. |
| La recherche ne renvoie rien | `dc run --rm site npm run recherche:reindexer`. |
| `dc up` s'arrête sur « Renseignez EMAIL_CERTIFICATS » | La variable est vide dans `.env`. |

## 13. Sécurité : l'essentiel

- Seuls les ports 80 et 443 (et SSH) sont ouverts. La base, Redis, Meilisearch et le stockage ne sont pas
  joignables depuis Internet.
- Le fichier `.env` contient tous les secrets : gardez-le en lecture réservée (`chmod 600`) et hors de toute sauvegarde publique.
- Connectez-vous en SSH par clé plutôt que par mot de passe, et activez les mises à jour de sécurité automatiques :
  `sudo apt install -y unattended-upgrades && sudo dpkg-reconfigure -plow unattended-upgrades`.
- Le robot de synchronisation ne contacte que des adresses publiques. La variable `SYNC_AUTORISER_LOCAL` ne sert
  qu'aux tests en local et est ignorée en production.

## Ce qui a été vérifié, et ce qui ne l'a pas été

Vérifié sur une pile de production complète lancée en local, avec `localhost` comme domaine :
construction de l'image, migrations, démarrage du site et du worker, HTTPS avec redirection et en-têtes de
sécurité, initialisation du stockage, création du compte admin, connexion, lecture publique des images et
refus des dossiers privés, réindexation, script de sauvegarde.

Non vérifié, faute de pouvoir le faire dans l'environnement de développement :

- l'obtention d'un vrai certificat Let's Encrypt (elle demande un domaine public) ;
- l'étape d'installation des paquets système du `Dockerfile`, dont le dépôt n'était pas joignable depuis
  l'environnement de test : elle est standard, mais signalez toute erreur à la construction ;
- la restauration complète d'une sauvegarde ;
- Cloudflare R2, la connexion Google et Discord, l'envoi réel de notifications push, et les synchronisations
  Google Drive et Discord, qui demandent des comptes chez ces services.
