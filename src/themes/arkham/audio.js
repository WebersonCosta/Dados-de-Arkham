import { rand, clamp } from '../../lib/util.js';

// Sons do tema, todos sintetizados na hora (não há arquivos de áudio): o dado batendo na madeira,
// o vento, um zumbido grave, sussurros distantes e os presságios dos críticos.
// O navegador só libera o som depois do primeiro toque, por isso tudo começa em unlock().

export function createArkhamAudio({ prefs }) {
  let ctx = null, sfx, amb, white, brown, ambVerb, sfxVerb, ambNodes = null, whisperTimer = 0;

  const pan = (node, p) => {
    if (!ctx.createStereoPanner) return node;
    const s = ctx.createStereoPanner();
    s.pan.value = p;
    node.connect(s);
    return s;
  };

  function unlock() {
    if (ctx) { if (ctx.state !== 'running') ctx.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    const master = ctx.createGain(); master.gain.value = .9; master.connect(ctx.destination);
    sfx = ctx.createGain(); sfx.gain.value = prefs.sfx ? 1 : 0; sfx.connect(master);
    amb = ctx.createGain(); amb.gain.value = 0; amb.connect(master);
    const len = ctx.sampleRate * 3;
    white = ctx.createBuffer(1, len, ctx.sampleRate);
    brown = ctx.createBuffer(1, len, ctx.sampleRate);
    const w = white.getChannelData(0), b = brown.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      w[i] = Math.random() * 2 - 1;
      last = (last + .02 * w[i]) / 1.02;
      b[i] = last * 3.5;
    }
    // eco de sala pequena, para os sussurros e os presságios
    const ir = ctx.createBuffer(2, ctx.sampleRate * 2.6, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = ir.getChannelData(c);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 3);
    }
    ambVerb = ctx.createConvolver(); ambVerb.buffer = ir; ambVerb.connect(amb);
    sfxVerb = ctx.createConvolver(); sfxVerb.buffer = ir; sfxVerb.connect(sfx);
    if (prefs.amb) startAmbient();
    document.addEventListener('visibilitychange', () => (document.hidden ? ctx.suspend() : ctx.resume()));
  }

  // kind: 'table' (madeira), 'wall' (borda) ou 'die' (um dado no outro)
  function hit(v, kind, p) {
    if (!ctx || !prefs.sfx) return;
    const t = ctx.currentTime;
    const g = clamp(v / 14, 0, 1) ** 1.2 * (kind === 'wall' ? .55 : 1);
    if (g < .02) return;
    const out = ctx.createGain();
    pan(out, p * .6).connect(sfx);
    // o estalo da aresta do dado
    const src = ctx.createBufferSource(); src.buffer = white;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass';
    bp.frequency.value = kind === 'die' ? rand(2600, 3800) : rand(1400, 2300);
    bp.Q.value = kind === 'die' ? 7 : 3;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(g * (kind === 'die' ? 1.3 : .9), t + .002);
    env.gain.exponentialRampToValueAtTime(.0005, t + (kind === 'die' ? .05 : .08));
    src.connect(bp).connect(env).connect(out);
    src.start(t, rand(0, 2.5), .12);
    if (kind === 'die') return;
    // o toque oco do tampo de madeira
    const res = ctx.createBufferSource(); res.buffer = white;
    const rf = ctx.createBiquadFilter(); rf.type = 'bandpass'; rf.frequency.value = rand(380, 620); rf.Q.value = 9;
    const re = ctx.createGain();
    re.gain.setValueAtTime(0, t); re.gain.linearRampToValueAtTime(g * 2.4, t + .003); re.gain.exponentialRampToValueAtTime(.0005, t + .16);
    res.connect(rf).connect(re).connect(out);
    res.start(t, rand(0, 2.5), .2);
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(rand(150, 190), t); o.frequency.exponentialRampToValueAtTime(90, t + .12);
    const oe = ctx.createGain();
    oe.gain.setValueAtTime(0, t); oe.gain.linearRampToValueAtTime(g * .5, t + .004); oe.gain.exponentialRampToValueAtTime(.0005, t + .14);
    o.connect(oe).connect(out);
    o.start(t); o.stop(t + .16);
  }

  function startAmbient() {
    if (!ctx || ambNodes) return;
    const t = ctx.currentTime;
    // vento: ruído grave passando por um filtro que "respira" devagar
    const wind = ctx.createBufferSource(); wind.buffer = brown; wind.loop = true;
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 380; lp.Q.value = .8;
    const lfo = ctx.createOscillator(); lfo.frequency.value = .06;
    const lfoG = ctx.createGain(); lfoG.gain.value = 220; lfo.connect(lfoG).connect(lp.frequency);
    const wg = ctx.createGain(); wg.gain.value = .38;
    wind.connect(lp).connect(wg).connect(amb);
    // um assobio fino por cima
    const wh = ctx.createBufferSource(); wh.buffer = white; wh.loop = true;
    const whf = ctx.createBiquadFilter(); whf.type = 'bandpass'; whf.frequency.value = 820; whf.Q.value = 14;
    const lfo2 = ctx.createOscillator(); lfo2.frequency.value = .09;
    const lfo2G = ctx.createGain(); lfo2G.gain.value = 260; lfo2.connect(lfo2G).connect(whf.frequency);
    const whg = ctx.createGain(); whg.gain.value = .045;
    const lfo3 = ctx.createOscillator(); lfo3.frequency.value = .045;
    const lfo3G = ctx.createGain(); lfo3G.gain.value = .04; lfo3.connect(lfo3G).connect(whg.gain);
    wh.connect(whf).connect(whg).connect(amb);
    // um zumbido grave e inquieto
    const drones = [98, 98.7, 146.3].map(f => {
      const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f;
      const dg = ctx.createGain(); dg.gain.value = .012;
      o.connect(dg).connect(amb);
      return o;
    });
    ambNodes = [wind, lfo, wh, lfo2, lfo3, ...drones];
    ambNodes.forEach(n => n.start(t));
    amb.gain.cancelScheduledValues(t);
    amb.gain.setValueAtTime(amb.gain.value, t);
    amb.gain.linearRampToValueAtTime(.55, t + 3);
    scheduleWhisper(rand(3, 7));
  }

  function stopAmbient() {
    if (!ctx || !ambNodes) return;
    const t = ctx.currentTime, nodes = ambNodes;
    ambNodes = null;
    clearTimeout(whisperTimer);
    amb.gain.cancelScheduledValues(t);
    amb.gain.setValueAtTime(amb.gain.value, t);
    amb.gain.linearRampToValueAtTime(0, t + .8);
    nodes.forEach(n => { try { n.stop(t + .9); } catch (e) {} });
  }

  function scheduleWhisper(sec) {
    clearTimeout(whisperTimer);
    whisperTimer = setTimeout(() => {
      if (!ambNodes) return;
      whisper();
      scheduleWhisper(rand(7, 18));
    }, sec * 1000);
  }

  // murmúrios sem palavras: ruído passando por "vogais" que mudam devagar, picado em sílabas
  function whisper() {
    const t = ctx.currentTime + .05, dur = rand(1.2, 2.6);
    const src = ctx.createBufferSource(); src.buffer = white;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 350;
    const env = ctx.createGain(); env.gain.value = 0;
    src.connect(hp);
    for (const [f, q] of [[rand(450, 800), 7], [rand(1100, 1900), 9], [rand(2400, 3000), 10]]) {
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = q;
      bp.frequency.setValueAtTime(f, t);
      for (let s = .25; s < dur; s += .25) bp.frequency.linearRampToValueAtTime(f * rand(.8, 1.25), t + s);
      hp.connect(bp).connect(env);
    }
    let s = 0;
    while (s < dur) {
      const syl = rand(.1, .24), peak = rand(.5, 1) * .22;
      env.gain.setValueAtTime(0, t + s);
      env.gain.linearRampToValueAtTime(peak, t + s + syl * .3);
      env.gain.linearRampToValueAtTime(0, t + s + syl);
      s += syl + rand(.02, .12);
    }
    const dry = ctx.createGain(); dry.gain.value = .25;
    const out = pan(env, rand(-.9, .9));
    out.connect(dry).connect(amb);
    out.connect(ambVerb);
    src.start(t, rand(0, 1), dur + .2);
  }

  // kind: 'critical' (acorde estranho e brilhante) ou 'fumble' (ronco grave)
  function omen(kind) {
    if (!ctx || !prefs.sfx) return;
    const t = ctx.currentTime;
    if (kind === 'critical') {
      [523.25, 659.25, 783.99, 1046.5, 1108.7].forEach((f, i) => {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = f * rand(.997, 1.003);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t + i * .07);
        g.gain.linearRampToValueAtTime(.05, t + i * .07 + .35);
        g.gain.exponentialRampToValueAtTime(.0005, t + 3.2);
        o.connect(g).connect(sfx);
        g.connect(sfxVerb);
        o.start(t + i * .07); o.stop(t + 3.3);
      });
    } else if (kind === 'fumble') {
      const n = ctx.createBufferSource(); n.buffer = brown;
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 160;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1.1, t + .6); g.gain.exponentialRampToValueAtTime(.0005, t + 3);
      n.connect(lp).connect(g).connect(sfx);
      n.start(t, 0, 3.1);
      const o = ctx.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(52, t + 2.6);
      const of = ctx.createBiquadFilter(); of.type = 'lowpass'; of.frequency.value = 400;
      const og = ctx.createGain();
      og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(.09, t + .4); og.gain.exponentialRampToValueAtTime(.0005, t + 2.8);
      o.connect(of).connect(og).connect(sfx);
      o.start(t); o.stop(t + 2.9);
    }
  }

  return {
    unlock, hit, omen,
    setSfx(on) { if (sfx) sfx.gain.value = on ? 1 : 0; },
    setAmbient(on) { if (ctx) (on ? startAmbient() : stopAmbient()); }
  };
}
