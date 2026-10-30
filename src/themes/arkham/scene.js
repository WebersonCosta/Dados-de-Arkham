import { THREE } from '../../vendor.js';
import { rnd, rand, clamp, TAU } from '../../lib/util.js';
import { mkCanvas, speckle, canvasTexture } from '../../lib/canvas.js';

// Cenário do tema: mesa de madeira gasta, velas, um tomo, papéis com anotações, névoa rasteira e a
// luz de uma lamparina. Nos críticos as velas reagem: verdes no sucesso, quase apagadas no desastre.

/* ---------------------------------------------------------------- texturas pintadas à mão */
function woodCanvas() {
  const W = 1024, H = 1024, c = mkCanvas(W, H), x = c.getContext('2d');
  const planks = 5, ph = H / planks;
  for (let p = 0; p < planks; p++) {
    const y0 = p * ph, tone = rand(-12, 10);
    x.fillStyle = `rgb(${46 + tone},${31 + tone * .7},${20 + tone * .5})`;
    x.fillRect(0, y0, W, ph);
    for (let g = 0; g < 140; g++) {
      const gy = y0 + rand(0, ph), amp = rand(1, 6), freq = Math.ceil(rand(0, 6)) * TAU / W, p0 = rand(0, TAU);
      x.strokeStyle = rnd() < .55 ? `rgba(16,9,4,${rand(.08, .38)})` : `rgba(120,88,55,${rand(.03, .12)})`;
      x.lineWidth = rand(.6, 2.6);
      x.beginPath();
      for (let px = 0; px <= W; px += 16) {
        const yy = clamp(gy + Math.sin(px * freq + p0) * amp, y0 + 2, y0 + ph - 2);
        px ? x.lineTo(px, yy) : x.moveTo(px, yy);
      }
      x.stroke();
    }
    if (rnd() < .7) {
      const kx = rand(90, W - 90), ky = y0 + rand(30, ph - 30);
      for (let r = 1; r < 9; r++) {
        x.strokeStyle = `rgba(14,8,3,${.5 - r * .045})`; x.lineWidth = 1.6;
        x.beginPath(); x.ellipse(kx, ky, r * 6.5, r * 2.6, 0, 0, TAU); x.stroke();
      }
    }
    x.fillStyle = 'rgba(4,2,1,.9)'; x.fillRect(0, y0, W, 3);
    x.fillRect(rand(40, W - 40), y0, 3, ph);
  }
  for (let i = 0; i < 300; i++) {
    const sx = rand(0, W), sy = rand(0, H), a = rand(0, TAU), l = rand(6, 60);
    x.strokeStyle = `rgba(170,130,90,${rand(.03, .11)})`; x.lineWidth = rand(.5, 1.3);
    x.beginPath(); x.moveTo(sx, sy); x.lineTo(sx + Math.cos(a) * l, sy + Math.sin(a) * l); x.stroke();
  }
  for (let i = 0; i < 4; i++) {
    x.strokeStyle = `rgba(8,4,2,${rand(.15, .3)})`; x.lineWidth = rand(4, 9);
    x.beginPath(); x.arc(rand(150, W - 150), rand(150, H - 150), rand(40, 70), rand(0, 1), rand(4, TAU)); x.stroke();
  }
  speckle(x, W, H, ['#0a0603', '#140c06'], 60, 30, 110, .18);
  return c;
}

function scribble(x, x0, y, x1) {
  x.beginPath();
  let px = x0;
  x.moveTo(px, y);
  while (px < x1) {
    const end = Math.min(px + rand(18, 64), x1);
    while (px < end) {
      const step = rand(3, 6.5), hgt = rand(3, 8) * (rnd() < .14 ? 2 : 1);
      x.quadraticCurveTo(px + step / 2, y - hgt, px + step, y + rand(-1, 1.6));
      px += step;
    }
    px += rand(7, 13);
    x.moveTo(px, y);
  }
  x.stroke();
}

function paperCanvas(withSigil) {
  const W = 512, H = 700, c = mkCanvas(W, H), x = c.getContext('2d');
  const g = x.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, H * .7);
  g.addColorStop(0, '#d6c08c'); g.addColorStop(.7, '#b89a62'); g.addColorStop(1, '#7c5f35');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  speckle(x, W, H, ['#8a6a3a', '#6e5028', '#e2cf9e'], 220, 1, 6, .25);
  speckle(x, W, H, ['#7a5a2c'], 10, 25, 70, .12);
  x.strokeStyle = 'rgba(90,60,25,.35)'; x.lineWidth = 5;
  x.beginPath(); x.arc(rand(120, 380), rand(450, 600), 48, .4, 5.6); x.stroke();
  x.strokeStyle = 'rgba(40,26,14,.78)'; x.lineWidth = 1.5; x.lineCap = 'round';
  const startY = withSigil ? 360 : 70;
  for (let y = startY; y < H - 50; y += rand(20, 25)) scribble(x, 42 + rand(0, 10), y, W - 40 - rand(0, 70));
  if (withSigil) {
    const cx = W / 2, cy = 190;
    x.strokeStyle = 'rgba(55,30,16,.82)'; x.lineWidth = 2.2;
    x.beginPath(); x.arc(cx, cy, 120, 0, TAU); x.stroke();
    x.beginPath(); x.arc(cx, cy, 104, 0, TAU); x.stroke();
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * TAU - Math.PI / 2, b = ((i + 3) % 7) / 7 * TAU - Math.PI / 2;
      x.beginPath(); x.moveTo(cx + Math.cos(a) * 104, cy + Math.sin(a) * 104); x.lineTo(cx + Math.cos(b) * 104, cy + Math.sin(b) * 104); x.stroke();
      x.save(); x.translate(cx + Math.cos(a) * 112, cy + Math.sin(a) * 112); x.rotate(a);
      x.beginPath(); x.moveTo(-4, -5); x.lineTo(4, 0); x.lineTo(-4, 5); x.stroke(); x.restore();
    }
    x.beginPath(); x.ellipse(cx, cy, 30, 15, 0, 0, TAU); x.stroke();
    x.fillStyle = 'rgba(55,30,16,.85)'; x.beginPath(); x.arc(cx, cy, 7, 0, TAU); x.fill();
  }
  return c;
}

function leatherCanvas() {
  const W = 512, H = 700, c = mkCanvas(W, H), x = c.getContext('2d');
  x.fillStyle = '#26221a'; x.fillRect(0, 0, W, H);
  speckle(x, W, H, ['#1a1711', '#332c20', '#2c2a1c', '#14120c'], 1400, 1, 5, .5);
  speckle(x, W, H, ['#0e0c08'], 30, 20, 80, .25);
  x.strokeStyle = 'rgba(168,136,70,.42)'; x.lineWidth = 3;
  x.strokeRect(34, 34, W - 68, H - 68);
  x.lineWidth = 1.4; x.strokeRect(48, 48, W - 96, H - 96);
  const cx = W / 2, cy = H / 2;
  x.lineWidth = 3;
  x.beginPath(); x.arc(cx, cy, 80, 0, TAU); x.stroke();
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * TAU;
    x.beginPath(); x.arc(cx + Math.cos(a) * 80, cy + Math.sin(a) * 80, 80, a + 2.1, a + 4.2); x.stroke();
  }
  x.beginPath(); x.arc(cx, cy, 12, 0, TAU); x.stroke();
  speckle(x, W, H, ['#26221a'], 500, 1, 4, .9);
  return c;
}

function pagesCanvas() {
  const W = 256, H = 64, c = mkCanvas(W, H), x = c.getContext('2d');
  x.fillStyle = '#b9a272'; x.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 2) { x.fillStyle = `rgba(70,50,25,${rand(.05, .3)})`; x.fillRect(0, y, W, 1); }
  speckle(x, W, H, ['#6b5028'], 40, 2, 8, .2);
  return c;
}

function flameCanvas() {
  const W = 64, H = 128, c = mkCanvas(W, H), x = c.getContext('2d');
  x.save(); x.translate(W / 2, H * .68); x.scale(1, 2.1);
  const g = x.createRadialGradient(0, 0, 0, 0, 0, W / 2);
  g.addColorStop(0, 'rgba(255,250,225,1)'); g.addColorStop(.25, 'rgba(255,214,120,.95)');
  g.addColorStop(.55, 'rgba(255,130,40,.55)'); g.addColorStop(1, 'rgba(255,80,20,0)');
  x.fillStyle = g; x.beginPath(); x.arc(0, 0, W / 2, 0, TAU); x.fill(); x.restore();
  return c;
}

function glowCanvas() {
  const S = 128, c = mkCanvas(S, S), x = c.getContext('2d');
  const g = x.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, 'rgba(255,170,80,.55)'); g.addColorStop(.4, 'rgba(255,120,40,.16)'); g.addColorStop(1, 'rgba(255,100,30,0)');
  x.fillStyle = g; x.fillRect(0, 0, S, S);
  return c;
}

function mistCanvas() {
  const S = 256, c = mkCanvas(S, S), x = c.getContext('2d');
  for (let i = 0; i < 40; i++) {
    const bx = rand(50, S - 50), by = rand(50, S - 50), r = rand(25, 70);
    const g = x.createRadialGradient(bx, by, 0, bx, by, r);
    g.addColorStop(0, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
  }
  x.globalCompositeOperation = 'destination-in';
  const m = x.createRadialGradient(S / 2, S / 2, S * .15, S / 2, S / 2, S / 2);
  m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = m; x.fillRect(0, 0, S, S);
  return c;
}

/* ---------------------------------------------------------------- cena */
const WARM = 0xffa04a;
const MOODS = {
  critical: { level: 2.4, tint: 0x9dff9a },   // as velas se inflamam em verde
  fumble: { level: .1, tint: 0xff2a10 }       // as velas quase se apagam, em vermelho
};

export function createArkhamScene({ stage }) {
  const { scene, renderer, maxAniso } = stage;
  const tex = (canvas, srgb = true) => canvasTexture(canvas, { srgb, anisotropy: maxAniso });
  renderer.toneMappingExposure = 1.15;
  scene.background = new THREE.Color(0x050605);
  scene.fog = new THREE.FogExp2(0x050605, .028);

  // mesa
  const wood = tex(woodCanvas());
  wood.wrapS = wood.wrapT = THREE.RepeatWrapping;
  wood.repeat.set(6, 6);
  const woodBump = wood.clone();
  woodBump.colorSpace = THREE.NoColorSpace;
  woodBump.needsUpdate = true;
  const table = new THREE.Mesh(
    new THREE.PlaneGeometry(54, 54),
    new THREE.MeshStandardMaterial({ map: wood, bumpMap: woodBump, bumpScale: 2.2, roughness: .82, metalness: 0 })
  );
  table.rotation.x = -Math.PI / 2;
  table.receiveShadow = true;
  scene.add(table);

  // papéis amarelados, com as pontas levemente curvadas
  const makePaper = withSigil => {
    const geo = new THREE.PlaneGeometry(2.3, 3.1, 12, 16);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const px = pos.getX(i) / 1.15, py = pos.getY(i) / 1.55;
      pos.setZ(i, .05 * px ** 4 + .035 * Math.max(0, py) ** 3 + .004);
    }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex(paperCanvas(withSigil)), roughness: .95, side: THREE.DoubleSide }));
    m.rotation.x = -Math.PI / 2;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };
  const papers = [makePaper(false), makePaper(true)];

  // tomo antigo
  const leather = new THREE.MeshStandardMaterial({ map: tex(leatherCanvas()), roughness: .7, metalness: .05 });
  const pages = new THREE.MeshStandardMaterial({ map: tex(pagesCanvas()), roughness: .9 });
  const tome = new THREE.Mesh(new THREE.BoxGeometry(2.1, .55, 2.9), [pages, leather, leather, leather, pages, pages]);
  tome.castShadow = tome.receiveShadow = true;
  scene.add(tome);

  // velas
  const flameMat = new THREE.SpriteMaterial({ map: tex(flameCanvas()), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false });
  const glowMat = new THREE.SpriteMaterial({ map: tex(glowCanvas()), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false });
  const makeCandle = (height, radius) => {
    const g = new THREE.Group();
    const iron = new THREE.MeshStandardMaterial({ color: 0x1c1a17, roughness: .5, metalness: .7 });
    const dish = new THREE.Mesh(new THREE.CylinderGeometry(radius * 2, radius * 2.2, .08, 28), iron);
    dish.position.y = .04; dish.castShadow = dish.receiveShadow = true; g.add(dish);
    const wax = new THREE.MeshStandardMaterial({ color: 0xd9ccaa, roughness: .55, emissive: 0x3a1c06, emissiveIntensity: .35 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(radius * .94, radius, height, 24), wax);
    body.position.y = .08 + height / 2; body.castShadow = true; g.add(body);
    const lip = new THREE.Mesh(new THREE.TorusGeometry(radius * .8, radius * .16, 8, 24), wax);
    lip.rotation.x = Math.PI / 2; lip.position.y = .08 + height; g.add(lip);
    for (let i = 0; i < 4; i++) {
      const drip = new THREE.Mesh(new THREE.SphereGeometry(radius * .18, 8, 8), wax);
      const a = rand(0, TAU), len = rand(.2, .55);
      drip.scale.set(1, len / (radius * .18) * .5, 1);
      drip.position.set(Math.cos(a) * radius * .95, .08 + height - len * .5, Math.sin(a) * radius * .95);
      g.add(drip);
    }
    const wick = new THREE.Mesh(new THREE.CylinderGeometry(.015, .015, .14, 6), new THREE.MeshBasicMaterial({ color: 0x0a0806 }));
    wick.position.y = .08 + height + .07; g.add(wick);
    const flame = new THREE.Sprite(flameMat); flame.scale.set(.2, .46, 1); flame.position.y = .08 + height + .27; g.add(flame);
    const glow = new THREE.Sprite(glowMat); glow.scale.set(1.8, 1.8, 1); glow.position.y = flame.position.y; g.add(glow);
    const light = new THREE.PointLight(WARM, 14, 16, 1.6);
    light.position.y = flame.position.y + .1; g.add(light);
    scene.add(g);
    return { group: g, flame, glow, light, seed: [rand(0, 100), rand(0, 100), rand(0, 100)] };
  };
  const candles = [makeCandle(1.55, .24), makeCandle(1, .27)];

  // lamparina (a luz principal, que faz as sombras) e um pouco de luz ambiente
  const lamp = new THREE.SpotLight(0xffb36b, 620, 0, .78, .8, 1.7);
  lamp.castShadow = true;
  lamp.shadow.mapSize.set(1024, 1024);
  lamp.shadow.camera.near = 4; lamp.shadow.camera.far = 32;
  lamp.shadow.bias = -.0004; lamp.shadow.normalBias = .02;
  scene.add(lamp, lamp.target);
  scene.add(new THREE.HemisphereLight(0x4a6058, 0x120c07, .9));

  // névoa rasteira
  const mistTex = tex(mistCanvas());
  const mists = [];
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(11, 11), new THREE.MeshBasicMaterial({
      map: mistTex, color: 0x9fb4a2, transparent: true, opacity: rand(.12, .2), depthWrite: false
    }));
    m.rotation.x = -Math.PI / 2; m.rotation.z = rand(0, TAU);
    m.position.y = .12 + i * .07;
    m.userData = { ox: rand(-3, 3), oz: rand(-4, 4), sp: rand(.04, .09), ph: rand(0, TAU), rs: rand(-.03, .03) };
    scene.add(m);
    mists.push(m);
  }

  const mood = { level: 1, target: 1, tint: new THREE.Color(WARM), tintTarget: new THREE.Color(WARM) };
  const warm = new THREE.Color(WARM), white = new THREE.Color(0xffffff), tmp = new THREE.Color();
  const lampSeed = [rand(0, 9), rand(0, 9)];
  const flick = (seed, t) =>
    .82 + .1 * Math.sin(t * 7.3 + seed[0]) + .06 * Math.sin(t * 13.7 + seed[1]) + .05 * Math.sin(t * 2.3 + seed[2]) + rand(-.03, .03);

  return {
    // Os objetos ficam no fundo da mesa, fora da área onde os dados rolam.
    layout(arena) {
      const farTable = stage.hit(0, 1, 0).z;
      const band = (arena.zMin + Math.max(farTable, arena.zMin - 4)) / 2;
      candles[0].group.position.set(-arena.hw * .72, 0, arena.zMin - .7);
      candles[1].group.position.set(arena.hw * .78, 0, arena.zMin - 1.2);
      tome.position.set(arena.hw * .05, .275, band - .4);
      tome.rotation.y = -.32;
      papers[0].position.set(-arena.hw + .4, 0, (arena.zMin + arena.zMax) * .5 + .8);
      papers[0].rotation.z = .35;
      papers[1].position.set(arena.hw - .3, .002, arena.zMax - 1.6);
      papers[1].rotation.z = -.5;
      lamp.position.set(-2.4, 11, arena.zMin - 1.5);
      lamp.target.position.set(.2, 0, (arena.zMin + arena.zMax) / 2 + .6);
      lamp.target.updateMatrixWorld();
    },

    update(dt, t) {
      mood.level += (mood.target - mood.level) * Math.min(1, dt * (mood.target < mood.level ? 2.2 : 3.5));
      mood.tint.lerp(mood.tintTarget, Math.min(1, dt * 2.5));
      for (const c of candles) {
        const f = flick(c.seed, t), s = Math.sqrt(mood.level);
        c.light.intensity = 14 * f * mood.level;
        c.light.color.copy(mood.tint);
        c.flame.scale.set(.2 * (.9 + f * .12) * s, .46 * f * s, 1);
        c.flame.position.x = Math.sin(t * 3.1 + c.seed[0]) * .015;
        c.glow.scale.setScalar(1.8 * f * (.6 + .4 * mood.level));
      }
      flameMat.color.copy(tmp.copy(mood.tint).lerp(white, .35));
      glowMat.color.copy(mood.tint);
      lamp.intensity = 620 * (.94 + .06 * Math.sin(t * 5.1 + lampSeed[0]) * Math.sin(t * 1.7 + lampSeed[1])) * THREE.MathUtils.lerp(1, mood.level, .55);
      lamp.color.copy(warm).lerp(mood.tint, .45);
      for (const m of mists) {
        const u = m.userData;
        m.position.x = u.ox + Math.sin(t * u.sp + u.ph) * 1.8;
        m.position.z = u.oz + Math.cos(t * u.sp * .8 + u.ph) * 1.4;
        m.rotation.z += u.rs * dt;
      }
    },

    // kind: 'critical', 'fumble' ou null (volta ao normal)
    setMood(kind) {
      const m = MOODS[kind];
      mood.target = m ? m.level : 1;
      mood.tintTarget.set(m ? m.tint : WARM);
    }
  };
}
