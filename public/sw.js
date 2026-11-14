// Service worker de l'application : lecture hors-ligne des chapitres téléchargés et notifications push.
// Écrit à la main, sans dépendance : il ne met en cache que ce que le lecteur a choisi de télécharger.

const VERSION = "v1";
// Le cache « chapitres-hors-ligne » est rempli par le lecteur (bouton « Télécharger ») : il n'est jamais vidé ici.
const CACHE_SOCLE = `socle-${VERSION}`; // page de secours affichée sans connexion

self.addEventListener("install", (evenement) => {
  evenement.waitUntil(caches.open(CACHE_SOCLE).then((cache) => cache.addAll(["/hors-ligne"])).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (evenement) => {
  // Supprime les socles des versions précédentes ; les chapitres téléchargés sont conservés.
  evenement.waitUntil(
    caches.keys().then((noms) => Promise.all(noms.filter((nom) => nom.startsWith("socle-") && nom !== CACHE_SOCLE).map((nom) => caches.delete(nom)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (evenement) => {
  const requete = evenement.request;
  if (requete.method !== "GET") return;
  const url = new URL(requete.url);

  // Pages : le réseau d'abord (contenu toujours à jour) ; sans connexion, le chapitre téléchargé, sinon la page de secours.
  if (requete.mode === "navigate") {
    evenement.respondWith(
      fetch(requete).catch(async () => (await caches.match(requete, { ignoreSearch: true })) ?? (await caches.match("/hors-ligne")) ?? Response.error()),
    );
    return;
  }

  // Images : si elle a été téléchargée, elle vient du cache ; sinon le réseau, sans rien stocker.
  if (requete.destination === "image" || /\.(avif|webp|png|jpe?g)$/.test(url.pathname)) {
    evenement.respondWith(caches.match(requete).then((enCache) => enCache ?? fetch(requete)));
  }
});

// ── Notifications push ──
self.addEventListener("push", (evenement) => {
  let message = { titre: "Nouveau chapitre", corps: "", lien: "/", etiquette: undefined };
  try {
    message = { ...message, ...evenement.data.json() };
  } catch {
    // Message illisible : on affiche la notification par défaut.
  }
  evenement.waitUntil(
    self.registration.showNotification(message.titre, { body: message.corps, tag: message.etiquette, icon: "/icones/icone-192.png", badge: "/icones/icone-192.png", data: { lien: message.lien } }),
  );
});

self.addEventListener("notificationclick", (evenement) => {
  evenement.notification.close();
  const lien = new URL(evenement.notification.data?.lien ?? "/", self.location.origin).href;
  // Réutilise un onglet déjà ouvert sur le site plutôt que d'en ouvrir un nouveau.
  evenement.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((fenetres) => {
      const ouverte = fenetres.find((fenetre) => new URL(fenetre.url).origin === self.location.origin);
      return ouverte ? ouverte.navigate(lien).then((fenetre) => fenetre?.focus()) : self.clients.openWindow(lien);
    }),
  );
});
