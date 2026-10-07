// Farbig gefüllte 2D Geometrie – WebGL
// Eigene Geometrie aus Dreiecken mit interpolierten Vertex-Farben.

"use strict";

const canvas = document.getElementById("glCanvas");
const statusElement = document.getElementById("status");
const vertexCountElement = document.getElementById("vertexCount");
const triangleCountElement = document.getElementById("triangleCount");

// Jeder Vertex: x, y
const vertices = new Float32Array([
  // Kopf und Ohren
  -0.62,  0.35,   // 0
  -0.42,  0.82,   // 1
  -0.12,  0.55,   // 2
   0.12,  0.55,   // 3
   0.42,  0.82,   // 4
   0.62,  0.35,   // 5
   0.52, -0.05,   // 6
   0.30, -0.32,   // 7
   0.00, -0.42,   // 8
  -0.30, -0.32,   // 9
  -0.52, -0.05,   // 10

  // Gesicht
  -0.30,  0.27,   // 11 linkes Auge außen
  -0.18,  0.27,   // 12 linkes Auge innen
  -0.18,  0.15,   // 13
  -0.30,  0.15,   // 14
   0.18,  0.27,   // 15 rechtes Auge innen
   0.30,  0.27,   // 16 rechtes Auge außen
   0.30,  0.15,   // 17
   0.18,  0.15,   // 18
  -0.07,  0.08,   // 19 Nase links
   0.07,  0.08,   // 20 Nase rechts
   0.00, -0.04,    // 21 Nase unten
  -0.14, -0.13,   // 22 Mund links
   0.00, -0.06,    // 23 Mundmitte
   0.14, -0.13,    // 24 Mund rechts

  // Schnurrhaare als kleine Flächen
  -0.20,  0.04,   // 25
  -0.50,  0.10,   // 26
  -0.20, -0.03,   // 27
  -0.52, -0.08,   // 28
   0.20,  0.04,   // 29
   0.50,  0.10,   // 30
   0.20, -0.03,   // 31
   0.52, -0.08,   // 32

  // Brust
  -0.18, -0.32,   // 33
   0.00, -0.52,   // 34
   0.18, -0.32    // 35
]);

// Jeder Vertex: r, g, b
const colors = new Float32Array([
  // Kopf
  0.20,0.48,0.95,   0.35,0.72,1.00,   0.28,0.58,0.98,
  0.28,0.58,0.98,   0.35,0.72,1.00,   0.20,0.48,0.95,
  0.18,0.40,0.85,   0.15,0.34,0.75,   0.18,0.40,0.85,
  0.15,0.34,0.75,   0.18,0.40,0.85,

  // Augen
  0.06,0.10,0.20,   0.10,0.16,0.28,   0.10,0.16,0.28,   0.06,0.10,0.20,
  0.10,0.16,0.28,   0.06,0.10,0.20,   0.06,0.10,0.20,   0.10,0.16,0.28,

  // Nase und Mund
  1.00,0.38,0.48,   1.00,0.38,0.48,   0.88,0.18,0.30,
  0.70,0.12,0.22,   0.88,0.18,0.30,   0.70,0.12,0.22,

  // Schnurrhaare
  0.40,0.65,1.00,   0.55,0.80,1.00,   0.40,0.65,1.00,   0.55,0.80,1.00,
  0.40,0.65,1.00,   0.55,0.80,1.00,   0.40,0.65,1.00,   0.55,0.80,1.00,

  // Brust
  0.24,0.54,0.96,   0.55,0.78,1.00,   0.24,0.54,0.96
]);

// Indizes: jeweils drei Indizes bilden ein Dreieck.
const indices = new Uint16Array([
  // Kopf / Ohren
   0,  1,  2,
   0,  2,  3,
   0,  3,  5,
   3,  4,  5,
   0,  5,  6,
   0,  6, 10,
   6,  7,  8,
   6,  8, 10,
   8,  9, 10,

  // linkes Auge
  11,12,13,
  11,13,14,

  // rechtes Auge
  15,16,17,
  15,17,18,

  // Nase
  19,20,21,

  // Mund
  22,23,24,

  // Schnurrhaare links
  25,26,27,
  27,26,28,

  // Schnurrhaare rechts
  29,30,31,
  31,30,32,

  // Brust
  33,34,35
]);

const vertexCount = vertices.length / 2;
const triangleCount = indices.length / 3;

vertexCountElement.textContent = String(vertexCount);
triangleCountElement.textContent = String(triangleCount);

const vertexShaderSource = `
attribute vec2 a_position;
attribute vec3 a_color;

varying vec3 v_color;

void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
    v_color = a_color;
}
`;

const fragmentShaderSource = `
precision mediump float;

varying vec3 v_color;

void main() {
    gl_FragColor = vec4(v_color, 1.0);
}
`;

function fail(message) {
  console.error(message);
  statusElement.textContent = message;
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);

  if (!shader) {
    throw new Error("Shader konnte nicht erstellt werden.");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) || "Unbekannter Shader-Fehler.";
    gl.deleteShader(shader);
    throw new Error(log);
  }

  return shader;
}

function createProgram(gl) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

  const program = gl.createProgram();

  if (!program) {
    throw new Error("WebGL-Programm konnte nicht erstellt werden.");
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) || "Unbekannter Linker-Fehler.";
    gl.deleteProgram(program);
    throw new Error(log);
  }

  return program;
}

function createBuffer(gl, data, target = gl.ARRAY_BUFFER) {
  const buffer = gl.createBuffer();

  if (!buffer) {
    throw new Error("WebGL-Buffer konnte nicht erstellt werden.");
  }

  gl.bindBuffer(target, buffer);
  gl.bufferData(target, data, gl.STATIC_DRAW);
  return buffer;
}

function resize(gl) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.floor(canvas.clientWidth * dpr);
  const height = Math.floor(canvas.clientWidth * (650 / 900) * dpr);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
}

function init() {
  if (!window.WebGLRenderingContext) {
    fail("WebGL wird von diesem Browser nicht unterstützt.");
    return;
  }

  const gl = canvas.getContext("webgl", {
    antialias: true,
    alpha: false
  });

  if (!gl) {
    fail("WebGL-Kontext konnte nicht erstellt werden.");
    return;
  }

  try {
    const program = createProgram(gl);

    const positionBuffer = createBuffer(gl, vertices);
    const colorBuffer = createBuffer(gl, colors);
    const indexBuffer = createBuffer(gl, indices, gl.ELEMENT_ARRAY_BUFFER);

    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const colorLocation = gl.getAttribLocation(program, "a_color");

    if (positionLocation < 0 || colorLocation < 0) {
      throw new Error("Ein benötigtes Vertex-Attribut wurde nicht gefunden.");
    }

    // Positionsattribute
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(
      positionLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0
    );

    // Farbattribute
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.enableVertexAttribArray(colorLocation);
    gl.vertexAttribPointer(
      colorLocation,
      3,
      gl.FLOAT,
      false,
      0,
      0
    );

    // Index-Buffer für drawElements
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    function draw() {
      resize(gl);

      gl.clearColor(0.985, 0.99, 0.995, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      // count = Anzahl der Index-Einträge.
      // Drei Indizes ergeben jeweils ein Dreieck.
      gl.drawElements(
        gl.TRIANGLES,
        indices.length,
        gl.UNSIGNED_SHORT,
        0
      );

      const error = gl.getError();
      if (error !== gl.NO_ERROR) {
        console.error("WebGL draw error:", error);
      }
    }

    window.addEventListener("resize", draw);
    draw();

    statusElement.textContent = "WebGL aktiv · Farbige Flächen erfolgreich dargestellt";

    console.info("WebGL erfolgreich initialisiert.");
    console.info("Vertices:", vertexCount);
    console.info("Dreiecke:", triangleCount);
    console.info("Indices:", indices.length);
    console.info("drawElements count:", indices.length);
  } catch (error) {
    fail("WebGL-Fehler: " + error.message);
  }
}

init();
