// Parametrisierte Flächen – WebGL
"use strict";

const canvas = document.getElementById("glCanvas");
const statusElement = document.getElementById("status");
const titleElement = document.getElementById("surfaceTitle");
const formulaShortElement = document.getElementById("formulaShort");
const vertexCountElement = document.getElementById("vertexCount");
const renderModeElement = document.getElementById("renderMode");
const toggleButton = document.getElementById("toggleButton");
const modeButton = document.getElementById("modeButton");
const modeBadge = document.getElementById("modeBadge");

const TAU = Math.PI * 2;

const surfaces = [
  {
    name: "Fläche 1 · Möbius-Band",
    short: "Möbius-Band",
    uSegments: 64,
    vSegments: 18,
    colorMode: "height"
  },
  {
    name: "Fläche 2 · Torus",
    short: "Torus",
    uSegments: 64,
    vSegments: 32,
    colorMode: "torus"
  },
  {
    name: "Fläche 3 · Eigene Wellenblüte ★",
    short: "Eigene Wellenblüte",
    uSegments: 72,
    vSegments: 36,
    colorMode: "flower"
  }
];

let surfaceIndex = 0;
let renderMode = 0; // 0 = fill + lines, 1 = fill, 2 = lines
let gl = null;
let program = null;
let positionLocation = -1;
let colorLocation = -1;
let positionBuffer = null;
let colorBuffer = null;
let indexBuffer = null;
let lineIndexBuffer = null;
let indexCount = 0;
let lineIndexCount = 0;

const vertexShaderSource = `
attribute vec3 a_position;
attribute vec3 a_color;

varying vec3 v_color;

void main() {
    gl_Position = vec4(a_position, 1.0);
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

function createShader(type, source) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Shader konnte nicht erstellt werden.");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) || "Unbekannter Shader-Fehler.";
    gl.deleteShader(shader);
    throw new Error(log);
  }

  return shader;
}

function createProgram() {
  const vs = createShader(gl.VERTEX_SHADER, vertexShaderSource);
  const fs = createShader(gl.FRAGMENT_SHADER, fragmentShaderSource);

  program = gl.createProgram();
  if (!program) throw new Error("WebGL-Programm konnte nicht erstellt werden.");

  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  gl.deleteShader(vs);
  gl.deleteShader(fs);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) || "Unbekannter Linker-Fehler.";
    throw new Error(log);
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function normalize3(x, y, z) {
  const length = Math.hypot(x, y, z) || 1;
  return [x / length, y / length, z / length];
}

function colorFor(surface, x, y, z) {
  // Farbverläufe werden aus der Position bzw. Höhe der Fläche erzeugt.
  const h = clamp((z + 0.8) / 1.6, 0, 1);
  const angle = (Math.atan2(y, x) + Math.PI) / TAU;

  if (surface.colorMode === "height") {
    return [
      0.18 + 0.50 * h,
      0.30 + 0.45 * (1 - h),
      0.85 + 0.10 * h
    ];
  }

  if (surface.colorMode === "torus") {
    return [
      0.20 + 0.55 * h,
      0.75 - 0.35 * h,
      0.95 - 0.35 * h
    ];
  }

  return [
    0.85 - 0.45 * h,
    0.28 + 0.50 * angle,
    0.55 + 0.35 * (1 - h)
  ];
}

function makeGrid(surface, pointFunction) {
  const cols = surface.uSegments + 1;
  const rows = surface.vSegments + 1;

  const positions = [];
  const colors = [];
  const triangles = [];

  for (let j = 0; j < rows; j++) {
    const v = j / surface.vSegments;

    for (let i = 0; i < cols; i++) {
      const u = i / surface.uSegments;

      const p = pointFunction(u, v);
      const c = colorFor(surface, p[0], p[1], p[2]);

      positions.push(p[0], p[1], p[2]);
      colors.push(c[0], c[1], c[2]);
    }
  }

  for (let j = 0; j < surface.vSegments; j++) {
    for (let i = 0; i < surface.uSegments; i++) {
      const a = j * cols + i;
      const b = a + 1;
      const c = a + cols;
      const d = c + 1;

      triangles.push(a, c, b);
      triangles.push(b, c, d);
    }
  }

  // Für die sichtbaren Gitterlinien werden die horizontalen und vertikalen
  // Kanten des Parameter-Gitters einmalig als Linien gespeichert.
  const lines = [];

  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < surface.uSegments; i++) {
      const a = j * cols + i;
      lines.push(a, a + 1);
    }
  }

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < surface.vSegments; j++) {
      const a = j * cols + i;
      lines.push(a, a + cols);
    }
  }

  return {
    positions: new Float32Array(positions),
    colors: new Float32Array(colors),
    triangles: new Uint32Array(triangles),
    lines: new Uint32Array(lines)
  };
}

// 1) Möbius-Band
function mobiusPoint(u01, v01) {
  const u = TAU * u01;
  const v = -0.45 + 0.90 * v01;

  const x = (1.0 + v * Math.cos(u / 2)) * Math.cos(u);
  const y = (1.0 + v * Math.cos(u / 2)) * Math.sin(u);
  const z = v * Math.sin(u / 2);

  const c = 0.46;
  return [c * x, c * y, c * z];
}

// 2) Torus
function torusPoint(u01, v01) {
  const u = TAU * u01;
  const v = TAU * v01;

  const R = 0.60;
  const r = 0.27;

  const x = (R + r * Math.cos(v)) * Math.cos(u);
  const y = (R + r * Math.cos(v)) * Math.sin(u);
  const z = r * Math.sin(v);

  return [x, y, z];
}

// 3) Eigene Parametrisierung: Wellenblüte
// rho(u) = 0.62 + 0.14 sin(3u)
// x = rho(u) cos(u) (0.78 + 0.22 cos(v))
// y = rho(u) sin(u) (0.78 + 0.22 cos(v))
// z = 0.22 sin(v) + 0.08 sin(3u)
function flowerPoint(u01, v01) {
  const u = TAU * u01;
  const v = TAU * v01;

  const rho = 0.62 + 0.14 * Math.sin(3 * u);
  const radial = 0.78 + 0.22 * Math.cos(v);

  const x = rho * Math.cos(u) * radial;
  const y = rho * Math.sin(u) * radial;
  const z = 0.22 * Math.sin(v) + 0.08 * Math.sin(3 * u);

  return [x, y, z];
}

function generateSurface(index) {
  const surface = surfaces[index];

  if (index === 0) {
    return makeGrid(surface, mobiusPoint);
  }

  if (index === 1) {
    return makeGrid(surface, torusPoint);
  }

  return makeGrid(surface, flowerPoint);
}

function uploadBuffer(target, data, usage = gl.STATIC_DRAW) {
  const buffer = gl.createBuffer();
  if (!buffer) throw new Error("WebGL-Buffer konnte nicht erstellt werden.");

  gl.bindBuffer(target, buffer);
  gl.bufferData(target, data, usage);
  return buffer;
}

function updateSurface() {
  const data = generateSurface(surfaceIndex);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, data.positions, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, data.colors, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.triangles, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineIndexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.lines, gl.STATIC_DRAW);

  indexCount = data.triangles.length;
  lineIndexCount = data.lines.length;

  titleElement.textContent = surfaces[surfaceIndex].name;
  formulaShortElement.textContent = surfaces[surfaceIndex].short;
  vertexCountElement.textContent = String(data.positions.length / 3);

  draw();
}

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.floor(canvas.clientWidth * dpr);
  const height = Math.floor(canvas.clientWidth * (700 / 1000) * dpr);

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
}

function draw() {
  if (!gl || !program) return;

  resize();

  gl.clearColor(0.985, 0.99, 0.995, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.enableVertexAttribArray(colorLocation);
  gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

  if (renderMode === 0 || renderMode === 1) {
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(
      gl.TRIANGLES,
      indexCount,
      gl.UNSIGNED_INT,
      0
    );
  }

  if (renderMode === 0 || renderMode === 2) {
    // Linien sind bewusst über die Parameter-Gitterkanten gelegt.
    gl.lineWidth(1);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineIndexBuffer);
    gl.drawElements(
      gl.LINES,
      lineIndexCount,
      gl.UNSIGNED_INT,
      0
    );
  }

  const error = gl.getError();
  if (error !== gl.NO_ERROR) {
    console.error("WebGL draw error:", error);
  }
}

function updateModeText() {
  const names = [
    "Füllung + Linien",
    "Nur Füllung",
    "Nur Linien"
  ];

  const name = names[renderMode];
  modeButton.textContent = "Modus: " + name;
  modeBadge.textContent = name;
  renderModeElement.textContent = name;
}

function toggleSurface() {
  surfaceIndex = (surfaceIndex + 1) % surfaces.length;
  updateSurface();
}

function toggleMode() {
  renderMode = (renderMode + 1) % 3;
  updateModeText();
  draw();
}

function init() {
  if (!window.WebGLRenderingContext) {
    fail("WebGL wird von diesem Browser nicht unterstützt.");
    return;
  }

  gl = canvas.getContext("webgl", {
    antialias: true,
    alpha: false
  });

  if (!gl) {
    fail("WebGL-Kontext konnte nicht erstellt werden.");
    return;
  }

  try {
    gl.getExtension("OES_element_index_uint");

    createProgram();

    positionLocation = gl.getAttribLocation(program, "a_position");
    colorLocation = gl.getAttribLocation(program, "a_color");

    if (positionLocation < 0 || colorLocation < 0) {
      throw new Error("Benötigte Shader-Attribute wurden nicht gefunden.");
    }

    positionBuffer = gl.createBuffer();
    colorBuffer = gl.createBuffer();
    indexBuffer = gl.createBuffer();
    lineIndexBuffer = gl.createBuffer();

    if (!positionBuffer || !colorBuffer || !indexBuffer || !lineIndexBuffer) {
      throw new Error("Ein WebGL-Buffer konnte nicht erstellt werden.");
    }

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    toggleButton.addEventListener("click", toggleSurface);
    modeButton.addEventListener("click", toggleMode);

    window.addEventListener("keydown", (event) => {
      if (event.key.toLowerCase() === "b") {
        toggleSurface();
      }
    });

    window.addEventListener("resize", draw);

    updateModeText();
    updateSurface();

    statusElement.textContent =
      "WebGL aktiv · B = Fläche wechseln · 3 Flächen verfügbar";

    console.info("WebGL erfolgreich initialisiert.");
    console.info("Flächen:", surfaces.length);
  } catch (error) {
    fail("WebGL-Fehler: " + error.message);
  }
}

init();
