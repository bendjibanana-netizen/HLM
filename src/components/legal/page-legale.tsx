import type { PageLegale as Contenu } from "@/content/legal";

/** Mise en page commune des textes légaux : titre, date de mise à jour, sections. */
export function PageLegale({ contenu }: { contenu: Contenu }) {
  return (
    <article className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold">{contenu.titre}</h1>
        <p className="text-sm text-texte-doux">{contenu.maj}</p>
      </header>
      {contenu.sections.map((section) => (
        <section key={section.titre} className="flex flex-col gap-2">
          <h2 className="text-xl font-bold">{section.titre}</h2>
          {section.paragraphes.map((paragraphe, index) => (
            <p key={index} className="leading-relaxed">
              {paragraphe}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
