// O que cada botão da bandeja rola e como o resultado é calculado e escrito.
// O d100 são dois d10: um de dezenas (00 a 90) e um de unidades (0 a 9); "00" com "0" vale 100.

const range = (from, to, step = 1) => {
  const out = [];
  for (let v = from; v <= to; v += step) out.push(v);
  return out;
};
const pad2 = v => String(v).padStart(2, '0');

const single = (shape, faces, subtitle) => ({
  id: shape, name: shape, subtitle,
  dice: [{ shape, role: 'single', values: range(1, faces) }],
  combine: ([v]) => ({ total: v, text: String(v), detail: '' })
});

export const DICE_SETS = [
  single('d4', 4, 'Quatro faces'),
  single('d6', 6, 'Seis faces'),
  single('d8', 8, 'Oito faces'),
  single('d10', 10, 'Dez faces'),
  single('d12', 12, 'Doze faces'),
  single('d20', 20, 'Vinte faces'),
  {
    id: 'd100', name: 'd100', subtitle: 'Teste percentual',
    dice: [
      { shape: 'd10', role: 'tens', values: range(0, 90, 10), label: pad2 },
      { shape: 'd10', role: 'units', values: range(0, 9) }
    ],
    combine: ([tens, units]) => {
      const total = tens + units || 100;
      return { total, text: total === 100 ? '100' : pad2(total), detail: `${pad2(tens)} + ${units}` };
    }
  }
];
