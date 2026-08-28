/**
 * JourneyOverlay
 * --------------
 * Pełnoekranowa, kontemplacyjna prezentacja sekwencji obrazów/wideo —
 * uruchamiana przez PlanetPortal. Obrazy trzymają się na ekranie przez
 * `duration` sekund, wideo odtwarza się do końca i samo przechodzi dalej.
 * Po ostatnim elemencie sekwencja zaczyna się od nowa (pętla) — to ma
 * być spokojne, kontemplacyjne oglądanie, nie coś co "trzeba dokończyć".
 *
 * Esc albo dotknięcie/kliknięcie zamyka w dowolnym momencie.
 */
export function createJourneyOverlay({ onClose = () => {} } = {}) {
  const overlay = document.createElement('div');
  overlay.id = 'journey-overlay';
  overlay.innerHTML = `
    <div id="journey-media"></div>
    <div id="journey-hint">Esc albo dotknij, aby wrócić</div>
  `;
  document.body.appendChild(overlay);

  const mediaEl = overlay.querySelector('#journey-media');
  let items = [];
  let index = 0;
  let timer = null;
  let active = false;

  function clearMedia() {
    mediaEl.innerHTML = '';
    if (timer) clearTimeout(timer);
    timer = null;
  }

  function showCurrent() {
    clearMedia();
    const item = items[index];
    if (!item) return close();

    if (item.type === 'video') {
      const video = document.createElement('video');
      video.src = item.src;
      video.autoplay = true;
      video.playsInline = true;
      video.className = 'journey-item';
      video.addEventListener('ended', next);
      mediaEl.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.src = item.src;
      img.className = 'journey-item';
      mediaEl.appendChild(img);
      timer = setTimeout(next, (item.duration ?? 8) * 1000);
    }
  }

  function next() {
    index += 1;
    if (index >= items.length) index = 0;
    showCurrent();
  }

  function start(journeyItems) {
    if (!journeyItems?.length) return;
    items = journeyItems;
    index = 0;
    active = true;
    overlay.classList.add('active');
    showCurrent();
  }

  function close() {
    active = false;
    clearMedia();
    overlay.classList.remove('active');
    onClose();
  }

  overlay.addEventListener('click', close);
  window.addEventListener('keydown', (e) => {
    if (active && e.key === 'Escape') close();
  });

  return {
    start,
    close,
    get isActive() {
      return active;
    },
  };
}