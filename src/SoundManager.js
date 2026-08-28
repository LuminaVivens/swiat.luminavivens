export class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.portalGain = null;
    this.started = false;

    const start = () => this._start();
    window.addEventListener('pointerdown', start, { once: true });
    window.addEventListener('keydown', start, { once: true });
  }

  _start() {
    if (this.started) return;
    this.started = true;

    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.22;
    this.masterGain.connect(this.ctx.destination);

    // Osobna, nietłumiona gałąź na dźwięk wejścia w portal — podłączona
    // wprost do wyjścia, z pominięciem masterGain. Dzięki temu akord
    // wejścia zawsze przebija się wyraźnie, nawet gdy otoczenie jest
    // maksymalnie wyciszone (patrz setAmbientDucking niżej)
    this.portalGain = this.ctx.createGain();
    this.portalGain.gain.value = 0.3;
    this.portalGain.connect(this.ctx.destination);

    this._startAmbient();
  }

  _startAmbient() {
    this._startWind();
    this._scheduleBirds();
  }

  _startWind() {
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 500;
    filter.Q.value = 0.7;

    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 250;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const windGain = this.ctx.createGain();
    windGain.gain.value = 0.05;

    noise.connect(filter);
    filter.connect(windGain);
    windGain.connect(this.masterGain);
    noise.start();
  }

  _playBirdChirp() {
    const t = this.ctx.currentTime;
    const startFreq = 1800 + Math.random() * 1400;

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(startFreq * (0.6 + Math.random() * 0.5), t + 0.09);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);

    if (this.ctx.createStereoPanner) {
      const panner = this.ctx.createStereoPanner();
      panner.pan.value = Math.random() * 2 - 1;
      gain.connect(panner);
      panner.connect(this.masterGain);
    } else {
      gain.connect(this.masterGain);
    }

    osc.start(t);
    osc.stop(t + 0.15);
  }

  _scheduleBirds() {
    const scheduleNext = () => {
      const delay = 2500 + Math.random() * 5000;
      setTimeout(() => {
        if (!this.started) return;
        this._playBirdChirp();
        if (Math.random() < 0.5) {
          setTimeout(() => this._playBirdChirp(), 120 + Math.random() * 150);
        }
        scheduleNext();
      }, delay);
    };
    scheduleNext();
  }

  playCollectSound(world) {
    if (!this.ctx) return;
    const baseFreq = { fizyczny: 220, energetyczny: 440, pustka: 110, duchowy: 660 }[world] ?? 330;
    this._chime(baseFreq);
    this._chime(baseFreq * 1.5, 0.08);
  }

  playLayerCompleteSound() {
    if (!this.ctx) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => this._chime(freq, i * 0.12));
  }

  playAwaken() {
    if (!this.ctx) return;
    this._softTone(196, 2.2, 0.12);
  }

  playResonance() {
    if (!this.ctx) return;
    this._softTone(196, 2.6, 0.1);
    this._softTone(293.66, 2.6, 0.08, 0.15);
  }

  // Przejście przez Próg — wznoszący się, delikatny akord, inny charakter
  // niż przebudzenie Ziarna (to moment powrotu, nie odkrycia)
  playPassage() {
    if (!this.ctx) return;
    [261.63, 329.63, 392, 523.25].forEach((freq, i) => this._softTone(freq, 2, 0.1, i * 0.1));
  }

  /**
   * setAmbientDucking
   * ------------------
   * 0 = otoczenie w pełnej głośności, 1 = maksymalnie wyciszone (jak
   * ucichnięcie sali kinowej tuż przed seansem). Wołane co klatkę z
   * PlanetPortal.onApproach z aktualnym postępem zbliżania — `setTargetAtTime`
   * płynnie dogania cel bez trzaskania przy każdej drobnej zmianie.
   */
  setAmbientDucking(progress) {
    if (!this.ctx || !this.masterGain) return;
    const base = 0.22;
    const min = 0.04;
    const target = base - (base - min) * progress;
    this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.15);
  }

  restoreAmbient() {
    this.setAmbientDucking(0);
  }

  // Moment wejścia w portal — wznoszący, tajemniczy akord, wyraźnie inny
  // od playPassage (to otwarcie przejścia w nowy świat, nie powrót do
  // znanego). Gra przez portalGain, więc słychać go czysto nawet gdy
  // otoczenie jest maksymalnie wyciszone przez setAmbientDucking.
  playPortalEntry() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    [196, 293.66, 392, 587.33].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      const gain = this.ctx.createGain();
      const start = t + i * 0.15;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.14, start + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 2.4);

      osc.connect(gain);
      gain.connect(this.portalGain);
      osc.start(start);
      osc.stop(start + 2.5);
    });
  }

  _softTone(freq, duration, peakGain, delay = 0) {
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(peakGain, t + duration * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + duration + 0.1);
  }

  _chime(freq, delay = 0) {
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(t);
    osc.stop(t + 1.3);
  }
}