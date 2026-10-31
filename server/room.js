// Regras da sala da mesa compartilhada, sem nada do Cloudflare: o código da sala, quem senta onde,
// o que uma rolagem pode trazer e o que cada pessoa recebe dela. O worker.js guarda e entrega; as
// decisões ficam aqui, para serem testadas sem servidor (test/room.test.js).

export const PROTOCOL = 1;        // muda quando o app e o servidor deixam de se entender
export const MAX_PLAYERS = 6;     // jogadores, fora o Guardião
export const GUARDIAN = 'g';      // o lugar do Guardião; os jogadores sentam em j1, j2… na ordem de entrada
export const HISTORY = 100;       // rolagens mandadas a quem entra ou volta
export const MAX_DICE = 8;        // como no app (src/core/formula.js)
export const MAX_FIXED = 99;
export const VISIBILITY = ['open', 'private', 'secret'];

// Código da sala: 6 letras e números, sem os que se confundem (0 e O, 1, I e L).
export const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 6;

export function newCode(randomBytes = n => crypto.getRandomValues(new Uint8Array(n))) {
  const fair = 256 - (256 % CODE_CHARS.length);   // bytes acima disso são descartados: toda letra tem a mesma chance
  let code = '';
  while (code.length < CODE_LENGTH) {
    for (const b of randomBytes(CODE_LENGTH)) {
      if (b < fair && code.length < CODE_LENGTH) code += CODE_CHARS[b % CODE_CHARS.length];
    }
  }
  return code;
}

// O código como a pessoa digitou (minúsculas, espaços e traços valem); null se não for um código.
export function cleanCode(input) {
  const code = String(input ?? '').toUpperCase().replace(/[\s-]/g, '');
  return code.length === CODE_LENGTH && [...code].every(c => CODE_CHARS.includes(c)) ? code : null;
}

// Chave do aparelho: sorteada pelo app e guardada só nele. O servidor guarda só um resumo dela
// (SHA-256): com o resumo dá para reconhecer o aparelho, mas não para se passar por ele.
export const validDevice = key => typeof key === 'string' && /^[A-Za-z0-9_-]{22,64}$/.test(key);

export async function digest(key) {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key)));
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

// Texto que veio de um aparelho: sem caracteres de controle nem invisíveis, sem espaços sobrando e
// com no máximo `max` letras (um emoji conta como uma). Quebras de linha, só onde `lines` deixa.
const INVISIBLE = /[\u0000-\u0009\u000b-\u001f\u007f-\u009f​-‏‪-‮⁠-⁯﻿]/g;
function cleanText(input, max, { lines = false } = {}) {
  if (typeof input !== 'string') return '';
  const s = input.replace(INVISIBLE, '');
  const tidy = lines
    ? s.split('\n').map(line => line.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n')
    : s.replace(/\s+/g, ' ').trim();
  return Array.from(tidy).slice(0, max).join('').trim();
}

export const MAX_NAME = 30;
export const cleanName = input => cleanText(input, MAX_NAME);

// O menor e o maior total possíveis de um conjunto: 'd100', ou uma fórmula escrita como no app,
// sem espaços ('2d6+6', '1d3+1d4', '1d6−2'). Cada dado dN vale de 1 a N (o d3 também: o d6 dele é
// convertido antes de somar). null se não for um conjunto que o app rola.
const FORMULA = /^(\d{1,2}d\d{1,3}(?:\+\d{1,2}d\d{1,3})*)([+-]\d{1,2})?$/;
export function bounds(set) {
  const s = String(set ?? '').replace(/−/g, '-').toLowerCase();
  if (s === 'd100') return { min: 1, max: 100 };
  const m = FORMULA.exec(s);
  if (!m) return null;
  let dice = 0, min = 0, max = 0;
  for (const [, n, faces] of m[1].matchAll(/(\d+)d(\d+)/g)) {
    if (Number(n) < 1 || Number(faces) < 2) return null;
    dice += Number(n);
    min += Number(n);
    max += Number(n) * Number(faces);
  }
  const fixed = Number(m[2] ?? 0);
  return dice <= MAX_DICE ? { min: min + fixed, max: max + fixed } : null;
}

// Uma rolagem que chegou de um aparelho, conferida e só com o que o app manda. Devolve { roll } ou
// { error }: 'invalid' (faltando algo ou fora do formato), 'impossible' (um total que a fórmula não
// dá) ou 'guardian-only' (secreta de jogador: os dados rolam no aparelho de quem rola, então só o
// Guardião consegue rolar sem que mais ninguém veja).
export function readRoll(msg, isGuardian) {
  const id = typeof msg?.id === 'string' && /^[A-Za-z0-9_-]{8,40}$/.test(msg.id) ? msg.id : null;
  const range = bounds(msg?.set);
  const text = typeof msg?.text === 'string' && /^[−-]?\d{1,3}$/.test(msg.text) ? msg.text : null;
  let vis = VISIBILITY.includes(msg?.vis) ? msg.vis : null;
  if (!id || !range || !text || !vis || !Number.isInteger(msg.total)) return { error: 'invalid' };
  if (Number(text.replace('−', '-')) !== msg.total) return { error: 'invalid' };
  if (msg.total < range.min || msg.total > range.max) return { error: 'impossible' };
  if (vis === 'secret' && !isGuardian) return { error: 'guardian-only' };
  if (vis === 'private' && isGuardian) vis = 'secret';   // para o Guardião, privada e secreta dão no mesmo: só ele vê
  if (msg.pieces !== undefined && (!Array.isArray(msg.pieces) || msg.pieces.length > 12)) return { error: 'invalid' };

  const set = String(msg.set).replace(/−/g, '-').toLowerCase();
  const roll = {
    id, vis, set, total: msg.total, text,
    name: cleanText(msg.name, 40) || set,
    label: cleanText(msg.label, 40),
    detail: cleanText(msg.detail, 80, { lines: true }),
    note: cleanText(msg.note, 160, { lines: true })
  };
  if (msg.pieces) roll.pieces = msg.pieces.map(p => ({ text: cleanText(p?.text, 8), dropped: p?.dropped === true }));
  for (const key of ['label', 'detail', 'note']) if (!roll[key]) delete roll[key];   // campo vazio não viaja
  return { roll };
}

// O que um lugar da mesa recebe de uma rolagem: ela inteira, ou só o sinal de suspense (quem rolou
// e quando, sem número, dados nem rótulo). A aberta vai inteira para todos; a privada, para quem
// rolou e para o Guardião; a secreta, só para o Guardião.
export function seenBy(roll, seat) {
  const sees = roll.vis === 'open' || seat === GUARDIAN || (roll.vis === 'private' && seat === roll.seat);
  return sees ? roll : { id: roll.id, seq: roll.seq, seat: roll.seat, at: roll.at, vis: roll.vis };
}

// O lugar de quem chega pela primeira vez: o próximo de jogador (j1, j2…), ou null com a mesa cheia.
export function nextSeat(seats) {
  const players = seats.filter(s => s.role === 'player').length;
  return players < MAX_PLAYERS ? `j${players + 1}` : null;
}

// Quem está na mesa, como todos recebem: o lugar, o nome, o papel, a ordem de entrada e se está
// conectado. A chave do aparelho (nem o resumo dela) nunca sai do servidor.
export const publicSeat = (s, online) => ({ seat: s.seat, name: s.name, role: s.role, order: s.ord, online });
