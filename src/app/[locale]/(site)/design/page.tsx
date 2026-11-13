import { BookOpen } from "lucide-react";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import type { ReactNode } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Badge, BadgeClassification } from "@/components/ui/badge";
import { Bouton } from "@/components/ui/bouton";
import { Carte } from "@/components/ui/carte";
import { Champ, ChampMotDePasse } from "@/components/ui/champ";
import { EtatVide } from "@/components/ui/etat-vide";
import { Etoiles } from "@/components/ui/etoiles";
import { Message } from "@/components/ui/message";
import { Squelette } from "@/components/ui/squelette";
import { DemoFeuille } from "./demo-feuille";

// Page de référence interne (en français uniquement) : tous les composants du design system
// au même endroit, pour vérifier leur rendu sur mobile, en thème clair et sombre.
export const metadata: Metadata = { title: "Design system", robots: { index: false } };

const COULEURS = [
  { nom: "fond", classe: "bg-fond" },
  { nom: "surface", classe: "bg-surface" },
  { nom: "surface-2", classe: "bg-surface-2" },
  { nom: "bordure", classe: "bg-bordure" },
  { nom: "texte", classe: "bg-texte" },
  { nom: "texte-doux", classe: "bg-texte-doux" },
  { nom: "accent", classe: "bg-accent" },
  { nom: "succes", classe: "bg-succes" },
  { nom: "alerte", classe: "bg-alerte" },
  { nom: "danger", classe: "bg-danger" },
];

function Section({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">{titre}</h2>
      {children}
    </section>
  );
}

export default async function PageDesign({ params }: PageProps<"/[locale]/design">) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-10 px-4 py-6">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-bold tracking-[0.14em] text-accent uppercase">Référence interne</p>
        <h1 className="text-3xl font-extrabold">Design system</h1>
        <p className="text-texte-doux">
          Thème « encre et papier » : fonds neutres, un seul accent vermillon, trame de points. Les cibles tactiles
          font au moins 40 px de haut. Changez de thème dans le pied de page.
        </p>
      </header>

      <Section titre="Couleurs">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {COULEURS.map(({ nom, classe }) => (
            <li key={nom} className="flex flex-col gap-1.5">
              <span className={`h-14 rounded-xl border border-bordure ${classe}`} />
              <code className="text-xs text-texte-doux">{nom}</code>
            </li>
          ))}
        </ul>
      </Section>

      <Section titre="Typographie">
        <Carte className="flex flex-col gap-3">
          <p className="font-titre text-4xl leading-tight font-extrabold">Titre de page</p>
          <p className="font-titre text-2xl font-bold">Titre de section</p>
          <p className="font-titre text-lg font-bold">Titre de carte</p>
          <p>Texte courant : il utilise la police du système, lisible et sans téléchargement.</p>
          <p className="text-sm text-texte-doux">Texte secondaire : dates, compteurs, aides de formulaire.</p>
        </Carte>
      </Section>

      <Section titre="Boutons">
        <div className="flex flex-wrap items-center gap-3">
          <Bouton>Primaire</Bouton>
          <Bouton variante="secondaire">Secondaire</Bouton>
          <Bouton variante="discret">Discret</Bouton>
          <Bouton variante="danger">Danger</Bouton>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Bouton taille="sm">Petit</Bouton>
          <Bouton taille="md">Moyen</Bouton>
          <Bouton taille="lg">Grand</Bouton>
          <Bouton enCours>En cours</Bouton>
          <Bouton disabled>Désactivé</Bouton>
        </div>
      </Section>

      <Section titre="Champs">
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ libelle="Titre de la série" placeholder="Ex. Les Veilleurs de brume" aide="Tel qu'il apparaîtra au catalogue." />
          <Champ libelle="Adresse email" type="email" defaultValue="adresse-invalide" erreur="Cette adresse email n'est pas valide." />
          <ChampMotDePasse
            libelle="Mot de passe"
            defaultValue="exemple"
            libelleAfficher="Afficher le mot de passe"
            libelleMasquer="Masquer le mot de passe"
          />
        </div>
      </Section>

      <Section titre="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge>Webtoon</Badge>
          <Badge ton="accent">Nouveau</Badge>
          <Badge ton="succes">Terminé</Badge>
          <Badge ton="alerte">En pause</Badge>
          <Badge ton="danger">Retiré</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <BadgeClassification classification="TOUT_PUBLIC" />
          <BadgeClassification classification="DOUZE_PLUS" />
          <BadgeClassification classification="SEIZE_PLUS" />
        </div>
      </Section>

      <Section titre="Notes">
        <div className="flex flex-col gap-2">
          {[10, 7, 5, 1].map((note) => (
            <div key={note} className="flex items-center gap-3">
              <Etoiles note={note} libelle={`${note / 2} sur 5`} />
              <span className="text-sm text-texte-doux tabular-nums">{(note / 2).toLocaleString("fr-FR")} / 5</span>
            </div>
          ))}
          <Etoiles note={8} libelle="4 sur 5" taille="sm" />
        </div>
      </Section>

      <Section titre="Avatars">
        <div className="flex items-center gap-3">
          <Avatar nom="Camille Roy" taille="sm" />
          <Avatar nom="lecteur_42" />
          <Avatar nom="Équipe Brume" taille="lg" />
        </div>
      </Section>

      <Section titre="Messages">
        <Message>Le prochain chapitre sort vendredi.</Message>
        <Message ton="succes">Série ajoutée à votre liste « À lire ».</Message>
        <Message ton="erreur">L&apos;envoi a échoué. Vérifiez votre connexion et réessayez.</Message>
      </Section>

      <Section titre="Chargement">
        <Carte className="flex gap-3">
          <Squelette className="aspect-2/3 w-20" />
          <div className="flex flex-1 flex-col gap-2 py-1">
            <Squelette className="h-5 w-3/4" />
            <Squelette className="h-4 w-1/2" />
            <Squelette className="mt-auto h-4 w-1/3" />
          </div>
        </Carte>
      </Section>

      <Section titre="Panneau modal">
        <div>
          <DemoFeuille />
        </div>
      </Section>

      <Section titre="État vide">
        <Carte className="p-0 sm:p-0">
          <EtatVide icone={BookOpen} titre="Aucune lecture en cours">
            Les séries que vous commencez apparaîtront ici.
          </EtatVide>
        </Carte>
      </Section>
    </div>
  );
}
