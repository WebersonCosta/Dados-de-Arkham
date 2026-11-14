import { createCounterWatch } from './core/counter-watch.js';

// Os alertas para o Guardião, na mesa compartilhada. Com base nos valores que cada jogador ajusta, o
// app do Guardião lembra a regra quando uma mudança pede atenção (no tema Arkham: perdas grandes de
// SAN e de PV; veja alerts em themes/arkham/rules.js). Tudo acontece neste aparelho: a mesa não sabe
// dos alertas, e os jogadores não recebem nada. Cada alerta aparece de três jeitos:
// - um aviso no alto da tela, que some sozinho depois de alguns segundos (ou no "Entendi");
// - um registro no histórico das rolagens, que só sai quando o Guardião toca em "Apagar";
// - o jogador destacado na lista de quem está na mesa, enquanto tiver um registro no histórico.
// Os registros ficam guardados no aparelho (saved.alerts), ligados ao código da mesa, até o Guardião
// apagar ou a mesa acabar; o aviso no alto não volta quando o app é aberto de novo.

const SHOWN = { wide: 3, narrow: 1 };   // avisos à vista de uma vez; os outros esperam a vez (no celular, um só, para não cobrir a mesa)
const NARROW = '(max-width: 600px)';
const TOAST_MS = 10000;   // o aviso no alto some sozinho depois disso (com o mouse em cima, espera)
const LEAVE_MS = 400;     // o aviso apagando antes de sair
const MAX_KEPT = 200;     // registros no histórico (quem apaga é o Guardião: isso é só um limite de segurança)

// list: os contadores do tema ({ id, short, name }); rules: os alertas do tema; saved/save: o que a
// mesa guarda no aparelho (room-panel.js); box: onde os avisos aparecem; log: o histórico
// (room-log.js); nameOf(seat): o nome de quem está naquele lugar; onUpdate: mudou quem está destacado.
export function createRoomAlerts({ list, rules, saved, save, box, log, nameOf, unlock, onUpdate }) {
  const shorts = Object.fromEntries(list.map(c => [c.id, c.short]));
  const narrow = matchMedia(NARROW);
  let state = null, watch = null, count = 0;
  // os avisos no alto, o mais novo primeiro: { id, timer, deadline, paused, left }; cards: o elemento
  // de cada um à vista (reaproveitado, para não piscar quando outro aviso chega ou sai)
  let toasts = [];
  const cards = new Map(), more = document.createElement('p');
  more.className = 'alert-more';

  const el = (tag, className, text) => {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  };
  const entryOf = id => state?.entries.find(e => e.id === id);

  // A mesa em que o Guardião está. A mesma de antes continua de onde estava; outra recomeça.
  function start(code) {
    if (state?.code === code) return;
    stop();
    if (saved.alerts?.code !== code || !Array.isArray(saved.alerts.entries)) saved.alerts = { code, watch: {}, memory: {}, entries: [] };
    state = saved.alerts;
    for (const e of state.entries) delete e.open;   // guardado por uma versão anterior, que fazia o aviso voltar
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
    const id = `${Date.now().toString(36)}${(count++).toString(36)}`;
    state.entries.push({
      id, at: Date.now(), after: log.last, seat: change.seat, lines,
      title: `${nameOf(change.seat)} · ${shorts[change.id] || change.id} ${change.from.cur} → ${change.to.cur}`
    });
    state.entries = state.entries.slice(-MAX_KEPT);
    toasts.unshift({ id });
    save();
    changed();
  }

  // O aviso no alto sai (o registro continua no histórico).
  function hideToast(id) {
    const toast = toasts.find(t => t.id === id);
    if (!toast) return;
    clearTimeout(toast.timer);
    toasts = toasts.filter(t => t !== toast);
    renderToasts();
  }

  // Passou o tempo: o aviso apaga devagar e sai.
  function expire(id) {
    const card = cards.get(id);
    if (!card) return hideToast(id);
    card.classList.add('is-leaving');
    setTimeout(() => hideToast(id), LEAVE_MS);
  }

  function arm(toast, ms) {
    clearTimeout(toast.timer);
    toast.deadline = Date.now() + ms;
    toast.timer = setTimeout(() => expire(toast.id), ms);
  }

  // O registro sai do histórico: só pelo "Apagar" do Guardião.
  function remove(id) {
    unlock();
    hideToast(id);
    state.entries = state.entries.filter(e => e.id !== id);
    save();
    changed();
  }

  // Os avisos no alto da tela, o mais novo em cima (os que não cabem esperam: o tempo de cada um só
  // começa a contar quando ele aparece).
  function renderToasts() {
    toasts = toasts.filter(t => entryOf(t.id));
    const shown = toasts.slice(0, narrow.matches ? SHOWN.narrow : SHOWN.wide), waiting = toasts.length - shown.length;
    for (const [id, card] of cards) {
      if (!shown.some(t => t.id === id)) {
        card.remove();
        cards.delete(id);
      }
    }
    shown.forEach((toast, i) => {
      if (!toast.deadline) arm(toast, TOAST_MS);
      const card = cards.get(toast.id) || cardOf(toast);
      if (box.children[i] !== card) box.insertBefore(card, box.children[i] || null);
    });
    more.textContent = `mais ${waiting} ${waiting === 1 ? 'alerta esperando' : 'alertas esperando'}`;
    if (waiting) box.append(more);
    else more.remove();
  }

  function cardOf(toast) {
    const e = entryOf(toast.id), card = el('div', 'alert');
    card.dataset.id = toast.id;
    card.setAttribute('role', 'alert');
    const head = el('div', 'alert-head');
    const ok = el('button', 'toggle alert-ok', 'Entendi');
    ok.type = 'button';
    ok.setAttribute('aria-label', `Dispensar o aviso: ${e.title}`);
    ok.addEventListener('click', () => { unlock(); hideToast(toast.id); });
    head.append(el('p', 'alert-title', e.title), ok);
    card.append(head, ...e.lines.map(line => el('p', 'alert-line', line)));
    // com o mouse em cima (lendo), o aviso espera; ao sair, ainda fica uns segundos
    card.addEventListener('pointerenter', () => {
      if (toast.paused) return;
      toast.paused = true;
      toast.left = Math.max(toast.deadline - Date.now(), 0);
      clearTimeout(toast.timer);
    });
    card.addEventListener('pointerleave', () => {
      if (!toast.paused) return;
      toast.paused = false;
      arm(toast, Math.max(toast.left, 3000));
    });
    cards.set(toast.id, card);
    return card;
  }

  function changed() {
    renderToasts();
    log.notes(state ? state.entries : [], remove);
    onUpdate();
  }
  narrow.addEventListener('change', () => { if (state) renderToasts(); });

  function stop() {
    watch?.stop();
    watch = null;
    for (const toast of toasts) clearTimeout(toast.timer);
    toasts = [];
    for (const card of cards.values()) card.remove();
    cards.clear();
    more.remove();
  }

  return {
    start,
    // Os valores de um jogador, como chegaram da mesa.
    see(seat, counters) { watch?.see(seat, counters); },
    // O jogador tem algum alerta no histórico (para destacá-lo na lista de quem está na mesa).
    flagged: seat => !!state?.entries.some(e => e.seat === seat),
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
