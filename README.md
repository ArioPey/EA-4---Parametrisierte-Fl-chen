# Farbig gefüllte 2D Geometrie

WebGL-Projekt für die Aufgabe **„Farbig gefüllte 2D Geometrie“**.

## Umsetzung

Die vorherige Liniengeometrie wurde als Grundlage verwendet und zu einer farbig gefüllten 2D-Geometrie aus Dreiecken weiterentwickelt.

Die Anwendung verwendet:

- WebGL
- `gl.TRIANGLES`
- einen Vertex-Buffer für Positionen
- einen Vertex-Buffer für RGB-Farben
- einen Index-Buffer
- `gl.drawElements()`
- interpolierte Vertex-Farben
- keine externen Bilddateien

## Dateien

- `index.html` – Webseite, Visualisierung und Dokumentation
- `style.css` – Gestaltung
- `script.js` – WebGL, Shader, Vertices, Farben und Indizes

## Wichtige Datenstrukturen

Jeder Vertex besitzt zwei Positionswerte:

```text
x, y
```

und drei Farbwerte:

```text
r, g, b
```

Die drei Arrays sind aufeinander abgestimmt.

Die Indizes werden jeweils in Dreiergruppen interpretiert:

```text
index1, index2, index3
```

Daraus entsteht jeweils ein Dreieck.

Der Draw-Call lautet:

```javascript
gl.drawElements(
    gl.TRIANGLES,
    indices.length,
    gl.UNSIGNED_SHORT,
    0
);
```

Der `count`-Parameter ist hier also die Anzahl der Index-Einträge und nicht die Anzahl der Werte in `vertices` oder `colors`.

## Farbinterpolation

Der Vertex-Shader übergibt die Farbe über ein `varying` an den Fragment-Shader. WebGL interpoliert die Farbe zwischen den Vertices eines Dreiecks automatisch. Dadurch entstehen weiche Farbverläufe innerhalb der Flächen.

## QA / Fehlerbehandlung

Beim Start werden WebGL-Unterstützung, Shader-Kompilierung und Program-Linking geprüft.

Zusätzlich wird nach dem Draw-Call `gl.getError()` kontrolliert. Fehler werden mit `console.error()` ausgegeben und auf der Webseite angezeigt.

Zum Testen in Chrome:

**Entwicklertools → Console**

## Quelle

Es wurden keine externen Grafiken oder fremden Geometriedaten übernommen. Die Geometrie und die Farbgestaltung wurden für diese Aufgabe eigenständig erstellt.
