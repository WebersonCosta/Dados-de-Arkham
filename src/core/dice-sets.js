// O que cada botão da bandeja rola e como o resultado é calculado e escrito.
// Os dados comuns (d4 a d20) entram nas fórmulas, como "2d6 + 6" ou "1d8 + 1d4" (veja formula.js).
// O d100 é à parte: dois d10, um de dezenas (00 a 90) e um de unidades (0 a 9); "00" com "0" vale 100.

const range = (from, to, step = 1) => {
  const out = [];
  for (let v = from; v <= to; v += step) out.push(v);
  return out;
};
const pad2 = v => String(v).padStart(2, '0');

// Tipos de dado das fórmulas. O tema pode acrescentar outros (o Arkham tem o d3, rolado com um d6).
export const DIE_KINDS = {
  d4: { name: 'd4', subtitle: 'Quatro faces', shape: 'd4', faces: 4 },
  d6: { name: 'd6', subtitle: 'Seis faces', shape: 'd6', faces: 6 },
  d8: { name: 'd8', subtitle: 'Oito faces', shape: 'd8', faces: 8 },
  d10: { name: 'd10', subtitle: 'Dez faces', shape: 'd10', faces: 10 },
  d12: { name: 'd12', subtitle: 'Doze faces', shape: 'd12', faces: 12 },
  d20: { name: 'd20', subtitle: 'Vinte faces', shape: 'd20', faces: 20 }
};

export const D100 = {
  id: 'd100', name: 'd100', subtitle: 'Teste percentual',
  dice: [
    { key: 'd100/tens', setId: 'd100', shape: 'd10', role: 'tens', values: range(0, 90, 10), label: pad2 },
    { key: 'd100/units', setId: 'd100', shape: 'd10', role: 'units', values: range(0, 9) }
  ],
  combine: ([tens, units]) => {
    const total = tens + units || 100;
    return { total, text: total === 100 ? '100' : pad2(total), detail: `${pad2(tens)} + ${units}` };
  }
};
