import { createCounterWatch } from './core/counter-watch.js';

// Os alertas para o Guardião, na mesa compartilhada. Com base nos valores que cada jogador ajusta, o
// app do Guardião lembra a regra quando uma mudança pede atenção (no tema Arkham: perdas grandes de
// SAN e de PV; veja alerts em themes/arkham/rules.js). Tudo acontece neste aparelho: a mesa não sabe
// dos alertas, e os jogadores não recebem nada. Cada alerta aparece de três jeitos: um aviso no alto
// da tela, que fica até o Guardião dispensar; o jogador destacado na lista de quem está na mesa,
// enquanto o aviso estiver lá; e um registro no histórico das rolagens, que fica.
// Fica guardado no aparelho (saved.alerts), ligado ao código da mesa: aberto de novo no meio da
// sessão, o app continua de onde estava.

const SHOWN = { wide: 3, narrow: 1 };   // avisos à vista de uma vez; os outros esperam a vez (no celular, um só, para não cobrir a mesa)
const NARROW = '(max-width: 600px)';
const MAX_OPEN = 6;     // avisos esperando: o mais velho que isso sai do alto (e fica no histórico)
const MAX_KEPT = 60;    // registros guardados no histórico

// list: os contadores do tema ({ id, short, name }); rules: os alertas do tema; saved/save: o que a
// mesa guarda no aparelho (room-panel.js); box: onde os avisos aparecem; log: o histórico
// (room-log.js); nameOf(seat): o nome de quem está naquele lugar; onUpdate: mudou quem está destacado.
export function createRoomAlerts({ list, rules, saved, save, box, log, nameOf, unlock, onUpdate }) {
  const shorts = Object.fromEntries(list.map(c => [c.id, c.short]));
  const narrow = matchMedia(NARROW);
  let state = null, watch = null, count = 0;

  const el = (tag, className, text) => {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  };

  // A mesa em que o Guardião está. A mesma de antes continua de onde estava; outra recomeça.
  function start(code) {
    if (state?.code === code) return;
    stop();
    if (saved.alerts?.code !== code || !Array.isArray(saved.alerts.entries)) saved.alerts = { code, watch: {}, memory: {}, entries: [] };
    state = saved.alerts;
    watch = createCounterWatch({ ids: list.map(c => c.id), state: state.watch, save, onChange });
    save();
    changed();
  }

  // Uma mudança terminou: o tema diz se ela pede um alerta.
  function onChange(change) {
    const memory = (state.memory[change.seat] ||= {});
    const lines = rules(change, memory);
    save();
    if (!lines.length) return;
    state.entries.push({
      id: `${Date.now().toString(36)}${(count++).toString(36)}`, at: Date.now(), after: log.last, seat: change.seat, open: true,
      title: `${nameOf(change.seat)} · ${shorts[change.id] || change.id} ${change.from.cur} → ${change.to.cur}`, lines
    });
    const open = state.entries.filter(e => e.open);
    for (const e of open.slice(0, -MAX_OPEN)) e.open = false;
    state.entries = state.entries.slice(-MAX_KEPT);
    save();
    changed();
  }

  function dismiss(id) {
    unlock();
    const entry = state?.entries.find(e => e.id === id);
    if (!entry) return;
    entry.open = false;
    save();
    changed();
  }

  // Os avisos no alto da tela, o mais novo em cima (os que não cabem esperam: dispensar um mostra o
  // seguinte), e os registros no histórico.
  function changed() {
    const open = state ? state.entries.filter(e => e.open).reverse() : [];
    const shown = open.slice(0, narrow.matches ? SHOWN.narrow : SHOWN.wide), more = open.length - shown.length;
    box.replaceChildren(...shown.map(e => {
      const card = el('div', 'alert');
      card.setAttribute('role', 'alert');
      const head = el('div', 'alert-head');
      const ok = el('button', 'toggle alert-ok', 'Entendi');
      ok.type = 'button';
      ok.setAttribute('aria-label', `Dispensar o alerta: ${e.title}`);
      ok.addEventListener('click', () => dismiss(e.id));
      head.append(el('p', 'alert-title', e.title), ok);
      card.append(head, ...e.lines.map(line => el('p', 'alert-line', line)));
      return card;
    }));
    if (more) box.append(el('p', 'alert-more', `mais ${more} ${more === 1 ? 'alerta esperando' : 'alertas esperando'}`));
    log.notes(state ? state.entries : []);
    onUpdate();
  }
  narrow.addEventListener('change', () => { if (state) changed(); });

  function stop() {
    watch?.stop();
    watch = null;
  }

  return {
    start,
    // Os valores de um jogador, como chegaram da mesa.
    see(seat, counters) { watch?.see(seat, counters); },
    // O jogador tem um aviso à vista (para destacá-lo na lista de quem está na mesa).
    flagged: seat => !!state?.entries.some(e => e.open && e.seat === seat),
    // Saiu da mesa: o que era dela se apaga.
    clear() {
      stop();
      state = null;
      delete saved.alerts;
      save();
      box.replaceChildren();
      log.notes([]);
    }
  };
}
