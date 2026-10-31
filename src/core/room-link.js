// A ligação do app com a mesa compartilhada (o servidor fica em server/): criar a mesa, entrar,
// manter a conexão viva e voltar sozinho quando ela cai. Não mexe na tela: conta o que aconteceu
// por onEvent ({ type: 'status' | 'room' | 'members' | 'roll' | 'error' | 'ended', ... }).

export const PROTOCOL = 1;      // o mesmo do servidor (server/room.js)
const PING_EVERY = 25000;       // um "ping" a cada 25 s mantém a conexão aberta nas redes de celular
const PONG_WAIT = 8000;         // sem "pong" nesse tempo, a conexão morreu sem avisar
const RETRY = [500, 1000, 2000, 4000, 8000, 15000];   // espera antes de cada nova tentativa
// recusas na entrada que não adianta tentar de novo
const FINAL = new Set(['room-not-found', 'room-full', 'version', 'name', 'invalid']);

// Bytes sorteados, em base64url (letras, números, - e _).
function randomKey(size) {
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Chave do aparelho: 32 bytes sorteados. Fica só no aparelho; o servidor guarda um resumo dela, que
// serve para reconhecer o aparelho quando ele volta.
export const newDevice = () => randomKey(32);

// Número de uma rolagem: com ele, a mesa reconhece a mesma rolagem mandada duas vezes.
export const newRollId = () => randomKey(16);

// Código da mesa: 6 letras e números, sem os que se confundem (as mesmas regras do servidor).
const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export function cleanCode(input) {
  const code = String(input ?? '').toUpperCase().replace(/[\s-]/g, '');
  return code.length === 6 && [...code].every(c => CODE_CHARS.includes(c)) ? code : null;
}
export const showCode = code => `${code.slice(0, 3)} ${code.slice(3)}`;   // "K7Q X3M": fácil de ditar

// Cria uma mesa; quem cria é o Guardião. Devolve o código, ou lança o motivo ('offline', 'version'…).
export async function createRoom(server, device, name) {
  let res;
  try {
    // corpo em texto simples: o navegador manda direto, sem consultar antes o outro endereço
    res = await fetch(`${server}/rooms`, { method: 'POST', body: JSON.stringify({ protocol: PROTOCOL, device, name }) });
  } catch (e) {
    throw new Error('offline');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.code) throw new Error(body.error || 'invalid');
  return body.code;
}

// Entra numa mesa (ou volta para ela) e fica conectado até leave(). Se a conexão cai, tenta de
// novo sozinho, com esperas cada vez maiores, e na hora em que o app volta para a tela ou a
// internet volta. Uma recusa na entrada (mesa cheia, mesa que não existe…) ou o fim da mesa
// encerram a ligação: o evento vem com final: true.
export function connect({ server, code, device, name, onEvent }) {
  let ws = null, left = false, tries = 0, retryTimer = 0, pingTimer = 0, pongTimer = 0;
  const emit = (type, data) => onEvent({ ...data, type });

  function open() {
    clearTimeout(retryTimer);
    if (left) return;
    const socket = ws = new WebSocket(`${server.replace(/^http/, 'ws')}/rooms/${code}`);
    let inside = false;   // esta conexão já recebeu a mesa
    emit('status', { status: tries ? 'reconnecting' : 'connecting' });
    socket.onopen = () => socket.send(JSON.stringify({ type: 'hello', protocol: PROTOCOL, device, name }));
    socket.onclose = () => { if (socket === ws) retry(); };
    socket.onmessage = ev => {
      if (socket !== ws) return;
      if (ev.data === 'pong') return clearTimeout(pongTimer);
      let msg;
      try { msg = JSON.parse(ev.data); } catch (e) { return; }
      if (msg.type === 'room') {
        inside = true;
        tries = 0;
        keepAlive();
        emit('status', { status: 'online' });
      }
      const final = msg.type === 'ended' || (msg.type === 'error' && !inside && FINAL.has(msg.error));
      if (final) stop();
      emit(msg.type, { ...msg, final });
    };
  }

  // A conexão caiu: tenta de novo depois de uma espera.
  function retry() {
    stopKeepAlive();
    ws = null;
    if (left) return;
    emit('status', { status: 'reconnecting' });
    retryTimer = setTimeout(open, RETRY[Math.min(tries++, RETRY.length - 1)]);
  }

  function keepAlive() {
    stopKeepAlive();
    pingTimer = setInterval(probe, PING_EVERY);
  }
  function stopKeepAlive() {
    clearInterval(pingTimer);
    clearTimeout(pongTimer);
  }

  // Pergunta se a conexão ainda está viva; sem resposta, larga ela e abre outra.
  function probe() {
    if (ws?.readyState !== WebSocket.OPEN) return;
    ws.send('ping');
    clearTimeout(pongTimer);
    pongTimer = setTimeout(() => {
      const dead = ws;
      retry();
      try { dead?.close(); } catch (e) {}
    }, PONG_WAIT);
  }

  // De volta à tela (ou à internet): reconecta na hora, sem esperar a próxima tentativa, ou confere
  // se a conexão aberta ainda está viva (o celular pode tê-la perdido enquanto dormia).
  function wake() {
    if (left || document.hidden) return;
    if (ws?.readyState === WebSocket.OPEN) return probe();
    if (!ws || ws.readyState >= WebSocket.CLOSING) {
      tries = Math.min(tries, 1);
      open();
    }
  }

  function stop() {
    left = true;
    clearTimeout(retryTimer);
    stopKeepAlive();
    document.removeEventListener('visibilitychange', wake);
    removeEventListener('online', wake);
  }

  document.addEventListener('visibilitychange', wake);
  addEventListener('online', wake);
  open();

  return {
    // Manda uma mensagem para a mesa; false se a conexão não está aberta agora.
    send(msg) {
      if (ws?.readyState !== WebSocket.OPEN) return false;
      ws.send(JSON.stringify(msg));
      return true;
    },
    // Sai da mesa neste aparelho. O lugar continua guardado na mesa, para quando ele voltar.
    leave() {
      stop();
      try { ws?.close(1000); } catch (e) {}
      ws = null;
    }
  };
}
