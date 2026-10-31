import { newDevice, cleanCode, showCode, createRoom, connect } from './core/room-link.js';

// O painel da mesa compartilhada: o botão "Mesa", no alto da tela, e a folha que ele abre, para
// criar uma mesa (o Guardião) ou entrar numa com o código (os jogadores), ver quem está nela e
// convidar. O nome do personagem, a chave do aparelho e a mesa atual ficam guardados no aparelho:
// ao abrir o app, ele volta sozinho para a mesa em que estava.

// Os dois servidores, como os dois endereços do app (veja server/wrangler.toml).
const SERVERS = {
  oficial: 'https://mesa-arkham.mesa-arkham.workers.dev',
  teste: 'https://mesa-arkham-teste.mesa-arkham.workers.dev'
};
const MAX_NAME = 30;

export function createRoomPanel({ place, texts, unlock, notify }) {
  const $ = id => document.getElementById(id);
  const button = $('btnTable'), sheet = $('tableSheet'), outBox = $('tableOut'), inBox = $('tableIn');
  const nameInput = $('tableName'), codeInput = $('tableCodeInput'), errorBox = $('tableError');
  const btnJoin = $('btnJoin'), btnCreate = $('btnCreate'), btnInvite = $('btnInvite'), btnLeave = $('btnLeave');
  const server = SERVERS[place] || SERVERS.teste;
  const MESSAGES = {
    offline: 'Sem conexão com a mesa. Confira a internet e tente de novo.',
    'room-not-found': `Não existe mesa com esse código. Confira com o ${texts.guardian}.`,
    'room-full': 'Essa mesa já está cheia: são 6 jogadores no máximo.',
    version: 'Esta mesa usa outra versão do app. Feche e abra o app para atualizar.',
    name: `Escreva o nome do ${texts.character}.`,
    code: 'O código tem 6 letras e números, como K7Q X3M.',
    busy: 'A mesa está ocupada. Tente de novo em instantes.',
    invalid: 'Algo deu errado. Tente de novo.'
  };

  // Num endereço de teste, "?aba" no endereço faz da aba um aparelho à parte, para simular vários
  // jogadores no mesmo computador: o que é da mesa fica guardado só naquela aba.
  const perTab = place !== 'oficial' && new URLSearchParams(location.search).has('aba');
  const store = perTab ? sessionStorage : localStorage;
  const KEY = place === 'teste' ? 'arkham-mesa-teste' : 'arkham-mesa';
  // device: a chave do aparelho; name: o nome do personagem; room: { code, guardian } da mesa atual
  const saved = { device: '', name: '', room: null };
  try { Object.assign(saved, JSON.parse(store.getItem(KEY) || '{}')); } catch (e) {}
  if (!saved.device) saved.device = newDevice();
  if (saved.room && !cleanCode(saved.room.code)) saved.room = null;
  const save = () => { try { store.setItem(KEY, JSON.stringify(saved)); } catch (e) {} };
  save();
  $('tablePerTab').hidden = !perTab;

  let link = null, room = null, status = 'out';   // room: { you, members } depois que a mesa respondeu
  const title = document.title;
  const canShare = !!navigator.share && matchMedia('(pointer: coarse)').matches;
  const inviteLabel = canShare ? 'Convidar' : 'Copiar convite';
  btnInvite.textContent = inviteLabel;

  /* ------------------------------------------------------------ entrar, criar, sair */
  function enter() {
    link?.leave();
    room = null;
    status = 'connecting';
    const { code, guardian } = saved.room;
    link = connect({ server, code, device: saved.device, name: guardian ? texts.guardian : saved.name, onEvent });
    render();
  }

  // Esquece a mesa neste aparelho (o lugar continua guardado nela, se ela ainda existir).
  function forget() {
    link?.leave();
    link = null;
    room = null;
    status = 'out';
    saved.room = null;
    save();
    render();
  }

  function onEvent(ev) {
    if (ev.type === 'status') status = ev.status;
    if (ev.type === 'room') {
      room = { you: ev.you, members: ev.members };
      saved.room.guardian = ev.you === 'g';
      save();
    }
    if (ev.type === 'members' && room) room.members = ev.members;
    if (ev.type === 'ended') {
      forget();
      notify(ev.reason === 'idle' ? 'A mesa se apagou depois de horas sem uso' : `O ${texts.guardian} encerrou a mesa`);
      return;
    }
    if (ev.type === 'error' && ev.final) {
      const code = saved.room.code;
      forget();
      if (!sheet.hidden) showError(ev.error);
      else if (ev.error === 'room-not-found') notify(`A mesa ${showCode(code)} não existe mais`);
      else notify(MESSAGES[ev.error] || MESSAGES.invalid);
      return;
    }
    render();
  }

  async function create() {
    unlock();
    showError(null);
    btnCreate.disabled = btnJoin.disabled = true;
    try {
      saved.room = { code: await createRoom(server, saved.device, texts.guardian), guardian: true };
      save();
      enter();
    } catch (e) {
      showError(e.message);
    }
    btnCreate.disabled = btnJoin.disabled = false;
  }

  function join() {
    unlock();
    const name = Array.from(nameInput.value.replace(/\s+/g, ' ').trim()).slice(0, MAX_NAME).join('').trim();
    const code = cleanCode(codeInput.value);
    if (!name) return showError('name', nameInput);
    if (!code) return showError('code', codeInput);
    showError(null);
    saved.name = name;
    saved.room = { code, guardian: false };
    save();
    enter();
  }

  function leave() {
    unlock();
    if (saved.room?.guardian) {
      if (!confirm('Encerrar a mesa? Todos saem dela e ela é apagada.')) return;
      link?.send({ type: 'end' });   // a mesa responde com o fim; se a conexão não estiver aberta, só sai
    }
    forget();
  }

  // Convite: no celular, abre o compartilhar do sistema (Discord, WhatsApp…); no computador, copia
  // o texto com o link, para colar no Discord.
  async function invite() {
    unlock();
    const code = saved.room.code;
    const url = `${location.origin}${location.pathname}#mesa=${code}`;
    const text = `Mesa dos Dados de Arkham, código ${showCode(code)}`;
    if (canShare) {
      try { await navigator.share({ title: 'Dados de Arkham', text, url }); return; } catch (e) { if (e.name === 'AbortError') return; }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      btnInvite.textContent = 'Copiado!';
      setTimeout(() => { btnInvite.textContent = inviteLabel; }, 1800);
    } catch (e) {
      prompt('Copie o convite:', url);
    }
  }

  /* ------------------------------------------------------------ a tela */
  function render() {
    const inside = !!saved.room;
    const online = room?.members.filter(m => m.online).length || 0;
    button.textContent = !inside ? 'Mesa' : status === 'online' ? `Mesa · ${online}` : 'Mesa …';
    button.classList.toggle('is-in', inside);
    button.dataset.status = status;
    button.setAttribute('aria-label', inside ? `Mesa ${showCode(saved.room.code)}, ${online} conectados` : 'Mesa compartilhada');
    // fora do endereço oficial, a aba mostra quem é quem (ajuda a testar com várias abas)
    const me = room?.members.find(m => m.seat === room.you);
    document.title = place !== 'oficial' && me ? `${me.role === 'guardian' ? texts.guardian : me.name} · ${title}` : title;

    outBox.hidden = inside;
    inBox.hidden = !inside;
    if (!inside) return;
    $('tableCode').textContent = showCode(saved.room.code);
    $('tableStatus').textContent = {
      connecting: 'Entrando na mesa…', reconnecting: 'A conexão caiu. Reconectando…', online: 'Conectado'
    }[status] || '';
    btnLeave.textContent = saved.room.guardian ? 'Encerrar a mesa' : 'Sair da mesa';
    renderMembers();
  }

  // Quem está na mesa, na ordem de entrada: o Guardião primeiro, depois os jogadores.
  function renderMembers() {
    const list = room?.members || [];
    $('tableMembers').replaceChildren(...list.map(m => {
      const li = document.createElement('li');
      li.className = 'member' + (m.online ? ' is-online' : '') + (m.seat === room.you ? ' is-me' : '');
      const dot = document.createElement('i');
      dot.className = 'dot';
      const name = document.createElement('span');
      name.className = 'member-name';
      name.textContent = m.role === 'guardian' ? texts.guardian : m.name;
      const note = document.createElement('small');
      note.textContent = [m.seat === room.you ? 'você' : '', m.online ? '' : 'fora da mesa'].filter(Boolean).join(' · ');
      li.append(dot, name, note);
      return li;
    }));
  }

  function showError(reason, field) {
    errorBox.hidden = !reason;
    errorBox.textContent = reason ? MESSAGES[reason] || MESSAGES.invalid : '';
    field?.focus();
  }

  function open() {
    unlock();
    if (!saved.room) {
      nameInput.value ||= saved.name;
      showError(null);
    }
    render();
    sheet.hidden = false;
    (saved.room ? $('btnCloseTable') : nameInput.value ? codeInput : nameInput).focus();
  }
  function close() { sheet.hidden = true; }

  button.addEventListener('click', open);
  $('btnCloseTable').addEventListener('click', close);
  sheet.addEventListener('click', ev => { if (ev.target === sheet) close(); });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !sheet.hidden) close(); });
  btnCreate.addEventListener('click', create);
  btnJoin.addEventListener('click', join);
  btnInvite.addEventListener('click', invite);
  btnLeave.addEventListener('click', leave);
  $('tableForm').addEventListener('submit', ev => { ev.preventDefault(); join(); });
  $('tableCharacter').textContent = `Nome do ${texts.character}`;
  $('tableGuardian').textContent = `É o ${texts.guardian}?`;

  /* ------------------------------------------------------------ ao abrir o app */
  // Um convite (o link termina com "#mesa=K7QX3M") abre a folha com o código já preenchido. Vale
  // também com o app já aberto: aí só o fim do endereço muda, e a página não recarrega.
  function takeInvite() {
    if (!location.hash.includes('mesa=')) return;
    const invited = cleanCode(new URLSearchParams(location.hash.slice(1)).get('mesa'));
    history.replaceState(null, '', location.pathname + location.search);
    if (!invited) return;
    if (invited !== saved.room?.code) {
      if (saved.room) notify('Saia desta mesa para entrar na do convite');
      codeInput.value = showCode(invited);
    }
    open();
  }
  addEventListener('hashchange', takeInvite);
  if (saved.room) enter();   // volta sozinho para a mesa em que estava
  else render();
  takeInvite();

  return { open, get room() { return room; }, get status() { return status; } };
}
