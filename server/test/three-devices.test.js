// Teste da proteção com aparelhos simulados conversando com um servidor da mesa de verdade: o
// Guardião, Ana e Bento (e mais quatro jogadores, para encher a mesa). Tudo o que cada aparelho
// recebe fica registrado como chegou, e o teste falha se aparecer algo que ele não podia ver.
//
// Com o simulador local ligado (npm run local, em outra janela):
//   MESA_URL=http://localhost:8787 npm run test:mesa
// Ou contra a mesa de teste publicada: MESA_URL=https://mesa-arkham-teste.mesa-arkham.workers.dev
// O teste da sala que se apaga sozinha só roda com MESA_INATIVIDADE (os segundos sem uso
// configurados no servidor, como em "npm run local -- --var IDLE_SECONDS:3").
import { test } from 'node:test';
import assert from 'node:assert/strict';

const BASE = process.env.MESA_URL?.replace(/\/$/, '');
const IDLE = Number(process.env.MESA_INATIVIDADE) || 0;
const ORIGIN = 'http://localhost:8766';   // como se fosse o app aberto no computador
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const newDevice = () => Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('base64url');
let counter = 0;
const newId = () => `teste${Date.now().toString(36)}x${(counter++).toString(36)}`;

async function createRoom(device, rules) {
  const res = await fetch(`${BASE}/rooms`, {
    method: 'POST', headers: { Origin: ORIGIN }, body: JSON.stringify({ protocol: 1, device, name: 'Guardião', rules })
  });
  assert.equal(res.status, 201);
  return (await res.json()).code;
}

// Um aparelho na sala (app: a versão do app dele). `raw` guarda o texto de cada mensagem exatamente
// como chegou.
const devices = [];
function join(code, device, name, app) {
  return new Promise(resolve => {
    const ws = new WebSocket(`${BASE.replace(/^http/, 'ws')}/rooms/${code}`, { headers: { Origin: ORIGIN } });
    const me = { name, device, ws, raw: [], messages: [] };
    devices.push(me);
    ws.onopen = () => ws.send(JSON.stringify({ type: 'hello', protocol: 1, device, name, app }));
    ws.onmessage = ev => {
      me.raw.push(ev.data);
      const msg = JSON.parse(ev.data);
      me.messages.push(msg);
      if (msg.type === 'room') { me.room = msg; resolve(me); }
      if (msg.type === 'error' && !me.room) { me.error = msg.error; resolve(me); }
    };
    ws.onclose = () => resolve(me);
  });
}

// Espera uma mensagem que o aparelho recebeu (ou ainda vai receber).
async function until(me, match, ms = 4000) {
  for (const end = Date.now() + ms; Date.now() < end; await wait(15)) {
    const msg = me.messages.find(match);
    if (msg) return msg;
  }
  throw new Error(`${me.name} não recebeu a mensagem esperada`);
}
const rollOf = id => msg => msg.type === 'roll' && msg.roll.id === id;
const SUSPENSE = ['at', 'id', 'seat', 'seq', 'vis'];
const send = (me, msg) => me.ws.send(JSON.stringify(msg));

test('a mesa só entrega a cada um o que ele pode ver', { skip: !BASE && 'defina MESA_URL' }, async t => {
  try {
    const keys = { g: newDevice(), a: newDevice(), b: newDevice() };
    const code = await createRoom(keys.g);
    const g = await join(code, keys.g, 'Guardião');
    const a = await join(code, keys.a, 'Ana');
    const b = await join(code, keys.b, 'Bento');
    assert.deepEqual([g.room.you, a.room.you, b.room.you], ['g', 'j1', 'j2']);
    await until(g, msg => msg.type === 'members' && msg.members.length === 3 && msg.members.every(m => m.online));

    await t.test('aberta: todos veem tudo', async () => {
      const id = newId();
      send(a, { type: 'roll', id, vis: 'open', set: '2d6+6', name: '2d6 + 6', total: 14, text: '14', detail: '5 + 3 + 6 = 14', label: 'Dano' });
      for (const me of [g, a, b]) {
        const { roll } = await until(me, rollOf(id));
        assert.equal(roll.total, 14);
        assert.equal(roll.label, 'Dano');
        assert.equal(roll.seat, 'j1');
      }
    });

    await t.test('privada: só quem rolou e o Guardião', async () => {
      const id = newId();
      send(a, { type: 'roll', id, vis: 'private', set: 'd100', name: 'd100', total: 37, text: '37', detail: '30 + 7', label: 'Furtividade SEGREDO-ANA' });
      for (const me of [g, a]) assert.equal((await until(me, rollOf(id))).roll.total, 37);
      const { roll } = await until(b, rollOf(id));
      assert.deepEqual(Object.keys(roll).sort(), SUSPENSE);
      assert.equal(roll.seat, 'j1');
    });

    await t.test('secreta do Guardião: só ele', async () => {
      const id = newId();
      send(g, { type: 'roll', id, vis: 'secret', set: 'd100', name: 'd100', total: 88, text: '88', detail: '80 + 8', label: 'Psicologia SEGREDO-GUARDIAO' });
      assert.equal((await until(g, rollOf(id))).roll.total, 88);
      for (const me of [a, b]) {
        const { roll } = await until(me, rollOf(id));
        assert.deepEqual(Object.keys(roll).sort(), SUSPENSE);
        assert.equal(roll.seat, 'g');
      }
    });

    await t.test('jogador não consegue rolar secreta, e nada chega aos outros', async () => {
      const id = newId();
      send(b, { type: 'roll', id, vis: 'secret', set: '1d20', total: 12, text: '12', label: 'SEGREDO-BENTO' });
      assert.equal((await until(b, msg => msg.type === 'error' && msg.id === id)).error, 'guardian-only');
      await wait(300);
      for (const me of [g, a, b]) assert.ok(!me.messages.some(rollOf(id)));
    });

    await t.test('número impossível é recusado', async () => {
      const id = newId();
      send(a, { type: 'roll', id, vis: 'open', set: '3d6', total: 25, text: '25' });
      assert.equal((await until(a, msg => msg.type === 'error' && msg.id === id)).error, 'impossible');
    });

    await t.test('a mesma rolagem mandada duas vezes conta uma vez só', async () => {
      const id = newId(), roll = { type: 'roll', id, vis: 'open', set: '1d4', total: 3, text: '3' };
      send(a, roll);
      await until(g, rollOf(id));
      send(a, roll);
      await wait(300);
      assert.equal(g.messages.filter(rollOf(id)).length, 1);
    });

    await t.test('quem volta senta no mesmo lugar e recebe o histórico filtrado', async () => {
      const b2 = await join(code, keys.b, 'Bento');
      assert.equal(b2.room.you, 'j2');
      const [open, priv, secret] = b2.room.rolls;
      assert.equal(open.total, 14);
      assert.deepEqual(Object.keys(priv).sort(), SUSPENSE);
      assert.deepEqual(Object.keys(secret).sort(), SUSPENSE);
      const a2 = await join(code, keys.a, 'Ana');
      assert.equal(a2.room.you, 'j1');
      assert.equal(a2.room.rolls[1].total, 37);                         // a privada dela
      assert.deepEqual(Object.keys(a2.room.rolls[2]).sort(), SUSPENSE); // a secreta do Guardião
      const g2 = await join(code, keys.g, 'Guardião');
      assert.equal(g2.room.you, 'g');
      assert.ok(g2.room.rolls.every(r => Number.isInteger(r.total)));   // o Guardião vê tudo
    });

    const full = [];
    await t.test('a mesa tem 6 lugares de jogador', async () => {
      for (const [i, name] of ['Carla', 'Davi', 'Elisa', 'Fábio'].entries()) {
        const me = await join(code, newDevice(), name);
        assert.equal(me.room.you, `j${i + 3}`);
        full.push(me);
      }
      assert.equal((await join(code, newDevice(), 'Gustavo')).error, 'room-full');
    });

    await t.test('a mesa cheia rola ao mesmo tempo e cada rolagem chega uma vez a cada um', async () => {
      const ids = [g, a, b, ...full].map(me => {
        const id = newId();
        send(me, { type: 'roll', id, vis: 'open', set: '1d20', total: 7, text: '7', label: 'Iniciativa' });
        return id;
      });
      for (const me of [g, a, b, ...full]) {
        for (const id of ids) await until(me, rollOf(id));
      }
      await wait(300);
      for (const me of [g, a, b, ...full]) {
        for (const id of ids) assert.equal(me.messages.filter(rollOf(id)).length, 1, `${me.name} recebeu uma rolagem repetida`);
      }
    });

    await t.test('ninguém recebeu o que não podia ver', () => {
      const seen = name => devices.filter(d => d.name === name).flatMap(d => d.raw).join('\n');
      for (const name of ['Bento', 'Carla', 'Davi', 'Elisa', 'Fábio', 'Gustavo']) {
        assert.ok(!seen(name).includes('SEGREDO-ANA'), `${name} viu a privada de Ana`);
        assert.ok(!seen(name).includes('SEGREDO-GUARDIAO'), `${name} viu a secreta do Guardião`);
      }
      assert.ok(!seen('Ana').includes('SEGREDO-GUARDIAO'), 'Ana viu a secreta do Guardião');
      assert.ok(seen('Guardião').includes('SEGREDO-ANA') && seen('Guardião').includes('SEGREDO-GUARDIAO'));
      assert.ok(devices.flatMap(d => d.raw).every(text => !text.includes('SEGREDO-BENTO')));
      // a chave de um aparelho nunca volta, nem para ele mesmo
      const everything = devices.flatMap(d => d.raw).join('\n');
      for (const key of [...Object.values(keys), ...devices.map(d => d.device)]) assert.ok(!everything.includes(key));
      assert.ok(!everything.includes('"device"'));
    });

    await t.test('o Guardião encerra a sessão e a sala se apaga', async () => {
      send(g, { type: 'end' });
      for (const me of [g, a, b]) assert.equal((await until(me, msg => msg.type === 'ended')).reason, 'guardian');
      assert.equal((await join(code, keys.a, 'Ana')).error, 'room-not-found');
    });
  } finally {
    for (const d of devices) d.ws.close();
  }
});

test('quem está com o app mais velho que o de alguém na mesa recebe o aviso', { skip: !BASE && 'defina MESA_URL' }, async () => {
  const keys = { g: newDevice(), a: newDevice(), b: newDevice() };
  const code = await createRoom(keys.g);
  const g = await join(code, keys.g, 'Guardião', '1.2');
  const a = await join(code, keys.a, 'Ana', '1.1');
  try {
    assert.equal((await until(a, msg => msg.type === 'outdated')).newest, '1.2');
    const b = await join(code, keys.b, 'Bento', '1.10');   // 1.10 é mais nova que 1.2
    for (const me of [g, a]) await until(me, msg => msg.type === 'outdated' && msg.newest === '1.10');
    await wait(300);
    assert.ok(!b.messages.some(msg => msg.type === 'outdated'));
    assert.ok(!g.messages.some(msg => msg.type === 'outdated' && msg.newest === '1.2'));   // ninguém avisa da própria versão
    send(g, { type: 'end' });
    await until(b, msg => msg.type === 'ended');
  } finally {
    for (const d of devices) d.ws.close();
  }
});

// Os valores do investigador. Os números marcados (733, 777…) só existem nesses testes: se aparecerem
// no que chegou a alguém, aquele aparelho recebeu o que não podia.
const isCounters = seat => msg => msg.type === 'counters' && msg.seat === seat;
const memberOf = (list, seat) => list.find(m => m.seat === seat);

test('sem a escolha do Guardião, só ele e o próprio jogador recebem os valores', { skip: !BASE && 'defina MESA_URL' }, async t => {
  const keys = { g: newDevice(), a: newDevice(), b: newDevice() };
  const code = await createRoom(keys.g, { counters: 'guardian' });
  const g = await join(code, keys.g, 'Guardião');
  const a = await join(code, keys.a, 'Ana');
  const b = await join(code, keys.b, 'Bento');
  const secret = { hp: { max: 777, cur: 733 }, san: { max: 666, cur: 655 } };
  try {
    assert.deepEqual(a.room.rules, { counters: 'guardian' });

    await t.test('o Guardião vê em tempo real; o outro jogador não recebe nada', async () => {
      send(a, { type: 'counters', counters: secret });
      assert.deepEqual((await until(g, isCounters('j1'))).counters, secret);
      await wait(300);
      assert.ok(!b.messages.some(msg => msg.type === 'counters'));
      assert.ok(!a.messages.some(msg => msg.type === 'counters'));   // quem mandou não precisa de volta
    });

    await t.test('quem chega ou volta recebe a lista filtrada', async () => {
      const b2 = await join(code, keys.b, 'Bento');
      assert.ok(!('counters' in memberOf(b2.room.members, 'j1')));
      const a2 = await join(code, keys.a, 'Ana');
      assert.deepEqual(memberOf(a2.room.members, 'j1').counters, secret);   // os dele, sim
      const g2 = await join(code, keys.g, 'Guardião');
      assert.deepEqual(memberOf(g2.room.members, 'j1').counters, secret);
      const c = await join(code, newDevice(), 'Carla');
      assert.ok(!('counters' in memberOf(c.room.members, 'j1')));
      // a chegada dela avisa todos: cada um recebe a lista do jeito que pode ver
      const seen = await until(g, msg => msg.type === 'members' && msg.members.length === 4);
      assert.deepEqual(memberOf(seen.members, 'j1').counters, secret);
      const told = await until(b, msg => msg.type === 'members' && msg.members.length === 4);
      assert.ok(!('counters' in memberOf(told.members, 'j1')));
    });

    await t.test('cada um só muda os seus', async () => {
      const mine = { hp: { max: 12, cur: 11 } };
      send(b, { type: 'counters', seat: 'j1', counters: mine });   // dizendo ser Ana: vale o lugar da conexão
      assert.deepEqual((await until(g, isCounters('j2'))).counters, mine);
      assert.ok(!g.messages.some(msg => isCounters('j1')(msg) && msg.counters.hp.max === 12));
    });

    await t.test('o Guardião não tem valores nem muda os dos outros', async () => {
      send(g, { type: 'counters', seat: 'j1', counters: { hp: { max: 1, cur: 0 } } });
      assert.equal((await until(g, msg => msg.type === 'error')).error, 'players-only');
      await wait(300);
      assert.ok(!a.messages.some(msg => msg.type === 'counters'));
      const g2 = await join(code, keys.g, 'Guardião');
      assert.ok(!('counters' in memberOf(g2.room.members, 'g')));
      assert.deepEqual(memberOf(g2.room.members, 'j1').counters, secret);
    });

    await t.test('valores fora do formato são recusados, e os mesmos valores não avisam de novo', async () => {
      const told = g.messages.filter(isCounters('j1')).length;
      send(a, { type: 'counters', counters: { hp: { max: 5, cur: 9 } } });
      await until(a, msg => msg.type === 'error' && msg.error === 'invalid');
      send(a, { type: 'counters', counters: secret });
      await wait(400);
      assert.equal(g.messages.filter(isCounters('j1')).length, told);
    });

    await t.test('ninguém recebeu os números de Ana sem poder', () => {
      for (const d of devices.filter(d => ['Bento', 'Carla'].includes(d.name))) {
        for (const number of ['733', '777', '655', '666']) assert.ok(!d.raw.join('\n').includes(`:${number}`), `${d.name} recebeu ${number}`);
      }
    });
  } finally {
    send(g, { type: 'end' });
    await until(a, msg => msg.type === 'ended');
    for (const d of devices) d.ws.close();
  }
});

test('o Guardião deixou: todos recebem os valores de todos', { skip: !BASE && 'defina MESA_URL' }, async () => {
  const keys = { g: newDevice(), a: newDevice(), b: newDevice() };
  const code = await createRoom(keys.g, { counters: 'all' });
  const g = await join(code, keys.g, 'Guardião');
  const a = await join(code, keys.a, 'Ana');
  const b = await join(code, keys.b, 'Bento');
  try {
    assert.deepEqual(b.room.rules, { counters: 'all' });
    const values = { hp: { max: 11, cur: 9 } };
    send(a, { type: 'counters', counters: values });
    for (const me of [g, b]) assert.deepEqual((await until(me, isCounters('j1'))).counters, values);
    const late = await join(code, newDevice(), 'Carla');
    assert.deepEqual(memberOf(late.room.members, 'j1').counters, values);
    send(a, { type: 'counters', counters: {} });                         // apagou tudo: o campo some da lista
    await until(b, msg => isCounters('j1')(msg) && !msg.counters.hp);
    const again = await join(code, newDevice(), 'Davi');
    assert.ok(!('counters' in memberOf(again.room.members, 'j1')));
  } finally {
    send(g, { type: 'end' });
    await until(a, msg => msg.type === 'ended');
    for (const d of devices) d.ws.close();
  }
});

test('mesa criada sem a regra (app antigo): os valores ficam protegidos', { skip: !BASE && 'defina MESA_URL' }, async () => {
  const key = newDevice(), code = await createRoom(key);
  const g = await join(code, key, 'Guardião');
  try {
    assert.deepEqual(g.room.rules, { counters: 'guardian' });
    send(g, { type: 'end' });
    await until(g, msg => msg.type === 'ended');
  } finally {
    for (const d of devices) d.ws.close();
  }
});

test('a sala se apaga sozinha depois do tempo sem uso', { skip: !(BASE && IDLE) && 'defina MESA_URL e MESA_INATIVIDADE' }, async () => {
  const key = newDevice(), code = await createRoom(key);
  const g = await join(code, key, 'Guardião');
  assert.equal(g.room.you, 'g');
  assert.equal((await until(g, msg => msg.type === 'ended', (IDLE + 15) * 1000)).reason, 'idle');
  assert.equal((await join(code, key, 'Guardião')).error, 'room-not-found');
  for (const d of devices) d.ws.close();
});
