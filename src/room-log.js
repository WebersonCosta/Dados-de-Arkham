// As rolagens da mesa compartilhada: o histórico, com a mais nova em cima (no painel da mesa), e o
// aviso discreto perto da bandeja quando outra pessoa rola. Cada rolagem chega do servidor já do
// jeito que este aparelho pode ver: inteira, ou só o sinal de que alguém rolou (sem o número).

const MAX = 100;           // como o servidor (HISTORY em server/room.js)
const NOTICE_MS = 5000;    // quanto tempo o aviso fica perto da bandeja
const MAX_NOTICES = 3;     // vários de uma vez (todos rolando Sanidade, por exemplo) ficam empilhados

// list: a lista do histórico; empty: o aviso de lista vazia; notices: onde os avisos aparecem.
// critical: a regra do tema (crítico e desastre); nameOf: como se escreve o que foi rolado ('2d6+6'
// vira '2d6 + 6').
export function createRoomLog({ list, empty, notices, texts, critical, nameOf }) {
  // waiting: as rolagens deste aparelho que a mesa ainda não confirmou; held: o aviso que fica
  let rolls = [], waiting = [], members = [], you = null, names = '', held = null;

  const el = (tag, className, text) => {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.textContent = text;
    return e;
  };
  const who = (seat, fallback = '?') => {
    const m = members.find(m => m.seat === seat);
    return !m ? fallback : m.role === 'guardian' ? texts.guardian : m.name;
  };
  const hidden = roll => !Number.isInteger(roll.total);   // o sinal de suspense: não traz o número
  const VEIL = { private: 'privada', secret: 'secreta' };   // as que nem todos veem
  const secretly = roll => (roll.vis === 'secret' ? 'rolou em segredo' : `rolou só para o ${texts.guardian}`);
  const crit = roll => (hidden(roll) ? null : critical(roll.set, roll));
  const time = at => new Date(at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const kind = roll => {
    const c = crit(roll);
    return (c ? ` is-${c.kind}` : '') + (hidden(roll) ? ' is-hidden' : '') + (VEIL[roll.vis] ? ' is-veiled' : '');
  };

  // Uma rolagem no histórico: o número à esquerda; ao lado, quem rolou e o rótulo, e embaixo o que
  // foi rolado e como deu aquele número ("d100 · 1 dado de bônus · 20 30 + 7"). A que nem todos
  // veem leva a marca "privada" ou "secreta"; a que este aparelho não pode ver mostra só "?" e
  // quem rolou; a deste aparelho que a mesa ainda não confirmou (pending) leva "enviando…". A de
  // outra pessoa que acabou de chegar acende uma vez, quando aparece (com a gaveta fechada, ao abrir).
  function entry(roll, fresh, pending) {
    const li = el('li', 'roll' + kind(roll) + (roll.seat === you || pending ? ' is-me' : '') + (pending ? ' is-pending' : ''));
    if (fresh && roll.seat !== you) {
      li.classList.add('is-new');
      li.addEventListener('animationend', () => li.classList.remove('is-new'), { once: true });
    }
    li.append(el('b', 'roll-num', hidden(roll) ? '?' : roll.text));
    const top = el('p', 'roll-who'), title = el('span');
    title.append(el('span', 'roll-name', who(roll.seat, roll.mine)));
    if (roll.label) title.append(` · ${roll.label}`);
    top.append(title);
    if (VEIL[roll.vis] && !hidden(roll)) top.append(el('small', 'roll-veil', VEIL[roll.vis]));
    if (pending) top.append(el('small', 'roll-wait', 'enviando…'));
    top.append(el('time', '', time(roll.at)));
    const bottom = el('p', 'roll-what');
    if (hidden(roll)) {
      bottom.textContent = secretly(roll);
    } else {
      const name = nameOf(roll.set);
      bottom.append([name, roll.note].filter(Boolean).join(' · '));
      if (roll.pieces) {
        bottom.append(' ·', ...roll.pieces.flatMap(p => [' ', el(p.dropped ? 's' : 'span', '', p.text)]));
      } else if (roll.detail && roll.detail !== name) {
        bottom.append(` · ${roll.detail}`);
      }
      const c = crit(roll);
      if (c) bottom.append(' · ', el('span', 'roll-crit', c.label));
    }
    const text = el('div', 'roll-text');
    text.append(top, bottom);
    li.append(text);
    return li;
  }

  // As que esperam a mesa ficam em cima de todas.
  function render() {
    list.replaceChildren(...waiting.map(r => entry(r, false, true)).reverse(), ...rolls.map(r => entry(r)).reverse());
    empty.hidden = rolls.length + waiting.length > 0;
  }

  // O aviso perto da bandeja: quem rolou, o rótulo (ou o que foi rolado) e o número. O sinal de
  // suspense diz só quem rolou ("Ana rolou só para o Guardião"), com um "?" no lugar do número.
  function notice(roll) {
    const p = el('p', 'notice' + kind(roll));
    const text = hidden(roll)
      ? `${who(roll.seat)} ${secretly(roll)}`
      : [who(roll.seat), roll.label || nameOf(roll.set), VEIL[roll.vis]].filter(Boolean).join(' · ');
    p.append(el('span', '', text), el('b', '', hidden(roll) ? '?' : roll.text));
    notices.insertBefore(p, held);   // o aviso que fica continua embaixo, perto da bandeja
    const passing = () => notices.querySelectorAll('.notice:not(.is-held)');
    while (passing().length > MAX_NOTICES) passing()[0].remove();
    setTimeout(() => p.remove(), NOTICE_MS);
  }

  // Quem está na mesa mudou. O histórico só é refeito se algum nome mudou.
  function setMembers(list, force) {
    members = list;
    const now = JSON.stringify(list.map(m => [m.seat, m.name]));
    if (force || now !== names) {
      names = now;
      render();
    }
  }

  return {
    // A mesa inteira, ao entrar ou ao voltar depois de uma queda: o servidor manda tudo de novo.
    reset(room) {
      rolls = room.rolls.slice(-MAX);
      you = room.you;
      setMembers(room.members, true);
    },
    setMembers,
    // Uma rolagem que acabou de chegar. A mesma, mandada de novo depois de uma queda, não se repete.
    add(roll) {
      if (rolls.some(r => r.id === roll.id)) return;
      rolls.push(roll);
      list.insertBefore(entry(roll, true), list.children[waiting.length] || null);
      if (rolls.length > MAX) {
        rolls.shift();
        list.lastElementChild.remove();
      }
      empty.hidden = true;
      if (roll.seat !== you) notice(roll);
    },
    // As rolagens deste aparelho que a mesa ainda não confirmou ([{ at, msg }], da mais velha para
    // a mais nova); name: o nome de quem rola, para antes de a mesa responder.
    waiting(list, name) {
      waiting = list.map(p => ({ ...p.msg, at: p.at, seat: you, mine: name }));
      render();
    },
    // O aviso que fica perto da bandeja até sair ({ text, action } ou null): a mesa sem conexão, o
    // app desatualizado. Com action, ele é um botão.
    banner(next) {
      if ((next?.text || '') === (held?.textContent || '')) return;
      held?.remove();
      held = null;
      if (!next) return;
      held = el(next.action ? 'button' : 'p', 'notice is-held' + (next.action ? ' is-action' : ''), next.text);
      if (next.action) {
        held.type = 'button';
        held.addEventListener('click', next.action);
      }
      notices.append(held);
    },
    // Quantas rolagens dos outros chegaram depois da rolagem número `seq`.
    unseen: seq => rolls.filter(r => r.seq > seq && r.seat !== you).length,
    get last() { return rolls.length ? rolls[rolls.length - 1].seq : 0; },
    clear() {
      rolls = [];
      waiting = [];
      members = [];
      you = null;
      names = '';
      held = null;
      render();
      notices.replaceChildren();
    }
  };
}
