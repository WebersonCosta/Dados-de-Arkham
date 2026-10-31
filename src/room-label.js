// O rótulo da rolagem ("Furtividade", "Dano"…): escolhido antes de lançar, vai para a mesa junto
// com a próxima rolagem e depois se apaga, como o bônus e a penalidade (ninguém esquece um rótulo
// ligado). Os últimos usados ficam guardados no aparelho, para escolher com um toque.

const MAX_LABEL = 30;
const MAX_RECENT = 8;

// saved/save: o que a mesa guarda no aparelho (room-panel.js); os últimos rótulos ficam em saved.labels.
export function createRoomLabel({ saved, save, unlock }) {
  const $ = id => document.getElementById(id);
  const pill = $('btnLabel'), sheet = $('labelSheet'), input = $('labelInput'), recent = $('labelRecent');
  if (!Array.isArray(saved.labels)) saved.labels = [];
  let label = '';

  const clean = text => Array.from(String(text ?? '').replace(/\s+/g, ' ').trim()).slice(0, MAX_LABEL).join('').trim();

  function choose(text) {
    label = clean(text);
    render();
    close();
  }

  // escolhido, o rótulo aparece no próprio botão, aceso (ao lado de quem vê a rolagem, não cabe mais nada)
  function render() {
    pill.textContent = label || 'Rótulo';
    pill.classList.toggle('is-set', !!label);
    pill.setAttribute('aria-label', label ? `Rótulo da próxima rolagem: ${label}. Trocar` : 'Pôr um rótulo na próxima rolagem');
  }

  function open() {
    unlock();
    input.value = label;
    recent.replaceChildren(...saved.labels.map(text => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'label-chip';
      b.textContent = text;
      b.addEventListener('click', () => choose(text));
      return b;
    }));
    $('labelRecentTitle').hidden = !saved.labels.length;
    $('btnNoLabel').hidden = !label;
    sheet.hidden = false;
    // no celular, com rótulos à mão, o teclado só abre se a pessoa tocar no campo
    (saved.labels.length && !matchMedia('(pointer: fine)').matches ? $('btnCloseLabel') : input).focus();
  }
  function close() { sheet.hidden = true; }

  pill.addEventListener('click', open);
  $('btnCloseLabel').addEventListener('click', close);
  $('btnNoLabel').addEventListener('click', () => choose(''));
  $('labelForm').addEventListener('submit', ev => { ev.preventDefault(); choose(input.value); });
  sheet.addEventListener('click', ev => { if (ev.target === sheet) close(); });
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && !sheet.hidden) close(); });
  render();

  return {
    // Na hora de lançar: o rótulo vai com esta rolagem (e passa a ser o primeiro dos últimos usados),
    // e a próxima começa sem rótulo.
    take() {
      const text = label;
      label = '';
      render();
      if (text) {
        saved.labels = [text, ...saved.labels.filter(t => t.toLowerCase() !== text.toLowerCase())].slice(0, MAX_RECENT);
        save();
      }
      return text;
    },
    clear() {
      label = '';
      render();
      close();
    }
  };
}
