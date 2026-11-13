// Point d'entrée HTTP de l'authentification : /api/auth/* (connexion, inscription, retours OAuth…).
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth);
