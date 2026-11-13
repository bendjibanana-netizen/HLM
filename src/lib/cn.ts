import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Assemble des classes Tailwind en résolvant les conflits (la dernière l'emporte). */
export function cn(...classes: ClassValue[]): string {
  return twMerge(clsx(classes));
}
