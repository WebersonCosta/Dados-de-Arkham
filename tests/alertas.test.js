// Testes dos alertas do Guardião, sem navegador: node --test tests/
// O agrupamento das mudanças (src/core/counter-watch.js) e as regras de Call of Cthulhu que viram
// alerta (alerts, em src/themes/arkham/rules.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCounterWatch, QUIET } from '../src/core/counter-watch.js';
import { alerts } from '../src/themes/arkham/rules.js';

// Um relógio de mentira: o tempo só anda quando o teste manda.
function fakeClock() {
  let now = 0, next = 1;
  const timers = new Map();
  return {
    setTimeout(fn, ms) { timers.set(next, { fn, at: now + ms }); return next++; },
    clearTimeout(id) { timers.delete(id); },
    advance(ms) {
      now += ms;
      for (const [id, t] of [...timers].sort((a, b) => a[1].at - b[1].at)) {
        if (t.at <= now && timers.has(id)) { timers.delete(id); t.fn(); }
      }
    }
  };
}

// Uma mesa de mentira: os valores de Ana (j1) chegando como o Guardião recebe.
function table() {
  const clock = fakeClock(), changes = [], state = {}, memory = {};
  const watch = createCounterWatch({ ids: ['hp', 'san'], state, clock, onChange: c => changes.push({ ...c, lines: alerts(c, memory) }) });
  let hp = { max: 12, cur: 12 }, san = { max: 60, cur: 55 };
  const send = () => watch.see('j1', { hp: { ...hp }, san: { ...san } });
  send();
  return {
    clock, changes, state, memory,
    san(delta, wait = 300) { san = { ...san, cur: Math.max(0, Math.min(san.max, san.cur + delta)) }; send(); clock.advance(wait); },
    hp(delta, wait = 300) { hp = { ...hp, cur: Math.max(0, Math.min(hp.max, hp.cur + delta)) }; send(); clock.advance(wait); },
    setMax(id, max) {
      if (id === 'san') san = { max, cur: san.cur === san.max ? max : Math.min(san.cur, max) };
      else hp = { max, cur: hp.cur === hp.max ? max : Math.min(hp.cur, max) };
      send();
    },
    settle() { clock.advance(QUIET + 1); }
  };
}

test('cinco toques seguidos no − contam como uma perda só', () => {
  const t = table();
  for (let i = 0; i < 5; i++) t.san(-1);
  assert.equal(t.changes.length, 0);   // ainda ajustando: nada antes do tempo
  t.settle();
  assert.equal(t.changes.length, 1);
  assert.deepEqual([t.changes[0].from.cur, t.changes[0].to.cur], [55, 50]);
  assert.match(t.changes[0].lines.join(' '), /teste de INT/);
});

test('errou e corrigiu no mesmo ajuste: vale só o resultado', () => {
  const t = table();
  for (let i = 0; i < 6; i++) t.san(-1);
  t.san(+1);
  t.settle();
  assert.equal(t.changes.length, 1);
  assert.equal(t.changes[0].from.cur - t.changes[0].to.cur, 5);
  // e quem desfaz tudo não gera mudança nenhuma
  const u = table();
  u.san(-2);
  u.san(+2);
  u.settle();
  assert.equal(u.changes.length, 0);
});

test('uma pausa maior que o tempo divide em duas perdas', () => {
  const t = table();
  for (let i = 0; i < 3; i++) t.san(-1);
  t.settle();
  for (let i = 0; i < 2; i++) t.san(-1);
  t.settle();
  assert.equal(t.changes.length, 2);
  assert.ok(t.changes.every(c => !c.lines.join(' ').includes('teste de INT')));
});

test('mexer no máximo (acertar a ficha) não é perda', () => {
  const t = table();
  t.setMax('san', 50);   // 55 de 60 vira 50 de 50
  t.settle();
  assert.equal(t.changes.length, 1);
  assert.deepEqual(t.changes[0].lines, []);
  // e o maior valor da sessão recomeça do valor novo: perder 9 de 50 ainda não é um quinto (10)
  t.san(-9);
  t.settle();
  assert.ok(!t.changes.at(-1).lines.join(' ').includes('um quinto'));
});

test('um quinto da SAN na sessão, somando perdas separadas, avisa uma vez só', () => {
  const t = table();   // SAN 55: um quinto é 11
  for (const loss of [4, 4]) { t.san(-loss); t.settle(); }
  assert.ok(t.changes.every(c => !c.lines.length));
  t.san(-3);
  t.settle();
  assert.match(t.changes.at(-1).lines.join(' '), /Já perdeu 11 de SAN nesta sessão \(tinha 55\)/);
  t.san(-2);
  t.settle();
  assert.deepEqual(t.changes.at(-1).lines, []);
});

test('SAN zero: insanidade permanente, sem os outros lembretes', () => {
  const t = table();
  t.san(-55);
  t.settle();
  assert.deepEqual(t.changes[0].lines, ['Chegou a 0 de SAN: insanidade permanente. O investigador deixa de ser um personagem jogável.']);
});

test('ferimento grave: metade do PV máximo de uma vez, arredondando para baixo', () => {
  const t = table();   // PV 12: metade é 6
  t.hp(-5);
  t.settle();
  assert.deepEqual(t.changes[0].lines, []);
  t.hp(-6);
  t.settle();
  assert.match(t.changes[1].lines.join(' '), /ferimento grave/);
  assert.equal(t.memory.wounded, true);   // fica anotado: chegar a 0 PV depois é "morrendo"
  // PV máximo 11: metade é 5,5, que vira 5
  assert.match(alerts({ id: 'hp', from: { max: 11, cur: 11 }, to: { max: 11, cur: 6 }, top: 11 }, {}).join(' '), /ferimento grave/);
  assert.deepEqual(alerts({ id: 'hp', from: { max: 11, cur: 11 }, to: { max: 11, cur: 7 }, top: 11 }, {}), []);
});

test('PV zero: inconsciente sem ferimento grave; morrendo com um, desta vez ou de antes', () => {
  const zero = (from, memory = {}) => alerts({ id: 'hp', from: { max: 12, cur: from }, to: { max: 12, cur: 0 }, top: 12 }, memory).join(' ');
  assert.match(zero(3), /fica inconsciente/);
  assert.match(zero(3, { wounded: true }), /está morrendo/);
  assert.match(zero(12), /está morrendo/);                   // esta perda já é um ferimento grave
  assert.match(zero(3), /a morte é na hora/);                // o app não vê dano abaixo de zero: lembra a regra
  const t = table();
  t.hp(-12);
  t.settle();
  assert.equal(t.changes[0].lines.length, 2);                // um alerta só: morrendo (e não ferimento grave e morrendo)
});

test('ganhar valor, ou o primeiro valor visto, não avisa nada', () => {
  assert.deepEqual(alerts({ id: 'san', from: { max: 60, cur: 40 }, to: { max: 60, cur: 45 }, top: 55 }, {}), []);
  assert.deepEqual(alerts({ id: 'luck', from: { max: 99, cur: 60 }, to: { max: 99, cur: 30 }, top: 60 }, {}), []);
  const t = table();
  t.settle();
  assert.equal(t.changes.length, 0);
});

test('o app aberto de novo no meio de um ajuste continua a mesma perda', () => {
  const clock = fakeClock(), state = {}, changes = [];
  let watch = createCounterWatch({ ids: ['san'], state, clock, onChange: c => changes.push(c) });
  watch.see('j1', { san: { max: 60, cur: 55 } });
  watch.see('j1', { san: { max: 60, cur: 52 } });
  watch.stop();   // a página recarrega: só o que foi guardado (state) continua
  const saved = JSON.parse(JSON.stringify(state));
  watch = createCounterWatch({ ids: ['san'], state: saved, clock, onChange: c => changes.push(c) });
  watch.see('j1', { san: { max: 60, cur: 49 } });
  clock.advance(QUIET + 1);
  assert.equal(changes.length, 1);
  assert.deepEqual([changes[0].from.cur, changes[0].to.cur], [55, 49]);
});
