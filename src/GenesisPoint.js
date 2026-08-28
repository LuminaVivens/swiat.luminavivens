import * as THREE from 'three';

// Promień, w którym gracz jest uznawany za "obecnego" przy Ziarnie
const PRESENCE_RADIUS = 5;

// Jak długo widać komunikat "Twoja obecność została zauważona." zanim
// zacznie znikać
const NOTICE_DURATION = 3.5;

function drawFloatingTextTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = '300 40px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Lekki obrys tylko dla czytelności na jasnym tle — cieńszy i bardziej
  // przezroczysty niż wcześniej, żeby nie dominował nad samym tekstem
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(5, 7, 12, 0.5)';
  ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
  // Ciepła, złamana biel — współgra ze złocistym światłem Ziarna,
  // zamiast zimnej, czysto kremowej czcionki
  ctx.fillStyle = '#f2e8d5';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);
  return new THREE.CanvasTexture(canvas);
}

/**
 * createGenesisPoint
 * -------------------
 * Punkt Narodzin — mała, jasna wyspa startowa. Zasada tego miejsca:
 * Ziarno reaguje samą obecnością graczy — bez klawisza, bez licznika.
 * Im bliżej gracz i im więcej osób naraz, tym mocniej świeci i tym
 * szersze stają się kręgi energii — wspólnota nie jest tu opisana
 * słowami, tylko widoczna wprost w mechanice przestrzeni.
 *
 * `playerPositions[0]` jest ZAWSZE traktowane jako pozycja LOKALNEGO
 * gracza (main.js zawsze podaje ją jako pierwszy element tablicy) —
 * tylko dla niej wyświetla się osobisty komunikat "zauważenia".
 * Reszta tablicy to gracze zdalni — liczą się do jasności/kręgów/
 * rezonansu tak samo jak lokalny, ale nie wyzwalają własnego komunikatu.
 */
export function createGenesisPoint(scene, { onAwaken, onResonance } = {}) {
  const group = new THREE.Group();
  scene.add(group);

  // --- Platforma startowa -------------------------------------------------
  const platform = new THREE.Mesh(
    new THREE.CircleGeometry(6, 64),
    new THREE.MeshStandardMaterial({ color: 0x171308, roughness: 0.85, metalness: 0.15 })
  );
  platform.rotation.x = -Math.PI / 2;
  platform.position.y = 0.005;
  platform.receiveShadow = true;
  group.add(platform);

  // --- Kręgi energii na podłożu ---------------------------------------------
  // Owinięte we wspólną grupę, żeby dało się je razem skalować —
  // to właśnie te "szersze kręgi" przy większej liczbie obecnych graczy
  const ringsGroup = new THREE.Group();
  group.add(ringsGroup);

  const rings = [2, 3.6, 5.2].map((radius, i) => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(radius - 0.03, radius, 64),
      new THREE.MeshBasicMaterial({
        color: 0xd4af37,
        transparent: true,
        opacity: 0.18 - i * 0.03,
        side: THREE.DoubleSide,
      })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02 + i * 0.002;
    ringsGroup.add(ring);
    return ring;
  });

  // --- Ziarno Światła -------------------------------------------------------
  const seedMaterial = new THREE.MeshStandardMaterial({
    color: 0xf4e4c1,
    emissive: 0xd4af37,
    emissiveIntensity: 0.2,
    roughness: 0.25,
    metalness: 0.1,
  });
  const seed = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 1), seedMaterial);
  seed.position.y = 1.0;
  seed.castShadow = true;
  group.add(seed);

  const seedLight = new THREE.PointLight(0xd4af37, 0.4, 8, 2);
  seedLight.position.y = 1.0;
  group.add(seedLight);

  // --- Cząsteczki wokół Ziarna ------------------------------------------------
  const particleCount = 80;
  const particlePositions = new Float32Array(particleCount * 3);
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.6 + Math.random() * 1.2;
    particlePositions[i * 3] = Math.cos(angle) * radius;
    particlePositions[i * 3 + 1] = Math.random() * 1.6;
    particlePositions[i * 3 + 2] = Math.sin(angle) * radius;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: 0xf4e4c1,
    size: 0.05,
    transparent: true,
    opacity: 0,
    sizeAttenuation: true,
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  group.add(particles);

  // --- Stały napis — ukryty do czasu wejścia do świata (patrz revealText) ----
  const textTexture = drawFloatingTextTexture('Świat zaczyna się od obecności.');
  const textMaterial = new THREE.SpriteMaterial({
    map: textTexture,
    transparent: true,
    depthTest: false,
    opacity: 0, // ukryty — main.js woła revealText() po wpisaniu imienia
  });
  const textSprite = new THREE.Sprite(textMaterial);
  textSprite.scale.set(5, 0.83, 1);
  textSprite.position.set(0, 2.4, 0);
  textSprite.renderOrder = 998;
  group.add(textSprite);

  // --- Przejściowy komunikat "zauważenia" lokalnego gracza --------------------
  const noticeTexture = drawFloatingTextTexture('Twoja obecność została zauważona.');
  const noticeMaterial = new THREE.SpriteMaterial({
    map: noticeTexture,
    transparent: true,
    depthTest: false,
    opacity: 0,
  });
  const noticeSprite = new THREE.Sprite(noticeMaterial);
  noticeSprite.scale.set(4.2, 0.7, 1);
  noticeSprite.position.set(0, 1.85, 0);
  noticeSprite.renderOrder = 998;
  group.add(noticeSprite);

  // --- Wiązka łącząca dwóch najbliższych obecnych graczy -----------------------
  const linkGeometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
  const linkMaterial = new THREE.LineBasicMaterial({ color: 0xd4af37, transparent: true, opacity: 0 });
  const linkLine = new THREE.Line(linkGeometry, linkMaterial);
  group.add(linkLine);

  let wasAwake = false;
  let wasResonating = false;
  let wasLocalNear = false;
  let textRevealed = false;
  let noticeVisibleUntil = -Infinity;
  let localAwakenedBoost = 0; // trwały (w ramach sesji) niewielki wzrost jasności po pierwszym "zauważeniu"
  let time = 0;
  let currentIntensity = 0.2;
  let currentTextOpacity = 0;
  let currentNoticeOpacity = 0;
  let currentRingScale = 1;

  /**
   * Wywołaj raz, kiedy gracz faktycznie wchodzi do świata (po wpisaniu
   * imienia) — napis "Świat zaczyna się od obecności." płynnie się
   * pojawia, zamiast być widoczny (i częściowo prześwitujący) w tle
   * ekranu startowego.
   */
  function revealText() {
    textRevealed = true;
  }

  /**
   * @param {number} delta - czas od poprzedniej klatki
   * @param {THREE.Vector3[]} playerPositions - pozycje WSZYSTKICH graczy,
   *        pierwsza pozycja (index 0) to ZAWSZE lokalny gracz
   */
  function update(delta, playerPositions) {
    time += delta;

    const distances = playerPositions.map((p) => Math.hypot(p.x - group.position.x, p.z - group.position.z));
    const nearby = distances.filter((d) => d <= PRESENCE_RADIUS);
    const localDist = distances[0] ?? Infinity;
    const localNear = localDist <= PRESENCE_RADIUS;

    const isAwake = nearby.length > 0;
    const isResonating = nearby.length >= 2;

    // Lokalny gracz właśnie wszedł w zasięg obecności — pokaż osobisty
    // komunikat i podnieś (trwale, w ramach tej sesji) bazową jasność
    if (localNear && !wasLocalNear) {
      noticeVisibleUntil = time + NOTICE_DURATION;
      localAwakenedBoost = Math.min(localAwakenedBoost + 0.18, 0.6);
    }

    // Docelowa jasność — im bliżej i im więcej osób, tym mocniej,
    // plus trwały "ślad" po pierwszym zauważeniu lokalnego gracza
    let targetIntensity = 0.2 + localAwakenedBoost;
    for (const d of nearby) {
      const closeness = 1 - Math.min(d / PRESENCE_RADIUS, 1);
      targetIntensity += closeness * 1.1;
    }
    targetIntensity = Math.min(targetIntensity, 3.4);

    currentIntensity += (targetIntensity - currentIntensity) * Math.min(1, delta * 2.5);
    seedMaterial.emissiveIntensity = currentIntensity;
    seedLight.intensity = 0.3 + currentIntensity * 0.6;

    // Delikatne "oddychanie" niezależne od obecności — nigdy całkiem martwe
    const breathe = 0.05 * Math.sin(time * 0.8);
    seed.scale.setScalar(1 + breathe * 0.3 + Math.min(currentIntensity, 1) * 0.05);

    // Cząsteczki — widoczne i unoszące się WYRAŹNIE szybciej, gdy ktoś
    // jest blisko, proporcjonalnie do liczby obecnych osób
    particles.rotation.y += delta * (0.05 + currentIntensity * 0.08 * (1 + nearby.length * 0.4));
    particleMaterial.opacity += ((isAwake ? 0.5 : 0.08) - particleMaterial.opacity) * Math.min(1, delta * 2);

    rings.forEach((ring, i) => {
      ring.rotation.z += delta * (0.03 + i * 0.015) * (i % 2 === 0 ? 1 : -1);
    });

    // Kręgi rosną wraz z liczbą obecnych graczy — "szersze kręgi"
    // w multiplayerze, o które prosiłeś
    const targetRingScale = 1 + Math.min(nearby.length, 4) * 0.07;
    currentRingScale += (targetRingScale - currentRingScale) * Math.min(1, delta * 2);
    ringsGroup.scale.setScalar(currentRingScale);

    // Stały napis — płynne pojawienie się po wejściu do świata
    const targetTextOpacity = textRevealed ? 0.85 : 0;
    currentTextOpacity += (targetTextOpacity - currentTextOpacity) * Math.min(1, delta * 1.2);
    textMaterial.opacity = currentTextOpacity;
    textSprite.position.y = 2.4 + Math.sin(time * 0.6) * 0.08;

    // Przejściowy komunikat "zauważenia" — widoczny przez NOTICE_DURATION,
    // potem płynnie znika
    const targetNoticeOpacity = time < noticeVisibleUntil ? 0.9 : 0;
    currentNoticeOpacity += (targetNoticeOpacity - currentNoticeOpacity) * Math.min(1, delta * 2.2);
    noticeMaterial.opacity = currentNoticeOpacity;
    noticeSprite.position.y = 1.85 + Math.sin(time * 0.6 + 1) * 0.06;

    // Wiązka między dwoma najbliższymi obecnymi graczami
    if (isResonating) {
      const nearbyWithPos = playerPositions
        .map((p, i) => ({ p, dist: distances[i] }))
        .filter((e) => e.dist <= PRESENCE_RADIUS)
        .sort((a, b) => a.dist - b.dist);
      const posAttr = linkGeometry.attributes.position;
      posAttr.setXYZ(0, nearbyWithPos[0].p.x, 1.2, nearbyWithPos[0].p.z);
      posAttr.setXYZ(1, nearbyWithPos[1].p.x, 1.2, nearbyWithPos[1].p.z);
      posAttr.needsUpdate = true;
      linkMaterial.opacity += (0.6 - linkMaterial.opacity) * Math.min(1, delta * 3);
    } else {
      linkMaterial.opacity += (0 - linkMaterial.opacity) * Math.min(1, delta * 3);
    }

    if (isAwake && !wasAwake) onAwaken?.();
    if (isResonating && !wasResonating) onResonance?.();
    wasAwake = isAwake;
    wasResonating = isResonating;
    wasLocalNear = localNear;
  }

  return { update, revealText, group };
}
