import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

/**
 * createMirrorFloor
 * -------------------
 * To NIE jest sztuczka wizualna (błyszczący materiał) — to prawdziwe,
 * liczone w czasie rzeczywistym odbicie całej sceny: nieba, gwiazd,
 * avatara, innych graczy. Trzeba na to patrzeć dosłownie jak na taflę —
 * to, co jest nad podłogą, faktycznie widać w niej odbite.
 *
 * Geometria to PIERŚCIEŃ (RingGeometry), nie pełne koło — celowo
 * zostawia wolny środek dokładnie tam, gdzie stoi platforma Punktu
 * Narodzin (promień 6), żeby obie powierzchnie nie nachodziły na siebie.
 */
export function createMirrorFloor() {
  const geometry = new THREE.RingGeometry(6.5, 55, 96);

  const mirror = new Reflector(geometry, {
    // Lustro nie potrzebuje rozdzielczości całego ekranu. Na monitorach
    // 4K/Retina wcześniejsza wersja potrafiła zarezerwować ogromny
    // render target i skończyć się utratą kontekstu WebGL.
    textureWidth: Math.min(2048, Math.floor(window.innerWidth * Math.min(window.devicePixelRatio, 1.25))),
    textureHeight: Math.min(2048, Math.floor(window.innerHeight * Math.min(window.devicePixelRatio, 1.25))),
    color: 0x0a0e14, // ciemny, przygaszony ton — odbicie ma być stonowane, nie jak polerowane srebro
    clipBias: 0.003,
  });

  mirror.rotation.x = -Math.PI / 2;
  mirror.position.y = 0.008; // tuż nad zwykłym gruntem, poniżej platformy Punktu Narodzin

  return mirror;
}
