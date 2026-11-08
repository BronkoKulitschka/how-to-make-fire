# How to Make Fire

Spielbarer Browserprototyp 0.1. Ein Platz am Waldrand, drei Streichhölzer und ein überschaubarer Auftrag.

## Spielen

Am Computer die ZIP vollständig entpacken und index.html im Browser öffnen. Auf Android lässt sich das Spiel über GitHub Pages in Chrome aufrufen. Auf „Platz nehmen“ tippen. Verfügbare Handlungen stehen unter der Szene. Am Rechner funktionieren auch die angezeigten Zifferntasten. Die Aktionen ändern sich mit der Situation. Hintergrundgeräusche lassen sich über „Ton“ abschalten. Ein neuer Durchgang startet wieder mit drei Streichhölzern.

## GitHub Pages

1. Ein Repository anlegen, beispielsweise how-to-make-fire. Bei GitHub Free ein öffentliches Repository verwenden.
2. Alle entpackten Dateien direkt auf oberster Ebene in den Branch main hochladen.
3. Unter Settings → Pages → Build and deployment „Deploy from a branch“ auswählen, anschließend main und /(root). Speichern.
4. Nach dem Deployment die unter Pages angezeigte Spieladresse öffnen.

## Weiterentwickeln

- game.js enthält Spielzeit, Wetter, Gegenstände, Begegnungen und Siegbedingung. In available() stehen die momentan möglichen Handlungen, in act() ihre Folgen. tick() steuert zeitabhängige Ereignisse.
- render.js zeichnet die wechselnden Teile der Szene, erzeugt das Geräusch von Wind und Feuer und verarbeitet Eingaben.
- woods.jpg ist die feste Kulisse. index.html enthält die Oberfläche und deren Darstellung.

Alle Dateien bleiben im selben Verzeichnis. Es gibt keine externen Laufzeitabhängigkeiten.
