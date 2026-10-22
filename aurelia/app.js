(() => {
  'use strict';

  const copy = {
    en: {
      chapters: [
        { key: 'dawn', chapter: 'CHAPTER I — THE AWAKENING', first: 'A world beyond', second: 'the ordinary.', description: 'Step into a place where the clouds carry castles and every horizon feels like a beginning.', next: 'Enter the garden', name: 'DAWN' },
        { key: 'garden', chapter: 'CHAPTER II — THE BLOOM', first: 'Let your wonder', second: 'bloom.', description: 'Cross the crystal bridge. Follow the light. See what grows where the sky touches your imagination.', next: 'Chase the stars', name: 'GARDEN' },
        { key: 'night', chapter: 'CHAPTER III — THE AFTERGLOW', first: 'Stay until', second: 'the stars rise.', description: 'When the sun slips away, the whole world begins to glow. A little magic is yours to keep.', next: 'Return to dawn', name: 'NIGHT' }
      ],
      swipe: 'SWIPE TO EXPLORE', nav: 'Choose a world', language: 'Türkçe diline geç', soundOn: 'Turn sound on', soundOff: 'Turn sound off', share: 'Share Aurelia', shared: 'Link copied to clipboard', shareFail: 'Could not copy the link', brand: 'Aurelia, return to dawn'
    },
    tr: {
      chapters: [
        { key: 'dawn', chapter: 'BÖLÜM I — UYANIŞ', first: 'Sıradanlığın', second: 'ötesinde.', description: 'Bulutların kaleleri taşıdığı, her ufkun yeni bir başlangıç gibi göründüğü bir dünyaya adım at.', next: 'Bahçeye gir', name: 'ŞAFAK' },
        { key: 'garden', chapter: 'BÖLÜM II — ÇİÇEKLENİŞ', first: 'Merakın burada', second: 'çiçek açar.', description: 'Kristal köprüden geç, ışığın izini sür ve hayal gücünün gökyüzüne dokunduğu yeri keşfet.', next: 'Yıldızları izle', name: 'BAHÇE' },
        { key: 'night', chapter: 'BÖLÜM III — GECE IŞIĞI', first: 'Yıldızlara', second: 'biraz daha yakın.', description: 'Güneş battığında bütün dünya ışıldamaya başlar. Bu büyüden bir parça seninle kalır.', next: 'Şafağa dön', name: 'GECE' }
      ],
      swipe: 'KEŞFETMEK İÇİN KAYDIR', nav: 'Bir dünya seç', language: 'Switch to English', soundOn: 'Sesi aç', soundOff: 'Sesi kapat', share: 'Aurelia’yı paylaş', shared: 'Bağlantı kopyalandı', shareFail: 'Bağlantı kopyalanamadı', brand: 'Aurelia, şafağa dön'
    }
  };

  const app = document.getElementById('app');
  const visuals = [...document.querySelectorAll('.scene-visual')];
  const tabs = [...document.querySelectorAll('.chapter-button')];
  const storyInner = document.getElementById('storyInner');
  const chapter = document.getElementById('chapter');
  const headingOne = document.getElementById('headingOne');
  const headingTwo = document.getElementById('headingTwo');
  const description = document.getElementById('description');
  const nextLabel = document.getElementById('nextLabel');
  const sceneCounter = document.getElementById('sceneCounter');
  const nextButton = document.getElementById('nextButton');
  const languageButton = document.getElementById('languageButton');
  const soundButton = document.getElementById('soundButton');
  const shareButton = document.getElementById('shareButton');
  const toast = document.getElementById('toast');
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const pageKeys = ['dawn', 'garden', 'night'];
  const parsedHash = pageKeys.indexOf(window.location.hash.slice(1).toLowerCase());
  let index = parsedHash >= 0 ? parsedHash : 0;
  let language = 'en';
  let ambient = null;
  let soundEnabled = false;
  let particles = [];
  let bursts = [];
  let frame = 0;
  let width = 0;
  let height = 0;
  let startX = 0;
  let startY = 0;
  let toastTimer;

  function render(animate = true) {
    const translations = copy[language];
    const scene = translations.chapters[index];
    app.classList.remove('scene-dawn', 'scene-garden', 'scene-night');
    app.classList.add(`scene-${scene.key}`);
    visuals.forEach((visual, i) => visual.classList.toggle('is-active', i === index));
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.classList.toggle('is-active', selected);
      if (selected) tab.setAttribute('aria-current', 'true');
      else tab.removeAttribute('aria-current');
      tab.querySelector('.chapter-name').textContent = translations.chapters[i].name;
      tab.setAttribute('aria-label', `${String(i + 1).padStart(2, '0')} ${translations.chapters[i].name}`);
    });
    chapter.textContent = scene.chapter;
    headingOne.textContent = scene.first;
    headingTwo.textContent = scene.second;
    description.textContent = scene.description;
    nextLabel.textContent = scene.next;
    sceneCounter.innerHTML = `${String(index + 1).padStart(2, '0')} <i>/</i> 03`;
    document.getElementById('swipeHint').firstChild.textContent = `${translations.swipe} `;
    document.getElementById('chapterNav').setAttribute('aria-label', translations.nav);
    document.getElementById('brandLink').setAttribute('aria-label', translations.brand);
    languageButton.textContent = language === 'en' ? 'TR' : 'EN';
    languageButton.setAttribute('aria-label', translations.language);
    soundButton.setAttribute('aria-label', soundEnabled ? translations.soundOff : translations.soundOn);
    shareButton.setAttribute('aria-label', translations.share);
    document.documentElement.lang = language;
    document.title = `Aurelia — ${scene.name}`;
    if (animate && !reducedMotion.matches) {
      storyInner.classList.remove('is-entering');
      void storyInner.offsetWidth;
      storyInner.classList.add('is-entering');
    }
    if (ambient) tuneAmbient();
  }

  function selectScene(next, animate = true) {
    const normalized = (next + pageKeys.length) % pageKeys.length;
    if (normalized === index && animate) return;
    index = normalized;
    render(animate);
    history.replaceState(null, '', `#${pageKeys[index]}`);
    if (soundEnabled) chime();
  }

  function notify(message) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('is-visible');
    toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800);
  }

  function createAmbient() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    const audio = new AudioContext();
    const gain = audio.createGain();
    gain.gain.value = 0;
    gain.connect(audio.destination);
    const oscillators = [0, 1, 2].map(() => {
      const oscillator = audio.createOscillator();
      const voice = audio.createGain();
      oscillator.type = 'sine';
      voice.gain.value = .33;
      oscillator.connect(voice).connect(gain);
      oscillator.start();
      return oscillator;
    });
    return { audio, gain, oscillators };
  }

  function tuneAmbient() {
    const notes = [[174.61, 261.63, 349.23], [196, 293.66, 392], [146.83, 220, 293.66]][index];
    ambient.oscillators.forEach((oscillator, i) => oscillator.frequency.setTargetAtTime(notes[i], ambient.audio.currentTime, .9));
  }

  function chime() {
    if (!ambient || !soundEnabled) return;
    const now = ambient.audio.currentTime;
    const tone = ambient.audio.createOscillator();
    const volume = ambient.audio.createGain();
    tone.type = 'sine';
    tone.frequency.setValueAtTime([523.25, 587.33, 659.25][index], now);
    tone.frequency.exponentialRampToValueAtTime([784, 880, 987.77][index], now + .55);
    volume.gain.setValueAtTime(.0001, now);
    volume.gain.exponentialRampToValueAtTime(.06, now + .06);
    volume.gain.exponentialRampToValueAtTime(.0001, now + 1.3);
    tone.connect(volume).connect(ambient.audio.destination);
    tone.start(now);
    tone.stop(now + 1.4);
  }

  function resize() {
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.7);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const amount = Math.min(Math.round(width * height / 10500), 90);
    particles = Array.from({ length: amount }, () => ({
      x: Math.random() * width, y: Math.random() * height,
      r: Math.random() * 1.8 + .5,
      vx: (Math.random() - .5) * .28,
      vy: -(Math.random() * .5 + .14),
      phase: Math.random() * Math.PI * 2,
      alpha: Math.random() * .44 + .18
    }));
  }

  function spark(x, y) {
    if (!ctx || reducedMotion.matches) return;
    for (let n = 0; n < 13; n++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.3 + .7;
      bursts.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life: 1, radius: Math.random() * 2 + 1 });
    }
  }

  function draw() {
    if (!ctx || document.hidden || reducedMotion.matches) return;
    frame++;
    ctx.clearRect(0, 0, width, height);
    const color = [[255, 227, 181], [213, 255, 241], [193, 185, 255]][index];
    ctx.globalCompositeOperation = 'screen';
    for (const particle of particles) {
      particle.x += particle.vx + Math.sin(frame * .008 + particle.phase) * .12;
      particle.y += particle.vy;
      if (particle.y < -8) { particle.y = height + 8; particle.x = Math.random() * width; }
      if (particle.x < -8) particle.x = width + 8;
      if (particle.x > width + 8) particle.x = -8;
      const twinkle = .65 + Math.sin(frame * .03 + particle.phase) * .35;
      ctx.fillStyle = `rgba(${color.join(',')},${particle.alpha * twinkle})`;
      ctx.shadowBlur = 12;
      ctx.shadowColor = `rgb(${color.join(',')})`;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      ctx.fill();
    }
    bursts = bursts.filter(burst => burst.life > .02);
    for (const burst of bursts) {
      burst.x += burst.vx;
      burst.y += burst.vy;
      burst.vy += .025;
      burst.life *= .955;
      ctx.fillStyle = `rgba(${color.join(',')},${burst.life})`;
      ctx.shadowBlur = 17;
      ctx.beginPath();
      ctx.arc(burst.x, burst.y, burst.radius * burst.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    requestAnimationFrame(draw);
  }

  tabs.forEach(tab => tab.addEventListener('click', () => selectScene(Number(tab.dataset.scene))));
  nextButton.addEventListener('click', () => selectScene(index + 1));
  document.getElementById('brandLink').addEventListener('click', event => { event.preventDefault(); selectScene(0); });
  languageButton.addEventListener('click', () => { language = language === 'en' ? 'tr' : 'en'; render(false); });
  soundButton.addEventListener('click', async () => {
    try {
      if (!ambient) ambient = createAmbient();
      if (!ambient) return;
      await ambient.audio.resume();
      soundEnabled = !soundEnabled;
      tuneAmbient();
      ambient.gain.gain.setTargetAtTime(soundEnabled ? .013 : 0, ambient.audio.currentTime, .25);
      soundButton.classList.toggle('sound-active', soundEnabled);
      soundButton.setAttribute('aria-pressed', String(soundEnabled));
      soundButton.setAttribute('aria-label', soundEnabled ? copy[language].soundOff : copy[language].soundOn);
      if (soundEnabled) chime();
    } catch { soundEnabled = false; }
  });
  shareButton.addEventListener('click', async () => {
    const payload = { title: 'Aurelia — Beyond the Clouds', text: 'Enter a luminous world above the clouds.', url: window.location.href.split('#')[0] };
    try {
      if (navigator.share) await navigator.share(payload);
      else if (navigator.clipboard) { await navigator.clipboard.writeText(payload.url); notify(copy[language].shared); }
      else throw new Error('Clipboard unavailable');
    } catch (error) { if (error?.name !== 'AbortError') notify(copy[language].shareFail); }
  });
  window.addEventListener('keydown', event => {
    if (event.key === 'ArrowRight') selectScene(index + 1);
    if (event.key === 'ArrowLeft') selectScene(index - 1);
  });
  window.addEventListener('hashchange', () => {
    const target = pageKeys.indexOf(window.location.hash.slice(1).toLowerCase());
    if (target >= 0 && target !== index) selectScene(target);
  });
  app.addEventListener('touchstart', event => {
    startX = event.changedTouches[0].screenX;
    startY = event.changedTouches[0].screenY;
  }, { passive: true });
  app.addEventListener('touchend', event => {
    const deltaX = event.changedTouches[0].screenX - startX;
    const deltaY = event.changedTouches[0].screenY - startY;
    if (Math.abs(deltaX) > 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) selectScene(index + (deltaX < 0 ? 1 : -1));
  }, { passive: true });
  app.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || reducedMotion.matches) return;
    const x = (event.clientX / window.innerWidth - .5) * 11;
    const y = (event.clientY / window.innerHeight - .5) * 9;
    app.style.setProperty('--px', `${-x}px`);
    app.style.setProperty('--py', `${-y}px`);
    app.style.setProperty('--npx', `${x}px`);
    app.style.setProperty('--npy', `${y}px`);
  }, { passive: true });
  app.addEventListener('pointerdown', event => spark(event.clientX, event.clientY), { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && !reducedMotion.matches) requestAnimationFrame(draw); });
  reducedMotion.addEventListener?.('change', () => { if (!reducedMotion.matches) requestAnimationFrame(draw); else ctx?.clearRect(0, 0, width, height); });

  resize();
  render(false);
  if (!reducedMotion.matches) requestAnimationFrame(draw);
})();
