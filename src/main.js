import { THREE } from './vendor.js';
import { createStage } from './core/stage.js';
import { DiceTable } from './core/physics.js';
import { DICE_SETS } from './core/dice-sets.js';
import { createDieModel } from './core/polyhedra.js';
import { THEMES, DEFAULT_THEME } from './themes/index.js';

// Liga as peças: carrega o tema, monta a mesa e cuida do toque, da escolha do dado e do resultado.

const $ = id => document.getElementById(id);
const canvas = $('scene'), hudTop = $('hudTop'), hudBottom = $('hudBottom');
const hint = $('hint'), verdict = $('verdict'), tray = $('tray'), modesBox = $('modes');
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
table.onSettled = () => showResult(current.dice.map(d => table.read(d.die)));
const dim = (d, amount) => theme.dimDie?.(d.mesh.material, amount);

/* ---------------------------------------------------------------- dados */
// Cada tipo de dado (conjunto + papel) é montado uma vez. Cada dado na mesa tem a sua própria
// malha e o seu material, para poder ficar apagado sozinho quando for descartado.
const kinds = new Map();
function placeDie(set, spec) {
  const key = `${set.id}/${spec.role}`;
  if (!kinds.has(key)) {
    const model = createDieModel(spec.shape, spec.values, spec.label);
    const material = theme.dieMaterial({ layout: model.layout, setId: set.id, role: spec.role, maxAniso: stage.maxAniso });
    kinds.set(key, { model, material, spare: [] });
  }
  const kind = kinds.get(key);
  let mesh = kind.spare.pop();
  if (!mesh) {
    mesh = new THREE.Mesh(kind.model.geometry, kind.material.clone());
    mesh.castShadow = mesh.receiveShadow = true;
  }
  stage.scene.add(mesh);
  return { spec, kind, mesh, die: table.addDie(kind.model), dim: 0, dropped: false };
}

// Guarda a malha de um dado que saiu da mesa, para usar de novo depois.
function putAway(d) {
  stage.scene.remove(d.mesh);
  dim(d, 0);
  d.kind.spare.push(d.mesh);
}

let state = 'loading', current = null, verdictTimer = 0, leaving = [];

function select(setId, { instant = false } = {}) {
  const set = DICE_SETS.find(s => s.id === setId) || DICE_SETS.find(s => s.id === 'd100');
  if (current) for (const d of current.dice) { table.removeDie(d.die); putAway(d); }
  current = { set, dice: set.dice.map(spec => placeDie(set, spec)) };
  if (instant) table.settleNow(); else table.drop();
  syncMeshes(false);
  for (const b of tray.children) b.setAttribute('aria-pressed', String(b.dataset.set === set.id));
  $('subtitle').textContent = `${set.subtitle} · ${set.name}`;
  buildModes(set);
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

/* ---------------------------------------------------------------- bônus, penalidade e afins */
// O tema pode oferecer jeitos especiais de rolar um conjunto (no Arkham, os dados de bônus e de
// penalidade do d100). Cada opção diz quantos dados a mais vão para a mesa e como contar o
// resultado; a opção sem dados a mais é a normal. Depois de cada lançamento, volta para a normal.
const PLAIN = { id: 'normal' };
const themeModes = Object.values(theme.modes || {});
let options = null, mode = PLAIN, rolled = PLAIN;
const normalMode = () => options?.find(o => !o.extra) || PLAIN;
modesBox.hidden = !themeModes.length;

function buildModes(set) {
  const list = theme.modes?.[set?.id];
  options = list?.options || null;
  mode = normalMode();
  modesBox.classList.toggle('is-off', !list);
  // num dado sem opções a faixa fica invisível, mas no mesmo lugar: a mesa não muda de tamanho
  const shown = list || (!modesBox.childElementCount && themeModes[0]);
  if (shown) {
    modesBox.replaceChildren();
    modesBox.setAttribute('aria-label', shown.title);
    let group = null;
    for (const option of shown.options) {
      if (!group || group.dataset.name !== (option.group || '')) {
        group = document.createElement('div');
        group.className = 'mode-group' + (option.tone ? ` tone-${option.tone}` : '');
        group.dataset.name = option.group || '';
        const caption = document.createElement('span');
        caption.className = 'mode-caption';
        caption.textContent = option.group || '';
        const row = document.createElement('div');
        row.className = 'mode-buttons';
        group.append(caption, row);
        modesBox.appendChild(group);
      }
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'mode-chip';
      b.textContent = option.chip;
      b.dataset.mode = option.id;
      b.setAttribute('aria-label', option.name || option.chip);
      b.addEventListener('click', () => chooseMode(option));
      group.lastChild.appendChild(b);
    }
  }
  syncModes();
}

function syncModes() {
  for (const b of modesBox.querySelectorAll('.mode-chip')) b.setAttribute('aria-pressed', String(b.dataset.mode === mode.id));
}

function chooseMode(option) {
  audio.unlock();
  mode = option;
  syncModes();
  if (state === 'result') toIdle();
  else if (state === 'idle') arrange();
}

// Deixa na mesa os dados que a próxima jogada vai usar: os do conjunto mais os que a opção pede.
// Dado descartado na jogada anterior é o primeiro a sair; os que faltam caem num lugar livre.
function arrange() {
  const { set } = current, extra = mode.extra;
  const wanted = [...set.dice];
  const copy = extra && set.dice.find(s => s.role === extra.role);
  if (copy) for (let i = 0; i < extra.count; i++) wanted.push(copy);
  const free = [...current.dice].sort((a, b) => a.dropped - b.dropped);
  const fresh = [];
  current.dice = wanted.map(spec => {
    const i = free.findIndex(d => d.spec === spec);
    if (i >= 0) return free.splice(i, 1)[0];
    const d = placeDie(set, spec);
    fresh.push(d.die);
    return d;
  });
  free.forEach(vanish);
  for (const d of current.dice) d.dropped = false;
  if (fresh.length) { table.drop(fresh); syncMeshes(false); }
}

// O dado que sai da mesa afunda na madeira e some.
function vanish(d) {
  table.removeDie(d.die);
  d.sink = 0;
  d.top = d.mesh.position.y;
  leaving.push(d);
}

// A cada quadro: o dado descartado escurece aos poucos, e o que está saindo afunda.
function fade(dt) {
  for (const d of current.dice) {
    const target = d.dropped ? 1 : 0;
    if (d.dim === target) continue;
    d.dim = Math.abs(target - d.dim) < .02 ? target : d.dim + (target - d.dim) * Math.min(1, dt * 6);
    dim(d, d.dim);
  }
  leaving = leaving.filter(d => {
    d.sink = Math.min(1, d.sink + dt / .7);
    d.mesh.position.y = d.top - d.sink ** 2 * d.die.radius * 2.4;
    dim(d, Math.max(d.dim, Math.min(1, d.sink * 1.6)));
    if (d.sink < 1) return true;
    putAway(d);
    return false;
  });
}

/* ---------------------------------------------------------------- resultado */
// how: a opção com que os dados foram lançados (normal, bônus…), que decide como contar.
function showResult(values, how = rolled) {
  const { set } = current;
  const result = how.combine ? how.combine(values, set) : set.combine(values);
  const crit = theme.critical(set.id, result);
  $('vNum').textContent = result.text;
  showParts(result.pieces, result.detail || set.name);
  const note = $('vNote');
  note.textContent = how.extra ? how.name : '';
  note.className = 'verdict-note' + (how.tone ? ` tone-${how.tone}` : '');
  note.hidden = !how.extra;
  $('vLabel').textContent = crit ? crit.label : '';
  verdict.className = 'verdict' + (crit ? ` is-${crit.kind}` : '');
  for (const i of result.discard || []) if (current.dice[i]) current.dice[i].dropped = true;
  verdict.hidden = false;
  placeVerdict();
  void verdict.offsetWidth;
  verdict.classList.add('show');
  look.setMood(crit ? crit.kind : null);
  if (crit) audio.omen(crit.kind);
  buzz(crit ? theme.haptics[crit.kind] : theme.haptics.settle);
  clearTimeout(verdictTimer);
  verdictTimer = setTimeout(toIdle, crit ? 4200 : 3000);
  state = 'result';
}

// O resultado vai para a altura da tela em que cobre menos os dados, entre o cabeçalho e a bandeja.
function placeVerdict() {
  verdict.style.top = '0px';
  const h = verdict.offsetHeight, w = Math.max(...[...verdict.children].map(el => el.offsetWidth)) + 32;
  const x0 = (innerWidth - w) / 2, x1 = x0 + w;
  const boxes = current.dice.map(d => stage.screenBox(new THREE.Vector3().copy(d.die.body.position), d.die.radius + .15));
  const cover = y => boxes.reduce((sum, [a, b, c, e]) =>
    sum + Math.max(0, Math.min(c, x1) - Math.max(a, x0)) * Math.max(0, Math.min(e, y + h) - Math.max(b, y)), 0);
  const top = hudTop.getBoundingClientRect().bottom, bottom = hudBottom.getBoundingClientRect().top - h;
  let best = top, least = Infinity;
  for (let y = top; y <= bottom; y += 6) {
    const score = cover(y) + Math.abs(y - innerHeight * .17) / 100;   // sem diferença, prefere o alto da tela
    if (score < least) { least = score; best = y; }
  }
  verdict.style.top = `${best}px`;
}

// Os números que formam o resultado; os descartados aparecem riscados.
function showParts(pieces, text) {
  const parts = $('vParts');
  if (!pieces) { parts.textContent = text; return; }
  parts.replaceChildren(...pieces.map(p => {
    const el = document.createElement(p.dropped ? 's' : 'span');
    el.textContent = p.text;
    return el;
  }));
}

function toIdle() {
  clearTimeout(verdictTimer);
  verdict.hidden = true;
  verdict.classList.remove('show');
  look.setMood(null);
  hint.textContent = theme.texts.hint;
  hint.hidden = false;
  state = 'idle';
  arrange();
}

/* ---------------------------------------------------------------- toques e botões */
canvas.addEventListener('pointerdown', ev => {
  audio.unlock();
  if (state === 'idle') {
    table.throw(stage.tablePoint(ev.clientX, ev.clientY));
    hint.hidden = true;
    buzz(theme.haptics.throw);
    state = 'rolling';
    // a jogada leva a opção escolhida, e a escolha volta para a normal (ninguém esquece o bônus ligado)
    rolled = mode;
    mode = normalMode();
    syncModes();
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
function tick(dt) {
  table.step(dt);
  syncMeshes(true);
  fade(dt);
  look.update(dt, clock.elapsedTime);
  stage.render();
}
function frame() {
  tick(Math.min(clock.getDelta(), 1 / 20));
  requestAnimationFrame(frame);
}

buildModes(DICE_SETS.find(s => s.id === prefs.die));   // a faixa de opções já ocupa o seu lugar ao medir a tela
relayout();
select(prefs.die, { instant: true });
window.addEventListener('resize', relayout);
document.fonts.ready.then(relayout);
requestAnimationFrame(frame);

// Guarda o app no aparelho para abrir rápido e funcionar sem internet (só no endereço publicado).
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

// Atalho só para testes no computador (localhost): permite simular resultados e opções.
if (location.hostname === 'localhost') {
  window.__dados = {
    showResult, select, chooseMode, tick, table, stage, theme, THREE,
    get current() { return current; }, get state() { return state; }, get mode() { return mode; }
  };
}
