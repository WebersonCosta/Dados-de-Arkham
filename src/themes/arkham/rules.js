// Regras de Call of Cthulhu (7ª edição) usadas pelo tema Arkham. A física só lança os dados e lê
// as faces que ficaram para cima; o que esses números valem é decidido aqui.

const pad2 = v => String(v).padStart(2, '0');

// Crítico e desastre: valem só no d100 e olham o resultado final. 01 é sucesso crítico, 100 é desastre.
export function critical(setId, result) {
  if (setId !== 'd100') return null;
  if (result.total === 1) return { kind: 'critical', label: 'Sucesso crítico' };
  if (result.total === 100) return { kind: 'fumble', label: 'Desastre' };
  return null;
}

// Dados de bônus e de penalidade: dezenas a mais, lançadas junto com o d100. Cada dezena é somada à
// mesma unidade; o bônus fica com o menor resultado e a penalidade com o maior. Como "00" com
// unidade 0 vale 100, nesse caso a dezena "00" é a pior de todas, e não a melhor (como no livro).
function extraTens(tone, count) {
  const word = tone === 'bonus' ? 'bônus' : 'penalidade';
  return {
    id: `${tone}-${count}`,
    chip: String(count),
    group: word,
    tone,
    name: `${count} ${count === 1 ? 'dado' : 'dados'} de ${word}`,
    extra: { role: 'tens', count },   // mais `count` dados iguais ao das dezenas
    // values: dezenas, unidade e as dezenas a mais, na ordem em que os dados entraram na mesa
    combine(values, set) {
      const [first, units, ...more] = values;
      const tries = [first, ...more].map((tens, i) => ({ at: i && i + 1, tens, ...set.combine([tens, units]) }));
      const better = (a, b) => (tone === 'bonus' ? b.total < a.total : b.total > a.total);
      const kept = tries.reduce((a, b) => (better(a, b) ? b : a));
      return {
        total: kept.total, text: kept.text, detail: kept.detail,
        // na tela: todas as dezenas (as descartadas riscadas) e a unidade
        pieces: [...tries].sort((a, b) => a.tens - b.tens)
          .map(t => ({ text: pad2(t.tens), dropped: t !== kept }))
          .concat({ text: `+ ${units}` }),
        // na mesa: os dados das dezenas descartadas ficam apagados
        discard: tries.filter(t => t !== kept).map(t => t.at)
      };
    }
  };
}

// O 1d3 de Call of Cthulhu: rola-se um d6 comum, e 1-2 vale 1, 3-4 vale 2, 5-6 vale 3.
// Entra nas fórmulas como qualquer outro dado (por exemplo, "1d3 + 1d4").
export const kinds = {
  d3: {
    name: 'd3', subtitle: 'Três faces (rolado com um d6)', shape: 'd6', faces: 6,
    points: v => Math.ceil(v / 2),
    explain: 'no 1d3, o d6 vale: 1-2 → 1 · 3-4 → 2 · 5-6 → 3'
  }
};

// Atalhos prontos, comuns em Call of Cthulhu.
export const shortcuts = [
  { formula: '3d6', note: 'FOR CON DES APA POD' },
  { formula: '2d6+6', note: 'TAM INT EDU' },
  { formula: '1d3', note: 'soco' },
  { formula: '1d4' },
  { formula: '1d6' },
  { formula: '1d10' }
];

// Os valores do investigador na mesa compartilhada, na ordem da tela (o botão perto da bandeja
// mostra os dois primeiros). short: como aparece na tela; name: por extenso. Os dois também são como
// a ficha do personagem vai escrever cada um, na tabela "Valores derivados".
export const counters = [
  { id: 'hp', short: 'PV', name: 'Pontos de Vida' },
  { id: 'san', short: 'SAN', name: 'Sanidade' },
  { id: 'luck', short: 'Sorte', name: 'Sorte' },
  { id: 'mp', short: 'PM', name: 'Pontos de Magia' }
];

// Alertas para o Guardião, com base nos valores que cada jogador ajusta na mesa compartilhada. Só o
// aparelho do Guardião calcula e mostra: os jogadores não recebem nada. São lembretes da regra, com
// texto próprio; quem decide é o Guardião.
// change: uma mudança de um valor, com as mudanças seguidas já juntas numa só (src/core/counter-
// watch.js): { id, from, to, top }, em que from e to são { max, cur } e top é o maior valor visto
// nesta sessão. memory: o que este jogador já teve nesta sessão (guardado pelo app; os alertas anotam
// nele). Devolve as linhas do alerta; nenhuma, sem alerta.
// As metades e os quintos arredondam para baixo, como os valores difícil e extremo das perícias.
const half = n => Math.max(1, Math.floor(n / 2));
const fifth = n => Math.max(1, Math.floor(n / 5));

export function alerts({ id, from, to, top }, memory) {
  const lost = from.cur - to.cur;
  if (from.max !== to.max || lost <= 0) return [];   // mexeu no máximo (acertando a ficha) ou não perdeu nada
  if (id === 'san') return sanity(lost, to, top, memory);
  if (id === 'hp') return health(lost, to, memory);
  return [];
}

function sanity(lost, to, top, memory) {
  if (to.cur === 0) return ['Chegou a 0 de SAN: insanidade permanente. O investigador deixa de ser um personagem jogável.'];
  const lines = [];
  const total = top - to.cur;
  if (!memory.indefinite && total >= fifth(top)) {
    memory.indefinite = true;
    lines.push(`Já perdeu ${total} de SAN nesta sessão (tinha ${top}): um quinto ou mais. Se tudo isso foi num mesmo dia de jogo, ` +
      'o investigador fica indefinidamente insano, sem teste de INT.');
  }
  if (lost >= 5) {
    lines.push('Perdeu 5 ou mais de uma vez. Se veio de uma rolagem de Sanidade só, peça um teste de INT: se passar, o ' +
      'investigador entende o que viu e fica temporariamente insano (1D10 horas, a começar por um surto de loucura); se ' +
      'falhar, a mente bloqueia a lembrança e ele segue são.');
  }
  return lines;
}

function health(lost, to, memory) {
  const major = lost >= half(to.max);
  if (to.cur === 0) {
    const wounded = major || memory.wounded;
    if (major) memory.wounded = true;
    return [
      wounded
        ? `Chegou a 0 PV com um ferimento grave (${major ? 'esta perda já é um, se veio de um golpe só' : 'o app viu um nesta sessão'}): está ` +
          'morrendo. No fim de cada rodada, a partir da próxima, teste de CON; se falhar, morre. Só um Primeiros Socorros ' +
          'bem-sucedido o estabiliza.'
        : 'Chegou a 0 PV sem ferimento grave nesta sessão: fica inconsciente, mas não morre por isso. Se ainda tem um ferimento ' +
          'grave de antes, está morrendo: teste de CON no fim de cada rodada, a partir da próxima.',
      'Se um golpe só tirou o PV máximo ou mais, a morte é na hora.'
    ];
  }
  if (!major) return [];
  memory.wounded = true;
  return [`Perdeu ${lost} de uma vez, metade do máximo (${to.max}) ou mais. Se foi um golpe só, é um ferimento grave: marque ` +
    'na ficha e peça um teste de CON; se falhar, o investigador desmaia.'];
}

// Opções do d100, da esquerda para a direita. A que não põe dados a mais na mesa é a normal.
export const modes = {
  d100: {
    title: 'Dados de bônus e de penalidade',
    options: [
      extraTens('penalty', 2), extraTens('penalty', 1),
      { id: 'normal', chip: 'Normal', name: 'Normal' },
      extraTens('bonus', 1), extraTens('bonus', 2)
    ]
  }
};
