import { createArkhamScene } from './scene.js';
import { createArkhamAudio } from './audio.js';
import { createDieMaterial, dimDie } from './dice-look.js';
import { critical, modes, kinds, shortcuts } from './rules.js';

// Ficha do tema "Arkham" (horror cósmico, Call of Cthulhu).
// O tema decide tudo o que se vê e se ouve, e as regras do jogo. A física, as formas dos dados
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
  dimDie,                           // como fica o dado descartado (bônus e penalidade)

  // Regras de Call of Cthulhu (em rules.js): 01 é sucesso crítico e 100 é desastre, no d100; os
  // dados de bônus e de penalidade, que aparecem como opções acima da bandeja quando o d100 está
  // escolhido; o 1d3, rolado com um d6; e os atalhos prontos (3d6, 2d6+6…).
  critical,
  modes,
  kinds,
  shortcuts,

  // vibração em milissegundos (funciona no Android)
  haptics: { throw: 12, settle: 35, critical: [30, 60, 30, 60, 140], fumble: [260, 80, 120] }
};
