// Os valores dos jogadores, como o Guardião recebe da mesa, acompanhados para os alertas. O jogador
// ajusta um valor com − e +, um toque de cada vez (e o app dele manda no máximo a cada 300 ms): uma
// perda de 5 chega como várias mudanças pequenas. Aqui, as mudanças seguidas de um mesmo valor viram
// uma só: quando ele fica QUIET sem mudar, a mudança vai do valor de antes do primeiro toque ao de
// depois do último (quem errou e corrigiu nesse tempo fica só com o resultado). Guarda também o
// maior valor de cada um nesta sessão (top). Sem tela e sem tema: o que pede um alerta é o tema que
// decide (alerts, em themes/arkham/rules.js).

export const QUIET = 4000;   // milissegundos sem mudar: o jogador terminou de ajustar

// ids: os contadores do tema; state: o que fica guardado no aparelho do Guardião, para valer mesmo se
// o app for aberto de novo no meio da sessão ({ last, top, from }: por lugar e por contador, o último
// valor visto, o maior da sessão e o de antes de uma mudança em andamento); save: guarda o state;
// onChange({ seat, id, from, to, top }): uma mudança terminou (from e to são { max, cur }). clock: o
// relógio (outro, nos testes).
export function createCounterWatch({ ids, state, save = () => {}, onChange, quiet = QUIET, clock = globalThis }) {
  for (const key of ['last', 'top', 'from']) if (!state[key] || typeof state[key] !== 'object') state[key] = {};
  const timers = new Map();
  const keyOf = (seat, id) => `${seat}/${id}`;

  function cancel(seat, id) {
    clock.clearTimeout(timers.get(keyOf(seat, id)));
    timers.delete(keyOf(seat, id));
  }

  function schedule(seat, id) {
    cancel(seat, id);
    timers.set(keyOf(seat, id), clock.setTimeout(() => finish(seat, id), quiet));
  }

  function finish(seat, id) {
    timers.delete(keyOf(seat, id));
    const from = state.from[seat]?.[id], to = state.last[seat]?.[id];
    if (state.from[seat]) delete state.from[seat][id];
    save();
    if (from && to && (from.max !== to.max || from.cur !== to.cur)) {
      onChange({ seat, id, from: { ...from }, to: { ...to }, top: state.top[seat]?.[id] ?? from.cur });
    }
  }

  // Os valores de um jogador, como chegaram agora ({ hp: { max, cur }, … }, ou nada).
  function see(seat, counters) {
    const last = (state.last[seat] ||= {}), top = (state.top[seat] ||= {}), from = (state.from[seat] ||= {});
    for (const id of ids) {
      const prev = last[id], next = counters?.[id];
      if (!next) {   // o jogador apagou o contador: recomeça do zero quando ele voltar
        delete last[id];
        delete top[id];
        delete from[id];
        cancel(seat, id);
        continue;
      }
      const now = { max: next.max, cur: next.cur };
      last[id] = now;
      // o primeiro valor visto, ou um máximo novo (o jogador acertando a ficha): o maior da sessão
      // recomeça dele; depois, só sobe
      top[id] = !prev || prev.max !== now.max || top[id] === undefined ? now.cur : Math.max(top[id], now.cur);
      if (!prev || (prev.max === now.max && prev.cur === now.cur)) continue;
      from[id] ||= prev;
      schedule(seat, id);
    }
    save();
  }

  // o app aberto de novo no meio de uma mudança (guardada em state.from): ela termina depois do tempo
  for (const [seat, list] of Object.entries(state.from)) for (const id of Object.keys(list)) schedule(seat, id);

  return {
    see,
    // Termina na hora as mudanças em andamento (nos testes).
    flush() {
      for (const key of [...timers.keys()]) {
        const [seat, id] = key.split('/');
        cancel(seat, id);
        finish(seat, id);
      }
    },
    stop() {
      for (const timer of timers.values()) clock.clearTimeout(timer);
      timers.clear();
    }
  };
}
