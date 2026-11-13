-- CreateEnum
CREATE TYPE "Role" AS ENUM ('LECTEUR', 'MODERATEUR', 'ADMIN');

-- CreateEnum
CREATE TYPE "RoleEquipe" AS ENUM ('CHEF', 'MEMBRE');

-- CreateEnum
CREATE TYPE "StatutEquipe" AS ENUM ('ACTIVE', 'SUSPENDUE');

-- CreateEnum
CREATE TYPE "TypeInvitation" AS ENUM ('NOUVELLE_EQUIPE', 'REJOINDRE_EQUIPE');

-- CreateEnum
CREATE TYPE "StatutJuridique" AS ENUM ('PARTICULIER', 'AUTO_ENTREPRENEUR', 'SOCIETE', 'ASSOCIATION', 'AUTRE');

-- CreateEnum
CREATE TYPE "TypeSerie" AS ENUM ('WEBTOON', 'MANGA', 'MANHWA', 'MANHUA');

-- CreateEnum
CREATE TYPE "Langue" AS ENUM ('FR', 'EN');

-- CreateEnum
CREATE TYPE "StatutSerie" AS ENUM ('EN_COURS', 'TERMINE', 'EN_PAUSE', 'ABANDONNE');

-- CreateEnum
CREATE TYPE "ClassificationAge" AS ENUM ('TOUT_PUBLIC', 'DOUZE_PLUS', 'SEIZE_PLUS');

-- CreateEnum
CREATE TYPE "SensLecture" AS ENUM ('VERTICAL', 'DROITE_A_GAUCHE', 'GAUCHE_A_DROITE');

-- CreateEnum
CREATE TYPE "StatutModeration" AS ENUM ('BROUILLON', 'EN_ATTENTE', 'PUBLIEE', 'REFUSEE', 'RETIREE');

-- CreateEnum
CREATE TYPE "StatutChapitre" AS ENUM ('BROUILLON', 'EN_TRAITEMENT', 'PROGRAMME', 'PUBLIE', 'RETIRE');

-- CreateEnum
CREATE TYPE "OrigineChapitre" AS ENUM ('MANUEL', 'SYNCHRONISATION');

-- CreateEnum
CREATE TYPE "RoleAuteur" AS ENUM ('SCENARIO', 'DESSIN', 'SCENARIO_ET_DESSIN', 'OEUVRE_ORIGINALE');

-- CreateEnum
CREATE TYPE "TypeListe" AS ENUM ('A_LIRE', 'EN_COURS', 'TERMINE', 'ABANDONNE', 'LIBRE');

-- CreateEnum
CREATE TYPE "TypeActivite" AS ENUM ('NOTE', 'CRITIQUE', 'AJOUT_LISTE', 'LECTURE', 'SUIVI_SERIE', 'SUIVI_UTILISATEUR');

-- CreateEnum
CREATE TYPE "TypeNotification" AS ENUM ('NOUVEAU_CHAPITRE', 'REPONSE_COMMENTAIRE', 'LIKE', 'NOUVEL_ABONNE', 'MODERATION', 'SYSTEME');

-- CreateEnum
CREATE TYPE "CibleSignalement" AS ENUM ('SERIE', 'CHAPITRE', 'COMMENTAIRE', 'CRITIQUE', 'UTILISATEUR');

-- CreateEnum
CREATE TYPE "MotifSignalement" AS ENUM ('CONTENU_ILLEGAL', 'CONTENU_SEXUEL', 'MAUVAISE_CLASSIFICATION', 'DROITS_AUTEUR', 'SPAM', 'HARCELEMENT', 'AUTRE');

-- CreateEnum
CREATE TYPE "StatutSignalement" AS ENUM ('OUVERT', 'EN_COURS', 'RESOLU', 'REJETE');

-- CreateEnum
CREATE TYPE "StatutRetrait" AS ENUM ('RECUE', 'EN_EXAMEN', 'ACCEPTEE', 'REFUSEE');

-- CreateEnum
CREATE TYPE "StatutPeriode" AS ENUM ('BROUILLON', 'CLOTUREE');

-- CreateEnum
CREATE TYPE "StatutVersement" AS ENUM ('EN_ATTENTE', 'BLOQUE', 'VERSE');

-- CreateEnum
CREATE TYPE "TypeSource" AS ENUM ('RSS', 'GOOGLE_DRIVE', 'DISCORD', 'SITE_AUTORISE');

-- CreateEnum
CREATE TYPE "StatutExecution" AS ENUM ('EN_COURS', 'REUSSIE', 'ECHOUEE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "pseudo" TEXT NOT NULL,
    "bio" TEXT,
    "role" "Role" NOT NULL DEFAULT 'LECTEUR',
    "langue" "Langue" NOT NULL DEFAULT 'FR',
    "suspenduJusquAu" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreferenceNotification" (
    "userId" TEXT NOT NULL,
    "chapitreSite" BOOLEAN NOT NULL DEFAULT true,
    "chapitrePush" BOOLEAN NOT NULL DEFAULT true,
    "chapitreEmail" BOOLEAN NOT NULL DEFAULT false,
    "socialSite" BOOLEAN NOT NULL DEFAULT true,
    "socialPush" BOOLEAN NOT NULL DEFAULT false,
    "socialEmail" BOOLEAN NOT NULL DEFAULT false,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreferenceNotification_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "AbonnementPush" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbonnementPush_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Equipe" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "logoCle" TEXT,
    "siteWeb" TEXT,
    "discord" TEXT,
    "statut" "StatutEquipe" NOT NULL DEFAULT 'ACTIVE',
    "suspendueLe" TIMESTAMP(3),
    "motifSuspension" TEXT,
    "nbRetraitsJustifies" INTEGER NOT NULL DEFAULT 0,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Equipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembreEquipe" (
    "id" TEXT NOT NULL,
    "equipeId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "RoleEquipe" NOT NULL DEFAULT 'MEMBRE',
    "rejointLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembreEquipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "jetonHache" TEXT NOT NULL,
    "type" "TypeInvitation" NOT NULL,
    "equipeId" TEXT,
    "nomEquipePropose" TEXT,
    "roleEquipe" "RoleEquipe" NOT NULL DEFAULT 'MEMBRE',
    "creeParId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expireLe" TIMESTAMP(3) NOT NULL,
    "accepteeLe" TIMESTAMP(3),
    "accepteeParId" TEXT,
    "revoqueeLe" TIMESTAMP(3),

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InfosPaiement" (
    "equipeId" TEXT NOT NULL,
    "statutJuridique" "StatutJuridique" NOT NULL,
    "raisonSociale" TEXT,
    "siret" TEXT,
    "titulaire" TEXT NOT NULL,
    "ibanChiffre" TEXT NOT NULL,
    "bic" TEXT,
    "pays" TEXT NOT NULL DEFAULT 'FR',
    "adresse" TEXT,
    "valideLe" TIMESTAMP(3),
    "valideParId" TEXT,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfosPaiement_pkey" PRIMARY KEY ("equipeId")
);

-- CreateTable
CREATE TABLE "Serie" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "titresAlternatifs" TEXT[],
    "synopsis" TEXT NOT NULL DEFAULT '',
    "type" "TypeSerie" NOT NULL,
    "langue" "Langue" NOT NULL,
    "statut" "StatutSerie" NOT NULL DEFAULT 'EN_COURS',
    "classification" "ClassificationAge" NOT NULL DEFAULT 'TOUT_PUBLIC',
    "sensLecture" "SensLecture" NOT NULL DEFAULT 'VERTICAL',
    "anneeParution" INTEGER,
    "couvertureCle" TEXT,
    "banniereCle" TEXT,
    "couleurDominante" TEXT,
    "equipeId" TEXT NOT NULL,
    "statutModeration" "StatutModeration" NOT NULL DEFAULT 'BROUILLON',
    "motifRefus" TEXT,
    "publieeLe" TIMESTAMP(3),
    "droitsDeclares" BOOLEAN NOT NULL DEFAULT false,
    "droitsDeclaresLe" TIMESTAMP(3),
    "droitsDeclaresParId" TEXT,
    "preuveAutorisationCle" TEXT,
    "preuveAutorisationNote" TEXT,
    "noteMoyenne" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "nbNotes" INTEGER NOT NULL DEFAULT 0,
    "nbAbonnes" INTEGER NOT NULL DEFAULT 0,
    "nbVues" INTEGER NOT NULL DEFAULT 0,
    "nbChapitres" INTEGER NOT NULL DEFAULT 0,
    "dernierChapitreLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Serie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auteur" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "bio" TEXT,

    CONSTRAINT "Auteur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SerieAuteur" (
    "serieId" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "role" "RoleAuteur" NOT NULL DEFAULT 'SCENARIO_ET_DESSIN',

    CONSTRAINT "SerieAuteur_pkey" PRIMARY KEY ("serieId","auteurId")
);

-- CreateTable
CREATE TABLE "Genre" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nomFr" TEXT NOT NULL,
    "nomEn" TEXT NOT NULL,

    CONSTRAINT "Genre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SerieGenre" (
    "serieId" TEXT NOT NULL,
    "genreId" TEXT NOT NULL,

    CONSTRAINT "SerieGenre_pkey" PRIMARY KEY ("serieId","genreId")
);

-- CreateTable
CREATE TABLE "Chapitre" (
    "id" TEXT NOT NULL,
    "serieId" TEXT NOT NULL,
    "numero" DECIMAL(7,2) NOT NULL,
    "titre" TEXT,
    "statut" "StatutChapitre" NOT NULL DEFAULT 'BROUILLON',
    "origine" "OrigineChapitre" NOT NULL DEFAULT 'MANUEL',
    "publieLe" TIMESTAMP(3),
    "programmePour" TIMESTAMP(3),
    "nbPages" INTEGER NOT NULL DEFAULT 0,
    "nbVues" INTEGER NOT NULL DEFAULT 0,
    "nbCommentaires" INTEGER NOT NULL DEFAULT 0,
    "creeParId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chapitre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "chapitreId" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "cleOriginale" TEXT NOT NULL,
    "largeur" INTEGER NOT NULL,
    "hauteur" INTEGER NOT NULL,
    "variantes" JSONB NOT NULL DEFAULT '[]',
    "apercuFlou" TEXT,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MiseEnAvant" (
    "id" TEXT NOT NULL,
    "serieId" TEXT NOT NULL,
    "accroche" TEXT,
    "visuelCle" TEXT,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "debutLe" TIMESTAMP(3),
    "finLe" TIMESTAMP(3),
    "creeParId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MiseEnAvant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Progression" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serieId" TEXT NOT NULL,
    "chapitreId" TEXT NOT NULL,
    "page" INTEGER NOT NULL DEFAULT 0,
    "ratio" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "termine" BOOLEAN NOT NULL DEFAULT false,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Progression_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntreeJournal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serieId" TEXT NOT NULL,
    "chapitreId" TEXT NOT NULL,
    "luLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EntreeJournal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuiviSerie" (
    "userId" TEXT NOT NULL,
    "serieId" TEXT NOT NULL,
    "notifier" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuiviSerie_pkey" PRIMARY KEY ("userId","serieId")
);

-- CreateTable
CREATE TABLE "Note" (
    "userId" TEXT NOT NULL,
    "serieId" TEXT NOT NULL,
    "valeur" INTEGER NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("userId","serieId")
);

-- CreateTable
CREATE TABLE "Critique" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serieId" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "spoiler" BOOLEAN NOT NULL DEFAULT false,
    "masquee" BOOLEAN NOT NULL DEFAULT false,
    "masqueeParId" TEXT,
    "nbLikes" INTEGER NOT NULL DEFAULT 0,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Critique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LikeCritique" (
    "userId" TEXT NOT NULL,
    "critiqueId" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LikeCritique_pkey" PRIMARY KEY ("userId","critiqueId")
);

-- CreateTable
CREATE TABLE "Liste" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TypeListe" NOT NULL DEFAULT 'LIBRE',
    "nom" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "publique" BOOLEAN NOT NULL DEFAULT true,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Liste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElementListe" (
    "id" TEXT NOT NULL,
    "listeId" TEXT NOT NULL,
    "serieId" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "commentaire" TEXT,
    "ajouteLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ElementListe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuiviUtilisateur" (
    "suiveurId" TEXT NOT NULL,
    "suiviId" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SuiviUtilisateur_pkey" PRIMARY KEY ("suiveurId","suiviId")
);

-- CreateTable
CREATE TABLE "Activite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TypeActivite" NOT NULL,
    "serieId" TEXT,
    "chapitreId" TEXT,
    "critiqueId" TEXT,
    "listeId" TEXT,
    "cibleUserId" TEXT,
    "donnees" JSONB,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Commentaire" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chapitreId" TEXT NOT NULL,
    "parentId" TEXT,
    "contenu" TEXT NOT NULL,
    "masque" BOOLEAN NOT NULL DEFAULT false,
    "masqueParId" TEXT,
    "nbLikes" INTEGER NOT NULL DEFAULT 0,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Commentaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LikeCommentaire" (
    "userId" TEXT NOT NULL,
    "commentaireId" TEXT NOT NULL,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LikeCommentaire_pkey" PRIMARY KEY ("userId","commentaireId")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TypeNotification" NOT NULL,
    "donnees" JSONB NOT NULL,
    "lien" TEXT,
    "lueLe" TIMESTAMP(3),
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signalement" (
    "id" TEXT NOT NULL,
    "auteurId" TEXT,
    "cible" "CibleSignalement" NOT NULL,
    "serieId" TEXT,
    "chapitreId" TEXT,
    "commentaireId" TEXT,
    "critiqueId" TEXT,
    "utilisateurCibleId" TEXT,
    "motif" "MotifSignalement" NOT NULL,
    "details" TEXT,
    "statut" "StatutSignalement" NOT NULL DEFAULT 'OUVERT',
    "traiteParId" TEXT,
    "traiteLe" TIMESTAMP(3),
    "decision" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Signalement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandeRetrait" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "nomDemandeur" TEXT NOT NULL,
    "qualite" TEXT NOT NULL,
    "organisation" TEXT,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "adresse" TEXT,
    "oeuvre" TEXT NOT NULL,
    "descriptionDroits" TEXT NOT NULL,
    "urls" TEXT[],
    "declarationSurHonneur" BOOLEAN NOT NULL,
    "signature" TEXT NOT NULL,
    "statut" "StatutRetrait" NOT NULL DEFAULT 'RECUE',
    "justifiee" BOOLEAN,
    "serieId" TEXT,
    "equipeId" TEXT,
    "traiteParId" TEXT,
    "traiteLe" TIMESTAMP(3),
    "reponse" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandeRetrait_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JournalModeration" (
    "id" TEXT NOT NULL,
    "acteurId" TEXT,
    "action" TEXT NOT NULL,
    "cibleType" TEXT NOT NULL,
    "cibleId" TEXT NOT NULL,
    "details" JSONB,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalModeration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmplacementPub" (
    "id" TEXT NOT NULL,
    "cle" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT false,
    "code" TEXT,
    "mobile" BOOLEAN NOT NULL DEFAULT true,
    "bureau" BOOLEAN NOT NULL DEFAULT true,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmplacementPub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VueJournaliere" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "chapitreId" TEXT NOT NULL,
    "serieId" TEXT NOT NULL,
    "equipeId" TEXT NOT NULL,
    "nbVues" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "VueJournaliere_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodeRevenus" (
    "id" TEXT NOT NULL,
    "mois" DATE NOT NULL,
    "revenuTotalCentimes" INTEGER NOT NULL,
    "pourcentageReverse" DECIMAL(5,2) NOT NULL,
    "totalVues" INTEGER NOT NULL DEFAULT 0,
    "statut" "StatutPeriode" NOT NULL DEFAULT 'BROUILLON',
    "clotureeLe" TIMESTAMP(3),
    "clotureeParId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PeriodeRevenus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartRevenus" (
    "id" TEXT NOT NULL,
    "periodeId" TEXT NOT NULL,
    "equipeId" TEXT NOT NULL,
    "nbVues" INTEGER NOT NULL,
    "montantCentimes" INTEGER NOT NULL,
    "statut" "StatutVersement" NOT NULL DEFAULT 'EN_ATTENTE',
    "verseLe" TIMESTAMP(3),
    "referenceVersement" TEXT,

    CONSTRAINT "PartRevenus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reglage" (
    "cle" TEXT NOT NULL,
    "valeur" JSONB NOT NULL,
    "majLe" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reglage_pkey" PRIMARY KEY ("cle")
);

-- CreateTable
CREATE TABLE "SourceSync" (
    "id" TEXT NOT NULL,
    "equipeId" TEXT NOT NULL,
    "serieId" TEXT,
    "type" "TypeSource" NOT NULL,
    "nom" TEXT NOT NULL,
    "url" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "secretChiffre" TEXT,
    "autorisationNote" TEXT,
    "autorisationPreuveCle" TEXT,
    "valideeLe" TIMESTAMP(3),
    "valideeParId" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "frequenceMinutes" INTEGER NOT NULL DEFAULT 60,
    "dernierPassageLe" TIMESTAMP(3),
    "dernierSuccesLe" TIMESTAMP(3),
    "erreursConsecutives" INTEGER NOT NULL DEFAULT 0,
    "creeParId" TEXT,
    "creeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceSync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutionSync" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "statut" "StatutExecution" NOT NULL DEFAULT 'EN_COURS',
    "declencheeParId" TEXT,
    "debutLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finLe" TIMESTAMP(3),
    "nbDetectes" INTEGER NOT NULL DEFAULT 0,
    "nbImportes" INTEGER NOT NULL DEFAULT 0,
    "erreur" TEXT,
    "journal" JSONB,

    CONSTRAINT "ExecutionSync_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChapitreImporte" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "identifiantExterne" TEXT NOT NULL,
    "chapitreId" TEXT,
    "importeLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChapitreImporte_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_pseudo_key" ON "User"("pseudo");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "AbonnementPush_endpoint_key" ON "AbonnementPush"("endpoint");

-- CreateIndex
CREATE INDEX "AbonnementPush_userId_idx" ON "AbonnementPush"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Equipe_slug_key" ON "Equipe"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Equipe_nom_key" ON "Equipe"("nom");

-- CreateIndex
CREATE INDEX "MembreEquipe_userId_idx" ON "MembreEquipe"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MembreEquipe_equipeId_userId_key" ON "MembreEquipe"("equipeId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_jetonHache_key" ON "Invitation"("jetonHache");

-- CreateIndex
CREATE INDEX "Invitation_email_idx" ON "Invitation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Serie_slug_key" ON "Serie"("slug");

-- CreateIndex
CREATE INDEX "Serie_statutModeration_dernierChapitreLe_idx" ON "Serie"("statutModeration", "dernierChapitreLe");

-- CreateIndex
CREATE INDEX "Serie_statutModeration_noteMoyenne_idx" ON "Serie"("statutModeration", "noteMoyenne");

-- CreateIndex
CREATE INDEX "Serie_statutModeration_nbVues_idx" ON "Serie"("statutModeration", "nbVues");

-- CreateIndex
CREATE INDEX "Serie_statutModeration_publieeLe_idx" ON "Serie"("statutModeration", "publieeLe");

-- CreateIndex
CREATE INDEX "Serie_equipeId_idx" ON "Serie"("equipeId");

-- CreateIndex
CREATE INDEX "Serie_type_langue_idx" ON "Serie"("type", "langue");

-- CreateIndex
CREATE UNIQUE INDEX "Auteur_slug_key" ON "Auteur"("slug");

-- CreateIndex
CREATE INDEX "SerieAuteur_auteurId_idx" ON "SerieAuteur"("auteurId");

-- CreateIndex
CREATE UNIQUE INDEX "Genre_slug_key" ON "Genre"("slug");

-- CreateIndex
CREATE INDEX "SerieGenre_genreId_idx" ON "SerieGenre"("genreId");

-- CreateIndex
CREATE INDEX "Chapitre_statut_publieLe_idx" ON "Chapitre"("statut", "publieLe");

-- CreateIndex
CREATE INDEX "Chapitre_statut_programmePour_idx" ON "Chapitre"("statut", "programmePour");

-- CreateIndex
CREATE UNIQUE INDEX "Chapitre_serieId_numero_key" ON "Chapitre"("serieId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "Page_chapitreId_ordre_key" ON "Page"("chapitreId", "ordre");

-- CreateIndex
CREATE INDEX "MiseEnAvant_actif_ordre_idx" ON "MiseEnAvant"("actif", "ordre");

-- CreateIndex
CREATE INDEX "Progression_userId_majLe_idx" ON "Progression"("userId", "majLe");

-- CreateIndex
CREATE UNIQUE INDEX "Progression_userId_serieId_key" ON "Progression"("userId", "serieId");

-- CreateIndex
CREATE INDEX "EntreeJournal_userId_luLe_idx" ON "EntreeJournal"("userId", "luLe");

-- CreateIndex
CREATE INDEX "EntreeJournal_userId_serieId_idx" ON "EntreeJournal"("userId", "serieId");

-- CreateIndex
CREATE INDEX "SuiviSerie_serieId_idx" ON "SuiviSerie"("serieId");

-- CreateIndex
CREATE INDEX "Note_serieId_idx" ON "Note"("serieId");

-- CreateIndex
CREATE INDEX "Critique_serieId_creeLe_idx" ON "Critique"("serieId", "creeLe");

-- CreateIndex
CREATE UNIQUE INDEX "Critique_userId_serieId_key" ON "Critique"("userId", "serieId");

-- CreateIndex
CREATE INDEX "LikeCritique_critiqueId_idx" ON "LikeCritique"("critiqueId");

-- CreateIndex
CREATE UNIQUE INDEX "Liste_userId_slug_key" ON "Liste"("userId", "slug");

-- CreateIndex
CREATE INDEX "ElementListe_serieId_idx" ON "ElementListe"("serieId");

-- CreateIndex
CREATE UNIQUE INDEX "ElementListe_listeId_serieId_key" ON "ElementListe"("listeId", "serieId");

-- CreateIndex
CREATE INDEX "SuiviUtilisateur_suiviId_idx" ON "SuiviUtilisateur"("suiviId");

-- CreateIndex
CREATE INDEX "Activite_userId_creeLe_idx" ON "Activite"("userId", "creeLe");

-- CreateIndex
CREATE INDEX "Commentaire_chapitreId_creeLe_idx" ON "Commentaire"("chapitreId", "creeLe");

-- CreateIndex
CREATE INDEX "Commentaire_userId_idx" ON "Commentaire"("userId");

-- CreateIndex
CREATE INDEX "LikeCommentaire_commentaireId_idx" ON "LikeCommentaire"("commentaireId");

-- CreateIndex
CREATE INDEX "Notification_userId_lueLe_creeLe_idx" ON "Notification"("userId", "lueLe", "creeLe");

-- CreateIndex
CREATE INDEX "Signalement_statut_creeLe_idx" ON "Signalement"("statut", "creeLe");

-- CreateIndex
CREATE UNIQUE INDEX "DemandeRetrait_reference_key" ON "DemandeRetrait"("reference");

-- CreateIndex
CREATE INDEX "DemandeRetrait_statut_creeLe_idx" ON "DemandeRetrait"("statut", "creeLe");

-- CreateIndex
CREATE INDEX "JournalModeration_cibleType_cibleId_idx" ON "JournalModeration"("cibleType", "cibleId");

-- CreateIndex
CREATE INDEX "JournalModeration_creeLe_idx" ON "JournalModeration"("creeLe");

-- CreateIndex
CREATE UNIQUE INDEX "EmplacementPub_cle_key" ON "EmplacementPub"("cle");

-- CreateIndex
CREATE INDEX "VueJournaliere_equipeId_date_idx" ON "VueJournaliere"("equipeId", "date");

-- CreateIndex
CREATE INDEX "VueJournaliere_serieId_date_idx" ON "VueJournaliere"("serieId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "VueJournaliere_chapitreId_date_key" ON "VueJournaliere"("chapitreId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodeRevenus_mois_key" ON "PeriodeRevenus"("mois");

-- CreateIndex
CREATE INDEX "PartRevenus_equipeId_idx" ON "PartRevenus"("equipeId");

-- CreateIndex
CREATE UNIQUE INDEX "PartRevenus_periodeId_equipeId_key" ON "PartRevenus"("periodeId", "equipeId");

-- CreateIndex
CREATE INDEX "SourceSync_actif_dernierPassageLe_idx" ON "SourceSync"("actif", "dernierPassageLe");

-- CreateIndex
CREATE INDEX "SourceSync_equipeId_idx" ON "SourceSync"("equipeId");

-- CreateIndex
CREATE INDEX "ExecutionSync_sourceId_debutLe_idx" ON "ExecutionSync"("sourceId", "debutLe");

-- CreateIndex
CREATE UNIQUE INDEX "ChapitreImporte_chapitreId_key" ON "ChapitreImporte"("chapitreId");

-- CreateIndex
CREATE UNIQUE INDEX "ChapitreImporte_sourceId_identifiantExterne_key" ON "ChapitreImporte"("sourceId", "identifiantExterne");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PreferenceNotification" ADD CONSTRAINT "PreferenceNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbonnementPush" ADD CONSTRAINT "AbonnementPush_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembreEquipe" ADD CONSTRAINT "MembreEquipe_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembreEquipe" ADD CONSTRAINT "MembreEquipe_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_accepteeParId_fkey" FOREIGN KEY ("accepteeParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfosPaiement" ADD CONSTRAINT "InfosPaiement_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InfosPaiement" ADD CONSTRAINT "InfosPaiement_valideParId_fkey" FOREIGN KEY ("valideParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Serie" ADD CONSTRAINT "Serie_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Serie" ADD CONSTRAINT "Serie_droitsDeclaresParId_fkey" FOREIGN KEY ("droitsDeclaresParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerieAuteur" ADD CONSTRAINT "SerieAuteur_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "Serie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerieAuteur" ADD CONSTRAINT "SerieAuteur_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "Auteur"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerieGenre" ADD CONSTRAINT "SerieGenre_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "Serie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SerieGenre" ADD CONSTRAINT "SerieGenre_genreId_fkey" FOREIGN KEY ("genreId") REFERENCES "Genre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapitre" ADD CONSTRAINT "Chapitre_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "Serie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chapitre" ADD CONSTRAINT "Chapitre_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Page" ADD CONSTRAINT "Page_chapitreId_fkey" FOREIGN KEY ("chapitreId") REFERENCES "Chapitre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiseEnAvant" ADD CONSTRAINT "MiseEnAvant_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "Serie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MiseEnAvant" ADD CONSTRAINT "MiseEnAvant_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progression" ADD CONSTRAINT "Progression_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progression" ADD CONSTRAINT "Progression_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "Serie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Progression" ADD CONSTRAINT "Progression_chapitreId_fkey" FOREIGN KEY ("chapitreId") REFERENCES "Chapitre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntreeJournal" ADD CONSTRAINT "EntreeJournal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntreeJournal" ADD CONSTRAINT "EntreeJournal_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "Serie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntreeJournal" ADD CONSTRAINT "EntreeJournal_chapitreId_fkey" FOREIGN KEY ("chapitreId") REFERENCES "Chapitre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuiviSerie" ADD CONSTRAINT "SuiviSerie_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuiviSerie" ADD CONSTRAINT "SuiviSerie_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "Serie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "Serie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Critique" ADD CONSTRAINT "Critique_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Critique" ADD CONSTRAINT "Critique_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "Serie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Critique" ADD CONSTRAINT "Critique_masqueeParId_fkey" FOREIGN KEY ("masqueeParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LikeCritique" ADD CONSTRAINT "LikeCritique_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LikeCritique" ADD CONSTRAINT "LikeCritique_critiqueId_fkey" FOREIGN KEY ("critiqueId") REFERENCES "Critique"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Liste" ADD CONSTRAINT "Liste_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElementListe" ADD CONSTRAINT "ElementListe_listeId_fkey" FOREIGN KEY ("listeId") REFERENCES "Liste"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElementListe" ADD CONSTRAINT "ElementListe_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "Serie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuiviUtilisateur" ADD CONSTRAINT "SuiviUtilisateur_suiveurId_fkey" FOREIGN KEY ("suiveurId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuiviUtilisateur" ADD CONSTRAINT "SuiviUtilisateur_suiviId_fkey" FOREIGN KEY ("suiviId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activite" ADD CONSTRAINT "Activite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activite" ADD CONSTRAINT "Activite_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "Serie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activite" ADD CONSTRAINT "Activite_chapitreId_fkey" FOREIGN KEY ("chapitreId") REFERENCES "Chapitre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activite" ADD CONSTRAINT "Activite_critiqueId_fkey" FOREIGN KEY ("critiqueId") REFERENCES "Critique"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activite" ADD CONSTRAINT "Activite_listeId_fkey" FOREIGN KEY ("listeId") REFERENCES "Liste"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activite" ADD CONSTRAINT "Activite_cibleUserId_fkey" FOREIGN KEY ("cibleUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_chapitreId_fkey" FOREIGN KEY ("chapitreId") REFERENCES "Chapitre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Commentaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Commentaire" ADD CONSTRAINT "Commentaire_masqueParId_fkey" FOREIGN KEY ("masqueParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LikeCommentaire" ADD CONSTRAINT "LikeCommentaire_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LikeCommentaire" ADD CONSTRAINT "LikeCommentaire_commentaireId_fkey" FOREIGN KEY ("commentaireId") REFERENCES "Commentaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signalement" ADD CONSTRAINT "Signalement_auteurId_fkey" FOREIGN KEY ("auteurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signalement" ADD CONSTRAINT "Signalement_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "Serie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signalement" ADD CONSTRAINT "Signalement_chapitreId_fkey" FOREIGN KEY ("chapitreId") REFERENCES "Chapitre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signalement" ADD CONSTRAINT "Signalement_commentaireId_fkey" FOREIGN KEY ("commentaireId") REFERENCES "Commentaire"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signalement" ADD CONSTRAINT "Signalement_critiqueId_fkey" FOREIGN KEY ("critiqueId") REFERENCES "Critique"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signalement" ADD CONSTRAINT "Signalement_utilisateurCibleId_fkey" FOREIGN KEY ("utilisateurCibleId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signalement" ADD CONSTRAINT "Signalement_traiteParId_fkey" FOREIGN KEY ("traiteParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandeRetrait" ADD CONSTRAINT "DemandeRetrait_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "Serie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandeRetrait" ADD CONSTRAINT "DemandeRetrait_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandeRetrait" ADD CONSTRAINT "DemandeRetrait_traiteParId_fkey" FOREIGN KEY ("traiteParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalModeration" ADD CONSTRAINT "JournalModeration_acteurId_fkey" FOREIGN KEY ("acteurId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VueJournaliere" ADD CONSTRAINT "VueJournaliere_chapitreId_fkey" FOREIGN KEY ("chapitreId") REFERENCES "Chapitre"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VueJournaliere" ADD CONSTRAINT "VueJournaliere_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "Serie"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VueJournaliere" ADD CONSTRAINT "VueJournaliere_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodeRevenus" ADD CONSTRAINT "PeriodeRevenus_clotureeParId_fkey" FOREIGN KEY ("clotureeParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartRevenus" ADD CONSTRAINT "PartRevenus_periodeId_fkey" FOREIGN KEY ("periodeId") REFERENCES "PeriodeRevenus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartRevenus" ADD CONSTRAINT "PartRevenus_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceSync" ADD CONSTRAINT "SourceSync_equipeId_fkey" FOREIGN KEY ("equipeId") REFERENCES "Equipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceSync" ADD CONSTRAINT "SourceSync_serieId_fkey" FOREIGN KEY ("serieId") REFERENCES "Serie"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceSync" ADD CONSTRAINT "SourceSync_valideeParId_fkey" FOREIGN KEY ("valideeParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceSync" ADD CONSTRAINT "SourceSync_creeParId_fkey" FOREIGN KEY ("creeParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionSync" ADD CONSTRAINT "ExecutionSync_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "SourceSync"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionSync" ADD CONSTRAINT "ExecutionSync_declencheeParId_fkey" FOREIGN KEY ("declencheeParId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapitreImporte" ADD CONSTRAINT "ChapitreImporte_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "SourceSync"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChapitreImporte" ADD CONSTRAINT "ChapitreImporte_chapitreId_fkey" FOREIGN KEY ("chapitreId") REFERENCES "Chapitre"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ════════════════════════════════════════════════════════════════
-- Contraintes ajoutées à la main (non exprimables dans le schéma Prisma)
-- ════════════════════════════════════════════════════════════════

-- Une note va de 1 à 10 (une demi-étoile = 1 point).
ALTER TABLE "Note" ADD CONSTRAINT "Note_valeur_intervalle" CHECK ("valeur" BETWEEN 1 AND 10);

-- Chaque lecteur a au plus une liste de chaque statut (À lire, En cours, Terminé, Abandonné) ;
-- les listes libres ne sont pas limitées.
CREATE UNIQUE INDEX "Liste_userId_type_statut_unique" ON "Liste" ("userId", "type") WHERE "type" <> 'LIBRE';

-- La position de défilement mémorisée reste entre 0 et 1.
ALTER TABLE "Progression" ADD CONSTRAINT "Progression_ratio_intervalle" CHECK ("ratio" >= 0 AND "ratio" <= 1);

-- Les montants et les compteurs de vues ne sont jamais négatifs.
ALTER TABLE "PartRevenus" ADD CONSTRAINT "PartRevenus_montant_positif" CHECK ("montantCentimes" >= 0 AND "nbVues" >= 0);
ALTER TABLE "PeriodeRevenus" ADD CONSTRAINT "PeriodeRevenus_valeurs_valides" CHECK ("revenuTotalCentimes" >= 0 AND "pourcentageReverse" BETWEEN 0 AND 100);
ALTER TABLE "VueJournaliere" ADD CONSTRAINT "VueJournaliere_vues_positives" CHECK ("nbVues" >= 0);
