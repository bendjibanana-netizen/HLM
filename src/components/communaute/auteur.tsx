import { Avatar } from "@/components/ui/avatar";
import { Link } from "@/i18n/navigation";

/** Avatar et nom d'un lecteur, avec lien vers son profil. */
export function Auteur({ compte, taille = "sm" }: { compte: { pseudo: string; name: string; image: string | null }; taille?: "sm" | "md" }) {
  return (
    <Link href={{ pathname: "/u/[pseudo]", params: { pseudo: compte.pseudo } }} className="flex min-w-0 items-center gap-2 rounded-lg font-semibold hover:underline">
      <Avatar nom={compte.name} image={compte.image} taille={taille} />
      <span className="truncate">{compte.name}</span>
    </Link>
  );
}
