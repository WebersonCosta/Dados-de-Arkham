import { THREE } from '../vendor.js';

// Formas dos dados. Aqui só há geometria: vértices, faces, que valor fica em cada face e onde
// cada número cabe. Como o dado é pintado (cor, fonte, desgaste) é decidido pelo tema.

const PHI = (1 + Math.sqrt(5)) / 2;

const cubeCorners = () => {
  const out = [];
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) out.push([x, y, z]);
  return out;
};

function scaled(points, radius) {
  const max = Math.max(...points.map(p => Math.hypot(...p)));
  return points.map(p => new THREE.Vector3(...p).multiplyScalar(radius / max));
}

// Trapezoedro pentagonal (d10). Com os polos à altura h, o zigue-zague do meio fica em ±h·tan²(18°),
// o que deixa cada face (uma "pipa") perfeitamente plana.
function trapezohedron(r, h) {
  const e = h * Math.tan(Math.PI / 10) ** 2;
  const V = [];
  for (let i = 0; i < 10; i++) {
    const a = i * Math.PI / 5;
    V.push(new THREE.Vector3(Math.cos(a) * r, i % 2 === 0 ? e : -e, Math.sin(a) * r));
  }
  V.push(new THREE.Vector3(0, h, 0), new THREE.Vector3(0, -h, 0));
  return V;
}

function dodecahedron() {
  const p = cubeCorners(), a = 1 / PHI, b = PHI;
  for (const s of [-1, 1]) for (const t of [-1, 1]) p.push([0, s * a, t * b], [s * a, t * b, 0], [s * b, 0, t * a]);
  return p;
}

function icosahedron() {
  const p = [];
  for (const s of [-1, 1]) for (const t of [-1, 1]) p.push([0, s, t * PHI], [s, t * PHI, 0], [s * PHI, 0, t]);
  return p;
}

// read: 'face' lê a face de cima; 'vertex' lê a ponta de cima (é assim que se lê o d4).
// labelUp: para onde aponta o topo do número em cada face ('vertex' = uma ponta, 'edge' = uma aresta).
const SHAPES = {
  d4: { vertices: () => scaled([[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]], 1.2), read: 'vertex', angularDamping: .14 },
  d6: { vertices: () => scaled(cubeCorners(), 1.08), read: 'face', labelUp: 'edge', angularDamping: .14 },
  d8: { vertices: () => scaled([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], 1), read: 'face', labelUp: 'vertex', angularDamping: .14 },
  d10: { vertices: () => trapezohedron(.8, .86), read: 'face', labelUp: 'vertex', angularDamping: .14 },
  d12: { vertices: () => scaled(dodecahedron(), 1.02), read: 'face', labelUp: 'vertex', angularDamping: .18 },
  d20: { vertices: () => scaled(icosahedron(), 1.05), read: 'face', labelUp: 'vertex', angularDamping: .2 }
};

// Encontra as faces de um sólido convexo a partir dos vértices: cada plano que encosta no sólido
// por fora e passa por três ou mais vértices é uma face. Os vértices saem em ordem anti-horária
// vistos de fora, como a física e o desenho 3D esperam.
function hullFaces(V) {
  const found = [], eps = 1e-5;
  for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) for (let k = j + 1; k < V.length; k++) {
    const n = new THREE.Vector3().subVectors(V[j], V[i]).cross(new THREE.Vector3().subVectors(V[k], V[i]));
    if (n.lengthSq() < 1e-10) continue;
    n.normalize();
    let d = n.dot(V[i]);
    if (d < 0) { n.negate(); d = -d; }
    if (V.some(v => n.dot(v) > d + eps)) continue;
    if (found.some(f => f.normal.dot(n) > 1 - 1e-6)) continue;
    const idx = [];
    V.forEach((v, m) => { if (Math.abs(n.dot(v) - d) < eps) idx.push(m); });
    found.push({ normal: n, idx });
  }
  return found.map(({ normal, idx }) => {
    const center = idx.reduce((s, m) => s.add(V[m]), new THREE.Vector3()).multiplyScalar(1 / idx.length);
    const u = new THREE.Vector3().subVectors(V[idx[0]], center).normalize();
    const w = new THREE.Vector3().crossVectors(normal, u);
    const angle = m => { const p = new THREE.Vector3().subVectors(V[m], center); return Math.atan2(p.dot(w), p.dot(u)); };
    idx.sort((a, b) => angle(a) - angle(b));
    return { normal, idx, center };
  });
}

const shapeCache = new Map();
export function getShape(id) {
  if (!shapeCache.has(id)) {
    const def = SHAPES[id];
    const V = def.vertices();
    shapeCache.set(id, {
      id, V, faces: hullFaces(V), radius: Math.max(...V.map(v => v.length())),
      read: def.read, labelUp: def.labelUp, angularDamping: def.angularDamping
    });
  }
  return shapeCache.get(id);
}

// Faces opostas sempre somam o mesmo (1 e 20, 2 e 19…), como nos dados de verdade.
function faceValues(shape, values) {
  const n = shape.faces.length;
  if (values.length !== n) throw new Error(`${shape.id} precisa de ${n} valores`);
  const sorted = [...values].sort((a, b) => a - b);
  const order = shape.faces.map((f, i) => i).sort((a, b) => {
    const A = shape.faces[a].normal, B = shape.faces[b].normal;
    return Math.round((B.y - A.y) * 1e4) || Math.atan2(A.z, A.x) - Math.atan2(B.z, B.x);
  });
  const out = new Array(n);
  let k = 0;
  for (const i of order) {
    if (out[i] !== undefined) continue;
    const j = shape.faces.findIndex(f => f.normal.dot(shape.faces[i].normal) < -.999);
    out[i] = sorted[k];
    out[j] = sorted[n - 1 - k];
    k++;
  }
  return out;
}

/* ---------------------------------------------------------------- molde da textura */
// Cada face ganha uma casa quadrada numa textura em grade. O tema pinta nessa grade; aqui só se
// calcula onde fica cada face, onde vai cada número e qual o maior tamanho que ele pode ter.

const CELL = 256;
const AMBIGUOUS = new Set(['6', '9']);

function atlasGrid(n) {
  let best = null;
  for (let cols = 1; cols <= n; cols++) {
    const rows = Math.ceil(n / cols), score = cols * rows * 10 + Math.abs(cols - rows);
    if (!best || score < best.score) best = { cols, rows, score };
  }
  return best;
}

// Coordenadas 2D da face, com o eixo "para cima" apontando para onde o número deve ficar de pé.
function faceFrame(shape, face) {
  const { V } = shape, { normal: n, idx, center: c } = face;
  let target;
  if (shape.labelUp === 'edge') target = new THREE.Vector3().addVectors(V[idx[0]], V[idx[1]]).multiplyScalar(.5);
  else {
    let best = -1;
    for (const m of idx) { const d = V[m].distanceTo(c); if (d > best + 1e-6) { best = d; target = V[m]; } }
  }
  const up = new THREE.Vector3().subVectors(target, c);
  up.addScaledVector(n, -up.dot(n)).normalize();
  const right = new THREE.Vector3().crossVectors(up, n);
  const pts = idx.map(m => { const p = new THREE.Vector3().subVectors(V[m], c); return [p.dot(right), p.dot(up)]; });
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  return { pts, bx: (x0 + x1) / 2, by: (y0 + y1) / 2, size: Math.max(x1 - x0, y1 - y0) };
}

// Maior altura (em pixels) de uma caixa de texto com a proporção pedida, centrada em (cx, cy) e
// girada por `angle`, que ainda cabe inteira dentro da face.
function makeFit(poly, cx, cy, angle) {
  const cos = Math.cos(angle), sin = Math.sin(angle);
  const inside = (x, y) => {
    let sign = 0;
    for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length];
      const c = (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1);
      if (Math.abs(c) < 1e-9) continue;
      if (!sign) sign = Math.sign(c);
      else if (Math.sign(c) !== sign) return false;
    }
    return true;
  };
  return aspect => {
    let lo = 0, hi = CELL;
    for (let k = 0; k < 22; k++) {
      const h = (lo + hi) / 2, w = h * aspect;
      const fits = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]
        .every(([x, y]) => inside(cx + x * cos - y * sin, cy + x * sin + y * cos));
      if (fits) lo = h; else hi = h;
    }
    return lo;
  };
}

function buildLayout(shape, values, labelFor) {
  const { cols, rows } = atlasGrid(shape.faces.length);
  const W = cols * CELL, H = rows * CELL;
  const frames = shape.faces.map(f => faceFrame(shape, f));
  const span = Math.max(...frames.map(f => f.size)) * 1.1;
  const faces = frames.map((fr, i) => {
    const ox = (i % cols) * CELL, oy = Math.floor(i / cols) * CELL;
    const toPx = ([x, y]) => [ox + CELL / 2 + (x - fr.bx) / span * CELL, oy + CELL / 2 - (y - fr.by) / span * CELL];
    const poly = fr.pts.map(toPx);
    const label = (value, at, angle) => {
      const text = labelFor(value), [x, y] = toPx(at);
      return { text, x, y, angle, mark: AMBIGUOUS.has(text), fit: makeFit(poly, x, y, angle) };
    };
    const labels = shape.read === 'vertex'
      // d4: um número perto de cada ponta, com o topo virado para ela
      ? shape.faces[i].idx.map((m, j) => { const [vx, vy] = fr.pts[j]; return label(values[m], [vx * .5, vy * .5], Math.atan2(vx, vy)); })
      : [label(values[i], [0, 0], 0)];
    return { poly, labels, uv: poly.map(([x, y]) => [x / W, 1 - y / H]) };
  });
  return { W, H, faces };
}

function buildGeometry(shape, layout) {
  const pos = [], uv = [];
  shape.faces.forEach((f, i) => {
    const fuv = layout.faces[i].uv;
    for (let k = 1; k < f.idx.length - 1; k++) for (const j of [0, k, k + 1]) {
      const v = shape.V[f.idx[j]];
      pos.push(v.x, v.y, v.z);
      uv.push(...fuv[j]);
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return geo;
}

// Um dado pronto para o tema pintar e para a física lançar.
// values: os valores do dado (ex.: 1 a 20); labelFor: como cada valor é escrito na face.
export function createDieModel(shapeId, values, labelFor = String) {
  const shape = getShape(shapeId);
  let placed = values;
  if (shape.read === 'face') placed = faceValues(shape, values);
  else if (values.length !== shape.V.length) throw new Error(`${shapeId} precisa de ${shape.V.length} valores`);
  const layout = buildLayout(shape, placed, labelFor);
  return { shape, values: placed, layout, geometry: buildGeometry(shape, layout) };
}
