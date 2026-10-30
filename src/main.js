import { THREE } from './vendor.js';
import { createStage } from './core/stage.js';
import { DiceTable } from './core/physics.js';
import { DIE_KINDS, D100 } from './core/dice-sets.js';
import { createFormulas, MAX_DICE } from './core/formula.js';
import { createDieModel } from './core/polyhedra.js';
import { THEMES, DEFAULT_THEME } from './themes/index.js';
import { VERSION, PLACE } from './version.js';

// Liga as peças: carrega o tema, monta a mesa e cuida do toque, da escolha dos dados e do resultado.

const $ = id => document.getElementById(id);
const canvas = $('scene'), hudTop = $('hudTop'), hudBottom = $('hudBottom');
const hint = $('hint'), verdict = $('verdict'), tray = $('tray');
const modesBox = $('modes'), composeBox = $('compose'), sheet = $('sheet');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

// versão no canto da tela; fora do endereço oficial, diz também onde o app está aberto
$('version').textContent = `v${VERSION}` + (PLACE === 'oficial' ? '' : ` · ${PLACE}`);
$('version').dataset.place = PLACE;

// o endereço de teste guarda as suas escolhas à parte, sem mexer nas do app oficial
const PREFS_KEY = PLACE === 'teste' ? 'arkham-dice-prefs-teste' : 'arkham-dice-prefs';
const MAX_FAVORITES = 12;
// roll: o que estava na mesa ('d100' ou uma fórmula, como '2d6+6'); favorites: as fórmulas salvas
const prefs = { sfx: true, amb: true, die: 'd100', roll: null, favorites: [] };
try { Object.assign(prefs, JSON.parse(localStorage.getItem(PREFS_KEY) || '{}')); } catch (e) {}
if (!Array.isArray(prefs.favorites)) prefs.favorites = [];
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
document.title = theme.title + (PLACE === 'teste' ? ' (teste)' : '');
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
const formulas = createFormulas(theme.kinds);   // os dados comuns e os do tema (no Arkham, o d3)
const table = new DiceTable();
table.onImpact = (strength, kind, pan) => audio.hit(strength, kind, pan);
table.onSettled = () => showResult(current.dice.map(d => table.read(d.die)));
const dim = (d, amount) => theme.dimDie?.(d.mesh.material, amount);

/* ---------------------------------------------------------------- dados */
// Cada tipo de dado (forma, números e pintura) é montado uma vez. Cada dado na mesa tem a sua
// própria malha e o seu material, para poder ficar apagado sozinho quando for descartado.
const molds = new Map();
function placeDie(spec) {
  if (!molds.has(spec.key)) {
    const model = createDieModel(spec.shape, spec.values, spec.label);
    const material = theme.dieMaterial({ layout: model.layout, setId: spec.setId, role: spec.role, maxAniso: stage.maxAniso });
    molds.set(spec.key, { model, material, spare: [] });
  }
  const mold = molds.get(spec.key);
  let mesh = mold.spare.pop();
  if (!mesh) {
    mesh = new THREE.Mesh(mold.model.geometry, mold.material.clone());
    mesh.castShadow = mesh.receiveShadow = true;
  }
  stage.scene.add(mesh);
  return { spec, mold, mesh, die: table.addDie(mold.model), dim: 0, dropped: false };
}

// Guarda a malha de um dado que saiu da mesa, para usar de novo depois.
function putAway(d) {
  stage.scene.remove(d.mesh);
  dim(d, 0);
  d.mold.spare.push(d.mesh);
}

// current.set: o que vai para a mesa (o d100 ou uma fórmula). formula: a fórmula dos dados comuns.
// building: enquanto a fórmula é montada, cada toque num dado soma mais um; depois de lançar, um
// dado que ainda não está na fórmula começa outra.
let state = 'loading', current = { set: null, dice: [] }, verdictTimer = 0, leaving = [];
let formula = formulas.single('d20'), building = false, lastKind = 'd20';

// Troca o que vai para a mesa. Os dados que continuam ficam onde estão; os que saem afundam e os
// que entram caem num lugar livre.
function chooseSet(set, { instant = false } = {}) {
  if (current.set?.id !== set.id) buildModes(set);
  current.set = set;
  refreshUI();
  prefs.roll = set.id;
  prefs.die = set === D100 ? 'd100' : formula.groups[0].kind;   // o que a versão 1.0 entende, se for preciso voltar a ela
  savePrefs();
  toIdle({ instant });
}

function setFormula(f, options) {
  formula = f;
  chooseSet(formulas.toSet(f), options);
}

// Toque num dado da bandeja. Enquanto se monta, cada toque soma mais um dado. Depois de lançar,
// tocar num dado que já está na fórmula aumenta a quantidade, e um dado novo começa outra fórmula.
function tapKind(kind) {
  audio.unlock();
  let next = formulas.single(kind);
  if (current.set !== D100 && (building || formulas.has(formula, kind))) {
    next = formulas.add(formula, kind);
    if (!next) return flashHint(`No máximo ${MAX_DICE} dados na mesa`);
  }
  building = true;
  lastKind = kind;
  setFormula(next);
}

function pickD100() {
  audio.unlock();
  if (current.set !== D100) chooseSet(D100);
}

function syncMeshes(interpolated) {
  for (const { die, mesh } of current.dice) {
    mesh.position.copy(interpolated ? die.body.interpolatedPosition : die.body.position);
    mesh.quaternion.copy(interpolated ? die.body.interpolatedQuaternion : die.body.quaternion);
  }
}

// Bandeja (dados escolhidos e quantos), subtítulo e a faixa acima da bandeja: as opções do d100
// ou a fórmula montada.
function refreshUI() {
  const { set } = current, isD100 = set === D100, hasModes = !!theme.modes?.[set.id];
  for (const b of tray.children) {
    const id = b.dataset.set;
    const n = isD100 ? Number(id === 'd100') : formula.groups.find(g => g.kind === id)?.count || 0;
    b.setAttribute('aria-pressed', String(n > 0));
    b.lastChild.textContent = n > 1 ? n : '';
  }
  // com vários dados, a fórmula já aparece na faixa de baixo
  $('subtitle').textContent = !isD100 && set.dice.length > 1 ? set.subtitle : `${set.subtitle} · ${set.name}`;
  modesBox.classList.toggle('is-off', !hasModes);
  composeBox.classList.toggle('is-off', isD100 || hasModes);
  if (isD100) return;
  const text = $('formulaText');
  text.textContent = set.name;
  text.dataset.size = set.name.length > 17 ? 's' : set.name.length > 11 ? 'm' : '';
  $('btnClear').disabled = formulas.count(formula) === 1 && !formula.fixed;
}

let hintTimer = 0;
function flashHint(text) {
  hint.textContent = text;
  hint.hidden = false;
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => { if (state === 'idle') hint.textContent = theme.texts.hint; }, 2200);
}

/* ---------------------------------------------------------------- a fórmula: número fixo, limpar, atalhos */
function stepFixed(delta) {
  if (current.set === D100) return;
  const next = formulas.withFixed(formula, formula.fixed + delta);
  if (next.fixed === formula.fixed) return;
  building = true;
  setFormula(next);
}

// Limpar: volta a um dado só (o último escolhido).
function clearFormula() {
  audio.unlock();
  building = false;
  setFormula(formulas.single(lastKind));
}

function useFormula(text) {
  const f = formulas.parse(text);
  if (!f) return;
  building = true;   // ainda dá para somar dados (1d3 e depois o d4: o soco com bônus de dano)
  lastKind = f.groups[f.groups.length - 1].kind;
  closeSheet();
  setFormula(f);
}

// Botão que repete enquanto está apertado, para chegar rápido a +6, por exemplo.
function holdRepeat(button, action) {
  let timer = 0;
  const stop = () => clearTimeout(timer);
  const run = delay => { action(); timer = setTimeout(run, delay, 90); };
  button.addEventListener('pointerdown', ev => { ev.preventDefault(); audio.unlock(); stop(); run(450); });
  for (const type of ['pointerup', 'pointerleave', 'pointercancel']) button.addEventListener(type, stop);
  button.addEventListener('click', ev => { if (!ev.detail) action(); });   // pelo teclado
}

function openSheet() {
  audio.unlock();
  renderSheet();
  sheet.hidden = false;
  $('btnCloseSheet').focus();
}
function closeSheet() { sheet.hidden = true; }

// Atalhos do tema e as fórmulas salvas no aparelho.
function renderSheet() {
  const chip = (text, note) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'shortcut';
    const name = document.createElement('b');
    name.textContent = formulas.text(formulas.parse(text));
    b.append(name);
    if (note) b.append(Object.assign(document.createElement('small'), { textContent: note }));
    b.addEventListener('click', () => useFormula(text));
    return b;
  };
  const shortcuts = (theme.shortcuts || []).filter(s => formulas.parse(s.formula));
  $('presets').replaceChildren(...shortcuts.map(s => chip(s.formula, s.note)));
  $('presetsTitle').hidden = !shortcuts.length;

  const saved = prefs.favorites.filter(t => formulas.parse(t));
  $('favorites').replaceChildren(...saved.map(t => {
    const wrap = document.createElement('div');
    wrap.className = 'favorite';
    const forget = document.createElement('button');
    forget.type = 'button';
    forget.className = 'forget';
    forget.textContent = '×';
    forget.setAttribute('aria-label', `Apagar ${formulas.text(formulas.parse(t))}`);
    forget.addEventListener('click', () => {
      prefs.favorites = prefs.favorites.filter(x => x !== t);
      savePrefs();
      renderSheet();
    });
    wrap.append(chip(t), forget);
    return wrap;
  }));
  $('favoritesEmpty').hidden = saved.length > 0;

  const id = formulas.text(formula, ''), name = formulas.text(formula), save = $('btnSave');
  const isSaved = prefs.favorites.includes(id), full = prefs.favorites.length >= MAX_FAVORITES;
  save.textContent = isSaved ? `★ ${name} já está salva` : full ? 'Apague uma fórmula para salvar outra' : `☆ Salvar ${name}`;
  save.disabled = isSaved || full;
}

$('btnSave').addEventListener('click', () => {
  prefs.favorites = [formulas.text(formula, ''), ...prefs.favorites].slice(0, MAX_FAVORITES);
  savePrefs();
  renderSheet();
});
$('btnShortcuts').addEventListener('click', openSheet);
$('btnCloseSheet').addEventListener('click', closeSheet);
sheet.addEventListener('click', ev => { if (ev.target === sheet) closeSheet(); });
document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !sheet.hidden) closeSheet(); });
$('btnClear').addEventListener('click', clearFormula);
holdRepeat($('btnMinus'), () => stepFixed(-1));
holdRepeat($('btnPlus'), () => stepFixed(1));

/* ---------------------------------------------------------------- bônus, penalidade e afins */
// O tema pode oferecer jeitos especiais de rolar (no Arkham, os dados de bônus e de penalidade do
// d100). Cada opção diz quantos dados a mais vão para a mesa e como contar o resultado; a opção
// sem dados a mais é a normal. Depois de cada lançamento, volta para a normal.
const PLAIN = { id: 'normal' };
const themeModes = Object.values(theme.modes || {});
let options = null, mode = PLAIN, rolled = PLAIN;
const normalMode = () => options?.find(o => !o.extra) || PLAIN;
modesBox.hidden = !themeModes.length;

function buildModes(set) {
  const list = theme.modes?.[set?.id];
  options = list?.options || null;
  mode = normalMode();
  // sem opções, a faixa fica invisível mas no mesmo lugar: a mesa não muda de tamanho
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
function arrange({ instant = false } = {}) {
  const { set } = current, extra = mode.extra;
  const wanted = [...set.dice];
  const copy = extra && set.dice.find(s => s.role === extra.role);
  if (copy) for (let i = 0; i < extra.count; i++) wanted.push(copy);
  const free = [...current.dice].sort((a, b) => a.dropped - b.dropped);
  const fresh = [];
  current.dice = wanted.map(spec => {
    const i = free.findIndex(d => d.spec === spec);
    if (i >= 0) return free.splice(i, 1)[0];
    const d = placeDie(spec);
    fresh.push(d.die);
    return d;
  });
  free.forEach(vanish);
  for (const d of current.dice) d.dropped = false;
  if (instant) table.settleNow();
  else if (fresh.length) table.drop(fresh);
  if (instant || fresh.length) syncMeshes(false);
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
  const note = $('vNote'), noteText = result.note || (how.extra ? how.name : '');
  note.textContent = noteText;
  note.className = 'verdict-note' + (how.tone ? ` tone-${how.tone}` : '');
  note.hidden = !noteText;
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

function toIdle({ instant = false } = {}) {
  clearTimeout(verdictTimer);
  verdict.hidden = true;
  verdict.classList.remove('show');
  look.setMood(null);
  hint.textContent = theme.texts.hint;
  hint.hidden = false;
  state = 'idle';
  arrange({ instant });
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
    building = false;   // depois de lançar, um dado novo começa outra fórmula
  } else if (state === 'result') {
    toIdle();
  }
});

for (const id of [...Object.keys(DIE_KINDS), D100.id]) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'die-chip';
  b.dataset.set = id;
  b.setAttribute('aria-pressed', 'false');
  b.append(id === D100.id ? D100.name : DIE_KINDS[id].name, Object.assign(document.createElement('span'), { className: 'count' }));
  b.addEventListener('click', () => (id === D100.id ? pickD100() : tapKind(id)));
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

// Abre com o que estava na mesa da última vez (o d100 não é fórmula: parse devolve null).
buildModes(D100);   // a faixa de opções já ocupa o seu lugar ao medir a tela
relayout();
const saved = formulas.parse(prefs.roll ?? prefs.die);
if (saved) {
  lastKind = saved.groups[saved.groups.length - 1].kind;
  setFormula(saved, { instant: true });
} else {
  chooseSet(D100, { instant: true });
}
window.addEventListener('resize', relayout);
document.fonts.ready.then(relayout);
requestAnimationFrame(frame);

// Guarda o app no aparelho para abrir rápido e funcionar sem internet (só no endereço publicado).
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});

// Atalho só para testes no computador (localhost): permite simular resultados e opções.
if (location.hostname === 'localhost') {
  window.__dados = {
    showResult, chooseSet, setFormula, tapKind, pickD100, chooseMode, stepFixed, clearFormula, useFormula,
    formulas, tick, table, stage, theme, THREE, D100,
    get current() { return current; }, get state() { return state; }, get mode() { return mode; },
    get formula() { return formula; }, get building() { return building; }
  };
}
