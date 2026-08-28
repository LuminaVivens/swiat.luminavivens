import * as THREE from 'three';

// Jak długo widać dymek, zanim zacznie znikać
const BUBBLE_DURATION = 5;

function drawBubbleTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 96;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.font = '500 26px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const paddingX = 22;
  const metrics = ctx.measureText(text);
  const bubbleWidth = Math.min(canvas.width - 8, metrics.width + paddingX * 2);
  const bubbleHeight = 58;
  const x = (canvas.width - bubbleWidth) / 2;
  const y = (canvas.height - bubbleHeight) / 2;
  const radius = 16;

  ctx.fillStyle = 'rgba(10, 14, 22, 0.85)';
  ctx.strokeStyle = 'rgba(212, 175, 55, 0.5)';
  ctx.lineWidth = 2;

  ctx.beginPath();
  if (ctx.roundRect) {
    ctx.roundRect(x, y, bubbleWidth, bubbleHeight, radius);
  } else {
    ctx.rect(x, y, bubbleWidth, bubbleHeight); // przeglądarki bez roundRect — zwykły prostokąt
  }
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#f4f1ea';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  return new THREE.CanvasTexture(canvas);
}

/**
 * createChatBubble
 * -----------------
 * Jeden dymek na gracza — tworzysz go raz (przy dołączeniu gracza do
 * sceny, tak jak etykietę imienia), a potem wywołujesz `.show(tekst)`
 * za każdym razem, kiedy ten gracz coś napisze. Dymek pojawia się,
 * czeka BUBBLE_DURATION sekund, i płynnie znika — bez potrzeby
 * tworzenia nowego obiektu za każdą wiadomość.
 */
export function createChatBubble() {
  const material = new THREE.SpriteMaterial({ transparent: true, depthTest: false, opacity: 0 });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.4, 0.45, 1);
  sprite.renderOrder = 997;

  let visibleUntil = -Infinity;
  let currentOpacity = 0;

  function show(text) {
    if (material.map) material.map.dispose();
    material.map = drawBubbleTexture(String(text).slice(0, 80));
    material.needsUpdate = true;
    visibleUntil = performance.now() / 1000 + BUBBLE_DURATION;
  }

  function update(delta) {
    const now = performance.now() / 1000;
    const target = now < visibleUntil ? 0.95 : 0;
    currentOpacity += (target - currentOpacity) * Math.min(1, delta * 3);
    material.opacity = currentOpacity;
  }

  return { sprite, show, update };
}
