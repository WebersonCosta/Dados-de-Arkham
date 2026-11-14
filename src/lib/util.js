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

// Fechar uma folha tocando ou clicando fora dela, no fundo escuro. Só vale se o toque começou e
// terminou no fundo: no PC, um clique que começa num campo e termina fora da folha (um campo que, ao
// ganhar o foco, muda a folha de lugar; um texto selecionado arrastando) não fecha nada. O navegador
// manda esse clique para o fundo, que contém os dois pontos.
export function closeOnBackdrop(sheet, close) {
  let down = false;
  sheet.addEventListener('pointerdown', ev => { down = ev.target === sheet; });
  sheet.addEventListener('click', ev => {
    if (ev.target === sheet && down) close();
    down = false;
  });
}

// Botão que repete enquanto está apertado, para chegar rápido a +6, por exemplo. press: o que fazer
// a cada novo aperto, antes de repetir (destravar o som).
export function holdRepeat(button, action, press) {
  let timer = 0;
  const stop = () => clearTimeout(timer);
  const run = delay => { action(); timer = setTimeout(run, delay, 90); };
  button.addEventListener('pointerdown', ev => { ev.preventDefault(); press?.(); stop(); run(450); });
  for (const type of ['pointerup', 'pointerleave', 'pointercancel']) button.addEventListener(type, stop);
  button.addEventListener('click', ev => { if (!ev.detail) action(); });   // pelo teclado
}
