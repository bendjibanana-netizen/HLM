const { app, BrowserWindow, ipcMain, Tray, Menu, screen, nativeImage, powerMonitor, globalShortcut, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');

// =========================================================
//  MISE À JOUR AUTOMATIQUE
//  Au lancement, l'app compare sa version à celle en ligne.
//  Si une version plus récente existe, elle télécharge les
//  fichiers, les remplace et se relance. Sinon elle démarre.
//
//  >>> Mets ici l'adresse où tu publies les mises à jour <<<
//  Exemple GitHub : "https://raw.githubusercontent.com/TonPseudo/HLM/main"
//  (laisse la valeur "DESACTIVE" pour ne pas utiliser la maj auto)
// =========================================================
const URL_MAJ = "https://raw.githubusercontent.com/bendjibanana-netizen/HLM/main";

function telecharger(url, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        const req = lib.get(url, (res) => {
            if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
            let data = '';
            res.setEncoding('utf8');
            res.on('data', c => data += c);
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.setTimeout(timeoutMs, () => req.destroy(new Error('timeout')));
    });
}

async function verifierMiseAJour() {
    if (!URL_MAJ || URL_MAJ === 'DESACTIVE' || URL_MAJ.includes('TonPseudo')) return;
    try {
        const manifeste = JSON.parse(await telecharger(URL_MAJ + '/version.json'));

        let versionLocale = 0;
        try {
            versionLocale = JSON.parse(fs.readFileSync(path.join(__dirname, 'version.json'), 'utf8')).version || 0;
        } catch (e) { /* pas de version locale -> 0 */ }

        if (!(manifeste.version > versionLocale)) return; // déjà à jour

        const fichiers = manifeste.fichiers || [];
        // 1) on télécharge TOUT en mémoire d'abord (pour ne rien casser si la connexion coupe)
        const contenus = {};
        for (const f of fichiers) {
            contenus[f] = await telecharger(URL_MAJ + '/' + f);
        }
        // 2) on écrit les fichiers
        for (const f of fichiers) {
            fs.writeFileSync(path.join(__dirname, f), contenus[f]);
        }
        // 3) on mémorise la nouvelle version
        fs.writeFileSync(path.join(__dirname, 'version.json'), JSON.stringify({ version: manifeste.version }));

        // 4) on relance l'app avec la nouvelle version
        app.relaunch();
        app.exit(0);
    } catch (e) {
        // hors ligne ou erreur : on démarre simplement la version actuelle
    }
}

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

let fenetre;
let tray;

// Taille "normale" de l'overlay (hors plein écran)
const TAILLE_NORMALE = { width: 600, height: 700 };
let dernierePosition = 'centre';
let libreActif = false;       // true = position libre (glissée), false = zone nommée
let posFx = 0.5, posFy = 0.5; // coordonnées normalisées (0..1) pour la position libre
let ecranChoisiId = null; // null = écran principal (auto)
let reglagesOuverts = false; // vrai quand le panneau de réglages est ouvert

// Renvoie l'écran choisi par l'utilisateur, sinon l'écran principal
function ecranActif() {
    if (ecranChoisiId !== null) {
        const trouve = screen.getAllDisplays().find(d => d.id === ecranChoisiId);
        if (trouve) return trouve;
    }
    return screen.getPrimaryDisplay();
}

function creerEcran() {
    // Hauteur adaptée : assez grande pour voir tous les réglages, mais jamais
    // plus que la zone de travail de l'écran (sinon le haut/bas sort de l'écran).
    const dispo = screen.getPrimaryDisplay().workAreaSize;
    TAILLE_NORMALE.height = Math.min(880, dispo.height - 40);

    fenetre = new BrowserWindow({
        width: TAILLE_NORMALE.width,
        height: TAILLE_NORMALE.height,
        transparent: true,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        type: 'toolbar',
        minimizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false, // nécessaire pour lire les pixels des vidéos (fond vert)
            autoplayPolicy: 'no-user-gesture-required' // son auto + analyse audio sans clic
        }
    });

    fenetre.loadFile('index.html');

    // Le bouclier classique
    fenetre.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    fenetre.setAlwaysOnTop(true, 'screen-saver');

    // === CHIEN DE GARDE ANTI-BUG WINDOWS ===
    setInterval(() => {
        if (fenetre && !fenetre.isDestroyed()) {
            // Quand les réglages sont ouverts, on ne ré-applique pas alwaysOnTop :
            // sinon ça referme les menus déroulants (choix de voix, d'écran...).
            if (reglagesOuverts) return;
            fenetre.setAlwaysOnTop(true, 'screen-saver');
            if (!fenetre.isVisible()) {
                fenetre.showInactive();
            }
        }
    }, 2000);

    // === DÉTECTION D'INACTIVITÉ (AFK) ===
    // Temps depuis la dernière action souris/clavier au niveau système.
    const SEUIL_INACTIF = 300; // secondes (5 min) avant d'être marqué "inactif"
    let dernierInactif = null;
    setInterval(() => {
        if (!fenetre || fenetre.isDestroyed()) return;
        let idle = 0;
        try { idle = powerMonitor.getSystemIdleTime(); } catch (e) { return; }
        const inactif = idle >= SEUIL_INACTIF;
        if (inactif !== dernierInactif) {
            dernierInactif = inactif;
            fenetre.webContents.send('etat-inactivite', inactif);
        }
    }, 15000);

    // --- Clics qui traversent l'overlay ---
    ipcMain.on('clic-traversant', (event, ignorer) => {
        const win = BrowserWindow.fromWebContents(event.sender);
        win.setIgnoreMouseEvents(ignorer, { forward: true });
    });

    // --- État d'ouverture des réglages (pour calmer le chien de garde) ---
    ipcMain.on('reglages-etat', (event, ouvert) => {
        reglagesOuverts = !!ouvert;
    });

    // --- Placement de la fenêtre selon la zone choisie, sur l'écran choisi ---
    function placerFenetre(position) {
        dernierePosition = position;
        const za = ecranActif().workArea; // {x, y, width, height} de l'écran choisi
        const f = fenetre.getBounds();
        let x = za.x, y = za.y;

        switch (position) {
            case 'haut-gauche':  x = za.x;                            y = za.y; break;
            case 'haut-droite':  x = za.x + za.width - f.width;       y = za.y; break;
            case 'bas-gauche':   x = za.x;                            y = za.y + za.height - f.height; break;
            case 'bas-droite':   x = za.x + za.width - f.width;       y = za.y + za.height - f.height; break;
            case 'haut-centre':  x = za.x + Math.round((za.width - f.width) / 2);  y = za.y; break;
            case 'bas-centre':   x = za.x + Math.round((za.width - f.width) / 2);  y = za.y + za.height - f.height; break;
            case 'centre':
            default:
                x = za.x + Math.round((za.width - f.width) / 2);
                y = za.y + Math.round((za.height - f.height) / 2);
                break;
        }
        fenetre.setPosition(x, y);
    }

    // Placement libre : coordonnées normalisées (0..1) dans la zone de travail
    function placerLibre() {
        const za = ecranActif().workArea;
        const f = fenetre.getBounds();
        const x = Math.round(za.x + posFx * (za.width  - f.width));
        const y = Math.round(za.y + posFy * (za.height - f.height));
        fenetre.setPosition(x, y);
    }

    // Replace la fenêtre selon le mode courant (libre ou zone nommée)
    function replacer() {
        if (libreActif) placerLibre();
        else placerFenetre(dernierePosition);
    }

    ipcMain.on('changer-position', (event, position) => {
        libreActif = false;
        placerFenetre(position);
    });

    ipcMain.on('position-libre', (event, coords) => {
        libreActif = true;
        if (coords && typeof coords.fx === 'number') { posFx = coords.fx; posFy = coords.fy; }
        placerLibre();
    });

    // --- Liste des écrans branchés (pour le menu des réglages) ---
    ipcMain.handle('lister-ecrans', () => {
        const idPrincipal = screen.getPrimaryDisplay().id;
        return screen.getAllDisplays().map((d, i) => ({
            id: d.id,
            index: i + 1,
            largeur: d.size.width,
            hauteur: d.size.height,
            primaire: d.id === idPrincipal
        }));
    });

    // --- Choix de l'écran d'affichage ---
    ipcMain.on('choisir-ecran', (event, id) => {
        ecranChoisiId = (id === null || id === undefined) ? null : id;
        replacer();
    });

    // --- Mode plein écran (couvre tout l'écran choisi) ---
    ipcMain.on('mode-plein-ecran', (event, actif) => {
        if (actif) {
            const b = ecranActif().bounds; // tout l'écran choisi, barre des tâches comprise
            fenetre.setBounds({ x: b.x, y: b.y, width: b.width, height: b.height });
        } else {
            fenetre.setBounds({
                x: 0, y: 0,
                width: TAILLE_NORMALE.width,
                height: TAILLE_NORMALE.height
            });
            replacer();
        }
        fenetre.setAlwaysOnTop(true, 'screen-saver');
    });

    // --- Relais des réglages venant de parametres.html (fenêtre séparée éventuelle) ---
    ipcMain.on('nouveaux-parametres', (event, reglages) => {
        if (fenetre && !fenetre.isDestroyed()) {
            fenetre.webContents.send('appliquer-parametres', reglages);
        }
    });

    fenetre.on('minimize', (event) => {
        event.preventDefault();
        setTimeout(() => {
            fenetre.restore();
            fenetre.setAlwaysOnTop(true, 'screen-saver');
        }, 10);
    });

    // --- Icône dans la barre système ---
    try {
        const cheminLogo = path.join(__dirname, 'logo.png');
        const icon = nativeImage.createFromPath(cheminLogo);
        tray = new Tray(icon);
    } catch (erreur) {
        tray = new Tray(nativeImage.createEmpty());
    }

    tray.setToolTip('Live Chat - Réglages');

    tray.on('click', () => {
        fenetre.webContents.send('afficher-reglages');
        fenetre.setAlwaysOnTop(true, 'screen-saver');
    });

    const menuClicDroit = Menu.buildFromTemplate([
        { label: 'Ouvrir les réglages', click: () => {
            fenetre.webContents.send('afficher-reglages');
            fenetre.setAlwaysOnTop(true, 'screen-saver');
        }},
        { type: 'separator' },
        { label: 'Quitter Live Chat', click: () => app.quit() }
    ]);
    tray.setContextMenu(menuClicDroit);

    // --- Raccourci clavier global (par défaut Inser), personnalisable ---
    let raccourciToggle = null;
    function actionToggle() {
        if (fenetre && !fenetre.isDestroyed()) {
            fenetre.webContents.send('basculer-reglages');
            fenetre.setAlwaysOnTop(true, 'screen-saver');
        }
    }
    function enregistrerToggle(acc) {
        if (!acc) return false;
        if (raccourciToggle) { try { globalShortcut.unregister(raccourciToggle); } catch (e) {} }
        let ok = false;
        try { ok = globalShortcut.register(acc, actionToggle); } catch (e) { ok = false; }
        if (ok) { raccourciToggle = acc; return true; }
        // échec (touche déjà prise) : on remet l'ancien raccourci
        if (raccourciToggle) { try { globalShortcut.register(raccourciToggle, actionToggle); } catch (e) {} }
        return false;
    }
    enregistrerToggle('Insert');
    ipcMain.handle('definir-raccourci', (e, acc) => enregistrerToggle(acc));
}

// =========================================================
//  RACCOURCI BUREAU (Windows)
//  Au lancement, si aucun raccourci n'existe sur le bureau, on en crée
//  un pointant vers l'app, avec pour icône logo.png (converti en .ico).
//  On construit un .ico au format BMP/DIB (et non PNG embarqué) car
//  l'explorateur Windows l'affiche de façon bien plus fiable pour les .lnk.
// =========================================================

// Construit un .ico (image BMP/DIB 32 bits) à partir de pixels BGRA
function bgraVersIco(bgra, largeur, hauteur) {
    const tailleImage = largeur * hauteur * 4;
    // masque AND : 1 bit/pixel, lignes alignées sur 4 octets
    const octetsParLigneMasque = Math.ceil(largeur / 8);
    const lignePadMasque = Math.ceil(octetsParLigneMasque / 4) * 4;
    const tailleMasque = lignePadMasque * hauteur;

    // BITMAPINFOHEADER (40 octets)
    const dib = Buffer.alloc(40);
    dib.writeUInt32LE(40, 0);            // taille du header
    dib.writeInt32LE(largeur, 4);        // largeur
    dib.writeInt32LE(hauteur * 2, 8);    // hauteur ×2 (image + masque), convention ICO
    dib.writeUInt16LE(1, 12);            // plans
    dib.writeUInt16LE(32, 14);           // bits par pixel
    dib.writeUInt32LE(0, 16);            // compression BI_RGB
    dib.writeUInt32LE(tailleImage + tailleMasque, 20);

    // BMP est bottom-up : on inverse l'ordre des lignes
    const pixels = Buffer.alloc(tailleImage);
    for (let y = 0; y < hauteur; y++) {
        const src = y * largeur * 4;
        const dst = (hauteur - 1 - y) * largeur * 4;
        bgra.copy(pixels, dst, src, src + largeur * 4);
    }
    const masque = Buffer.alloc(tailleMasque, 0); // 0 = pixel visible (l'alpha gère la transparence)
    const imageComplete = Buffer.concat([dib, pixels, masque]);

    const tete = Buffer.alloc(6);
    tete.writeUInt16LE(0, 0); tete.writeUInt16LE(1, 2); tete.writeUInt16LE(1, 4);
    const entree = Buffer.alloc(16);
    entree.writeUInt8(largeur  >= 256 ? 0 : largeur, 0);
    entree.writeUInt8(hauteur >= 256 ? 0 : hauteur, 1);
    entree.writeUInt8(0, 2); entree.writeUInt8(0, 3);
    entree.writeUInt16LE(1, 4); entree.writeUInt16LE(32, 6);
    entree.writeUInt32LE(imageComplete.length, 8);
    entree.writeUInt32LE(22, 12);

    return Buffer.concat([tete, entree, imageComplete]);
}

// Convertit logo.png -> logo.ico (une seule fois). Renvoie le chemin du .ico, ou null.
function preparerIcone() {
    try {
        const cheminPng = path.join(__dirname, 'logo.png');
        if (!fs.existsSync(cheminPng)) return null;

        const cheminIco = path.join(app.getPath('userData'), 'logo.ico');
        // Régénère si l'ico n'existe pas ou si le png est plus récent
        let aRegenerer = true;
        try {
            if (fs.existsSync(cheminIco)) {
                aRegenerer = fs.statSync(cheminPng).mtimeMs > fs.statSync(cheminIco).mtimeMs;
            }
        } catch (e) {}

        if (aRegenerer) {
            let img = nativeImage.createFromPath(cheminPng);
            if (img.isEmpty()) return null;

            // On normalise à 256×256 max (taille d'icône standard ; évite un .ico énorme)
            const taille = img.getSize();
            const cote = Math.min(256, Math.max(taille.width, taille.height) || 256);
            img = img.resize({ width: cote, height: cote, quality: 'best' });

            const dim = img.getSize();
            const bgra = img.toBitmap(); // pixels BGRA
            fs.writeFileSync(cheminIco, bgraVersIco(bgra, dim.width, dim.height));
        }
        return cheminIco;
    } catch (e) {
        return null;
    }
}

// Crée le raccourci bureau s'il n'existe pas, ou corrige son icône s'il pointe encore sur l'icône Electron
function creerRaccourciBureau() {
    if (process.platform !== 'win32') return; // raccourci .lnk = Windows uniquement

    try {
        const bureau = app.getPath('desktop');
        const cheminRaccourci = path.join(bureau, 'Live Chat HLM.lnk');
        const cible = process.execPath;
        const icone = preparerIcone();

        const options = {
            target: cible,
            cwd: path.dirname(cible),
            description: 'Live Chat HLM - overlay de chat en direct'
        };
        // En mode non empaqueté (npm start), on passe le dossier de l'app en argument
        if (!app.isPackaged) {
            options.args = `"${app.getAppPath()}"`;
        }
        if (icone) {
            options.icon = icone;
            options.iconIndex = 0;
        }

        if (fs.existsSync(cheminRaccourci)) {
            // Le raccourci existe déjà. On vérifie s'il a la bonne icône ;
            // sinon (ancien raccourci avec l'icône Electron), on le met à jour.
            if (!icone) return; // pas d'icône à appliquer, on ne touche à rien
            let icoActuelle = '';
            try {
                const details = shell.readShortcutLink(cheminRaccourci);
                icoActuelle = (details && details.icon) || '';
            } catch (e) {}
            if (icoActuelle !== icone) {
                try { shell.writeShortcutLink(cheminRaccourci, 'update', { icon: icone, iconIndex: 0 }); } catch (e) {}
                rafraichirIcones();
            }
            return;
        }

        // Création initiale
        shell.writeShortcutLink(cheminRaccourci, 'create', options);
        rafraichirIcones();
    } catch (e) {
        // échec silencieux : pas de raccourci, mais l'app démarre normalement
    }
}

// Demande à Windows de rafraîchir son cache d'icônes (sinon l'ancienne icône peut persister à l'écran)
function rafraichirIcones() {
    try {
        const { execFile } = require('child_process');
        // Notifie le shell qu'une association d'icône a changé
        execFile('ie4uinit.exe', ['-show'], () => {});
    } catch (e) {}
}

app.whenReady().then(async () => {
    await verifierMiseAJour(); // si une maj est appliquée, l'app se relance ici
    creerRaccourciBureau();    // crée le raccourci bureau au premier lancement
    creerEcran();
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
