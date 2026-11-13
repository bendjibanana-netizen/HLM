// Client d'authentification pour les composants React (navigateur).
"use client";

import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "@/lib/auth";

export const authClient = createAuthClient({
  // Rend les champs supplémentaires du compte (pseudo, rôle, langue…) typés côté navigateur.
  plugins: [inferAdditionalFields<typeof auth>()],
});
