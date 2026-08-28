import * as THREE from 'three';

/**
 * Etykieta imienia to zwykły THREE.Sprite (automatycznie zawsze zwrócony
 * do kamery — nie trzeba ręcznie liczyć "billboardingu"). Celowo NIE jest
 * dzieckiem grupy avatara — AvatarLoader robi `avatarGroup.clear()` przy
 * podmianie placeholdera na prawdziwy model, co skasowałoby etykietę,
 * gdyby była w środku. Zamiast tego main.js co klatkę ustawia jej pozycję
 * ręcznie, tuż nad głową danego gracza.
 */
function drawNameTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '600 32px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Delikatny cień/obrys, żeby tekst był czytelny na dowolnym tle sceny
  ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgba(5, 7, 12, 0.85)';
  ctx.strokeText(text, canvas.width / 2, canvas.height / 2);

  ctx.fillStyle = '#f4f1ea';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  return new THREE.CanvasTexture(canvas);
}

export function createNameLabel(text) {
  const texture = drawNameTexture(text);
  const material = new THREE.SpriteMaterial({ map: texture, depthTest: false, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.4, 0.35, 1);
  sprite.renderOrder = 999; // rysuj na wierzchu, nawet zza innych obiektów
  return sprite;
}

export function updateNameLabelText(sprite, text) {
  sprite.material.map.dispose();
  sprite.material.map = drawNameTexture(text);
  sprite.material.needsUpdate = true;
}
