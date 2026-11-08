# How to Make Fire · v0.2

Eine 3D-Feuerstelle im Wald. Drei Streichhölzer. Es wird dunkel.

## Spielen

Die Seite öffnen und die Dinge an der Feuerstelle mit der Maus oder dem Finger untersuchen. Gegenstände reagieren auf Berühren und Ziehen. Die erste Berührung aktiviert den Ton und die Spielzeit. Die Kamera bleibt am selben Platz. Zum erneuten Spielen die Seite neu laden.

GitHub Pages kann dieses Verzeichnis direkt aus dem Stamm von main ausliefern. Lokal lässt sich index.html im Browser öffnen. Alle Spielressourcen liegen im Repository.

## Aufbau

game.js enthält Zustände und Reaktionen. mesh.js projiziert die 3D-Geometrie, rendert sie mit WebGL und ermittelt per Strahltest, welches Objekt berührt wurde. Für Geräte ohne WebGL gibt es eine perspektivische Canvas-Darstellung. world.js baut Landschaft und Gegenstände auf. render.js verbindet Spielzeit, Audio, Kamera und Zeigereingaben.
