# Parametrisierte Flächen

WebGL-Projekt für die Aufgabe **„Parametrisierte Flächen“**.

## Enthaltene Flächen

### 1. Möbius-Band

Parametrisierung:

```text
x = (1 + v cos(u/2)) cos(u)
y = (1 + v cos(u/2)) sin(u)
z = v sin(u/2)
```

mit:

```text
u ∈ [0, 2π]
v ∈ [-0.45, 0.45]
```

Quelle:  
http://www.3d-meier.de/tut3/Seite0.html

### 2. Torus

Parametrisierung:

```text
x = (R + r cos(v)) cos(u)
y = (R + r cos(v)) sin(u)
z = r sin(v)
```

mit:

```text
R = 0.60
r = 0.27
u,v ∈ [0, 2π]
```

Quelle:  
http://www.3d-meier.de/tut3/Seite0.html

### 3. Eigene Parametrisierung – Wellenblüte

Die eigene Fläche kombiniert eine dreifache radiale Welle mit einer ringförmigen Parametrisierung:

```text
ρ(u) = 0.62 + 0.14 sin(3u)

x = ρ(u) cos(u) (0.78 + 0.22 cos(v))
y = ρ(u) sin(u) (0.78 + 0.22 cos(v))
z = 0.22 sin(v) + 0.08 sin(3u)
```

mit:

```text
u,v ∈ [0, 2π]
```

Die Formel wurde für diese Aufgabe selbst entwickelt.

## Technische Umsetzung

Die Parameterfläche wird als regelmäßiges `u`-/`v`-Gitter erzeugt.

Aus jeweils vier benachbarten Gitterpunkten entstehen zwei Dreiecke:

```text
a --- b
|   / |
|  /  |
c --- d

Dreieck 1: a, c, b
Dreieck 2: b, c, d
```

Für die Darstellung werden zwei `drawElements()`-Aufrufe verwendet:

```javascript
gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_INT, 0);
gl.drawElements(gl.LINES, lineIndexCount, gl.UNSIGNED_INT, 0);
```

Dadurch können Füllung und Linien gleichzeitig dargestellt werden.

## Farbgebung

Die Vertex-Farben werden abhängig von Position, Höhe und Winkel der jeweiligen Fläche berechnet. Der Vertex-Shader übergibt die Farben an den Fragment-Shader. WebGL interpoliert die Farben innerhalb der Dreiecke und erzeugt dadurch Farbverläufe.

## Interaktion

- **B-Taste:** nächste Fläche
- **Fläche wechseln:** nächste Fläche
- **Modus:** Füllung + Linien / nur Füllung / nur Linien

## NDC / Skalierung

Die erzeugten Koordinaten werden so gewählt bzw. skaliert, dass sie im sichtbaren NDC-Bereich von ungefähr `-1` bis `+1` liegen. Eine Kamera ist nicht erforderlich.

## QA / Fehlerbehandlung

Shader-Kompilierung, Program-Linking und WebGL-Kontext werden geprüft. Nach den Draw-Calls wird `gl.getError()` kontrolliert.

Zum Testen in Chrome:

**Entwicklertools → Console**

## Quellen

Parametrisierte Flächen und mathematische Anregungen:

http://www.3d-meier.de/tut3/Seite0.html

Zum Ausprobieren parametrischer Flächen:

https://stemkoski.github.io/Three.js/Graphulus-Surface.html

Die konkrete Wellenblüte wurde selbst parametrisiert.
