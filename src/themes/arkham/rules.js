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
