import { THREE } from '../../vendor.js';
import { rand } from '../../lib/util.js';
import { mkCanvas, speckle, canvasTexture } from '../../lib/canvas.js';

// Aparência dos dados no tema Arkham. Recebe o molde de cada dado (onde fica cada face e cada
// número na textura) e pinta: pedra esverdeada ou osso envelhecido, bordas gastas, números entalhados.

const FONT = 'Cinzel, "Trajan Pro", Georgia, serif';
const FILL = .8;   // quanto do espaço livre da face o número ocupa

const STYLES = {
  // dezenas do d100: pedra esverdeada, números verde-pálidos com um brilho fraco
  stone: {
    base: '#2c3d33', specks: ['#3a4e40', '#1c2820', '#4a5e4a', '#162019', '#33443a'], vein: 'rgba(150,185,150,.13)',
    ink: '#c3e6b4', glow: '#6fbf6c', edge: 'rgba(0,0,0,.6)', edgeHi: 'rgba(170,200,160,.18)',
    roughness: .4, emissive: .8
  },
  // unidades do d100 e os outros dados: osso envelhecido com tinta escura
  bone: {
    base: '#d3c49e', specks: ['#c2b088', '#e2d6b6', '#a99366', '#bba67a'], vein: 'rgba(90,65,30,.22)',
    ink: '#1c2a1b', glow: null, edge: 'rgba(70,50,22,.55)', edgeHi: 'rgba(255,245,220,.35)',
    roughness: .55, emissive: 0
  }
};
const styleFor = (setId, role) => (role === 'tens' ? STYLES.stone : STYLES.bone);

// Mede o número e calcula o tamanho de fonte que o faz caber na face.
function measure(ctx, label) {
  ctx.font = `700 100px ${FONT}`;
  const t = ctx.measureText(label.text);
  const asc = t.actualBoundingBoxAscent, desc = t.actualBoundingBoxDescent;
  const w = (t.actualBoundingBoxLeft + t.actualBoundingBoxRight) || t.width;
  const mark = label.mark ? .26 : 0;   // espaço para o traço que separa o 6 do 9
  const h = (asc + desc) * (1 + mark);
  const k = label.fit(w / h) * FILL / h;
  return { px: 100 * k, asc: asc * k, desc: desc * k, w: w * k, glyph: (asc + desc) * k, mark };
}

function drawLabel(ctx, label, m, color, shadow) {
  ctx.save();
  ctx.translate(label.x, label.y);
  ctx.rotate(label.angle);
  ctx.font = `700 ${m.px}px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  if (shadow) { ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 3; }
  ctx.fillStyle = color;
  const baseline = -m.glyph * (1 + m.mark) / 2 + m.asc;
  ctx.fillText(label.text, 0, baseline);
  if (m.mark) ctx.fillRect(-m.w * .4, baseline + m.desc + m.glyph * .1, m.w * .8, m.glyph * .1);
  ctx.restore();
}

export function createDieMaterial({ layout, setId, role, maxAniso }) {
  const st = styleFor(setId, role);
  const { W, H } = layout, area = W * H / (1280 * 512);
  const base = mkCanvas(W, H), glow = mkCanvas(W, H), bump = mkCanvas(W, H);
  const bx = base.getContext('2d'), gx = glow.getContext('2d'), ux = bump.getContext('2d');

  bx.fillStyle = st.base; bx.fillRect(0, 0, W, H);
  speckle(bx, W, H, st.specks, 2600 * area, .6, 3.2, .55);
  speckle(bx, W, H, st.specks, 120 * area, 8, 26, .14);
  bx.strokeStyle = st.vein; bx.lineWidth = 1.2;
  for (let i = 0; i < 26 * area; i++) {
    let vx = rand(0, W), vy = rand(0, H);
    bx.beginPath(); bx.moveTo(vx, vy);
    for (let j = 0; j < 8; j++) { vx += rand(-22, 22); vy += rand(-22, 22); bx.lineTo(vx, vy); }
    bx.stroke();
  }
  gx.fillStyle = '#000'; gx.fillRect(0, 0, W, H);
  ux.fillStyle = '#b8b8b8'; ux.fillRect(0, 0, W, H);
  speckle(ux, W, H, ['#a0a0a0', '#cfcfcf'], 1800 * area, .6, 2.4, .6);

  for (const face of layout.faces) {
    const path = ctx => {
      ctx.beginPath();
      face.poly.forEach(([x, y], j) => (j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.closePath();
    };
    const cx = face.poly.reduce((s, p) => s + p[0], 0) / face.poly.length;
    const cy = face.poly.reduce((s, p) => s + p[1], 0) / face.poly.length;
    // bordas gastas: sujeira junto à aresta e um fio de luz logo para dentro
    bx.save(); path(bx); bx.clip();
    bx.strokeStyle = st.edge; bx.lineWidth = 16; path(bx); bx.stroke();
    bx.translate(cx, cy); bx.scale(.9, .9); bx.translate(-cx, -cy);
    bx.strokeStyle = st.edgeHi; bx.lineWidth = 4; path(bx); bx.stroke();
    bx.restore();
    ux.save(); path(ux); ux.clip(); ux.strokeStyle = '#7a7a7a'; ux.lineWidth = 14; path(ux); ux.stroke(); ux.restore();

    for (const label of face.labels) {
      const m = measure(bx, label);
      drawLabel(bx, label, m, st.ink, true);
      if (st.glow) drawLabel(gx, label, m, st.glow);
      drawLabel(ux, label, m, '#202020');
    }
  }
  // um pouco de desgaste por cima dos números, sem atrapalhar a leitura
  speckle(bx, W, H, [st.base], 900 * area, .5, 1.6, .5);

  return new THREE.MeshStandardMaterial({
    map: canvasTexture(base, { anisotropy: maxAniso }),
    bumpMap: canvasTexture(bump, { srgb: false, anisotropy: maxAniso }), bumpScale: 1.2,
    roughness: st.roughness, metalness: 0,
    emissive: st.glow ? 0xffffff : 0x000000,
    emissiveMap: st.glow ? canvasTexture(glow, { anisotropy: maxAniso }) : null,
    emissiveIntensity: st.emissive
  });
}

// Dado descartado (bônus e penalidade): escurece, perde o reflexo da lamparina e quase todo o
// brilho, mas o número continua legível para quem quiser conferir. amount vai de 0 (normal) a 1.
export function dimDie(material, amount) {
  const lit = material.userData.lit ??= { glow: material.emissiveIntensity, roughness: material.roughness };
  material.color.setScalar(1 - .75 * amount);
  material.emissiveIntensity = lit.glow * (1 - .8 * amount);
  material.roughness = lit.roughness + (.95 - lit.roughness) * amount;
}
