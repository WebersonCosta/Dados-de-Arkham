import { clamp } from '../lib/util.js';

// Os contadores de um personagem (no tema Arkham: PV, Sanidade, Sorte e Pontos de Magia). Cada um
// guarda o máximo e o valor atual, { max, cur }, com o atual sempre entre 0 e o máximo. Essa é a
// forma em todo lugar: na tela, no aparelho, na mesa (o servidor confere o mesmo formato) e, no
// futuro, na ficha do personagem, com as colunas "Máximo" e "Atual". Quais são os contadores é o
// tema que diz; aqui não há tela nem tema.

export const MAX_COUNTER = 999;   // como o servidor (server/room.js)

// O máximo como foi escrito: um número de 1 a 999, ou null (vazio, zero ou qualquer outra coisa).
export function readMax(text) {
  const written = String(text ?? '').trim();
  const max = /^\d{1,3}$/.test(written) ? Number(written) : 0;
  return max >= 1 ? max : null;
}

// Um contador com outro máximo (sem máximo, ele deixa de existir: null). O primeiro máximo começa
// cheio, e quem estava cheio continua cheio; os outros só não passam do máximo novo.
export function setMax(counter, max) {
  if (!max) return null;
  if (!counter || counter.cur === counter.max) return { max, cur: max };
  return { max, cur: Math.min(counter.cur, max) };
}

// O valor atual, um pouco mais ou menos, sem sair de 0 a máximo.
export const step = (counter, delta) => ({ max: counter.max, cur: clamp(counter.cur + delta, 0, counter.max) });

// O que veio de fora (guardado no aparelho e, no futuro, a ficha): só os contadores do tema, com
// valores que valem.
export function cleanCounters(ids, input) {
  const counters = {};
  for (const id of ids) {
    const c = input?.[id];
    if (Number.isInteger(c?.max) && c.max >= 1 && c.max <= MAX_COUNTER && Number.isInteger(c.cur)) {
      counters[id] = { max: c.max, cur: clamp(c.cur, 0, c.max) };
    }
  }
  return counters;
}

// Os valores ficam ligados ao nome do personagem, sem diferenciar maiúsculas.
export const characterKey = name => String(name ?? '').trim().toLocaleLowerCase('pt-BR');
