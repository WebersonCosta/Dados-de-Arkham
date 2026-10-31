// Testes das regras da sala (room.js), sem servidor: node --test test/room.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GUARDIAN, MAX_PLAYERS, CODE_CHARS, CODE_LENGTH,
  newCode, cleanCode, validDevice, digest, cleanName, bounds, readRoll, seenBy, nextSeat, publicSeat
} from '../room.js';

test('código da sala: 6 letras e números, sem os que se confundem', () => {
  for (let i = 0; i < 2000; i++) {
    const code = newCode();
    assert.equal(code.length, CODE_LENGTH);
    assert.ok([...code].every(c => CODE_CHARS.includes(c)), code);
  }
  assert.ok(![...CODE_CHARS].some(c => '0O1IL'.includes(c)));
  // bytes acima do limite justo são descartados, não viram letra
  let calls = 0;
  const code = newCode(n => (calls++ === 0 ? new Uint8Array(n).fill(255) : new Uint8Array(n).fill(0)));
  assert.equal(code, 'AAAAAA');
});

test('código digitado: aceita minúsculas, espaços e traços', () => {
  assert.equal(cleanCode('k7q-x3m'), 'K7QX3M');
  assert.equal(cleanCode(' K7Q X3M '), 'K7QX3M');
  assert.equal(cleanCode('K7QX3'), null);          // curto
  assert.equal(cleanCode('K7QX3O'), null);         // O não existe nos códigos
  assert.equal(cleanCode('../x'), null);
  assert.equal(cleanCode(undefined), null);
});

test('chave do aparelho e o resumo guardado no servidor', async () => {
  assert.ok(validDevice('a'.repeat(43)));
  assert.ok(!validDevice('curta'));
  assert.ok(!validDevice('a'.repeat(42) + '!'));
  assert.ok(!validDevice(12345));
  const d = await digest('abc');
  assert.equal(d, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('nome do investigador: limpo e com no máximo 30 letras', () => {
  assert.equal(cleanName('  Ana   Ferreira  '), 'Ana Ferreira');
  assert.equal(cleanName('Ana\u0000‮Lima'), 'AnaLima');
  assert.equal(cleanName('x'.repeat(50)).length, 30);
  assert.equal(cleanName('🐙'.repeat(40)), '🐙'.repeat(30));   // emoji não é cortado ao meio
  assert.equal(cleanName(42), '');
  assert.equal(cleanName('   '), '');
});

test('menor e maior total de cada conjunto', () => {
  assert.deepEqual(bounds('d100'), { min: 1, max: 100 });
  assert.deepEqual(bounds('3d6'), { min: 3, max: 18 });
  assert.deepEqual(bounds('2d6+6'), { min: 8, max: 18 });
  assert.deepEqual(bounds('1d3+1d4'), { min: 2, max: 7 });
  assert.deepEqual(bounds('1d6−2'), { min: -1, max: 4 });
  assert.deepEqual(bounds('1d6-2'), { min: -1, max: 4 });
  assert.deepEqual(bounds('8d20+99'), { min: 107, max: 259 });
  assert.equal(bounds('9d6'), null);               // mais de 8 dados
  assert.equal(bounds('1d6+100'), null);
  assert.equal(bounds('2d6 + 6'), null);           // vem sem espaços
  assert.equal(bounds('1d1'), null);
  assert.equal(bounds('d20'), null);
  assert.equal(bounds('1d6*2'), null);
  assert.equal(bounds(undefined), null);
});

const base = { id: 'abcdefgh1', vis: 'open', set: '2d6+6', name: '2d6 + 6', total: 14, text: '14', detail: '5 + 3 + 6 = 14' };

test('rolagem: só passa o que o app manda, conferido', () => {
  const { roll } = readRoll({ ...base, label: '  Dano  ', extra: 'não passa', seat: 'g' }, false);
  assert.deepEqual(roll, { id: 'abcdefgh1', vis: 'open', set: '2d6+6', total: 14, text: '14', name: '2d6 + 6', label: 'Dano', detail: '5 + 3 + 6 = 14' });
  const d100 = readRoll({ id: 'abcdefgh2', vis: 'private', set: 'd100', total: 5, text: '05', pieces: [{ text: '00', dropped: true }, { text: '00' }, { text: '+ 5' }] }, false);
  assert.deepEqual(d100.roll.pieces, [{ text: '00', dropped: true }, { text: '00', dropped: false }, { text: '+ 5', dropped: false }]);
  assert.equal(readRoll({ ...base, set: '1d6−2', total: -1, text: '−1' }, false).roll.set, '1d6-2');
});

test('rolagem: recusa o que não pode ser', () => {
  assert.equal(readRoll({ ...base, total: 25, text: '25', set: '3d6' }, false).error, 'impossible');
  assert.equal(readRoll({ ...base, total: 7, text: '7' }, false).error, 'impossible');       // 2d6+6 começa em 8
  assert.equal(readRoll({ ...base, text: '15' }, false).error, 'invalid');                  // texto diferente do total
  assert.equal(readRoll({ ...base, total: 14.5 }, false).error, 'invalid');
  assert.equal(readRoll({ ...base, id: 'curto' }, false).error, 'invalid');
  assert.equal(readRoll({ ...base, vis: 'todos' }, false).error, 'invalid');
  assert.equal(readRoll({ ...base, set: '2d6 + 6' }, false).error, 'invalid');
  assert.equal(readRoll({ ...base, pieces: 'x' }, false).error, 'invalid');
  assert.equal(readRoll(null, false).error, 'invalid');
});

test('rolagem secreta é só do Guardião', () => {
  assert.equal(readRoll({ ...base, vis: 'secret' }, false).error, 'guardian-only');
  assert.equal(readRoll({ ...base, vis: 'secret' }, true).roll.vis, 'secret');
  assert.equal(readRoll({ ...base, vis: 'private' }, true).roll.vis, 'secret');   // para o Guardião, dá no mesmo
  assert.equal(readRoll({ ...base, vis: 'private' }, false).roll.vis, 'private');
});

test('quem vê o quê: aberta, privada e secreta', () => {
  const full = vis => ({ ...base, vis, label: 'Furtividade', seq: 3, seat: vis === 'secret' ? GUARDIAN : 'j1', at: 1000 });
  const suspense = r => ({ id: r.id, seq: r.seq, seat: r.seat, at: r.at, vis: r.vis });
  const open = full('open'), priv = full('private'), secret = full('secret');
  for (const seat of [GUARDIAN, 'j1', 'j2']) assert.deepEqual(seenBy(open, seat), open);
  assert.deepEqual(seenBy(priv, 'j1'), priv);          // quem rolou
  assert.deepEqual(seenBy(priv, GUARDIAN), priv);
  assert.deepEqual(seenBy(priv, 'j2'), suspense(priv));
  assert.deepEqual(seenBy(secret, GUARDIAN), secret);
  assert.deepEqual(seenBy(secret, 'j1'), suspense(secret));
  assert.deepEqual(seenBy(secret, 'j2'), suspense(secret));
  // o sinal de suspense não leva nada além de quem rolou e quando, mesmo com campos novos na rolagem
  assert.deepEqual(Object.keys(seenBy({ ...priv, futuro: 'x' }, 'j2')).sort(), ['at', 'id', 'seat', 'seq', 'vis']);
});

test('lugares: j1 a j6 na ordem de entrada, depois a mesa está cheia', () => {
  const seats = [{ seat: GUARDIAN, role: 'guardian' }];
  for (let i = 1; i <= MAX_PLAYERS; i++) {
    const seat = nextSeat(seats);
    assert.equal(seat, `j${i}`);
    seats.push({ seat, role: 'player' });
  }
  assert.equal(nextSeat(seats), null);
});

test('a lista de quem está na mesa não leva a chave do aparelho', () => {
  const row = { seat: 'j1', device: 'f'.repeat(64), name: 'Ana', role: 'player', ord: 1 };
  assert.deepEqual(publicSeat(row, true), { seat: 'j1', name: 'Ana', role: 'player', order: 1, online: true });
});
