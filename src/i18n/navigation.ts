// Liens et redirections qui tiennent compte de la langue et des adresses traduites.
// À utiliser à la place de next/link et next/navigation pour toute navigation interne.
import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
