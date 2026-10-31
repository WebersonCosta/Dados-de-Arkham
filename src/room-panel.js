import { newDevice, newRollId, cleanCode, showCode, createRoom, connect } from './core/room-link.js';
import { createRoomLog } from './room-log.js';
import { createRoomLabel } from './room-label.js';
import { VERSION } from './version.js';

// O painel da mesa compartilhada. O botão "Mesa", no alto da tela, abre a folha de entrar numa mesa
// com o código (os jogadores) ou de criar uma (o Guardião). Dentro de uma mesa, ele abre o painel
// dela: o código e o convite, quem está na mesa e as rolagens de todos (room-log.js). No celular o
// painel é uma gaveta; no PC ele fica à vista, ao lado da mesa de dados. Perto da bandeja ficam
// quem vê a próxima rolagem, o rótulo dela (room-label.js) e, no celular, o atalho para as rolagens.
// O nome do personagem, a chave do aparelho e a mesa atual ficam guardados no aparelho: ao abrir o
// app, ele volta sozinho para a mesa em que estava.

// Os dois servidores, como os dois endereços do app (veja server/wrangler.toml).
const SERVERS = {
  oficial: 'https://mesa-arkham.mesa-arkham.workers.dev',
  teste: 'https://mesa-arkham-teste.mesa-arkham.workers.dev'
};
const MAX_NAME = 30;
const WIDE = '(min-width: 960px)';   // a partir dessa largura (PC, tablet deitado), o painel fica ao lado
const MAX_PENDING = 20;              // rolagens guardadas esperando a conexão
const DROP_NOTICE = 3000;            // sem conexão por mais que isso, aparece o aviso perto da bandeja
const CONFIRM_WAIT = 4000;           // a mesa não confirmou a rolagem nesse tempo: a conexão é conferida

// critical e nameOf: para o histórico (veja room-log.js); relayout: refaz a área onde os dados rolam,
// quando a bandeja ganha a linha do rótulo ou o painel passa a ocupar o lado da tela.
export function createRoomPanel({ place, texts, unlock, notify, critical, nameOf, relayout }) {
  const $ = id => document.getElementById(id);
  const button = $('btnTable'), joinSheet = $('tableSheet'), panel = $('roomPanel'), row = $('roomRow');
  const nameInput = $('tableName'), codeInput = $('tableCodeInput'), errorBox = $('tableError');
  const btnJoin = $('btnJoin'), btnCreate = $('btnCreate'), btnInvite = $('btnInvite'), btnLeave = $('btnLeave');
  const btnLog = $('btnLog'), btnVis = $('btnVis');
  const server = SERVERS[place] || SERVERS.teste;
  const wide = matchMedia(WIDE);
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
  // device: a chave do aparelho; name: o nome do personagem; room: { code, guardian } da mesa atual;
  // labels: os últimos rótulos usados; pending: as rolagens que a mesa ainda não confirmou
  const saved = { device: '', name: '', room: null, labels: [], pending: [] };
  try { Object.assign(saved, JSON.parse(store.getItem(KEY) || '{}')); } catch (e) {}
  if (!saved.device) saved.device = newDevice();
  if (saved.room && !cleanCode(saved.room.code)) saved.room = null;
  if (!saved.room || !Array.isArray(saved.pending)) saved.pending = [];
  const save = () => { try { store.setItem(KEY, JSON.stringify(saved)); } catch (e) {} };
  save();
  $('tablePerTab').hidden = !perTab;

  // room: { you, members }, depois que a mesa respondeu. status: 'out', 'connecting', 'reconnecting',
  // 'online' ou 'old' (a mesa recusou este app, que ficou para trás). joining: entrando pela folha,
  // que fica aberta até a mesa responder. drawer: a gaveta aberta (celular); folded: o painel
  // recolhido (PC). seen: a última rolagem que esteve à vista, para contar as novas no botão
  // "Rolagens". dropped: sem conexão há mais que alguns segundos; outdated: a mesa avisou que há
  // uma versão mais nova do app.
  let link = null, room = null, status = 'out', joining = false, drawer = false, folded = false, seen = 0, layout = 'out';
  let dropped = false, dropTimer = 0, outdated = false;
  const title = document.title;
  const canShare = !!navigator.share && matchMedia('(pointer: coarse)').matches;
  const inviteLabel = canShare ? 'Convidar' : 'Copiar convite';
  btnInvite.textContent = inviteLabel;
  const log = createRoomLog({ list: $('roomLog'), empty: $('roomLogEmpty'), notices: $('notices'), texts, critical, nameOf });
  const label = createRoomLabel({ saved, save, unlock });

  // Quem vê a próxima rolagem. O jogador escolhe entre aberta (o padrão: todos veem) e privada (só
  // ele e o Guardião); o Guardião, entre secreta (o padrão: só ele vê) e aberta. Quem não pode ver
  // recebe da mesa só o sinal de que alguém rolou, sem o número. Depois de cada lançamento a escolha
  // volta para o padrão, como o bônus e o rótulo: ninguém revela um segredo por esquecimento.
  const VIS = {
    open: { chip: 'Aberta', aria: 'Rolagem aberta: todos veem. Trocar' },
    private: { chip: 'Privada', veil: 'privada', aria: `Rolagem privada: só você e o ${texts.guardian} veem. Trocar` },
    secret: { chip: 'Secreta', veil: 'secreta', aria: 'Rolagem secreta: só você vê. Trocar' }
  };
  let flipped = false;   // a outra escolha, só para a próxima rolagem
  const visibility = () => (saved.room?.guardian ? ['secret', 'open'] : ['open', 'private'])[flipped ? 1 : 0];

  /* ------------------------------------------------------------ entrar, criar, sair */
  function enter() {
    link?.leave();
    room = null;
    status = 'connecting';
    outdated = false;
    link = connect({ server, code: saved.room.code, device: saved.device, name: mine(), app: VERSION, onEvent });
    watchDrop();
    render();
  }
  const mine = () => (saved.room?.guardian ? texts.guardian : saved.name);   // o nome deste aparelho na mesa

  // Esquece a mesa neste aparelho (o lugar continua guardado nela, se ela ainda existir). As
  // rolagens que ainda esperavam a conexão ficam de fora.
  function forget() {
    link?.leave();
    link = null;
    room = null;
    status = 'out';
    joining = drawer = folded = flipped = outdated = false;
    saved.room = null;
    saved.pending = [];
    save();
    watchDrop();
    label.clear();
    log.clear();
    render();
  }

  // Sem conexão por mais que alguns segundos (uma queda rápida passa sem aviso), aparece o aviso
  // perto da bandeja; ele sai quando a mesa responde.
  function watchDrop() {
    clearTimeout(dropTimer);
    if (status !== 'connecting' && status !== 'reconnecting') {
      dropped = false;
      return;
    }
    dropTimer = setTimeout(() => {
      dropped = true;
      render();
    }, DROP_NOTICE);
  }

  function onEvent(ev) {
    if (ev.type === 'status' && ev.status !== status) {
      status = ev.status;
      watchDrop();
    }
    if (ev.type === 'room') {
      const fresh = !room;   // a primeira resposta (ao entrar ou ao abrir o app), e não a volta depois de uma queda
      room = { you: ev.you, members: ev.members };
      saved.room.guardian = ev.you === 'g';
      log.reset(ev);
      if (fresh) seen = log.last;   // o que já estava na mesa conta como visto
      if (joining) {                // entrou pela folha: ela fecha e, no celular, a gaveta da mesa abre
        joining = false;
        joinSheet.hidden = true;
        drawer = true;
      }
      // as rolagens feitas sem conexão: as que a mesa já tinha recebido saem da fila, e o resto vai
      // de novo (a mesa reconhece uma rolagem repetida e conta uma vez só)
      const got = new Set(ev.rolls.map(r => r.id));
      setPending(saved.pending.filter(p => !got.has(p.msg.id)));
      for (const p of saved.pending) link.send(p.msg);
    }
    if (ev.type === 'members' && room) {
      room.members = ev.members;
      log.setMembers(ev.members);
    }
    if (ev.type === 'roll' && room) {
      if (saved.pending.some(p => p.msg.id === ev.roll.id)) setPending(saved.pending.filter(p => p.msg.id !== ev.roll.id));
      log.add(ev.roll);
    }
    if (ev.type === 'outdated') outdated = true;
    if (ev.type === 'error' && ev.id) {   // a mesa recusou uma rolagem: mandar de novo não adianta
      setPending(saved.pending.filter(p => p.msg.id !== ev.id));
      notify('A mesa não aceitou esta rolagem');
    }
    if (ev.type === 'ended') {
      forget();
      notify(ev.reason === 'idle' ? 'A mesa se apagou depois de horas sem uso' : `O ${texts.guardian} encerrou a mesa`);
      return;
    }
    if (ev.type === 'error' && ev.final && ev.error === 'version' && !joining) {
      // O app ficou para trás de um jeito que a mesa não entende mais. A mesa continua guardada (e as
      // rolagens que esperavam também): depois de atualizar, o app volta sozinho para ela.
      link = null;
      status = 'old';
      watchDrop();
    } else if (ev.type === 'error' && ev.final) {
      const code = saved.room.code, wasJoining = joining;
      forget();
      if (wasJoining) showError(ev.error);
      else if (ev.error === 'room-not-found') notify(`A mesa ${showCode(code)} não existe mais`);
      else notify(MESSAGES[ev.error] || MESSAGES.invalid);
      return;
    }
    render();
  }

  // A fila das rolagens que a mesa ainda não confirmou ([{ at, msg }]): guardada no aparelho (vale
  // também se o app for fechado) e mostrada no histórico com "enviando…".
  function setPending(list) {
    saved.pending = list;
    save();
    log.waiting(list, mine());
  }

  // Atualizar o app: a página abre de novo, a versão nova chega pela cópia do app no aparelho
  // (sw.js; veja o index.html) e o app volta sozinho para a mesa.
  function update() {
    unlock();
    location.reload();
  }

  async function create() {
    unlock();
    showError(null);
    joining = true;
    render();
    try {
      const code = await createRoom(server, saved.device, texts.guardian);
      if (!joining) return;   // a folha foi fechada enquanto a mesa era criada: desistiu
      saved.room = { code, guardian: true };
      save();
      enter();
    } catch (e) {
      joining = false;
      showError(e.message);
      render();
    }
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
    joining = true;
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

  /* ------------------------------------------------------------ as rolagens deste aparelho */
  // Na hora de lançar: o rótulo e quem vê esta jogada ({ label, vis, veil }, em que veil é a marca
  // "privada" ou "secreta"); null fora de uma mesa. A próxima começa sem rótulo e com o padrão.
  function take() {
    if (!saved.room || joining) return null;
    const vis = visibility();
    flipped = false;
    render();
    return { label: label.take(), vis, veil: VIS[vis].veil || '' };
  }

  // A rolagem que acabou de parar, para a mesa: o que take() devolveu na hora de lançar e o
  // resultado ({ set, total, text, detail, note, pieces }). Ela entra na fila até a mesa confirmar:
  // sem conexão, vai quando a conexão voltar (mesmo que o app seja fechado e aberto de novo). Se a
  // conexão parecia aberta mas a mesa não confirma, ela é conferida na hora (pode ter caído sem
  // avisar, como no celular que troca de rede).
  function share(table, roll) {
    if (!saved.room || joining) return;
    const msg = { type: 'roll', id: newRollId(), vis: table.vis, label: table.label, ...roll };
    setPending([...saved.pending, { at: Date.now(), msg }].slice(-MAX_PENDING));
    if (status === 'online' && link?.send(msg)) {
      setTimeout(() => { if (saved.pending.some(p => p.msg.id === msg.id)) link?.check(); }, CONFIRM_WAIT);
    } else {
      notify('Sem conexão: a rolagem vai para a mesa quando a conexão voltar');
    }
    render();
  }

  /* ------------------------------------------------------------ a tela */
  function render() {
    const inside = !!saved.room && !joining;
    const docked = inside && wide.matches;
    const shown = inside && (docked ? !folded : drawer);
    const online = room?.members.filter(m => m.online).length || 0;
    button.textContent = !inside ? 'Mesa' : status === 'online' ? `Mesa · ${online}` : 'Mesa …';
    button.classList.toggle('is-in', inside);
    button.dataset.status = inside ? status : 'out';
    button.setAttribute('aria-label', inside ? `Mesa ${showCode(saved.room.code)}, ${online} conectados` : 'Mesa compartilhada');
    // fora do endereço oficial, a aba mostra quem é quem (ajuda a testar com várias abas)
    const me = room?.members.find(m => m.seat === room.you);
    document.title = place !== 'oficial' && me ? `${me.role === 'guardian' ? texts.guardian : me.name} · ${title}` : title;

    // a folha de entrar, enquanto a mesa não responde
    btnJoin.disabled = btnCreate.disabled = joining;
    $('tableJoining').hidden = !joining;
    $('tableJoining').textContent = status === 'reconnecting' ? 'Sem resposta da mesa. Tentando de novo…' : 'Entrando na mesa…';

    // o painel da mesa (gaveta no celular, ao lado no PC) e a linha perto da bandeja
    panel.hidden = !shown;
    panel.classList.toggle('is-docked', docked);
    panel.setAttribute('aria-modal', String(!docked));
    document.body.classList.toggle('docked', docked && !folded);
    row.hidden = !inside;
    const vis = VIS[visibility()];
    btnVis.textContent = vis.chip;
    btnVis.classList.toggle('is-veiled', !!vis.veil);
    btnVis.setAttribute('aria-label', vis.aria);
    btnLog.hidden = docked && !folded;
    if (shown) seen = log.last;
    const unseen = log.unseen(seen);
    $('logCount').textContent = unseen ? String(Math.min(unseen, 99)) : '';
    btnLog.setAttribute('aria-label', !unseen ? 'Rolagens da mesa' : `Rolagens da mesa, ${unseen} ${unseen === 1 ? 'nova' : 'novas'}`);
    // a área onde os dados rolam muda quando a bandeja ganha a linha do rótulo ou o painel ocupa o lado
    const now = !inside ? 'out' : docked && !folded ? 'side' : 'row';
    if (now !== layout) {
      layout = now;
      relayout();
    }
    // o aviso que fica perto da bandeja: o app desatualizado (um toque atualiza), ou a mesa sem conexão
    const waiting = saved.pending.length;
    log.banner(!inside ? null
      : status === 'old' ? { text: 'App desatualizado · toque para atualizar e voltar à mesa', action: update }
      : outdated ? { text: 'Versão nova do app · toque para atualizar', action: update }
      : dropped ? { text: 'Sem conexão com a mesa · reconectando…' + (waiting ? ` · ${waiting} ${waiting === 1 ? 'rolagem esperando' : 'rolagens esperando'}` : '') }
      : null);

    if (!inside) return;
    $('tableCode').textContent = showCode(saved.room.code);
    $('tableStatus').textContent = {
      connecting: 'Entrando na mesa…', reconnecting: 'A conexão caiu. Reconectando…', online: 'Conectado',
      old: 'Este app está desatualizado: atualize para voltar à mesa.'
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

  // O botão "Mesa": fora de uma mesa, a folha de entrar; dentro, o painel da mesa (no PC, que já
  // está ao lado, o botão esconde e mostra o painel).
  function open() {
    unlock();
    if (!saved.room || joining) {
      if (!joining) {
        nameInput.value ||= saved.name;
        showError(null);
      }
      joinSheet.hidden = false;
      render();
      (nameInput.value ? codeInput : nameInput).focus();
      return;
    }
    if (wide.matches) folded = !folded;
    else drawer = true;
    render();
    if (!panel.hidden && !wide.matches) $('btnCloseRoom').focus();
  }

  function showLog() {
    unlock();
    if (wide.matches) folded = false;
    else drawer = true;
    render();
  }

  // Fechar a folha de entrar enquanto a mesa não respondeu é desistir de entrar.
  function closeJoin() {
    joinSheet.hidden = true;
    if (joining) forget();
  }

  function closePanel() {
    if (wide.matches) folded = true;
    else drawer = false;
    render();
  }

  button.addEventListener('click', open);
  btnLog.addEventListener('click', showLog);
  btnVis.addEventListener('click', () => {
    unlock();
    flipped = !flipped;
    render();
  });
  $('btnCloseTable').addEventListener('click', closeJoin);
  $('btnCloseRoom').addEventListener('click', closePanel);
  joinSheet.addEventListener('click', ev => { if (ev.target === joinSheet) closeJoin(); });
  panel.addEventListener('click', ev => { if (ev.target === panel && !wide.matches) closePanel(); });
  document.addEventListener('keydown', ev => {
    if (ev.key !== 'Escape') return;
    if (!joinSheet.hidden) closeJoin();
    else if (!panel.hidden && !wide.matches) closePanel();
  });
  wide.addEventListener('change', render);
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
    if (saved.room && !joining) showLog();
    else open();
  }
  addEventListener('hashchange', takeInvite);
  if (saved.room) {   // volta sozinho para a mesa em que estava, com as rolagens que esperavam a conexão
    log.waiting(saved.pending, mine());
    enter();
  } else {
    render();
  }
  takeInvite();

  return {
    open, take, share, log,
    get room() { return room; }, get status() { return status; }
  };
}
