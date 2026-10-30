// Pequenas ferramentas usadas em todo o app.

export const TAU = Math.PI * 2;

// Sorteio com o gerador criptográfico do navegador: imprevisível e uniforme.
const pool = new Uint32Array(256);
let next = pool.length;
export function rnd() {
  if (next >= pool.length) { crypto.getRandomValues(pool); next = 0; }
  return pool[next++] / 4294967296;
}
export const rand = (a, b) => a + rnd() * (b - a);
export const pick = list => list[Math.floor(rnd() * list.length)];
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
