// Identité de l'éditeur et de l'hébergeur, affichée dans les pages légales.
// À renseigner dans le fichier .env avant la mise en ligne : la loi impose ces mentions.
const aCompleter = (valeur: string | undefined, libelle: string) => valeur?.trim() || `[à compléter : ${libelle}]`;

export const LEGAL = {
  editeur: aCompleter(process.env.LEGAL_EDITEUR, "nom ou raison sociale de l'éditeur"),
  statut: aCompleter(process.env.LEGAL_STATUT, "forme juridique, SIREN/SIRET"),
  adresse: aCompleter(process.env.LEGAL_ADRESSE, "adresse postale"),
  email: aCompleter(process.env.LEGAL_EMAIL, "adresse email de contact"),
  directeur: aCompleter(process.env.LEGAL_DIRECTEUR, "directeur de la publication"),
  hebergeur: aCompleter(process.env.LEGAL_HEBERGEUR, "nom, adresse et téléphone de l'hébergeur"),
};
