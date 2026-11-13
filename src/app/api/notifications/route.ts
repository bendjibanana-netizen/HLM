// Nombre de notifications non lues du compte connecté : GET /api/notifications (pastille de l'en-tête).
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { obtenirSession } from "@/lib/session";

export async function GET() {
  const session = await obtenirSession();
  const nonLues = session ? await db.notification.count({ where: { userId: session.user.id, lueLe: null } }) : 0;
  return NextResponse.json({ nonLues }, { headers: { "Cache-Control": "private, no-store" } });
}
