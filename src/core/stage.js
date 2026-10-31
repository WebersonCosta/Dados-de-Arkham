import { THREE } from '../vendor.js';

// Palco 3D: o desenhista (renderer), a câmera e a área da mesa onde os dados podem rolar.
// A área acompanha o tamanho da tela e deixa livres o cabeçalho e a bandeja de dados.
// view (vem do tema): fov e tilt da câmera, e reserveTop = fração da tela guardada no fundo da mesa.

export function createStage(canvas, view = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(view.fov ?? 36, 1, .1, 120);
  const ray = new THREE.Raycaster();
  const arena = { hw: 3, zMin: -4, zMax: 4 };

  // Ponto onde o raio que sai da tela em (nx, ny), de -1 a 1, atinge a altura y.
  function hit(nx, ny, y) {
    ray.setFromCamera(new THREE.Vector2(nx, ny), camera);
    const t = (y - ray.ray.origin.y) / ray.ray.direction.y;
    return ray.ray.origin.clone().addScaledVector(ray.ray.direction, t);
  }

  // topPx / bottomPx: quanto da tela o cabeçalho e a bandeja ocupam. A largura é a do desenho, que
  // pode deixar um lado da tela para outra coisa (no PC, o painel da mesa compartilhada).
  function fit({ topPx, bottomPx }) {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const d = Math.max(5.6 / tan, 3.8 / (tan * camera.aspect));
    const tilt = THREE.MathUtils.degToRad(view.tilt ?? 22);
    camera.position.set(0, Math.cos(tilt) * d, Math.sin(tilt) * d);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    const top = Math.max(topPx + 10, h * (view.reserveTop ?? 0)), bottom = bottomPx + 6;
    const nTop = 1 - 2 * top / h, nBot = -1 + 2 * bottom / h, y0 = .8;
    const tl = hit(-1, nTop, y0), tr = hit(1, nTop, y0), bl = hit(-1, nBot, y0), br = hit(1, nBot, y0);
    arena.hw = Math.min(-tl.x, tr.x, -bl.x, br.x) - .15;
    arena.zMin = Math.max(tl.z, tr.z) + .1;
    arena.zMax = Math.min(bl.z, br.z) - .1;
    return arena;
  }

  return {
    renderer, scene, camera, arena, hit, fit,
    maxAniso: renderer.capabilities.getMaxAnisotropy(),
    tablePoint(clientX, clientY) {
      const r = canvas.getBoundingClientRect();
      return hit((clientX - r.left) / r.width * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1, 0);
    },
    // Caixa, em pixels da tela, ocupada por um dado de raio `radius` nessa posição: [esq, topo, dir, base].
    screenBox(position, radius) {
      const r = canvas.getBoundingClientRect();
      const c = position.clone().project(camera), e = position.clone().setX(position.x + radius).project(camera);
      const x = r.left + (c.x + 1) / 2 * r.width, y = r.top + (1 - c.y) / 2 * r.height, s = Math.abs(e.x - c.x) / 2 * r.width;
      return [x - s, y - s, x + s, y + s];
    },
    render() { renderer.render(scene, camera); }
  };
}
