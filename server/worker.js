import { DurableObject } from 'cloudflare:workers';
import {
  PROTOCOL, GUARDIAN, HISTORY, REMOVED,
  newCode, cleanCode, cleanName, cleanVersion, compareVersions, newest, cleanRules,
  validDevice, digest, readRoll, seenBy, readCounters, seesCounters, nextSeat, publicSeat, isPlayerSeat
} from './room.js';

// Servidor da mesa compartilhada, no Cloudflare. Cada sala é um Durable Object: um pequeno programa
// com memória própria, que recebe as rolagens, entrega a cada pessoa só o que ela pode ver e se
// apaga sozinho depois de algumas horas sem uso. Quem vê o quê é decidido em room.js.
//
// Como o app conversa com ele:
// - POST /rooms, com { protocol, device, name, rules }: cria uma sala e devolve { code }. Quem cria
//   é o Guardião.
// - /rooms/<código>: a conexão ao vivo (WebSocket). A primeira mensagem do app é
//   { type: 'hello', protocol, device, name, app, join? }, e a resposta é a sala ({ type: 'room' }).
//   join: true quando a pessoa entrou de propósito, pela folha com o código (e não o app voltando
//   sozinho). Depois chegam 'members', 'roll', 'counters', 'outdated' (o app ficou para trás),
//   'removed' (o Guardião tirou este lugar da mesa), 'error' e 'ended'; o app manda 'roll', o
//   jogador manda 'counters' (os dele) e o Guardião manda 'remove' ({ seat }) e 'end'.

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    // pelo navegador, só o app (e, na mesa de teste, o computador de testes) usa a mesa
    if (origin && !allowed(origin, env.ORIGINS)) return new Response('Origem não permitida\n', { status: 403 });
    const cors = origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};

    if (url.pathname === '/rooms' && request.method === 'POST') return createRoom(request, env, cors);
    if (url.pathname === '/rooms' && request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: { ...cors, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' }
      });
    }
    const code = cleanCode(url.pathname.match(/^\/rooms\/([^/]+)$/)?.[1]);
    if (code && request.headers.get('Upgrade') === 'websocket') return env.ROOMS.get(env.ROOMS.idFromName(code)).fetch(request);
    if (url.pathname === '/') return new Response(`Mesa de Arkham (${env.PLACE})\n`, { headers: { ...cors, 'Content-Type': 'text/plain; charset=utf-8' } });
    return new Response('Não encontrado\n', { status: 404, headers: cors });
  }
};

// A origem está na lista? Uma regra como 'http://localhost:*' vale para qualquer porta.
function allowed(origin, list = '') {
  return list.split(',').map(rule => rule.trim()).filter(Boolean).some(rule => rule.endsWith(':*')
    ? origin.startsWith(rule.slice(0, -1)) && /^\d+$/.test(origin.slice(rule.length - 1))
    : origin === rule);
}

async function createRoom(request, env, cors) {
  const reply = (body, status) => Response.json(body, { status, headers: cors });
  if (Number(request.headers.get('Content-Length')) > 2048) return reply({ error: 'invalid' }, 413);
  let body = null;
  try { body = JSON.parse(await request.text()); } catch (e) {}
  if (body?.protocol !== PROTOCOL) return reply({ error: 'version' }, 409);
  if (!validDevice(body.device)) return reply({ error: 'invalid' }, 400);
  const device = await digest(body.device), name = cleanName(body.name), rules = cleanRules(body.rules);
  // um código sorteado que já esteja em uso (muito raro) é trocado por outro
  for (let tries = 0; tries < 5; tries++) {
    const code = newCode();
    if (await env.ROOMS.get(env.ROOMS.idFromName(code)).create(code, device, name, rules)) return reply({ code }, 201);
  }
  return reply({ error: 'busy' }, 503);
}

// Uma rolagem como fica guardada (body: o que o app mandou, já conferido) e como viaja.
const fromRow = r => ({ ...JSON.parse(r.body), id: r.id, seq: r.seq, seat: r.seat, at: r.at, vis: r.vis });

export class Room extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.idle = (Number(env.IDLE_SECONDS) || 6 * 3600) * 1000;
    // o "ping" do app é respondido sem acordar a sala: mantém a conexão viva sem gastar nada
    ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  // A sala existe se foi criada e ainda não se apagou. Um código errado não deixa rastro: a sala
  // que não existe não guarda nada.
  exists() {
    return this.sql.exec("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'room'").toArray().length > 0;
  }

  // Cria a sala, com o Guardião no lugar dele. false se o código já estiver em uso.
  async create(code, device, name, rules) {
    if (this.exists()) return false;
    const now = Date.now();
    this.ctx.storage.transactionSync(() => {
      this.sql.exec('CREATE TABLE room (code TEXT NOT NULL, created INTEGER NOT NULL, last INTEGER NOT NULL, rules TEXT NOT NULL)');
      this.sql.exec('CREATE TABLE seats (seat TEXT PRIMARY KEY, device TEXT NOT NULL UNIQUE, name TEXT NOT NULL, role TEXT NOT NULL, ord INTEGER NOT NULL, counters TEXT)');
      this.sql.exec('CREATE TABLE rolls (seq INTEGER PRIMARY KEY, id TEXT NOT NULL UNIQUE, seat TEXT NOT NULL, at INTEGER NOT NULL, vis TEXT NOT NULL, body TEXT NOT NULL)');
      this.sql.exec('INSERT INTO room VALUES (?, ?, ?, ?)', code, now, now, JSON.stringify(rules));
      this.sql.exec("INSERT INTO seats (seat, device, name, role, ord) VALUES (?, ?, ?, 'guardian', 0)", GUARDIAN, device, name);
    });
    await this.ctx.storage.setAlarm(now + this.idle);
    return true;
  }

  // A conexão ao vivo de um aparelho. Numa sala que não existe, só avisa e desliga.
  async fetch() {
    const [client, server] = Object.values(new WebSocketPair());
    if (this.exists()) {
      this.ctx.acceptWebSocket(server);
    } else {
      server.accept();
      server.send(JSON.stringify({ type: 'error', error: 'room-not-found' }));
      server.close(4000, 'room-not-found');
    }
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws, data) {
    let msg = null;
    try { if (typeof data === 'string' && data.length <= 4096) msg = JSON.parse(data); } catch (e) {}
    if (!msg || typeof msg !== 'object') return this.send(ws, { type: 'error', error: 'invalid' });
    if (!this.exists()) return this.refuse(ws, 'room-not-found');
    const seat = ws.deserializeAttachment()?.seat;
    if (!seat) return msg.type === 'hello' ? this.hello(ws, msg) : this.refuse(ws, 'invalid');
    // um lugar que o Guardião tirou não manda mais nada, nem por uma conexão que ainda não fechou
    if (this.sql.exec('SELECT role FROM seats WHERE seat = ?', seat).toArray()[0]?.role !== (seat === GUARDIAN ? 'guardian' : 'player')) {
      return this.refuse(ws, 'removed');
    }
    if (msg.type === 'roll') return this.roll(ws, seat, msg);
    if (msg.type === 'counters') return this.counters(ws, seat, msg);
    if (msg.type === 'remove') return seat === GUARDIAN ? this.remove(ws, msg.seat) : this.send(ws, { type: 'error', error: 'guardian-only' });
    if (msg.type === 'end') return seat === GUARDIAN ? this.end('guardian') : this.send(ws, { type: 'error', error: 'guardian-only' });
    this.send(ws, { type: 'error', error: 'invalid' });
  }

  // Chegada (ou volta) de um aparelho. O mesmo aparelho volta sempre para o mesmo lugar; um
  // aparelho novo senta no próximo lugar de jogador livre. O aparelho de um lugar que o Guardião
  // tirou só entra de novo de propósito, pelo código (join): voltando sozinho, é recusado.
  async hello(ws, msg) {
    if (msg.protocol !== PROTOCOL) return this.refuse(ws, 'version');
    if (!validDevice(msg.device)) return this.refuse(ws, 'invalid');
    const device = await digest(msg.device), name = cleanName(msg.name);
    if (!this.exists()) return this.refuse(ws, 'room-not-found');   // apagada enquanto o resumo era feito
    let me = this.sql.exec('SELECT * FROM seats WHERE device = ?', device).toArray()[0];
    if (me?.role === REMOVED) {
      if (msg.join !== true) return this.refuse(ws, 'removed');
      if (!name) return this.refuse(ws, 'name');
      // sem vaga, o aparelho continua marcado como tirado (e não volta sozinho quando abrir uma)
      if (!nextSeat(this.seats())) return this.refuse(ws, 'room-full');
      // entrou de novo pelo código: o lugar antigo fica só no histórico, e ele senta num lugar novo
      this.sql.exec('UPDATE seats SET device = ? WHERE seat = ?', `${REMOVED}:${me.seat}`, me.seat);
      me = null;
    }
    if (!me) {
      if (!name) return this.refuse(ws, 'name');
      const seats = this.seats(), seat = nextSeat(seats);
      if (!seat) return this.refuse(ws, 'room-full');
      me = { seat, name, role: 'player', ord: seats.length };
      this.sql.exec('INSERT INTO seats (seat, device, name, role, ord) VALUES (?, ?, ?, ?, ?)', seat, device, name, me.role, me.ord);
    } else if (name && name !== me.name) {
      this.sql.exec('UPDATE seats SET name = ? WHERE seat = ?', name, me.seat);
    }
    ws.serializeAttachment({ seat: me.seat, app: cleanVersion(msg.app) });
    await this.touch();
    const { code } = this.sql.exec('SELECT code FROM room').one();
    this.send(ws, { type: 'room', protocol: PROTOCOL, code, you: me.seat, rules: this.rules(), members: this.members(me.seat), rolls: this.history(me.seat) });
    this.announceMembers({ skip: ws });
    this.checkVersions();
  }

  // Quem está com o app mais velho que o mais novo da mesa recebe o aviso para atualizar.
  checkVersions() {
    const all = this.connections(), top = newest(all.map(c => c.app));
    for (const c of all) if (compareVersions(c.app, top) < 0) this.send(c.ws, { type: 'outdated', newest: top });
  }

  // Uma rolagem nova: guardada e entregue a cada conexão do jeito que aquele lugar pode ver. Quem
  // rolou recebe a dela inteira de volta, como confirmação.
  async roll(ws, seat, msg) {
    const { roll, error } = readRoll(msg, seat === GUARDIAN);
    if (error) return this.send(ws, { type: 'error', error, id: typeof msg.id === 'string' ? msg.id.slice(0, 40) : null });
    const old = this.sql.exec('SELECT * FROM rolls WHERE id = ?', roll.id).toArray()[0];
    if (old) return this.send(ws, { type: 'roll', roll: seenBy(fromRow(old), seat) });   // a mesma rolagem, mandada de novo depois de uma queda
    const { id, vis, ...body } = roll, at = Date.now();
    const { seq } = this.sql.exec('INSERT INTO rolls (id, seat, at, vis, body) VALUES (?, ?, ?, ?, ?) RETURNING seq',
      id, seat, at, vis, JSON.stringify(body)).one();
    await this.touch(at);
    const saved = { ...body, id, seq, seat, at, vis };
    for (const c of this.connections()) this.send(c.ws, { type: 'roll', roll: seenBy(saved, c.seat) });
  }

  // Os contadores de um jogador (PV, Sanidade…). Cada um só muda os seus: a mensagem não diz de quem
  // são, vale o lugar da conexão. O Guardião não tem contadores. Eles vão só para quem pode ver, e o
  // app manda os dele a cada volta à mesa: se nada mudou, ninguém é avisado.
  async counters(ws, seat, msg) {
    if (seat === GUARDIAN) return this.send(ws, { type: 'error', error: 'players-only' });
    const counters = readCounters(msg.counters);
    if (!counters) return this.send(ws, { type: 'error', error: 'invalid' });
    const body = Object.keys(counters).length ? JSON.stringify(counters) : null;
    if (this.sql.exec('SELECT counters FROM seats WHERE seat = ?', seat).one().counters === body) return;
    this.sql.exec('UPDATE seats SET counters = ? WHERE seat = ?', body, seat);
    await this.touch();
    const rules = this.rules();
    for (const c of this.connections()) {
      if (c.ws !== ws && seesCounters(c.seat, seat, rules)) this.send(c.ws, { type: 'counters', seat, counters });
    }
  }

  // O Guardião tira um jogador da mesa (um lugar ocupado por engano, ou de quem trocou de aparelho).
  // Só o Guardião pode (quem chama já foi conferido). O lugar fica na lista só com o nome, para o
  // histórico; os valores dele saem. As conexões daquele lugar são avisadas e desligadas, e a
  // pessoa só volta entrando de novo pelo código, num lugar novo, se houver vaga.
  async remove(ws, target) {
    const row = isPlayerSeat(target) && this.sql.exec("SELECT seat FROM seats WHERE seat = ? AND role = 'player'", target).toArray()[0];
    if (!row) return this.send(ws, { type: 'error', error: 'invalid' });
    this.sql.exec('UPDATE seats SET role = ?, counters = NULL WHERE seat = ?', REMOVED, target);
    await this.touch();
    const gone = this.connections().filter(c => c.seat === target).map(c => c.ws);
    for (const socket of gone) {
      this.send(socket, { type: 'removed' });
      try { socket.close(4000, 'removed'); } catch (e) {}
    }
    this.announceMembers({ gone });
  }

  // O Guardião encerrou a sessão, ou a sala ficou tempo demais sem uso: avisa quem está nela,
  // desliga todas as conexões e apaga tudo o que a sala guardava.
  async end(reason) {
    for (const ws of this.ctx.getWebSockets()) {
      this.send(ws, { type: 'ended', reason });
      try { ws.close(4000, reason); } catch (e) {}
    }
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
  }

  // O despertador da sala: passadas as horas sem uso, ela se apaga.
  async alarm() {
    if (!this.exists()) return;
    const { last } = this.sql.exec('SELECT last FROM room').one();
    if (Date.now() - last >= this.idle) await this.end('idle');
    else await this.ctx.storage.setAlarm(last + this.idle);
  }

  // Mais um uso (alguém chegou, rolou ou mudou um contador): a contagem das horas sem uso começa de novo.
  async touch(now = Date.now()) {
    this.sql.exec('UPDATE room SET last = ?', now);
    await this.ctx.storage.setAlarm(now + this.idle);
  }

  async webSocketClose(ws) {
    try { ws.close(1000); } catch (e) {}
    this.left(ws);
  }

  async webSocketError(ws) {
    this.left(ws);
  }

  // Uma conexão caiu: os outros ficam sabendo se aquele lugar ficou sem ninguém.
  left(ws) {
    if (ws.deserializeAttachment()?.seat && this.exists()) this.announceMembers({ gone: ws });
  }

  seats() {
    return this.sql.exec('SELECT * FROM seats ORDER BY ord').toArray();
  }

  rules() {
    return cleanRules(JSON.parse(this.sql.exec('SELECT * FROM room').one().rules || '{}'));
  }

  // As últimas rolagens, do jeito que esse lugar pode ver.
  history(seat) {
    return this.sql.exec('SELECT * FROM (SELECT * FROM rolls ORDER BY seq DESC LIMIT ?) ORDER BY seq', HISTORY)
      .toArray().map(r => seenBy(fromRow(r), seat));
  }

  // As conexões abertas que já disseram de que lugar são (menos `gone`: a que está caindo, ou a lista
  // das que estão sendo desligadas), com a versão do app de cada uma.
  connections(gone) {
    const skip = new Set([gone].flat());
    return this.ctx.getWebSockets().flatMap(ws => {
      const me = !skip.has(ws) && ws.readyState === 1 && ws.deserializeAttachment();
      return me?.seat ? [{ ws, seat: me.seat, app: me.app || '0.0' }] : [];
    });
  }

  // Quem está na mesa, do jeito que esse lugar pode ver.
  members(viewer, gone) {
    const online = new Set(this.connections(gone).map(c => c.seat)), rules = this.rules();
    return this.seats().map(s => publicSeat(s, online.has(s.seat), seesCounters(viewer, s.seat, rules)));
  }

  // Manda a lista de quem está na mesa para todos (menos `skip`, que já recebeu a sala inteira).
  announceMembers({ skip, gone } = {}) {
    for (const c of this.connections(gone)) if (c.ws !== skip) this.send(c.ws, { type: 'members', members: this.members(c.seat, gone) });
  }

  send(ws, msg) {
    try { ws.send(JSON.stringify(msg)); } catch (e) {}
  }

  // Recusa a conexão: diz o motivo e desliga.
  refuse(ws, error) {
    this.send(ws, { type: 'error', error });
    try { ws.close(4000, error); } catch (e) {}
  }
}
