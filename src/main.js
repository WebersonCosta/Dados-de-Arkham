import { THREE } from './vendor.js';
import { createStage } from './core/stage.js';
import { DiceTable } from './core/physics.js';
import { DICE_SETS } from './core/dice-sets.js';
import { createDieModel } from './core/polyhedra.js';
import { THEMES, DEFAULT_THEME } from './themes/index.js';

// Liga as peças: carrega o tema, monta a mesa e cuida do toque, da escolha do dado e do resultado.

const $ = id => document.getElementById(id);
const canvas = $('scene'), hudTop = $('hudTop'), hudBottom = $('hudBottom');
const hint = $('hint'), verdict = $('verdict'), tray = $('tray');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const PREFS_KEY = 'arkham-dice-prefs';
const prefs = { sfx: true, amb: true, die: 'd100' };
try { Object.assign(prefs, JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')); } catch (e) {}
const savePrefs = () => { try { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); } catch (e) {} };
const buzz = pattern => { try { if (pattern && navigator.vibrate) navigator.vibrate(pattern); } catch (e) {} };

// O CSS do tema entra no fim da página, depois do app.css, para que as cores e fontes dele valham.
function loadStylesheet(href) {
  return new Promise(resolve => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = link.onerror = resolve;
    document.body.appendChild(link);
  });
}

/* ---------------------------------------------------------------- tema */
const theme = (await THEMES[DEFAULT_THEME]()).default;
document.title = theme.title;
$('appTitle').textContent = theme.title;
hint.textContent = theme.texts.loading;
await Promise.race([loadStylesheet(theme.css), wait(3000)]);
await Promise.race([Promise.all(theme.fonts.map(f => document.fonts.load(f).catch(() => {}))), wait(2500)]);

/* ---------------------------------------------------------------- palco, cenário, som e física */
const stage = createStage(canvas, theme.view);
if (!stage) {
  document.body.insertAdjacentHTML('beforeend',
    '<div class="fatal">Este navegador não conseguiu abrir o 3D (WebGL).<br>Tente atualizar o navegador ou usar o Chrome ou o Safari.</div>');
  throw new Error('WebGL indisponível');
}
const look = theme.createScene({ stage });
const audio = theme.createAudio({ prefs });
const table = new DiceTable();
table.onImpact = (strength, kind, pan) => audio.hit(strength, kind, pan);
table.onSettled = showResult;

/* ---------------------------------------------------------------- dados */
const built = new Map();
function placeDie(set, spec) {
  const key = `${set.id}/${spec.role}`;
  if (!built.has(key)) {
    const model = createDieModel(spec.shape, spec.values, spec.label);
    const material = theme.dieMaterial({ layout: model.layout, setId: set.id, role: spec.role, maxAniso: stage.maxAniso });
    const mesh = new THREE.Mesh(model.geometry, material);
    mesh.castShadow = mesh.receiveShadow = true;
    built.set(key, { model, mesh });
  }
  const { model, mesh } = built.get(key);
  stage.scene.add(mesh);
  return { mesh, die: table.addDie(model) };
}

let state = 'loading', current = null, verdictTimer = 0;

function select(setId, { instant = false } = {}) {
  const set = DICE_SETS.find(s => s.id === setId) || DICE_SETS.find(s => s.id === 'd100');
  if (current) for (const d of current.dice) { table.removeDie(d.die); stage.scene.remove(d.mesh); }
  current = { set, dice: set.dice.map(spec => placeDie(set, spec)) };
  if (instant) table.settleNow(); else table.drop();
  syncMeshes(false);
  for (const b of tray.children) b.setAttribute('aria-pressed', String(b.dataset.set === set.id));
  $('subtitle').textContent = `${set.subtitle} · ${set.name}`;
  prefs.die = set.id;
  savePrefs();
  toIdle();
}

function syncMeshes(interpolated) {
  for (const { die, mesh } of current.dice) {
    mesh.position.copy(interpolated ? die.body.interpolatedPosition : die.body.position);
    mesh.quaternion.copy(interpolated ? die.body.interpolatedQuaternion : die.body.quaternion);
  }
}

/* ---------------------------------------------------------------- resultado */
function showResult(values) {
  const { set } = current;
  const result = set.combine(values);
  const crit = theme.critical(set.id, result);
  $('vNum').textContent = result.text;
  $('vParts').textContent = result.detail || set.name;
  $('vLabel').textContent = crit ? crit.label : '';
  verdict.className = 'verdict' + (crit ? ` is-${crit.kind}` : '');
  // o resultado aparece na faixa da tela mais distante dos dados
  const ys = current.dice.map(d => stage.screenY(new THREE.Vector3().copy(d.die.body.position)));
  const spots = [{ top: '17%', y: .42 }, { top: '50%', y: -.26 }];
  const gap = spot => Math.min(...ys.map(y => Math.abs(y - spot.y)));
  verdict.style.top = (gap(spots[1]) > gap(spots[0]) ? spots[1] : spots[0]).top;
  verdict.hidden = false;
  void verdict.offsetWidth;
  verdict.classList.add('show');
  look.setMood(crit ? crit.kind : null);
  if (crit) audio.omen(crit.kind);
  buzz(crit ? theme.haptics[crit.kind] : theme.haptics.settle);
  clearTimeout(verdictTimer);
  verdictTimer = setTimeout(toIdle, crit ? 4200 : 3000);
  state = 'result';
}

function toIdle() {
  clearTimeout(verdictTimer);
  verdict.hidden = true;
  verdict.classList.remove('show');
  look.setMood(null);
  hint.textContent = theme.texts.hint;
  hint.hidden = false;
  state = 'idle';
}

/* ---------------------------------------------------------------- toques e botões */
canvas.addEventListener('pointerdown', ev => {
  audio.unlock();
  if (state === 'idle') {
    table.throw(stage.tablePoint(ev.clientX, ev.clientY));
    hint.hidden = true;
    buzz(theme.haptics.throw);
    state = 'rolling';
  } else if (state === 'result') {
    toIdle();
  }
});

for (const set of DICE_SETS) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'die-chip';
  b.textContent = set.name;
  b.dataset.set = set.id;
  b.setAttribute('aria-pressed', 'false');
  b.addEventListener('click', () => {
    audio.unlock();
    if (current?.set.id !== set.id) select(set.id);
  });
  tray.appendChild(b);
}

function bindToggle(button, key, label, apply) {
  button.textContent = label;
  const sync = () => button.setAttribute('aria-pressed', String(prefs[key]));
  sync();
  button.addEventListener('click', () => {
    audio.unlock();
    prefs[key] = !prefs[key];
    savePrefs();
    sync();
    apply(prefs[key]);
  });
}
bindToggle($('btnSfx'), 'sfx', theme.texts.sound, on => audio.setSfx(on));
bindToggle($('btnAmb'), 'amb', theme.texts.ambient, on => audio.setAmbient(on));

/* ---------------------------------------------------------------- tela e animação */
function relayout() {
  const arena = stage.fit({
    topPx: hudTop.getBoundingClientRect().bottom,
    bottomPx: window.innerHeight - hudBottom.getBoundingClientRect().top
  });
  table.setArena(arena);
  look.layout(arena);
}

const clock = new THREE.Clock();
function frame() {
  const dt = Math.min(clock.getDelta(), 1 / 20);
  table.step(dt);
  syncMeshes(true);
  look.update(dt, clock.elapsedTime);
  stage.render();
  requestAnimationFrame(frame);
}

relayout();
select(prefs.die, { instant: true });
window.addEventListener('resize', relayout);
document.fonts.ready.then(relayout);
requestAnimationFrame(frame);

// Guarda o app no aparelho para abrir rápido e funcionar sem internet (só no endereço publicado).
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

// Atalho só para testes no computador (localhost): permite simular um resultado.
if (location.hostname === 'localhost') window.__dados = { showResult, select, table, stage, THREE };
