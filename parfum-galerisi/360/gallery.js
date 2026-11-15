(() => {
  const root = document.documentElement;
  const pages = new Map(Array.from(document.querySelectorAll('.page'), page => [page.id, page]));
  const fallback = pages.get('tr-women');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const scrollPositions = new Map();
  const columns = 10;
  const rows = 8;
  const frames = columns * rows;
  const turnDuration = 8000;
  const frontViewTime = 1050;
  let active = matchingPage();
  let player;

  function matchingPage() {
    const hash = location.hash.slice(1);
    if (pages.has(hash)) return pages.get(hash);
    const [group, item] = hash.split('/');
    const lang = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'tr';
    if (group === 'men' || group === 'women') {
      const collection = pages.get(lang + '-' + group);
      return pages.get([lang, group, item].filter(Boolean).join('-')) || collection;
    }
    return pages.get(lang + '-women') || fallback;
  }

  function seek(session, position) {
    session.position = ((position % frames) + frames) % frames;
    const index = Math.floor(session.position);
    if (index === session.index) return;
    session.index = index;

    const column = index % columns;
    const row = Math.floor(index / columns);
    session.surface.style.setProperty('--frame-x', (100 * column / (columns - 1)) + '%');
    session.surface.style.setProperty('--frame-y', (100 * row / (rows - 1)) + '%');
    const angle = Math.round(360 * index / frames) + '°';
    session.range.value = String(index);
    session.range.style.setProperty('--progress', (100 * index / (frames - 1)) + '%');
    session.range.setAttribute('aria-valuetext', angle);
    session.angle.textContent = angle;
  }

  function syncPlayback(session) {
    cancelAnimationFrame(session.animation);
    session.toggle.textContent = session.playing ? session.toggle.dataset.pauseLabel : session.toggle.dataset.playLabel;
    session.surface.dataset.spinning = String(session.ready && session.playing);
    if (!session.ready || !session.playing || session.grab || document.hidden) return;

    let previousTime;
    function advance(time) {
      if (time >= session.frontViewUntil) {
        if (previousTime !== undefined) seek(session, session.position + (time - previousTime) * frames / turnDuration);
        previousTime = time;
      }
      session.animation = requestAnimationFrame(advance);
    }
    session.animation = requestAnimationFrame(advance);
  }

  function setPlayback(session, playing) {
    session.playing = playing;
    session.frontViewUntil = 0;
    syncPlayback(session);
  }

  function release(next) {
    if (!player) return null;
    const old = player;
    player = undefined;
    const playback = old.page.dataset.product === next.dataset.product
      ? { position: old.position, playing: old.playing }
      : null;
    old.events.abort();
    cancelAnimationFrame(old.animation);
    old.surface.style.removeProperty('--film');
    old.surface.style.removeProperty('--frame-ratio');
    delete old.surface.dataset.ready;
    delete old.surface.dataset.spinning;
    delete old.stage.dataset.grab;
    old.toggle.disabled = true;
    old.range.disabled = true;
    return playback;
  }

  function mount(page, playback) {
    const stage = page.querySelector('.product-stage');
    if (!stage) return;

    const surface = stage.querySelector('.render-surface');
    const frame = stage.querySelector('.turntable-frame');
    const loader = stage.querySelector('.stage-load');
    const events = new AbortController();
    const options = { signal: events.signal };
    const session = {
      page, stage, surface, events,
      toggle: stage.querySelector('[data-orbit-toggle]'),
      range: stage.querySelector('input[type="range"]'),
      angle: stage.querySelector('.angle-value'),
      playing: playback?.playing ?? !reducedMotion.matches,
      position: playback?.position ?? 0,
      animation: 0,
      frontViewUntil: 0,
      ready: false,
    };
    player = session;
    loader.textContent = loader.dataset.message;
    loader.dataset.show = '';
    syncPlayback(session);

    const image = new Image();
    let retried = false;
    function ready() {
      if (player !== session || !image.naturalWidth || session.ready) return;
      surface.style.setProperty('--film', `url("${image.src}")`);
      surface.style.setProperty('--frame-ratio', `${image.naturalWidth / columns} / ${image.naturalHeight / rows}`);
      if (!playback && session.playing) session.frontViewUntil = performance.now() + frontViewTime;
      seek(session, session.position);
      session.ready = true;
      surface.dataset.ready = '';
      delete loader.dataset.show;
      session.toggle.disabled = false;
      session.range.disabled = false;
      syncPlayback(session);
    }
    image.addEventListener('load', ready, options);
    image.addEventListener('error', () => {
      if (player !== session) return;
      if (retried) {
        loader.textContent = loader.dataset.error;
        return;
      }
      retried = true;
      image.src = frame.dataset.film + '?retry=1';
    }, options);
    image.src = frame.dataset.film;
    if (image.complete) ready();

    session.toggle.addEventListener('click', () => setPlayback(session, !session.playing), options);
    session.range.addEventListener('input', () => {
      const position = Number(session.range.value);
      setPlayback(session, false);
      seek(session, position);
    }, options);

    surface.addEventListener('pointerdown', event => {
      if (!session.ready || !event.isPrimary || event.button !== 0) return;
      session.grab = { id: event.pointerId, start: event.clientX, position: session.position };
      stage.dataset.grab = '';
      surface.setPointerCapture(event.pointerId);
      syncPlayback(session);
    }, options);

    surface.addEventListener('pointermove', event => {
      const grab = session.grab;
      if (event.pointerId !== grab?.id) return;
      const pixels = event.clientX - grab.start;
      if (!grab.moved && Math.abs(pixels) < 4) return;
      if (!grab.moved) {
        grab.moved = true;
        setPlayback(session, false);
      }
      seek(session, grab.position - pixels * frames / Math.max(180, surface.clientWidth * .84));
    }, options);

    function endGrab(event) {
      if (event.pointerId !== session.grab?.id) return;
      session.grab = undefined;
      delete stage.dataset.grab;
      syncPlayback(session);
    }
    for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      surface.addEventListener(type, endGrab, options);
    }

    surface.addEventListener('keydown', event => {
      if (!session.ready || (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight')) return;
      event.preventDefault();
      setPlayback(session, false);
      seek(session, session.position + (event.key === 'ArrowLeft' ? -2 : 2));
    }, options);
    document.addEventListener('visibilitychange', () => syncPlayback(session), options);
    reducedMotion.addEventListener('change', event => {
      if (event.matches) setPlayback(session, false);
    }, options);
  }

  function activate(page) {
    page.dataset.active = '';
    document.title = page.dataset.title;
    root.lang = page.lang;
  }

  function show(next, link) {
    if (next === active) return;
    const before = active.dataset.product;
    const after = next.dataset.product;
    const currentScroll = scrollY;
    const sameView = before === after && active.dataset.collection === next.dataset.collection;
    const playback = release(next);
    if (!before) scrollPositions.set(active.id, currentScroll);
    delete active.dataset.active;
    active = next;
    activate(active);
    mount(active, playback);
    scrollTo(0, sameView ? currentScroll : (after ? 0 : scrollPositions.get(active.id) || 0));

    if (link) {
      const inHeader = link.closest('.language, .catalogue-nav');
      const target = inHeader
        ? Array.from(active.querySelectorAll('.language a, .catalogue-nav a')).find(candidate => candidate.textContent.trim() === link.textContent.trim())
        : (before && !after ? active.querySelector(`[data-card="${before}"]`) : active.querySelector('h1'));
      target?.focus({ preventScroll: true });
    }

    if (!reducedMotion.matches && !sameView) {
      const entrance = active.querySelector(after ? '.display-case' : '.showcase');
      entrance?.animate?.([{ opacity: .48, transform: 'translateY(5px)' }, { opacity: 1, transform: 'none' }], {
        duration: 280, easing: 'ease-out',
      });
    }
  }

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  activate(active);
  root.classList.add('enhanced');
  mount(active);

  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[data-nav]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const href = link.getAttribute('href');
    const next = pages.get(href.slice(1));
    if (!next) return;
    event.preventDefault();
    if (href !== location.hash) {
      try { history.pushState(null, '', href); }
      catch { location.hash = href; }
    }
    show(next, link);
  });

  document.addEventListener('keydown', event => {
    if (event.defaultPrevented || !active.dataset.product || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.target instanceof HTMLInputElement && event.key !== 'Escape') return;
    const controls = { Escape: '[data-back]', ArrowLeft: '[data-step="-1"]', ArrowRight: '[data-step="1"]' };
    if (!controls[event.key]) return;
    event.preventDefault();
    active.querySelector(controls[event.key])?.click();
  });

  window.addEventListener('popstate', () => show(matchingPage()));
  window.addEventListener('hashchange', () => show(matchingPage()));
})();
