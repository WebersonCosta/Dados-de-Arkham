import { DIE_KINDS } from './dice-sets.js';

// Fórmulas de rolagem: grupos de dados iguais (2d6, 1d8…) e um número fixo (+6, −2), como em
// "1d8 + 1d4 + 2". Os tipos de dado são os comuns (d4 a d20) mais os que o tema acrescentar.
// Uma fórmula é { groups: [{ kind: 'd6', count: 2 }], fixed: 6 }.

export const MAX_DICE = 8;     // dados na mesa de uma vez: com mais, a mesa do celular vira um amontoado
export const MAX_FIXED = 99;   // maior número fixo, para mais ou para menos

const MINUS = '−';
const signed = (n, gap = ' ') => (n < 0 ? `${MINUS}${gap}${-n}` : `+${gap}${n}`);

export function createFormulas(themeKinds = {}) {
  const kinds = { ...DIE_KINDS, ...themeKinds };
  // Um molde por tipo de dado, sempre o mesmo objeto: assim a mesa reconhece os dados que já estão nela.
  const specs = {};
  const specOf = id => specs[id] ??= {
    key: id, setId: id, role: 'single', shape: kinds[id].shape,
    values: Array.from({ length: kinds[id].faces }, (_, i) => i + 1)
  };

  const count = f => f.groups.reduce((n, g) => n + g.count, 0);
  const has = (f, kind) => f.groups.some(g => g.kind === kind);
  const single = kind => ({ groups: [{ kind, count: 1 }], fixed: 0 });

  // Como se escreve: "2d6 + 6" na tela, ou "2d6+6" para guardar.
  function text(f, gap = ' ') {
    const dice = f.groups.map(g => `${g.count}${kinds[g.kind].name}`).join(`${gap}+${gap}`);
    return f.fixed ? `${dice}${gap}${signed(f.fixed, gap)}` : dice;
  }

  // Mais um dado desse tipo; null se a mesa já tem o máximo.
  function add(f, kind) {
    if (count(f) >= MAX_DICE) return null;
    const groups = has(f, kind)
      ? f.groups.map(g => (g.kind === kind ? { ...g, count: g.count + 1 } : g))
      : [...f.groups, { kind, count: 1 }];
    return { groups, fixed: f.fixed };
  }

  const withFixed = (f, fixed) => ({ groups: f.groups, fixed: Math.max(-MAX_FIXED, Math.min(MAX_FIXED, fixed)) });

  // Lê "2d6+6", "1d8 + 1d4", "d20" ou "3d6-2"; null se não for uma fórmula que dá para rolar.
  function parse(input) {
    const s = String(input ?? '').replace(/\s+/g, '').replace(/−/g, '-').toLowerCase();
    if (!/^([+-]?(\d*d\d+|\d+))+$/.test(s)) return null;
    let f = { groups: [], fixed: 0 };
    for (const [, sign, n, faces, num] of s.matchAll(/([+-]?)(?:(\d*)d(\d+)|(\d+))/g)) {
      if (num !== undefined) { f.fixed += (sign === '-' ? -1 : 1) * Number(num); continue; }
      const kind = `d${faces}`, times = n === '' ? 1 : Number(n);
      if (sign === '-' || !kinds[kind] || !times) return null;
      for (let i = 0; i < times; i++) if (!(f = add(f, kind))) return null;
    }
    return f.groups.length ? withFixed(f, f.fixed) : null;
  }

  // O que vai para a mesa e como se soma: um dado de cada vez, na ordem da fórmula.
  function toSet(f) {
    const dice = f.groups.flatMap(g => Array(g.count).fill(specOf(g.kind)));
    const lone = dice.length === 1 && !f.fixed;
    return {
      id: text(f, ''), name: text(f),
      subtitle: dice.length === 1 ? kinds[f.groups[0].kind].subtitle : 'Vários dados',
      dice,
      combine(values) {
        const rolled = values.map((v, i) => {
          const kind = kinds[dice[i].setId], points = kind.points ? kind.points(v) : v;
          return { kind, points, shown: points === v ? String(v) : `${v}→${points}` };   // no d3: "5→3"
        });
        const total = rolled.reduce((sum, r) => sum + r.points, 0) + f.fixed;
        const written = total < 0 ? `${MINUS}${-total}` : String(total);
        const sum = rolled.map(r => r.shown).join(' + ') + (f.fixed ? ` ${signed(f.fixed)}` : '');
        const explain = [...new Set(rolled.map(r => r.kind.explain).filter(Boolean))];
        return {
          total, text: written,
          // um dado sozinho mostra o próprio nome (ou a conversão, no d3); mais que isso, a conta
          detail: lone ? (rolled[0].kind.points ? rolled[0].shown : text(f)) : `${sum} = ${written}`,
          note: [lone ? '' : text(f), ...explain].filter(Boolean).join('\n')
        };
      }
    };
  }

  return { kinds, count, has, single, add, withFixed, text, parse, toSet };
}
