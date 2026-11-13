import { CANNON } from '../vendor.js';
import { rnd, rand, clamp, TAU } from '../lib/util.js';

// A física: gravidade, quiques, atrito e paredes invisíveis na borda da tela.
// Nenhum número é sorteado: o resultado é lido da face (ou ponta) que ficou de fato para cima.

const STEP = 1 / 120;   // a física anda sempre em passos iguais, qualquer que seja o ritmo da tela
const MAX_STEPS = 8;    // passos por quadro, no máximo (num aparelho lento demais, câmera lenta em vez de tela travada)
const scratch = new CANNON.Vec3(), va = new CANNON.Vec3(), vb = new CANNON.Vec3();

// O jeito dos dados: o tamanho (1 é o da versão 1.2) e o peso (0 é como era na versão 1.2).
export const FEEL = { size: .88, weight: 4 };

// O que o peso muda, de 0 a 10: menos quique, mais atrito na mesa, mais freio no giro e uma queda
// mais rápida, como um dado mais denso. O lançamento acompanha a queda (pace), para os dados ainda
// atravessarem a mesa. A borda e os outros dados continuam lisos: um dado que encosta neles
// escorrega e deita, em vez de ficar escorado.
function weigh(weight) {
  const x = clamp(weight, 0, 10) / 10;
  return {
    gravity: 34 + 26 * x,
    table: { friction: .32 + .18 * x, restitution: .36 - .24 * x },
    dice: { friction: .18 - .06 * x, restitution: .45 - .25 * x },
    wall: { friction: .08 - .06 * x, restitution: .5 - .25 * x },
    spin: 1 + 1.2 * x,   // multiplica o freio no giro de cada forma
    drag: .1 + .1 * x
  };
}

function randomQuat() {
  const u1 = rnd(), u2 = rnd(), u3 = rnd(), a = Math.sqrt(1 - u1), b = Math.sqrt(u1);
  return new CANNON.Quaternion(a * Math.sin(TAU * u2), a * Math.cos(TAU * u2), b * Math.sin(TAU * u3), b * Math.cos(TAU * u3));
}

// Reposiciona um corpo de uma vez, sem o desenho "deslizar" da posição antiga até a nova.
function teleport(body, x, y, z, q) {
  body.position.set(x, y, z);
  body.previousPosition.copy(body.position);
  body.interpolatedPosition.copy(body.position);
  body.quaternion.copy(q);
  body.previousQuaternion.copy(q);
  body.interpolatedQuaternion.copy(q);
}

// Velocidade com que os dois pontos de um contato se aproximam, ao longo da normal.
function closing(c) {
  c.bi.angularVelocity.cross(c.ri, va);
  va.vadd(c.bi.velocity, va);
  c.bj.angularVelocity.cross(c.rj, vb);
  vb.vadd(c.bj.velocity, vb);
  vb.vsub(va, vb);
  return -vb.dot(c.ni);
}

export class DiceTable {
  constructor() {
    const world = this.world = new CANNON.World();
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 16;
    const die = this.dieMaterial = new CANNON.Material('die');
    const top = new CANNON.Material('table'), wall = new CANNON.Material('wall');
    this.contacts = {
      table: new CANNON.ContactMaterial(die, top, {}),
      dice: new CANNON.ContactMaterial(die, die, {}),
      wall: new CANNON.ContactMaterial(die, wall, {})
    };
    for (const cm of Object.values(this.contacts)) world.addContactMaterial(cm);
    // Na mesa, quique só de verdade: abaixo de uma velocidade, a batida não devolve nada. A
    // biblioteca devolveria um pouco de qualquer toque, por menor que fosse: a cada passo, a
    // gravidade dá um tiquinho de velocidade ao dado parado, a mesa devolvia como um pulinho, e o
    // dado quase parado tremia. Entre dados e na borda o quique fica, porque ajuda os dados a se
    // soltarem uns dos outros.
    const solve = world.solver.solve.bind(world.solver);
    world.solver.solve = (dt, w) => {
      for (const c of w.contacts) {
        if (c.restitution > 0 && (c.bi === this.floor || c.bj === this.floor) && closing(c) < this.bounceMin) c.restitution = 0;
      }
      return solve(dt, w);
    };
    this.floor = new CANNON.Body({ mass: 0, material: top, shape: new CANNON.Plane() });
    this.floor.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    world.addBody(this.floor);
    // esquerda, direita, fundo, frente
    this.walls = [Math.PI / 2, -Math.PI / 2, 0, Math.PI].map(yaw => {
      const b = new CANNON.Body({ mass: 0, material: wall, shape: new CANNON.Plane() });
      b.quaternion.setFromEuler(0, yaw, 0);
      world.addBody(b);
      return b;
    });
    this.arena = { hw: 3, zMin: -4, zMax: 4 };
    this.dice = [];
    this.roll = null;
    this.muted = false;
    this.lag = 0;   // o tempo da tela que a física ainda não andou (menos de um passo)
    this.onImpact = () => {};   // (força, 'table' | 'wall' | 'die', posição de -1 a 1 da esquerda à direita)
    this.onSettled = () => {};  // todos os dados do lançamento pararam deitados numa face
    this.setFeel(FEEL);
  }

  // O tamanho e o peso dos dados (o painel de ajuste do endereço de teste muda os dois na hora).
  setFeel({ size = this.feel.size, weight = this.feel.weight } = {}) {
    const p = weigh(weight);
    this.feel = { size, weight };
    this.pace = Math.sqrt(p.gravity / 34);
    this.bounceMin = 1.2 * this.pace;
    this.spin = p.spin;
    this.drag = p.drag;
    this.world.gravity.set(0, -p.gravity, 0);
    for (const kind of ['table', 'dice', 'wall']) Object.assign(this.contacts[kind], p[kind]);
    for (const d of this.dice) this.fit(d);
  }

  setArena(arena) {
    Object.assign(this.arena, arena);
    const { hw, zMin, zMax } = this.arena;
    this.walls[0].position.set(-hw, 0, 0);
    this.walls[1].position.set(hw, 0, 0);
    this.walls[2].position.set(0, 0, zMin);
    this.walls[3].position.set(0, 0, zMax);
    if (!this.roll) for (const d of this.dice) {
      const p = d.body.position, m = d.radius + .05;
      p.x = clamp(p.x, -hw + m, hw - m);
      p.z = clamp(p.z, zMin + m, zMax - m);
    }
  }

  addDie(model) {
    const body = new CANNON.Body({ mass: 1, material: this.dieMaterial });
    body.isDie = true;
    const die = {
      model, body, lastHit: 0,
      normals: model.shape.faces.map(f => new CANNON.Vec3(f.normal.x, f.normal.y, f.normal.z)),
      restPos: new CANNON.Vec3(), restQuat: new CANNON.Quaternion(), restTime: 0, leanTime: 0, calmTime: 0, nudges: 0
    };
    this.fit(die);
    body.addEventListener('collide', ev => this.impact(die, ev));
    this.world.addBody(body);
    this.dice.push(die);
    return die;
  }

  // A forma do dado na física, no tamanho atual, e o freio que vem do peso.
  fit(die) {
    const { shape } = die.model, s = this.feel.size, body = die.body;
    const points = shape.V.map(v => new CANNON.Vec3(v.x * s, v.y * s, v.z * s));
    if (body.shapes.length) body.removeShape(body.shapes[0]);
    body.addShape(new CANNON.ConvexPolyhedron({ vertices: points, faces: shape.faces.map(f => f.idx) }));
    body.linearDamping = this.drag;
    body.angularDamping = Math.min(shape.angularDamping * this.spin, .9);
    die.radius = shape.radius * s;
    die.corners = points;
    // altura do centro quando o dado está deitado numa face, direto na mesa
    die.floorHeight = Math.min(...shape.faces.map(f => f.normal.dot(shape.V[f.idx[0]]))) * s;
  }

  removeDie(die) {
    this.world.removeBody(die.body);
    this.dice = this.dice.filter(d => d !== die);
    this.roll = null;
  }

  // Põe de volta, no mesmo lugar, um dado que tinha acabado de sair (o toque duplo desfaz a troca).
  restoreDie(die) {
    this.fit(die);
    this.world.addBody(die.body);
    this.dice.push(die);
  }

  impact(die, ev) {
    if (this.muted) return;
    const other = ev.body;
    // batida entre dois dados: só um deles avisa, para o som não sair dobrado
    if (other.isDie && this.dice.findIndex(d => d.body === other) < this.dice.indexOf(die)) return;
    const v = Math.abs(ev.contact.getImpactVelocityAlongNormal());
    const now = performance.now();
    if (v < .7 * this.pace || now - die.lastHit < 45) return;
    die.lastHit = now;
    const kind = other.isDie ? 'die' : other === this.floor ? 'table' : 'wall';
    this.onImpact(v / this.pace, kind, clamp(die.body.position.x / Math.max(this.arena.hw, 1), -1, 1));
  }

  // Valor que ficou para cima: a face mais virada para o alto (ou a ponta mais alta, no d4).
  read(die) {
    const q = die.body.quaternion, list = die.model.shape.read === 'vertex' ? die.corners : die.normals;
    let best = -Infinity, at = 0;
    list.forEach((v, i) => { const y = q.vmult(v).y; if (y > best) { best = y; at = i; } });
    return die.model.values[at];
  }

  // Quanto a face mais virada para baixo aponta para baixo: −1 é o dado deitado reto numa face.
  lowest(die) {
    const q = die.body.quaternion;
    let low = 1;
    for (const n of die.normals) low = Math.min(low, q.vmult(n, scratch).y);
    return low;
  }

  // O dado está deitado numa face, e não apoiado torto em outro dado ou na borda?
  isFlat(die) { return this.lowest(die) < -.97; }

  // Deitado, mas em cima de outro dado (e não direto na mesa).
  stacked(die) { return die.body.position.y > die.floorHeight + .2; }

  // Dado torto rola de novo, como na mesa de verdade. O primeiro empurrão é o menor que costuma
  // resolver:
  // - em cima de outro dado: rola para fora, para o lado em que já está, como um dado que estava
  //   equilibrado;
  // - escorado na borda ou num vizinho: um pulinho baixo para longe do apoio e para o lado mais
  //   livre da mesa (ele fica preso porque deitado não cabe ali; com espaço, deita sozinho);
  // - de pé numa aresta, tocando só a mesa: basta inclinar.
  // Se não resolver (com muitos dados na mesa, às vezes não há espaço por perto), os dois seguintes
  // são pulinhos de verdade, com giro, para o lugar mais livre da mesa; depois do terceiro, o dado
  // é tirado dali e solto de novo num lugar livre.
  unstick(die) {
    die.leanTime = 0;
    const others = this.dice.filter(o => o !== die);
    if (++die.nudges > 3) return this.place(die, others);
    const k = this.pace, n = die.nudges, body = die.body, away = n === 1 && this.support(die, others);
    if (n > 1) {
      const p = body.position, [fx, fz] = this.freeSpot(die, others);
      const dx = fx - p.x, dz = fz - p.z, dist = Math.hypot(dx, dz) || 1, push = Math.min(1.5 + dist * .8, 4) * k, turn = 6 * k;
      body.velocity.set(dx / dist * push, rand(2.5, 3.5) * k, dz / dist * push);
      body.angularVelocity.set(rand(-turn, turn), rand(-turn, turn), rand(-turn, turn));
    } else if (!away) {
      const a = rand(0, TAU), turn = 2.5 * k;
      body.angularVelocity.set(Math.cos(a) * turn, 0, Math.sin(a) * turn);
    } else if (away.on) {
      // o giro em volta do eixo deitado, de lado para a direção, leva o alto do dado para lá
      const turn = 6 * k;
      body.velocity.set(away.x * .8 * k, .3 * k, away.z * .8 * k);
      body.angularVelocity.set(away.z * turn, 0, -away.x * turn);
    } else {
      const [fx, fz] = this.freeSpot(die, others), p = body.position;
      let x = fx - p.x, z = fz - p.z, len = Math.hypot(x, z) || 1;
      x = away.x + x / len;
      z = away.z + z / len;
      len = Math.hypot(x, z) || 1;
      const push = 2.1 * k, turn = k;
      body.velocity.set(x / len * push, 1.4 * k, z / len * push);
      body.angularVelocity.set(rand(-turn, turn), rand(-turn, turn), rand(-turn, turn));
    }
    body.wakeUp();
  }

  // Encostado na borda ou em outro dado (e não só na mesa)?
  propped(die) {
    return this.world.contacts.some(c => (c.bi === die.body || c.bj === die.body) && c.bi !== this.floor && c.bj !== this.floor);
  }

  // O que segura um dado torto: a direção, no chão, para longe do apoio ({ x, z }), e se ele está
  // em cima de outro dado (on). null quando ele só toca a mesa.
  support(die, others) {
    let x = 0, z = 0, held = false, on = false;
    for (const c of this.world.contacts) {
      const other = c.bi === die.body ? c.bj : c.bj === die.body ? c.bi : null;
      if (!other || other === this.floor) continue;
      held = true;
      // a normal aponta para fora do primeiro corpo do contato
      const s = c.bi === die.body ? -1 : 1;
      let nx = c.ni.x * s, nz = c.ni.z * s;
      // em cima de outro dado, a normal aponta para o alto: o lado é o do centro dele para o do outro
      if (other.isDie && Math.hypot(nx, nz) < .3) {
        on = true;
        nx = die.body.position.x - other.position.x;
        nz = die.body.position.z - other.position.z;
      }
      x += nx;
      z += nz;
    }
    if (!held) return null;
    let len = Math.hypot(x, z);
    if (len < 1e-3) {   // bem no meio do apoio: vai para o lugar mais livre da mesa
      const [fx, fz] = this.freeSpot(die, others);
      x = fx - die.body.position.x;
      z = fz - die.body.position.z;
      len = Math.hypot(x, z) || 1;
    }
    return { x: x / len, z: z / len, on };
  }

  // Pega o dado e solta de novo, de leve, num lugar livre da mesa.
  place(die, others) {
    const [x, z] = this.freeSpot(die, others), k = this.pace;
    teleport(die.body, x, rand(2.2, 2.8) * this.feel.size, z, randomQuat());
    die.body.velocity.set(rand(-.6, .6) * k, 0, rand(-.6, .6) * k);
    die.body.angularVelocity.set(rand(-7, 7) * k, rand(-7, 7) * k, rand(-7, 7) * k);
    die.body.wakeUp();
    die.restTime = die.leanTime = die.calmTime = 0;
  }

  // Conta há quanto tempo o dado está de fato parado, olhando a posição e o giro (e não a
  // velocidade): uma tremidinha da simulação, sem sair do lugar, não segura mais o resultado.
  watch(die, dt) {
    const p = die.body.position, q = die.body.quaternion, r = die.restQuat;
    const turned = Math.abs(q.x * r.x + q.y * r.y + q.z * r.z + q.w * r.w) < .99995;   // mais de ~1°
    if (turned || p.distanceTo(die.restPos) > .015) {
      die.restPos.copy(p);
      r.copy(q);
      die.restTime = 0;
    } else {
      die.restTime += dt;
    }
  }

  // Lança todos os dados da beira mais próxima em direção ao ponto tocado, com força e giro sorteados.
  throw(target) {
    const { hw, zMin, zMax } = this.arena, n = this.dice.length, k = this.pace;
    const tx = clamp(target.x, -hw + 1.2, hw - 1.2), tz = clamp(target.z, zMin + 1, zMax - 2.6);
    // saem lado a lado e um pouco desencontrados; se não cabem numa fileira, formam outras atrás
    const room = Math.max(hw - 1, 0), perRow = Math.max(1, Math.min(n, Math.floor(2 * room / 1.7) + 1));
    const soft = n > 4 ? Math.max(.7, 1 - .05 * (n - 4)) : 1;   // com muitos dados, um lançamento mais suave
    this.dice.forEach((d, i) => {
      const row = Math.floor(i / perRow), col = i % perRow, cols = Math.min(perRow, n - row * perRow);
      const gap = Math.min(1.7, 2 * room / Math.max(cols - 1, 1));
      const cx = clamp(tx * .35, -room + gap * (cols - 1) / 2, room - gap * (cols - 1) / 2);
      const off = (col - (cols - 1) / 2) * gap, m = d.radius + .1, edge = zMax - m;
      const sx = clamp(cx + off + rand(-.25, .25), -hw + m, hw - m);
      const sz = Math.max(edge - (col % 2) * .5 - row * 1.9, zMin + m);
      teleport(d.body, sx, rand(2.2, 3.1) + (col % 2) * .4 + row * .5, sz, randomQuat());
      // todos na mesma direção (da beira para o ponto tocado), abrindo em leque; as fileiras de
      // trás miram mais longe, para os dados não se amontoarem
      const aimZ = Math.max(tz - row * 1.5, zMin + 1);
      const dx = tx + off * .8 + rand(-.6, .6) - sx, dz = aimZ + rand(-.6, .6) - edge;
      const len = Math.hypot(dx, dz) || 1, speed = rand(8, 13) * soft * k;
      d.body.velocity.set(dx / len * speed, rand(1, 4) * k, dz / len * speed);
      d.body.angularVelocity.set(rand(-26, 26) * k, rand(-26, 26) * k, rand(-26, 26) * k);
      d.body.wakeUp();
      d.restTime = d.leanTime = d.calmTime = d.nudges = 0;
    });
    this.roll = { time: 0, report: true };
  }

  // Os dados caem devagar num lugar livre da mesa (ao trocar de dado, ou quando um dado entra na
  // fórmula). Não conta como lançamento. Com `fresh`, só esses caem; os outros ficam onde estão.
  // `avoid`: dados que já saíram da mesa mas ainda podem voltar; ninguém cai no lugar deles.
  drop(fresh, avoid = []) {
    const falling = fresh || this.dice, placed = [...this.dice.filter(d => !falling.includes(d)), ...avoid];
    for (const d of falling) {
      this.place(d, placed);
      placed.push(d);
      d.nudges = 0;
    }
    this.roll = { time: 0, report: false };
  }

  // Entre alguns pontos sorteados na mesa, o mais longe das bordas e dos outros dados (`others`).
  freeSpot(die, others) {
    const { hw, zMin, zMax } = this.arena, m = die.radius + .1;
    let best = [0, (zMin + zMax) / 2], most = -Infinity;
    for (let k = 0; k < 32; k++) {
      const x = rand(-hw + m, hw - m), z = rand(zMin + m, zMax - m);
      let room = Math.min(x + hw, hw - x, z - zMin, zMax - z);
      for (const o of others) room = Math.min(room, Math.hypot(o.body.position.x - x, o.body.position.z - z) - o.radius);
      if (room > most) { most = room; best = [x, z]; }
    }
    return best;
  }

  // Mesma queda, mas simulada na hora e em silêncio (para a mesa já abrir com os dados parados).
  settleNow() {
    this.muted = true;
    this.drop();
    for (let i = 0; i < 4000 && this.roll; i++) {
      this.world.step(STEP);
      this.track(STEP);
    }
    for (const d of this.dice) { d.body.velocity.setZero(); d.body.angularVelocity.setZero(); }
    this.roll = null;
    this.muted = false;
  }

  // A física anda em passos iguais de 1/120 s, quantos couberem no tempo do quadro, e os relógios
  // do lance contam esses passos, e não o relógio da tela: o que acontece com os dados é o mesmo em
  // qualquer aparelho. (Sozinha, a biblioteca de física pula passos quando o quadro fica pesado, e
  // os dados andavam em câmera lenta enquanto os relógios do lance corriam no tempo da tela.) O
  // desenho fica entre os dois últimos passos, na proporção do tempo que sobrou.
  step(dt) {
    this.lag += dt;
    for (let n = 0; this.lag >= STEP; n++) {
      if (n === MAX_STEPS) { this.lag = 0; break; }
      this.world.step(STEP);
      this.lag -= STEP;
      if (this.roll) this.track(STEP);
    }
    const t = this.lag / STEP;
    for (const b of this.world.bodies) {
      b.previousPosition.lerp(b.position, t, b.interpolatedPosition);
      b.previousQuaternion.slerp(b.quaternion, t, b.interpolatedQuaternion);
      b.interpolatedQuaternion.normalize();
    }
  }

  // Espera os dados pararem, contando o tempo da física. Dado parado torto (ou em cima de outro
  // dado) rola de novo; quando todos estão deitados numa face, os valores são lidos.
  // - Dado torto e parado, escorado na borda ou noutro dado, rola de novo logo, sem esperar os
  //   outros: o empurrão se mistura ao fim do lance, enquanto os dados ainda estão assentando.
  // - Dado torto que não para de escorregar devagar também rola de novo, sem esperar os outros.
  // - Dado já deitado numa face, direto na mesa, e quase parado dorme: fica parado de vez, e só
  //   acorda se outro dado bater nele com força.
  // - Depois de 10 s, dado deitado numa face vale mesmo que ainda se mexa.
  track(dt) {
    const r = this.roll, k2 = this.pace ** 2;
    r.time += dt;
    for (const d of this.dice) {
      this.watch(d, dt);
      const v2 = d.body.velocity.lengthSquared(), w2 = d.body.angularVelocity.lengthSquared();
      const ok = this.isFlat(d) && !this.stacked(d);
      d.leanTime = !ok && v2 < 2.25 * k2 && w2 < 9 * k2 ? d.leanTime + dt : 0;
      d.calmTime = ok && v2 < .09 * k2 && w2 < .09 * k2 ? d.calmTime + dt : 0;
      if (d.calmTime > .3 && d.body.sleepState !== CANNON.Body.SLEEPING) d.body.sleep();
    }
    const sliding = this.dice.filter(d => d.leanTime > 1 || (d.leanTime > 0 && d.restTime > .2 && this.propped(d)));
    if (sliding.length) {
      sliding.forEach(d => this.unstick(d));
      return;
    }
    const still = r.time > .6 && this.dice.every(d => d.restTime > .35);
    if (!still && r.time < 10) return;
    const leaning = this.dice.filter(d => !this.isFlat(d) || this.stacked(d));
    if (leaning.length) {
      leaning.forEach(d => this.unstick(d));
      if (r.time >= 10) r.time = 7;
      return;
    }
    this.roll = null;
    if (r.report) this.onSettled();
  }
}
