import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

/**
 * createGLTFLoader
 * -----------------
 * Zwraca GLTFLoader gotowy do wczytywania modeli skompresowanych Draco
 * (patrz `scripts/compress-models.mjs`) — ale działa równie dobrze ze
 * zwykłymi, nieskompresowanymi plikami .glb, więc nie trzeba nic
 * przełączać ręcznie w zależności od tego, czy dany plik jest
 * skompresowany, czy nie.
 *
 * Dekoder Draco (kod odpowiedzialny za rozpakowanie geometrii) NIE jest
 * częścią naszego bundla — pobieramy go z CDN Google przy pierwszym
 * użyciu. To standardowa, powszechnie stosowana praktyka: dekoder to
 * kod współdzielony między tysiącami stron, więc odwiedzający może go
 * mieć już w cache przeglądarki z zupełnie innej strony.
 */
export function createGLTFLoader() {
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);
  return loader;
}
