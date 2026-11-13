// Medições da física dos dados, para rodar no computador (python tools/servidor-local.py), no
// console da página http://localhost:8766:
//
//   const m = await import('/tools/medir-dados.js');
//   await m.medir('8d6', { lances: 100 })                  // tempo até o resultado e empurrões
//   await m.medir('d20', { lances: 4000, justica: true })  // e se as faces saem por igual
//   await m.medir('d100', { opcao: 'bonus-2' })            // o d100 com 2 dados de bônus
//   await m.medir('8d6', { celular: 5, desenho: 8 })       // como num celular 5 vezes mais lento
//
// A página para de desenhar (os dados continuam na mesa, mas parados na tela) e os lances vão
// direto para a física, contando o tempo como a página contaria: cada quadro dura o trabalho
// feito (a física, mais `desenho` milissegundos de desenho), no mínimo 1/60 s e no máximo 1/20 s.
// `celular` multiplica o custo de cada passo da física, para imitar um aparelho mais lento. Os
// lances rodam de uma vez, sem pausa (com o painel do navegador escondido, as pausas da página
// ficam lentas demais): para muitos lances lentos, divida em várias chamadas.

const D = () => window.__dados;
let ready = false;

function prepare() {
  if (ready) return;
  window.requestAnimationFrame = () => 0;   // a página para de desenhar sozinha
  D().stage.render = () => {};
  ready = true;
}

const median = list => { const s = [...list].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const p90 = list => { const s = [...list].sort((a, b) => a - b); return s.length ? s[Math.floor(s.length * .9)] : 0; };
const round = (v, n = 2) => Math.round(v * 10 ** n) / 10 ** n;

// Probabilidade de um desvio pelo menos tão grande quanto o medido, se as faces saem por igual
// (qui-quadrado, pela aproximação de Wilson e Hilferty). Abaixo de 0,01, algo está torto.
function chiSquare(counts) {
  const values = Object.values(counts), n = values.reduce((a, b) => a + b, 0), k = values.length, e = n / k;
  const chi = values.reduce((s, o) => s + (o - e) ** 2 / e, 0), df = k - 1;
  const z = (Math.cbrt(chi / df) - (1 - 2 / (9 * df))) / Math.sqrt(2 / (9 * df));
  const p = .5 * erfc(z / Math.SQRT2);
  return { n, faces: k, chi: round(chi), p: round(p, 3) };
}
function erfc(x) {
  const t = 1 / (1 + .5 * Math.abs(x));
  const y = t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (.37409196 + t * (.09678418 + t * (-.18628806 +
    t * (.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-.82215223 + t * .17087277)))))))));
  return x >= 0 ? y : 2 - y;
}

// O que deixou o dado torto na hora do empurrão: em cima de outro dado, encostado na parede ou em
// outro dado, ou de pé numa aresta (ou ponta), tocando só a mesa.
function cause(table, die) {
  const touching = new Set();
  for (const c of table.world.contacts) {
    const other = c.bi === die.body ? c.bj : c.bj === die.body ? c.bi : null;
    if (!other) continue;
    touching.add(other.isDie ? 'dado' : other === table.floor ? 'mesa' : 'parede');
  }
  if (!touching.size) return 'no ar';
  if (touching.has('dado') && table.stacked(die)) return 'em cima de outro dado';
  if (touching.has('parede')) return 'encostado na parede';
  if (touching.has('dado')) return 'encostado em outro dado';
  return 'de pé numa aresta, só na mesa';
}

// Velocidade com que os dois pontos de um contato se aproximam, ao longo da normal.
let va, vb;
function closing(c) {
  va ||= c.ni.clone();
  vb ||= c.ni.clone();
  c.bi.angularVelocity.cross(c.ri, va);
  va.vadd(c.bi.velocity, va);
  c.bj.angularVelocity.cross(c.rj, vb);
  vb.vadd(c.bj.velocity, vb);
  vb.vsub(va, vb);
  return -vb.dot(c.ni);
}

// Escolhe o que vai para a mesa e espera os dados caírem.
function choose(set, opcao) {
  const d = D();
  if (set === 'd100') {
    d.chooseSet(d.D100, { instant: true });
    const option = opcao && d.theme.modes.d100.options.find(o => o.id === opcao);
    if (option) d.chooseMode(option);
  } else {
    d.setFormula(d.formulas.parse(set), { instant: true });
  }
  for (let i = 0; i < 2000 && d.table.roll; i++) d.table.step(1 / 60);
}

export async function medir(set, { lances = 100, celular = 1, desenho = 0, opcao = null, justica = false } = {}) {
  prepare();
  choose(set, opcao);
  const { table } = D(), world = table.world;
  const results = { real: [], sim: [], nudges: [], places: [], causes: {}, counts: {}, steps: 0, bailouts: 0, cost: 0, peak: 0, shaking: 0 };
  let steps = 0, nudges = 0, places = 0;

  // instrumentos: cada passo da física (o custo dele e o extra do celular imitado), os quiques
  // pequenos de um dado quase parado (o tremor), cada empurrão e cada vez que um dado é tirado do
  // lugar e solto de novo
  const internalStep = world.internalStep, solve = world.solver.solve, unstick = table.unstick, place = table.place, settled = table.onSettled;
  world.internalStep = function (dt) {
    const t0 = performance.now();
    internalStep.call(this, dt);
    steps++;
    const cost = performance.now() - t0;
    results.cost += cost;
    results.peak = Math.max(results.peak, cost);
    const end = performance.now() + cost * (celular - 1);
    while (performance.now() < end);
  };
  world.solver.solve = function (dt, w) {
    const small = w.contacts.filter(c => { const s = closing(c); return s > .3 && s < 2; });
    const out = solve.call(this, dt, w);
    if (small.some(c => c.restitution > 0)) results.shaking++;
    return out;
  };
  table.unstick = function (die) {
    nudges++;
    const why = cause(this, die);
    results.causes[why] = (results.causes[why] || 0) + 1;
    return unstick.call(this, die);
  };
  table.place = function (die, others) {
    if (this.roll?.report) places++;
    return place.call(this, die, others);
  };

  try {
    for (let i = 0; i < lances; i++) {
      let done = false;
      table.onSettled = () => { done = true; };
      const { hw, zMin, zMax } = table.arena;
      steps = nudges = places = 0;
      table.throw({ x: (Math.random() - .5) * hw * 1.2, z: zMin + 1 + Math.random() * Math.max(zMax - zMin - 4, .1) });
      let real = 0, dt = 1 / 60;
      while (!done && real < 30) {
        const t0 = performance.now(), before = steps;
        table.step(dt);
        // a biblioteca de física desiste de alcançar o relógio quando o quadro fica pesado
        if (steps - before < Math.floor(dt * 120 + 1e-9) - 1) results.bailouts++;
        const work = (performance.now() - t0) / 1000 + desenho / 1000;
        real += dt;
        dt = Math.min(Math.max(work, 1 / 60), 1 / 20);
      }
      results.real.push(real);
      results.sim.push(steps / 120);
      results.nudges.push(nudges);
      results.places.push(places);
      results.steps += steps;
      if (justica) {
        for (const d of D().current.dice) {
          const key = d.spec.key || d.spec.kind || d.spec.shape, value = table.read(d.die);
          (results.counts[key] ||= {})[value] = (results.counts[key][value] || 0) + 1;
        }
      }
    }
  } finally {
    world.internalStep = internalStep;
    world.solver.solve = solve;
    table.unstick = unstick;
    table.place = place;
    table.onSettled = settled;
  }

  const withNudge = results.nudges.filter(n => n > 0).length;
  const summary = {
    conjunto: set + (opcao ? ` (${opcao})` : ''), lances, celular, desenho,
    tempoAteResultado: { mediana: round(median(results.real)), p90: round(p90(results.real)) },
    tempoSimulado: { mediana: round(median(results.sim)), p90: round(p90(results.sim)) },
    lancesComEmpurrao: `${round(100 * withNudge / lances, 1)}%`,
    empurroesPorLance: round(results.nudges.reduce((a, b) => a + b, 0) / lances, 3),
    dadosTiradosDoLugar: results.places.reduce((a, b) => a + b, 0),
    quadrosEmQueAFisicaDesistiu: results.bailouts,
    // segundos, por lance, em que algum dado deu quiques pequenos (de 0,3 a 2 por segundo)
    tremorPorLance: round(results.shaking / 120 / lances),
    custoDoPasso: { mediaMs: round(results.cost / Math.max(results.steps, 1), 3), maiorMs: round(results.peak, 2) },
    motivos: results.causes
  };
  if (justica) summary.justica = Object.fromEntries(Object.entries(results.counts).map(([k, c]) => [k, chiSquare(c)]));
  return summary;
}
