import { readMax, setMax, step, cleanCounters, characterKey } from './core/counters.js';
import { holdRepeat } from './lib/util.js';

// Os valores do personagem na mesa compartilhada (no tema Arkham: PV, SAN, Sorte e PM). O jogador
// escreve o máximo de cada um e ajusta o valor atual com − e +, numa folha aberta pelo botão perto
// da bandeja, que mostra os dois primeiros. O Guardião não tem contadores.
//
// Os valores ficam guardados no aparelho, ligados ao nome do personagem, e voltam sozinhos na
// próxima sessão: saved.characters guarda { name, counters } pela chave do nome. O aparelho é quem
// sabe os valores; a mesa só recebe o resultado. Toda mudança passa por changed(): é ali que, no
// futuro, a ficha do personagem acompanha os contadores (docs/plano-mesa-compartilhada.md).

// list: os contadores do tema ({ id, short, name }); saved/save: o que a mesa guarda no aparelho
// (room-panel.js); note: o texto da folha; onChange: os valores mudaram.
export function createRoomCounters({ list, saved, save, unlock, note, onChange }) {
  const $ = id => document.getElementById(id);
  const chip = $('btnCounters'), sheet = $('countersSheet'), grid = $('countersList');
  if (!saved.characters || typeof saved.characters !== 'object') saved.characters = {};
  const ids = list.map(c => c.id), rows = new Map();
  const names = new Intl.ListFormat('pt-BR').format(list.map(c => c.short));
  let character = null;   // o personagem em uso: { name, counters }

  const values = () => character?.counters || {};
  const isEmpty = () => !Object.keys(values()).length;

  const el = (tag, className, text) => {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  };

  function stepButton(sign, aria, action) {
    const b = el('button', 'counter-step', sign);
    b.type = 'button';
    b.setAttribute('aria-label', aria);
    holdRepeat(b, action, unlock);
    return b;
  }

  // As linhas da folha: o nome, − atual +, e o máximo.
  grid.append(el('span'), el('span'), el('span', 'counter-caption', 'atual'), el('span'), el('span', 'counter-caption', 'máximo'));
  for (const c of list) {
    const cur = el('b', 'counter-cur');
    const max = el('input', 'counter-max');
    Object.assign(max, { inputMode: 'numeric', pattern: '[0-9]*', maxLength: 3, autocomplete: 'off', placeholder: '—', enterKeyHint: 'next' });
    max.setAttribute('aria-label', `Máximo de ${c.name}`);
    const minus = stepButton('−', `Diminuir ${c.name}`, () => adjust(c.id, -1));
    const plus = stepButton('+', `Aumentar ${c.name}`, () => adjust(c.id, 1));
    grid.append(el('span', 'counter-name', c.short), minus, cur, plus, max);
    rows.set(c.id, { cur, max, minus, plus });
  }

  function changed() {
    save();
    render();
    onChange();
  }

  function adjust(id, delta) {
    commit();
    const now = character?.counters[id];
    if (!now) return;
    const next = step(now, delta);
    if (next.cur === now.cur) return;
    character.counters[id] = next;
    changed();
  }

  // Os máximos escritos valem ao sair do campo, e não a cada letra: escrevendo 60 sobre 11, o valor
  // atual não passa por um máximo de 6.
  function commit() {
    if (!character) return;
    let dirty = false;
    for (const id of ids) {
      const { max: field } = rows.get(id), now = character.counters[id], max = readMax(field.value);
      field.value = max ?? '';
      if (max === (now?.max ?? null)) continue;
      const next = setMax(now, max);
      if (next) character.counters[id] = next;
      else delete character.counters[id];
      dirty = true;
    }
    if (dirty) changed();
  }

  function render() {
    chip.hidden = !character;
    if (!character) return;
    const now = values();
    chip.textContent = list.slice(0, 2).map(c => (now[c.id] ? `${c.short} ${now[c.id].cur}` : c.short)).join(' · ');
    chip.classList.toggle('is-empty', isEmpty());
    chip.setAttribute('aria-label', isEmpty() ? `Informar ${names}`
      : list.map(c => (now[c.id] ? `${c.short} ${now[c.id].cur} de ${now[c.id].max}` : `${c.short} sem valor`)).join(', ') + '. Ajustar');
    $('countersHead').textContent = character.name;
    for (const id of ids) {
      const v = now[id], { cur, max, minus, plus } = rows.get(id);
      cur.textContent = v ? v.cur : '–';
      // aria-disabled, e não disabled: um botão desligado no meio do toque não avisaria que o dedo saiu
      minus.setAttribute('aria-disabled', String(!v || v.cur <= 0));
      plus.setAttribute('aria-disabled', String(!v || v.cur >= v.max));
      if (document.activeElement !== max) max.value = v ? v.max : '';
    }
  }

  function open() {
    unlock();
    $('countersNote').textContent = note();
    render();
    sheet.hidden = false;
    // no computador, quem ainda não informou já pode escrever; no celular, o teclado só abre se a pessoa tocar no campo
    (isEmpty() && matchMedia('(pointer: fine)').matches ? rows.get(ids[0]).max : $('btnCloseCounters')).focus();
  }
  function close() {
    commit();
    sheet.hidden = true;
  }

  chip.addEventListener('click', open);
  $('btnCloseCounters').addEventListener('click', close);
  sheet.addEventListener('click', ev => { if (ev.target === sheet) close(); });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !sheet.hidden) close(); });
  grid.addEventListener('change', commit);
  // o Enter do teclado passa para o próximo campo
  grid.addEventListener('keydown', ev => {
    if (ev.key !== 'Enter' || !ev.target.matches('input')) return;
    ev.preventDefault();
    const fields = ids.map(id => rows.get(id).max), next = fields[fields.indexOf(ev.target) + 1];
    if (next) next.focus();
    else ev.target.blur();
  });
  // Escrevendo um máximo, a folha sobe, para o teclado não cobrir os campos; no resto do tempo fica
  // embaixo, perto do polegar.
  grid.addEventListener('focusin', ev => sheet.classList.toggle('at-top', ev.target.matches('input')));
  grid.addEventListener('focusout', () => sheet.classList.remove('at-top'));
  render();

  return {
    values, open,
    // O personagem em uso, pelo nome; null para quem não tem contadores (o Guardião, ou fora de uma mesa).
    use(name) {
      const key = list.length && name ? characterKey(name) : '';
      character = key ? (saved.characters[key] = { name, counters: cleanCounters(ids, saved.characters[key]?.counters) }) : null;
      render();
    },
    // Um personagem que ainda não tem nenhum valor.
    get missing() { return !!character && isEmpty(); },
    clear() {
      commit();
      sheet.hidden = true;
      character = null;
      render();
    }
  };
}
