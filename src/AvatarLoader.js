import * as THREE from 'three';
import { createGLTFLoader } from './DracoGLTFLoader.js';
import { clone as cloneSkinnedModel } from 'three/examples/jsm/utils/SkeletonUtils.js';

const gltfLoader = createGLTFLoader();

function loadGLB(url) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(url, resolve, undefined, reject);
  });
}

// "Root motion" — animacje z Mixamo mają zapisany ruch bioder w osiach
// poziomych (X/Z), zakładając że to ONE przesuwają postać do przodu.
// My przesuwamy avatara przez PlayerController, więc usuwamy tu poziomy
// komponent ruchu bioder, zostawiając tylko naturalne pionowe podbicie (Y).
function stripHorizontalRootMotion(clip, rootBoneName = 'mixamorigHips') {
  const track = clip.tracks.find((t) => t.name === `${rootBoneName}.position`);
  if (!track) return;
  for (let i = 0; i < track.values.length; i += 3) {
    track.values[i] = track.values[0];
    track.values[i + 2] = track.values[2];
  }
}

/**
 * loadAvatarAssets
 * ----------------
 * Wczytuje pliki .glb RAZ na całą sesję gry — zarówno dla lokalnego
 * gracza, jak i dla każdego zdalnego gracza w multiplayerze. Dołączenie
 * kolejnej osoby do sesji NIE oznacza ponownego pobierania tych samych
 * plików z serwera — tylko sklonowanie już wczytanego modelu (patrz
 * createAvatarController niżej).
 */
export async function loadAvatarAssets(paths) {
  const [idleGltf, walkGltf, runGltf, jumpGltf] = await Promise.all([
    loadGLB(paths.idle),
    loadGLB(paths.walk),
    loadGLB(paths.run),
    loadGLB(paths.jump),
  ]);

  stripHorizontalRootMotion(idleGltf.animations[0]);
  stripHorizontalRootMotion(walkGltf.animations[0]);
  stripHorizontalRootMotion(runGltf.animations[0]);
  // Skok NIE jest stripowany w pionie — pionowy ruch bioder (przysiad
  // przed odbiciem) chcemy zostawić. Poziomy komponent stripujemy tak
  // samo jak resztę, żeby nie sunął avatara w bok.
  stripHorizontalRootMotion(jumpGltf.animations[0]);

  // Skala/obrót ustawiamy raz na "szablonie" — każdy sklonowany egzemplarz
  // odziedziczy tę samą orientację. Wartości sprawdzone i działające
  // dla modeli Mixamo przepuszczonych przez Blender.
  idleGltf.scene.scale.setScalar(1);
  idleGltf.scene.rotation.y = Math.PI;
  idleGltf.scene.traverse((child) => {
    if (child.isMesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return { idleGltf, walkGltf, runGltf, jumpGltf };
}

/**
 * createAvatarController
 * -----------------------
 * Tworzy JEDEN egzemplarz animowanego avatara (klon modelu + własny
 * AnimationMixer, żeby każda postać animowała się niezależnie) i podpina
 * go pod `avatarGroup`. Wywołujesz to raz dla lokalnego gracza, i ponownie
 * dla każdego zdalnego gracza dołączającego do sesji multiplayer — bez
 * pobierania plików na nowo, bo `assets` jest już wczytane.
 */
export function createAvatarController(assets, avatarGroup) {
  const { idleGltf, walkGltf, runGltf, jumpGltf } = assets;

  const model = cloneSkinnedModel(idleGltf.scene);
  avatarGroup.clear();
  avatarGroup.add(model);

  const mixer = new THREE.AnimationMixer(model);
  const actions = {
    idle: mixer.clipAction(idleGltf.animations[0]),
    walk: mixer.clipAction(walkGltf.animations[0]),
    run: mixer.clipAction(runGltf.animations[0]),
    jump: mixer.clipAction(jumpGltf.animations[0]),
  };

  // Skok gra się raz i "zamraża" na ostatniej klatce, dopóki sami
  // nie zdecydujemy że wracamy do idle/walk (patrz warunek grounded niżej)
  actions.jump.setLoop(THREE.LoopOnce);
  actions.jump.clampWhenFinished = true;

  let currentAction = actions.idle;
  currentAction.play();

  function setAction(nextAction, fadeDuration = 0.25) {
    if (nextAction === currentAction) return;
    const previous = currentAction;
    currentAction = nextAction;
    nextAction.reset().fadeIn(fadeDuration).play();
    if (previous) previous.fadeOut(fadeDuration);
  }

  return {
    // grounded przychodzi teraz wprost z PlayerControllera — to on jedyny
    // wie, czy avatar dotyka ziemi, więc nie duplikujemy tej logiki tutaj
    update(delta, moving, running, grounded) {
      if (!grounded) {
        // krótszy fade wejścia w skok — ma być odczuwalnie "od razu"
        setAction(actions.jump, 0.1);
      } else {
        const desired = !moving ? actions.idle : running ? actions.run : actions.walk;
        setAction(desired);
      }
      mixer.update(delta);
    },
  };
}