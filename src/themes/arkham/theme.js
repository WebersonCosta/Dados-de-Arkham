import { createArkhamScene } from './scene.js';
import { createArkhamAudio } from './audio.js';
import { createDieMaterial } from './dice-look.js';

// Ficha do tema "Arkham" (horror cósmico, Call of Cthulhu).
// O tema decide tudo o que se vê e se ouve, e as regras de crítico. A física, as formas dos dados
// e a leitura do resultado ficam em src/core e não mudam de um tema para outro.
export default {
  id: 'arkham',
  title: 'Dados de Arkham',
  css: new URL('./theme.css', import.meta.url).href,
  // fontes que precisam estar carregadas antes de pintar os números nos dados
  fonts: ['700 120px Cinzel', '400 16px "IM Fell English SC"', '400 16px "Special Elite"'],
  texts: {
    loading: 'Acendendo as velas…',
    hint: 'Toque na mesa para lançar',
    sound: 'Som',
    ambient: 'Ambiente'
  },
  // câmera, e a faixa no fundo da mesa reservada para as velas e o tomo
  view: { fov: 36, tilt: 22, reserveTop: .2 },

  createScene: createArkhamScene,   // mesa, luzes, objetos e a reação das velas aos críticos
  createAudio: createArkhamAudio,   // dado na madeira, vento, sussurros, presságios
  dieMaterial: createDieMaterial,   // como cada dado é pintado

  // Regras de crítico de Call of Cthulhu: valem só no d100. 01 é sucesso crítico, 100 é desastre.
  critical(setId, result) {
    if (setId !== 'd100') return null;
    if (result.total === 1) return { kind: 'critical', label: 'Sucesso crítico' };
    if (result.total === 100) return { kind: 'fumble', label: 'Desastre' };
    return null;
  },

  // vibração em milissegundos (funciona no Android)
  haptics: { throw: 12, settle: 35, critical: [30, 60, 30, 60, 140], fumble: [260, 80, 120] }
};
