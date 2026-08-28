import * as THREE from 'three';

// Pełny cykl dnia i nocy — ok. 8 minut. Wystarczająco wolno, żeby nie
// rozpraszać podczas gry, wystarczająco szybko, żeby faktycznie zobaczyć
// zmianę w trakcie jednej, dłuższej sesji
const CYCLE_DURATION = 480;

/**
 * createDayNightCycle
 * ---------------------
 * Ta sama zasada co w MirrorClock.js: skoro to inny świat, czas płynie
 * tu w przeciwną stronę — słońce wędruje w LEWO (ujemny kąt), nie w prawo
 * jak na Ziemi.
 *
 * Celowo NIE robimy dosłownego, jasnego, błękitnego dnia — kłóciłoby się
 * to z resztą nastroju Lumina Vivens. "Dzień" tutaj to cieplejsza,
 * jaśniejsza odmiana tej samej, kosmicznej scenerii: gwiazdy przygasają,
 * światło robi się bardziej złote, ale przestrzeń nigdy nie przestaje
 * być kontemplacyjna i ciemna w swojej istocie.
 */
export function createDayNightCycle(scene, dirLight, hemiLight, sky) {
  const nightBg = new THREE.Color(0x05070c);
  const dayBg = new THREE.Color(0x1a1f2e);

  const nightFog = new THREE.Color(0x05070c);
  const dayFog = new THREE.Color(0x241f2a);

  const nightLight = new THREE.Color(0x8fa8ff);
  const dayLight = new THREE.Color(0xfff2d9);

  let time = 0;

  function update(delta) {
    time += delta;

    // Kąt ZE ZNAKIEM MINUS — słońce wędruje w lewo, dokładnie tak jak
    // wskazówki zegara w rogu ekranu (MirrorClock.js). Ta sama zasada,
    // konsekwentnie zastosowana w całej scenerii
    const angle = -(time / CYCLE_DURATION) * Math.PI * 2;

    const sunHeight = Math.sin(angle);
    dirLight.position.set(
      Math.cos(angle) * 100,
      Math.max(sunHeight * 100, 5), // nigdy nie schodzi dokładnie pod ziemię — upraszcza cienie
      Math.sin(angle * 0.4) * 40
    );

    // 0 = pełna noc, 1 = pełny "dzień" — im wyżej słońce, tym bliżej dnia
    const dayFactor = THREE.MathUtils.clamp((sunHeight + 0.3) / 1.3, 0, 1);

    dirLight.intensity = 0.35 + dayFactor * 0.9;
    dirLight.color.copy(nightLight).lerp(dayLight, dayFactor);

    hemiLight.intensity = 0.35 + dayFactor * 0.4;

    scene.background.copy(nightBg).lerp(dayBg, dayFactor * 0.5); // stonowane nawet w "dzień" — nigdy jaskrawe
    scene.fog.color.copy(nightFog).lerp(dayFog, dayFactor * 0.5);

    sky.update(delta, 1 - dayFactor * 0.85); // gwiazdy przygasają w dzień, nigdy nie znikają całkiem
  }

  return { update };
}
