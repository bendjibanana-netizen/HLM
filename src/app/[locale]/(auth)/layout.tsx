import { ArrowLeft } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Logo } from "@/components/mise-en-page/logo";
import { Link } from "@/i18n/navigation";

/** Mise en page épurée des pages de connexion : pas de navigation, le formulaire au centre. */
export default async function MiseEnPageAuth({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Auth");

  return (
    <div className="relative flex flex-1 flex-col">
      <div className="trame trame-fondue absolute inset-x-0 top-0 h-64" aria-hidden />
      <header className="relative mx-auto flex w-full max-w-md items-center justify-between px-4 pt-4">
        <Link href="/" className="rounded-lg">
          <Logo />
        </Link>
        <Link
          href="/"
          className="flex h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-texte-doux hover:text-texte"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t("retourAccueil")}
        </Link>
      </header>
      <main className="relative mx-auto w-full max-w-md flex-1 px-4 pt-8 pb-12">{children}</main>
    </div>
  );
}
