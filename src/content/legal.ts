// Textes des pages légales. Ce sont des modèles de départ : faites-les relire par un juriste
// avant la mise en ligne, et complétez l'identité de l'éditeur dans le fichier .env.
import { LEGAL } from "@/lib/legal";
import { NOM_SITE } from "@/lib/site";

export type Section = { titre: string; paragraphes: string[] };
export type PageLegale = { titre: string; maj: string; sections: Section[] };
type Langue = "fr" | "en";

const MAJ = { fr: "Dernière mise à jour : novembre 2026", en: "Last updated: November 2026" };

export const CGU: Record<Langue, PageLegale> = {
  fr: {
    titre: "Conditions générales d'utilisation",
    maj: MAJ.fr,
    sections: [
      { titre: "1. Objet", paragraphes: [`${NOM_SITE} est une plateforme de lecture de bandes dessinées numériques (webtoons, mangas, manhwas, manhuas) publiées par des équipes et des auteurs inscrits sur invitation. Les présentes conditions régissent l'usage du site par les visiteurs, les lecteurs inscrits et les équipes.`] },
      { titre: "2. Compte", paragraphes: ["La lecture des séries « tout public » est ouverte à tous. Un compte est nécessaire pour lire les séries classées 12+ et 16+, suivre des séries, noter, commenter et tenir des listes.", "Vous êtes responsable de la confidentialité de vos identifiants et de l'activité de votre compte. Vous pouvez supprimer votre compte à tout moment en nous écrivant."] },
      { titre: "3. Contenus publiés par les équipes", paragraphes: ["Seules les équipes et les auteurs invités par l'administration peuvent publier des séries. Pour chaque série, l'équipe déclare détenir les droits sur l'œuvre ou l'autorisation de l'ayant droit. Elle est seule responsable de l'exactitude de cette déclaration.", "Chaque série est examinée avant publication. L'administration peut refuser ou retirer une série à tout moment.", "Une équipe qui fait l'objet de plusieurs demandes de retrait justifiées est suspendue."] },
      { titre: "4. Contenus interdits", paragraphes: ["La plateforme n'accueille aucun contenu pornographique ni sexuellement explicite. Sont également interdits les contenus illégaux, haineux, diffamatoires, ou portant atteinte aux droits de tiers.", "Les séries sont classées tout public, 12+ ou 16+ (violence, thèmes matures). Un avertissement précède les séries 16+."] },
      { titre: "5. Contributions des lecteurs", paragraphes: ["Les notes, critiques, commentaires et listes publiques que vous publiez restent votre propriété. Vous nous accordez le droit de les afficher sur le site. Vous vous engagez à rester courtois et à ne publier ni spam, ni harcèlement, ni contenu illégal.", "La modération peut masquer une contribution et suspendre un compte en cas de manquement."] },
      { titre: "6. Droits d'auteur et demandes de retrait", paragraphes: ["Si vous estimez qu'une œuvre publiée sur le site porte atteinte à vos droits, utilisez le formulaire de demande de retrait. Chaque demande est examinée rapidement et son historique est conservé."] },
      { titre: "7. Publicité et rémunération des équipes", paragraphes: ["Le site est financé par la publicité. Une part des revenus publicitaires est reversée aux équipes en proportion de l'audience de leurs séries, selon les modalités qui leur sont communiquées."] },
      { titre: "8. Responsabilité", paragraphes: ["Le site est fourni en l'état. Nous faisons notre possible pour assurer sa disponibilité, sans garantie d'absence d'interruption. En tant qu'hébergeur des contenus publiés par les équipes et les lecteurs, nous agissons dès qu'un contenu illicite nous est signalé."] },
      { titre: "9. Modification et droit applicable", paragraphes: ["Ces conditions peuvent évoluer ; la date de mise à jour figure en haut de page. Elles sont soumises au droit français."] },
    ],
  },
  en: {
    titre: "Terms of use",
    maj: MAJ.en,
    sections: [
      { titre: "1. Purpose", paragraphes: [`${NOM_SITE} is a reading platform for digital comics (webtoons, manga, manhwa, manhua) published by teams and authors who join by invitation. These terms govern use of the site by visitors, registered readers and teams.`] },
      { titre: "2. Account", paragraphes: ["Series rated “all ages” can be read by anyone. An account is required to read series rated 12+ and 16+, follow series, rate, comment and keep lists.", "You are responsible for keeping your credentials confidential and for activity on your account. You can delete your account at any time by writing to us."] },
      { titre: "3. Content published by teams", paragraphes: ["Only teams and authors invited by the administration can publish series. For each series, the team declares that it holds the rights to the work or the rights holder's permission, and is solely responsible for the accuracy of that declaration.", "Every series is reviewed before publication. The administration may refuse or remove a series at any time.", "A team that receives several justified takedown requests is suspended."] },
      { titre: "4. Prohibited content", paragraphes: ["The platform hosts no pornographic or sexually explicit content. Illegal, hateful or defamatory content, and content infringing third-party rights, is also prohibited.", "Series are rated all ages, 12+ or 16+ (violence, mature themes). A warning is shown before 16+ series."] },
      { titre: "5. Reader contributions", paragraphes: ["Ratings, reviews, comments and public lists you post remain yours. You grant us the right to display them on the site. You agree to remain courteous and not to post spam, harassment or illegal content.", "Moderators may hide a contribution and suspend an account in case of a breach."] },
      { titre: "6. Copyright and takedown requests", paragraphes: ["If you believe a work published on the site infringes your rights, use the takedown request form. Each request is reviewed promptly and its history is kept."] },
      { titre: "7. Advertising and team revenue", paragraphes: ["The site is funded by advertising. A share of advertising revenue is paid to teams in proportion to the audience of their series, under terms communicated to them."] },
      { titre: "8. Liability", paragraphes: ["The site is provided as is. We do our best to keep it available, without guaranteeing uninterrupted service. As host of content published by teams and readers, we act as soon as unlawful content is reported to us."] },
      { titre: "9. Changes and governing law", paragraphes: ["These terms may change; the update date is shown at the top of the page. They are governed by French law."] },
    ],
  },
};

export const MENTIONS: Record<Langue, PageLegale> = {
  fr: {
    titre: "Mentions légales",
    maj: MAJ.fr,
    sections: [
      { titre: "Éditeur du site", paragraphes: [LEGAL.editeur, LEGAL.statut, LEGAL.adresse, `Contact : ${LEGAL.email}`, `Directeur de la publication : ${LEGAL.directeur}`] },
      { titre: "Hébergeur", paragraphes: [LEGAL.hebergeur] },
      { titre: "Propriété intellectuelle", paragraphes: ["Les séries publiées appartiennent à leurs auteurs et ayants droit. L'interface du site, son nom et son identité visuelle appartiennent à l'éditeur. Toute reproduction non autorisée est interdite."] },
      { titre: "Signaler un contenu", paragraphes: ["Chaque série, chapitre, commentaire et critique dispose d'un bouton « Signaler ». Les ayants droit disposent d'un formulaire de demande de retrait dédié."] },
    ],
  },
  en: {
    titre: "Legal notice",
    maj: MAJ.en,
    sections: [
      { titre: "Publisher", paragraphes: [LEGAL.editeur, LEGAL.statut, LEGAL.adresse, `Contact: ${LEGAL.email}`, `Publication director: ${LEGAL.directeur}`] },
      { titre: "Hosting provider", paragraphes: [LEGAL.hebergeur] },
      { titre: "Intellectual property", paragraphes: ["Published series belong to their authors and rights holders. The site's interface, name and visual identity belong to the publisher. Any unauthorised reproduction is prohibited."] },
      { titre: "Reporting content", paragraphes: ["Every series, chapter, comment and review has a “Report” button. Rights holders have a dedicated takedown request form."] },
    ],
  },
};

export const CONFIDENTIALITE: Record<Langue, PageLegale> = {
  fr: {
    titre: "Politique de confidentialité",
    maj: MAJ.fr,
    sections: [
      { titre: "Responsable du traitement", paragraphes: [`${LEGAL.editeur} — ${LEGAL.adresse}. Contact : ${LEGAL.email}.`] },
      { titre: "Données collectées", paragraphes: ["Compte : adresse email, pseudo, nom affiché, mot de passe (stocké haché), ou identifiant fourni par Google ou Discord si vous utilisez ces connexions.", "Activité : séries suivies, notes, critiques, commentaires, listes, position et journal de lecture.", "Technique : adresse IP et type de navigateur lors de la connexion (sécurité du compte), vues de chapitres dédoublonnées et anonymisées.", "Équipes : informations de paiement et statut juridique, nécessaires au versement de leur part de revenus."] },
      { titre: "Finalités et bases légales", paragraphes: ["Fournir le service et votre compte (exécution du contrat). Sécuriser le site et lutter contre la fraude aux vues (intérêt légitime). Mesurer l'audience et afficher de la publicité (votre consentement, recueilli par le bandeau cookies). Rémunérer les équipes et respecter nos obligations comptables (obligation légale)."] },
      { titre: "Cookies", paragraphes: ["Cookies strictement nécessaires : session de connexion, langue, choix de consentement. Ils ne demandent pas votre accord.", "Cookies de mesure d'audience et de publicité : déposés uniquement si vous les acceptez dans le bandeau. Vous pouvez modifier votre choix à tout moment depuis le lien « Cookies » en bas de page."] },
      { titre: "Durées de conservation", paragraphes: ["Données de compte : tant que le compte existe, puis suppression. Journaux de connexion : douze mois. Demandes de retrait et décisions de modération : cinq ans. Pièces comptables : dix ans."] },
      { titre: "Destinataires", paragraphes: ["Vos données ne sont pas vendues. Elles sont accessibles à l'équipe du site et à nos prestataires techniques (hébergement, envoi d'emails, stockage des images), dans la limite de leur mission. Les régies publicitaires ne reçoivent de données que si vous avez accepté les cookies publicitaires."] },
      { titre: "Vos droits", paragraphes: [`Vous disposez d'un droit d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité. Écrivez à ${LEGAL.email}. Vous pouvez aussi saisir la CNIL (cnil.fr).`] },
    ],
  },
  en: {
    titre: "Privacy policy",
    maj: MAJ.en,
    sections: [
      { titre: "Data controller", paragraphes: [`${LEGAL.editeur} — ${LEGAL.adresse}. Contact: ${LEGAL.email}.`] },
      { titre: "Data we collect", paragraphes: ["Account: email address, username, display name, password (stored hashed), or the identifier provided by Google or Discord if you use those logins.", "Activity: followed series, ratings, reviews, comments, lists, reading position and diary.", "Technical: IP address and browser type at login (account security), de-duplicated and anonymised chapter views.", "Teams: payment details and legal status, needed to pay their revenue share."] },
      { titre: "Purposes and legal bases", paragraphes: ["Providing the service and your account (performance of the contract). Securing the site and preventing view fraud (legitimate interest). Measuring audience and showing advertising (your consent, collected by the cookie banner). Paying teams and meeting our accounting obligations (legal obligation)."] },
      { titre: "Cookies", paragraphes: ["Strictly necessary cookies: login session, language, consent choice. They do not require your agreement.", "Audience measurement and advertising cookies: set only if you accept them in the banner. You can change your choice at any time from the “Cookies” link at the bottom of the page."] },
      { titre: "Retention periods", paragraphes: ["Account data: while the account exists, then deleted. Login logs: twelve months. Takedown requests and moderation decisions: five years. Accounting records: ten years."] },
      { titre: "Recipients", paragraphes: ["Your data is not sold. It is accessible to the site team and to our technical providers (hosting, email delivery, image storage), within the limits of their task. Advertising networks receive data only if you accepted advertising cookies."] },
      { titre: "Your rights", paragraphes: [`You have the right to access, rectify, erase, restrict, object to and port your data. Write to ${LEGAL.email}. You may also lodge a complaint with the CNIL (cnil.fr).`] },
    ],
  },
};
