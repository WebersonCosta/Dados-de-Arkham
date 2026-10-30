import { CANNON } from '../vendor.js';
import { rnd, rand, clamp, TAU } from '../lib/util.js';

// A física: gravidade, quiques, atrito e paredes invisíveis na borda da tela.
// Nenhum número é sorteado: o resultado é lido da face (ou ponta) que ficou de fato para cima.

const STEP = 1 / 120;
const scratch = new CANNON.Vec3();

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

export class DiceTable {
  constructor() {
    const world = this.world = new CANNON.World({ gravity: new CANNON.Vec3(0, -34, 0) });
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 16;
    const die = this.dieMaterial = new CANNON.Material('die');
    const top = new CANNON.Material('table'), wall = new CANNON.Material('wall');
    world.addContactMaterial(new CANNON.ContactMaterial(die, top, { friction: .32, restitution: .36 }));
    world.addContactMaterial(new CANNON.ContactMaterial(die, die, { friction: .18, restitution: .45 }));
    world.addContactMaterial(new CANNON.ContactMaterial(die, wall, { friction: .08, restitution: .5 }));
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
    this.onImpact = () => {};   // (força, 'table' | 'wall' | 'die', posição de -1 a 1 da esquerda à direita)
    this.onSettled = () => {};  // todos os dados do lançamento pararam deitados numa face
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
    const { shape } = model;
    const body = new CANNON.Body({
      mass: 1, material: this.dieMaterial, linearDamping: .1, angularDamping: shape.angularDamping,
      shape: new CANNON.ConvexPolyhedron({
        vertices: shape.V.map(v => new CANNON.Vec3(v.x, v.y, v.z)),
        faces: shape.faces.map(f => f.idx)
      })
    });
    body.isDie = true;
    const die = {
      model, body, radius: shape.radius, lastHit: 0,
      normals: shape.faces.map(f => new CANNON.Vec3(f.normal.x, f.normal.y, f.normal.z)),
      corners: shape.V.map(v => new CANNON.Vec3(v.x, v.y, v.z)),
      // altura do centro quando o dado está deitado numa face, direto na mesa
      floorHeight: Math.min(...shape.faces.map(f => f.normal.dot(shape.V[f.idx[0]]))),
      restPos: new CANNON.Vec3(), restQuat: new CANNON.Quaternion(), restTime: 0, leanTime: 0, calmTime: 0, nudges: 0
    };
    body.addEventListener('collide', ev => this.impact(die, ev));
    this.world.addBody(body);
    this.dice.push(die);
    return die;
  }

  removeDie(die) {
    this.world.removeBody(die.body);
    this.dice = this.dice.filter(d => d !== die);
    this.roll = null;
  }

  // Põe de volta, no mesmo lugar, um dado que tinha acabado de sair (o toque duplo desfaz a troca).
  restoreDie(die) {
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
    if (v < .7 || now - die.lastHit < 45) return;
    die.lastHit = now;
    const kind = other.isDie ? 'die' : other === this.floor ? 'table' : 'wall';
    this.onImpact(v, kind, clamp(die.body.position.x / Math.max(this.arena.hw, 1), -1, 1));
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

  // Dado torto rola de novo, como na mesa de verdade: um pulinho com giro novo, na direção do lugar
  // mais livre da mesa, para sair do canto ou da pilha em que ficou apoiado. Se continuar preso
  // depois de dois pulinhos, é tirado dali e solto de novo num lugar livre.
  unstick(die) {
    die.leanTime = 0;
    const others = this.dice.filter(o => o !== die);
    if (++die.nudges > 2) return this.place(die, others);
    const p = die.body.position, [fx, fz] = this.freeSpot(die, others);
    const dx = fx - p.x, dz = fz - p.z, dist = Math.hypot(dx, dz) || 1, push = Math.min(1.8 + dist * .9, 4.5);
    die.body.velocity.set(dx / dist * push, rand(3.5, 5), dz / dist * push);
    die.body.angularVelocity.set(rand(-10, 10), rand(-10, 10), rand(-10, 10));
    die.body.wakeUp();
  }

  // Pega o dado e solta de novo, de leve, num lugar livre da mesa.
  place(die, others) {
    const [x, z] = this.freeSpot(die, others);
    teleport(die.body, x, rand(2.2, 2.8), z, randomQuat());
    die.body.velocity.set(rand(-.6, .6), 0, rand(-.6, .6));
    die.body.angularVelocity.set(rand(-7, 7), rand(-7, 7), rand(-7, 7));
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
    const { hw, zMin, zMax } = this.arena, n = this.dice.length;
    const tx = clamp(target.x, -hw + 1.2, hw - 1.2), tz = clamp(target.z, zMin + 1, zMax - 2.6);
    // saem lado a lado e um pouco desencontrados; se não cabem numa fileira, formam outras atrás
    const room = Math.max(hw - 1, 0), perRow = Math.max(1, Math.min(n, Math.floor(2 * room / 1.7) + 1));
    const soft = n > 4 ? Math.max(.7, 1 - .05 * (n - 4)) : 1;   // com muitos dados, um lançamento mais suave
    this.dice.forEach((d, i) => {
      const row = Math.floor(i / perRow), col = i % perRow, k = Math.min(perRow, n - row * perRow);
      const gap = Math.min(1.7, 2 * room / Math.max(k - 1, 1));
      const cx = clamp(tx * .35, -room + gap * (k - 1) / 2, room - gap * (k - 1) / 2);
      const off = (col - (k - 1) / 2) * gap, m = d.radius + .1, edge = zMax - m;
      const sx = clamp(cx + off + rand(-.25, .25), -hw + m, hw - m);
      const sz = Math.max(edge - (col % 2) * .5 - row * 1.9, zMin + m);
      teleport(d.body, sx, rand(2.2, 3.1) + (col % 2) * .4 + row * .5, sz, randomQuat());
      // todos na mesma direção (da beira para o ponto tocado), abrindo em leque; as fileiras de
      // trás miram mais longe, para os dados não se amontoarem
      const aimZ = Math.max(tz - row * 1.5, zMin + 1);
      const dx = tx + off * .8 + rand(-.6, .6) - sx, dz = aimZ + rand(-.6, .6) - edge;
      const len = Math.hypot(dx, dz) || 1, speed = rand(8, 13) * soft;
      d.body.velocity.set(dx / len * speed, rand(1, 4), dz / len * speed);
      d.body.angularVelocity.set(rand(-26, 26), rand(-26, 26), rand(-26, 26));
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

  step(dt) {
    this.world.step(STEP, dt, 8);
    if (this.roll) this.track(dt);
  }

  // Espera os dados pararem. Dado parado torto (ou em cima de outro dado) rola de novo; quando
  // todos estão deitados numa face, os valores são lidos.
  // - Dado torto que não para de escorregar devagar (escorado num canto ou noutro dado) também
  //   rola de novo, sem esperar os outros.
  // - Dado já deitado numa face, direto na mesa, e quase parado é segurado de vez: a face de cima
  //   não muda mais, e assim um empurrãozinho de um vizinho não segura o resultado.
  // - Depois de 10 s, dado deitado numa face vale mesmo que ainda se mexa.
  track(dt) {
    const r = this.roll;
    r.time += dt;
    for (const d of this.dice) {
      this.watch(d, dt);
      const v2 = d.body.velocity.lengthSquared(), w2 = d.body.angularVelocity.lengthSquared();
      const ok = this.isFlat(d) && !this.stacked(d);
      d.leanTime = !ok && v2 < 2.25 && w2 < 9 ? d.leanTime + dt : 0;
      d.calmTime = ok && v2 < .09 && w2 < .09 ? d.calmTime + dt : 0;
      if (d.calmTime > .4) { d.body.velocity.setZero(); d.body.angularVelocity.setZero(); }
    }
    const sliding = this.dice.filter(d => d.leanTime > 1);
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
