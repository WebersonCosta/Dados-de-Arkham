// Testes das regras da sala (room.js), sem servidor: node --test test/room.test.js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  GUARDIAN, MAX_PLAYERS, CODE_CHARS, CODE_LENGTH,
  newCode, cleanCode, validDevice, digest, cleanName, bounds, readRoll, seenBy, nextSeat, publicSeat,
  cleanVersion, compareVersions, newest, readCounters, cleanRules, seesCounters, MAX_COUNTERS, MAX_COUNTER,
  REMOVED, isPlayerSeat
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

test('lugar tirado pelo Guardião: abre a vaga, mas o número do lugar nunca volta', () => {
  const seats = [{ seat: GUARDIAN, role: 'guardian' }, { seat: 'j1', role: 'player' }, { seat: 'j2', role: REMOVED }, { seat: 'j3', role: 'player' }];
  assert.equal(nextSeat(seats), 'j4');   // e não j2: quem chega não herda as privadas do lugar tirado
  const full = [{ seat: GUARDIAN, role: 'guardian' }, ...Array.from({ length: MAX_PLAYERS }, (_, i) => ({ seat: `j${i + 1}`, role: 'player' }))];
  assert.equal(nextSeat(full), null);
  full[3].role = REMOVED;
  assert.equal(nextSeat(full), `j${MAX_PLAYERS + 1}`);
  assert.ok(isPlayerSeat('j1') && isPlayerSeat('j12'));
  for (const bad of [GUARDIAN, 'j', 'j0x', 'x1', 'j1234', 1, null, undefined]) assert.ok(!isPlayerSeat(bad), String(bad));
});

test('a lista de quem está na mesa não leva a chave do aparelho', () => {
  const row = { seat: 'j1', device: 'f'.repeat(64), name: 'Ana', role: 'player', ord: 1 };
  assert.deepEqual(publicSeat(row, true), { seat: 'j1', name: 'Ana', role: 'player', order: 1, online: true });
});

test('contadores: só o máximo e o atual de cada um, com o atual entre 0 e o máximo', () => {
  const good = { hp: { max: 11, cur: 9 }, san: { max: 60, cur: 0 } };
  assert.deepEqual(readCounters(good), good);
  assert.deepEqual(readCounters({}), {});                                   // ainda sem nenhum
  assert.deepEqual(readCounters({ hp: { max: 5, cur: 5, extra: 'x' } }), { hp: { max: 5, cur: 5 } });   // campo a mais não passa
  assert.deepEqual(readCounters({ hp: { max: MAX_COUNTER, cur: 1 } }), { hp: { max: MAX_COUNTER, cur: 1 } });
  for (const bad of [
    null, undefined, 'hp', 7, [], [{ max: 1, cur: 1 }],
    { hp: { max: 10, cur: 11 } },                       // acima do máximo
    { hp: { max: 10, cur: -1 } },                       // abaixo de zero
    { hp: { max: 0, cur: 0 } },                         // sem máximo
    { hp: { max: MAX_COUNTER + 1, cur: 1 } },
    { hp: { max: '10', cur: 1 } }, { hp: { max: 10 } }, { hp: { max: 10.5, cur: 1 } }, { hp: null }, { hp: 5 },
    { 'H P': { max: 1, cur: 1 } }, { __proto__x: { max: 1, cur: 1 } },
    Object.fromEntries(Array.from({ length: MAX_COUNTERS + 1 }, (_, i) => [`c${i}`, { max: 1, cur: 1 }]))
  ]) assert.equal(readCounters(bad), null, JSON.stringify(bad));
});

test('regras da mesa: sem escolha, os contadores não são mostrados aos outros', () => {
  assert.deepEqual(cleanRules({ counters: 'all' }), { counters: 'all' });
  assert.deepEqual(cleanRules({ counters: 'guardian' }), { counters: 'guardian' });
  for (const other of [undefined, null, {}, { counters: 'todos' }, 'all']) assert.deepEqual(cleanRules(other), { counters: 'guardian' });
});

test('quem vê os contadores de um jogador', () => {
  const closed = { counters: 'guardian' }, open = { counters: 'all' };
  assert.ok(seesCounters('j1', 'j1', closed));      // o próprio
  assert.ok(seesCounters(GUARDIAN, 'j1', closed));  // o Guardião
  assert.ok(!seesCounters('j2', 'j1', closed));     // os outros, só se a regra deixar
  assert.ok(seesCounters('j2', 'j1', open));
  const row = { seat: 'j1', device: 'f', name: 'Ana', role: 'player', ord: 1, counters: '{"hp":{"max":11,"cur":9}}' };
  assert.deepEqual(publicSeat(row, true, true).counters, { hp: { max: 11, cur: 9 } });
  assert.ok(!('counters' in publicSeat(row, true, false)));                  // para quem não pode ver, o campo nem existe
  assert.ok(!('counters' in publicSeat({ ...row, counters: null }, true, true)));
});

test('versão do app: a mais nova da mesa e quem ficou para trás', () => {
  assert.equal(cleanVersion('1.2'), '1.2');
  assert.equal(cleanVersion('1.10'), '1.10');
  assert.equal(cleanVersion(undefined), '0.0');    // app antigo, que não manda a versão
  assert.equal(cleanVersion('1.2.3'), '0.0');
  assert.equal(cleanVersion('v1.2'), '0.0');
  assert.ok(compareVersions('1.10', '1.9') > 0);   // número, e não letra
  assert.ok(compareVersions('2.0', '1.12') > 0);
  assert.ok(compareVersions('0.0', '1.2') < 0);
  assert.equal(compareVersions('1.2', '1.2'), 0);
  assert.equal(newest(['1.2', '1.10', '0.0', '1.9']), '1.10');
  assert.equal(newest([]), '0.0');
});
