@echo off
title Lancement de la Cacabox
:: =========================================================
:: CORRECTIF : on se place TOUJOURS dans le dossier de ce fichier.
:: (Sans ca, au demarrage de Windows le dossier courant est System32.)
:: =========================================================
cd /d "%~dp0"
:: =========================================================
:: ETAPE 0 : LE MODE INVISIBLE
:: =========================================================
if "%~1"=="invisible" goto :LANCER_APPLI
:: =========================================================
:: AUTO-DEBLOCAGE : enleve l'etiquette "vient d'internet" de tous
:: les fichiers du dossier, pour ne plus avoir l'alerte de securite.
:: (Marche quel que soit l'emplacement du dossier.)
:: =========================================================
powershell -NoProfile -ExecutionPolicy Bypass -Command "Get-ChildItem -LiteralPath '%~dp0' -File | Unblock-File" >nul 2>&1
:: =========================================================
:: ETAPE 1 : VERIFICATION DE NODE.JS (1er lancement)
:: =========================================================
node -v >nul 2>nul
IF %ERRORLEVEL% EQU 0 GOTO PASSER_EN_INVISIBLE
echo Il te manque Node.js pour faire fonctionner la Cacabox !
echo Installation automatique en cours...
curl -s -o installateur_nodejs.msi https://nodejs.org/dist/v20.15.0/node-v20.15.0-x64.msi
start /wait installateur_nodejs.msi
echo.
echo Installation terminee !
echo Appuie sur une touche pour fermer, puis double-clique a nouveau sur ce fichier.
pause
exit
:: =========================================================
:: ETAPE 2 : PASSAGE EN INVISIBLE
:: =========================================================
:PASSER_EN_INVISIBLE
echo Set WshShell = CreateObject("WScript.Shell") > "%temp%\lanceur_cache.vbs"
echo WshShell.CurrentDirectory = "%~dp0" >> "%temp%\lanceur_cache.vbs"
echo WshShell.Run chr(34) ^& "%~f0" ^& chr(34) ^& " invisible", 0 >> "%temp%\lanceur_cache.vbs"
wscript.exe "%temp%\lanceur_cache.vbs"
exit
:: =========================================================
:: ETAPE 3 : LE MOTEUR (100% INVISIBLE)
:: =========================================================
:LANCER_APPLI
cd /d "%~dp0"
IF NOT EXIST "node_modules" (
    call npm install
)
:: Filtre de nudite : installe nsfwjs si absent (sans ralentir les lancements normaux)
IF NOT EXIST "node_modules\nsfwjs" (
    call npm install nsfwjs
)
call npx electron .
exit
