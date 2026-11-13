import { FEEL } from './core/physics.js';

// Painel de ajuste dos dados. TEMPORÁRIO: só fora do endereço oficial, aberto com "?ajuste" no fim
// do endereço. Serve para Weberson achar, no celular, o tamanho e o peso ideais; depois os valores
// escolhidos ficam fixos no app (FEEL, em core/physics.js) e este arquivo sai, antes de publicar.
// Os valores ficam guardados só neste aparelho. Depois de cada lance, o painel mostra o tempo até
// o resultado e quantos empurrões os dados levaram.

const KEY = 'arkham-ajuste';
const BEFORE = { size: 1, weight: 0 };   // como era na versão 1.2

const STYLE = `
.tune { position: fixed; z-index: 6; left: max(10px, env(safe-area-inset-left, 0px)); top: calc(env(safe-area-inset-top, 0px) + 92px);
  width: min(270px, calc(100% - 20px)); box-sizing: border-box; font-family: var(--font-ui); font-size: .72rem; color: var(--c-text);
  background: rgba(0, 0, 0, .74); border: 1px dashed var(--c-penalty); border-radius: 3px; padding: 8px 10px; }
.tune[data-open="false"] { width: auto; padding: 0; border: 0; background: none; }
.tune[data-open="false"] > :not(.tune-head) { display: none; }
.tune-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.tune-head b { color: var(--c-penalty); letter-spacing: .06em; }
.tune button { font: inherit; color: var(--c-text); background: var(--c-panel); border: 1px solid var(--c-line-strong); border-radius: 2px; padding: .45rem .6rem; cursor: pointer; touch-action: manipulation; }
.tune label { display: block; margin-top: 8px; }
.tune label span { display: flex; justify-content: space-between; }
.tune input[type=range] { width: 100%; margin: 6px 0 0; accent-color: var(--c-accent); }
.tune-buttons { display: flex; gap: 6px; margin-top: 8px; }
.tune-stats { margin: 8px 0 0; line-height: 1.45; color: var(--c-text-dim); }
`;

// table: a física (DiceTable); onSize: os dados mudaram de tamanho e precisam ser postos de novo na mesa.
export function createTunePanel({ table, onSize }) {
  const saved = { ...FEEL };
  try { Object.assign(saved, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) {}
  const store = () => { try { localStorage.setItem(KEY, JSON.stringify(table.feel)); } catch (e) {} };

  const style = document.createElement('style');
  style.textContent = STYLE;
  const box = document.createElement('div');
  box.className = 'tune';
  box.dataset.open = 'true';
  box.innerHTML = `
    <div class="tune-head"><b>AJUSTE (só no teste)</b><button type="button" data-act="toggle">Fechar</button></div>
    <label><span>Tamanho <b data-show="size"></b></span><input type="range" data-set="size" min="70" max="110" step="2"></label>
    <label><span>Peso <b data-show="weight"></b></span><input type="range" data-set="weight" min="0" max="10" step="0.5"></label>
    <div class="tune-buttons"><button type="button" data-act="default">Padrão</button><button type="button" data-act="before">Como era</button></div>
    <p class="tune-stats" data-show="stats">Lance os dados: aqui aparecem o tempo até o resultado e os empurrões.</p>`;
  document.head.append(style);
  document.body.append(box);
  const $ = sel => box.querySelector(sel);
  const number = v => v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });

  function show() {
    $('[data-set="size"]').value = Math.round(table.feel.size * 100);
    $('[data-set="weight"]').value = table.feel.weight;
    $('[data-show="size"]').textContent = `${Math.round(table.feel.size * 100)}%`;
    $('[data-show="weight"]').textContent = number(table.feel.weight);
  }

  function apply(feel) {
    const resized = feel.size !== undefined && feel.size !== table.feel.size;
    table.setFeel(feel);
    store();
    show();
    if (resized) onSize();
  }

  // o peso vale na hora (até para os dados que estão rolando); o tamanho, ao soltar o controle
  $('[data-set="weight"]').addEventListener('input', ev => apply({ weight: Number(ev.target.value) }));
  $('[data-set="size"]').addEventListener('input', ev => { $('[data-show="size"]').textContent = `${ev.target.value}%`; });
  $('[data-set="size"]').addEventListener('change', ev => apply({ size: Number(ev.target.value) / 100 }));
  box.addEventListener('click', ev => {
    const act = ev.target.dataset?.act;
    if (act === 'toggle') {
      const open = box.dataset.open !== 'true';
      box.dataset.open = String(open);
      ev.target.textContent = open ? 'Fechar' : 'Ajuste';
    }
    if (act === 'default') apply({ ...FEEL });
    if (act === 'before') apply({ ...BEFORE });
  });

  // depois de cada lance: o tempo até o resultado (no relógio da física) e os empurrões
  let start = 0, nudges = 0, counting = false;
  const runs = [];
  const throwDice = table.throw.bind(table), unstick = table.unstick.bind(table), settled = table.onSettled;
  table.throw = target => { start = table.world.time; nudges = 0; counting = true; throwDice(target); };
  table.unstick = die => { if (counting) nudges++; unstick(die); };
  table.onSettled = () => {
    if (counting) {
      counting = false;
      const time = table.world.time - start;
      runs.push({ time, nudges });
      const pushed = runs.filter(r => r.nudges).length, sorted = runs.map(r => r.time).sort((a, b) => a - b);
      $('[data-show="stats"]').textContent =
        `Último lance: ${number(time)} s até o resultado, ${nudges} ${nudges === 1 ? 'empurrão' : 'empurrões'}. ` +
        `Até agora: ${runs.length} ${runs.length === 1 ? 'lance' : 'lances'}, ${pushed} com empurrão, tempo do meio ${number(sorted[Math.floor(sorted.length / 2)])} s.`;
    }
    settled();
  };

  table.setFeel(saved);
  show();
  onSize();
}
