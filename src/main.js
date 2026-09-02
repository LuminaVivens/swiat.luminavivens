import * as THREE from 'three';
import { PlayerController } from './PlayerController.js';
import { KeyboardInput } from './KeyboardInput.js';
import { PuzzleManager } from './PuzzleManager.js';
import { loadAvatarAssets, createAvatarController } from './AvatarLoader.js';
import { NetworkManager } from './NetworkManager.js';
import { SoundManager } from './SoundManager.js';
import { createNameLabel, updateNameLabelText } from './NameLabel.js';
import { createChatBubble } from './ChatBubble.js';
import { setupTeleportation } from './TeleportController.js';
import { createGenesisPoint } from './GenesisPoint.js';
import { createDistantTerrain } from './DistantTerrain.js';
import { createSky } from './Sky.js';
import { createDayNightCycle } from './DayNightCycle.js';
import { createWaterBody } from './Water.js';
import { createRain } from './Rain.js';
import { createMirrorClock } from './MirrorClock.js';
import { createMirrorFloor } from './MirrorFloor.js';
import { createThreshold } from './Threshold.js';
import { createPlanet } from './Planet.js';
import { createPlanetPortal } from './PlanetPortal.js';
import { createJourneyOverlay } from './JourneyOverlay.js';
import { setupVRLocomotion } from './VRLocomotion.js';
import { createEnergeticPocket } from './DimensionPocket.js';
import { setupMouseLook } from './MouseLook.js';
import { createWorldRuntime } from './core/WorldRuntime.js';
import { WorldManager, WORLD_LAYER_ORDER } from './core/WorldManager.js';
import { createRealityAtmosphere } from './core/RealityAtmosphere.js';
import { createWorldHub } from './core/WorldHub.js';
import { createMainPlazaFinish } from './core/MainPlazaFinish.js';
import { createWaterCreationRealm } from './core/WaterCreationRealm.js';
import { createElarionRealm } from './core/ElarionRealm.js';
import { createAlgorithmsRealm } from './core/AlgorithmsRealm.js';
import { createMemoryGateRealm } from './core/MemoryGateRealm.js';
import { createObservationTowerRealm } from './core/ObservationTowerRealm.js';
import { createDarknessFieldRealm } from './core/DarknessFieldRealm.js';
import { createStoneCityRealm } from './core/StoneCityRealm.js';

// ---------------------------------------------------------------------------
// Scena, kamera, renderer
// ---------------------------------------------------------------------------

const container = document.getElementById('app');
const { scene, camera, cameraRig, renderer, hemiLight, dirLight } = createWorldRuntime(container);

// ---------------------------------------------------------------------------
// Podłoże
// ---------------------------------------------------------------------------

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(60, 64),
  new THREE.MeshStandardMaterial({ color: 0x11151f, roughness: 0.95 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const grid = new THREE.GridHelper(120, 60, 0x2a3550, 0x161c2c);
grid.position.y = 0.01;
scene.add(grid);

// Faliste wzgórza na horyzoncie — czysto dekoracyjne, otaczają płaską,
// grywalną ziemię i znikają w mgle, zanim gracz miałby szansę tam dotrzeć
const distantTerrain = createDistantTerrain();
scene.add(distantTerrain);

const sky = createSky(scene);
const dayNightCycle = createDayNightCycle(scene, dirLight, hemiLight, sky);

const waterBody = createWaterBody();
scene.add(waterBody.mesh);

const rain = createRain(scene);

// Lustrzana podłoga — prawdziwe odbicie nieba i sceny, pierścieniem
// wokół platformy Punktu Narodzin (patrz sekcja niżej)
const mirrorFloor = createMirrorFloor();
scene.add(mirrorFloor);
let planetSystem = null;
let planetPortal = null;
const portalVignetteEl = document.getElementById('portal-vignette');

// Systemy UI/audio są inicjalizowane przed callbackami podróży.
// Dzięki temu callback nie może trafić na niezainicjalizowany element
// podczas szybkiego załadowania journeys.json.
const passageFadeEl = document.getElementById('passage-fade');
const soundManager = new SoundManager();

const journeyOverlay = createJourneyOverlay({
  onClose: () => soundManager.restoreAmbient(),
});

fetch('/journeys.json')
  .then((r) => r.json())
  .then((data) => {
    const journey = data.journeys?.[data.journeys.length - 1]; // na razie zawsze najnowsza
    if (!journey) return;

    planetSystem = createPlanet(journey.skyPosition, journey.color ?? 0xd4af37);
    scene.add(planetSystem.group);

planetPortal = createPlanetPortal(scene, journey.skyPosition, {
  onApproach: (progress) => {
    portalVignetteEl.style.opacity = progress * 0.85;
    soundManager.setAmbientDucking(progress);
  },
  onEnter: () => {
    soundManager.playPortalEntry();
    passageFadeEl.classList.add('active');
    setTimeout(() => journeyOverlay.start(journey.items), 850);
    setTimeout(() => passageFadeEl.classList.remove('active'), 1200);
  },
});
  })
  .catch((err) => console.warn('[Journeys] Brak journeys.json lub błąd wczytywania', err));

const ORIGINAL_SPAWN = new THREE.Vector3(0, 0, 3.5); // ten sam punkt co GENESIS_RETURN_POSITION

const energeticPocket = createEnergeticPocket(scene, {
  onReturn: () => {
    soundManager.playPassage();
    passageFadeEl.classList.add('active');
    setTimeout(() => avatar.position.copy(ORIGINAL_SPAWN), 850);
    setTimeout(() => passageFadeEl.classList.remove('active'), 1200);
  },
});

const energeticPlanetSkyPos = [-55, 30, 65];
const energeticPlanet = createPlanet(energeticPlanetSkyPos, 0x7fb8ff);
scene.add(energeticPlanet.group);

const energeticPortal = createPlanetPortal(scene, energeticPlanetSkyPos, {
  onApproach: (progress) => {
    portalVignetteEl.style.opacity = progress * 0.85;
    soundManager.setAmbientDucking(progress);
  },
  onEnter: () => {
    soundManager.playPortalEntry();
    passageFadeEl.classList.add('active');
    setTimeout(() => avatar.position.copy(energeticPocket.entryPoint), 850);
    setTimeout(() => passageFadeEl.classList.remove('active'), 1200);
  },
});
const consciousnessPlanetSkyPos = [0, 38, -85];
const consciousnessPlanet = createPlanet(consciousnessPlanetSkyPos, 0x9b6fd4);
scene.add(consciousnessPlanet.group);

const consciousnessPortal = createPlanetPortal(scene, consciousnessPlanetSkyPos, {
  onApproach: (progress) => {
    portalVignetteEl.style.opacity = progress * 0.85;
    soundManager.setAmbientDucking(progress);
  },
  onEnter: () => {
    soundManager.playPortalEntry();
    passageFadeEl.classList.add('active');
    setTimeout(() => {
      window.open('https://luminavivens.com.pl', '_blank');
      passageFadeEl.classList.remove('active');
    }, 850);
  },
});
// ---------------------------------------------------------------------------
// Teleportacja VR
// ---------------------------------------------------------------------------

const teleportSystem = setupTeleportation(renderer, cameraRig, ground, scene, {
  onTeleport: () => triggerTeleportFlash(),
});
const vrLocomotion = setupVRLocomotion(renderer, cameraRig, camera);
const mouseLook = setupMouseLook(renderer.domElement);

// Wejście w VR: kamera VR startuje tam, gdzie stał avatar w widoku
// trzecioosobowym, zamiast zawsze w punkcie (0,0,0) — bez tego wejście
// w gogle cofałoby Cię na start niezależnie od tego, dokąd doszedłeś
renderer.xr.addEventListener('sessionstart', () => {
  cameraRig.position.set(avatar.position.x, 0, avatar.position.z);
 avatar.visible = false;
});

renderer.xr.addEventListener('sessionend', () => {
  avatar.visible = true;    // wracasz do widoku trzecioosobowego na desktopie
});

// ---------------------------------------------------------------------------
// Avatar lokalnego gracza
// ---------------------------------------------------------------------------

function createPlaceholderAvatar() {
  const group = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4fd1c5, roughness: 0.4, metalness: 0.1 });
  const accentMat = new THREE.MeshStandardMaterial({ color: 0xf4a259, roughness: 0.5 });

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, 0.9, 4, 12), bodyMat);
  body.position.y = 0.95;
  body.castShadow = true;
  group.add(body);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), accentMat);
  head.position.y = 1.75;
  head.castShadow = true;
  group.add(head);

  const facing = new THREE.Mesh(
    new THREE.ConeGeometry(0.08, 0.22, 8),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  facing.rotation.x = Math.PI / 2;
  facing.position.set(0, 1.75, -0.35);
  group.add(facing);

  return group;
}

const avatar = createPlaceholderAvatar();
avatar.position.set(0, 0, 3.5);
scene.add(avatar);

let avatarAssets = null;
let avatarAnimator = null;

loadAvatarAssets({
  idle: '/models/avatar/idle.glb',
  walk: '/models/avatar/walk.glb',
  run: '/models/avatar/run.glb',
  jump: '/models/avatar/jump.glb',
})
  .then((assets) => {
    avatarAssets = assets;
    avatarAnimator = createAvatarController(assets, avatar);
    console.log('[Avatar] Wczytano prawdziwy, animowany model.');
  })
  .catch((err) => {
    console.warn('[Avatar] Brak plików avatara w public/models/avatar/ — zostaje placeholder.', err);
  });

// ---------------------------------------------------------------------------
// Sterowanie
// ---------------------------------------------------------------------------

const playerController = new PlayerController(avatar, {
  walkSpeed: 2.2,
  runSpeed: 4.6,
  turnRate: 3,
  jumpSpeed: 2,
});

const keyboardInput = new KeyboardInput();

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------

const toastEl = document.getElementById('toast');
let toastTimeout = null;

function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toastEl.classList.remove('visible'), 3200);
}

// ---------------------------------------------------------------------------
// Warstwy rzeczywistości
// ---------------------------------------------------------------------------

const worldManager = new WorldManager(scene, {
  onChange: ({ meta }) => {
    showToast(`${meta.symbol} Warstwa: ${meta.label}`);
  },
});

let activeLayerId = worldManager.getCurrentLayer();
const baseGroundColor = new THREE.Color(0x11151f);
const darkGroundColor = new THREE.Color(0x020204);
const avatarDarkLight = new THREE.PointLight(0xa9d4ff, 0, 8, 2);
avatarDarkLight.position.set(0, 1.5, 0);
scene.add(avatarDarkLight);

let threshold = null;

function applyLayerPresentation(layerId) {
  activeLayerId = layerId;
  const isDarkSpiritual = layerId === 'dark_spiritual';
  grid.visible = !isDarkSpiritual;
  waterBody.mesh.visible = !isDarkSpiritual;
  mirrorFloor.visible = !isDarkSpiritual;
  if (threshold) threshold.group.visible = !isDarkSpiritual;
  if (genesisPoint) genesisPoint.group.visible = !isDarkSpiritual;
  ground.material.color.copy(isDarkSpiritual ? darkGroundColor : baseGroundColor);
}

// ---------------------------------------------------------------------------
// Dźwięk i Punkt Narodzin
// ---------------------------------------------------------------------------

const mainPlazaFinish = createMainPlazaFinish(scene);

const genesisPoint = createGenesisPoint(scene, {
  onAwaken: () => soundManager.playAwaken(),
  onResonance: () => soundManager.playResonance(),
});

const waterCreationRealm = createWaterCreationRealm(scene);
const elarionRealm = createElarionRealm(scene);
const algorithmsRealm = createAlgorithmsRealm(scene);
const memoryGateRealm = createMemoryGateRealm(scene);
const observationTowerRealm = createObservationTowerRealm(scene);
const darknessFieldRealm = createDarknessFieldRealm(scene);
const stoneCityRealm = createStoneCityRealm(scene);
let currentRealm = 'world';
const REALM_RADIUS = 27;

let realmTransitionLockUntil = 0;

const realmRegistry = {
  'woda-kreacji': {
    realm: waterCreationRealm,
    toast: '◌ Woda Kreacji',
  },
  elarion: {
    realm: elarionRealm,
    toast: '✧ Elarion',
  },
  algorytmy: {
    realm: algorithmsRealm,
    toast: '⌘ Algorytmy',
  },
  'brama-pamieci': {
    realm: memoryGateRealm,
    toast: '◇ Brama Pamięci',
  },
  'wieza-obserwacji': {
    realm: observationTowerRealm,
    toast: '△ Wieża Obserwacji',
  },
  'pole-ciemnosci': {
    realm: darknessFieldRealm,
    toast: '○ Pole Ciemności',
  },
  'kamienne-miasto': {
    realm: stoneCityRealm,
    toast: '⬡ Kamienne Miasto',
  },
};

function setActiveRealmVisibility(activeRealmId = null) {
  Object.entries(realmRegistry).forEach(([id, config]) => {
    if (config?.realm?.root) config.realm.root.visible = id === activeRealmId;
  });
}

setActiveRealmVisibility(null);

function enterRealm(realmId) {
  const config = realmRegistry[realmId];
  if (!config || currentRealm === realmId) return;
  realmTransitionLockUntil = performance.now() + 1400;
  worldHub.setOpen(false);
  soundManager.playPassage();
  passageFadeEl.classList.add('active');

  setTimeout(() => {
    currentRealm = realmId;
    setActiveRealmVisibility(realmId);
    distantTerrain.visible = false;
    chatInputEl?.blur();
    avatar.position.copy(config.realm.entryPoint);
    cameraRig.position.set(avatar.position.x, 0, avatar.position.z);
    showToast(config.toast);
  }, 650);

  setTimeout(() => passageFadeEl.classList.remove('active'), 1300);
}

function returnToPunktZero() {
  if (currentRealm === 'world') return;
  realmTransitionLockUntil = performance.now() + 1400;
  soundManager.playPassage();
  passageFadeEl.classList.add('active');

  setTimeout(() => {
    currentRealm = 'world';
    setActiveRealmVisibility(null);
    distantTerrain.visible = true;
    avatar.position.copy(GENESIS_RETURN_POSITION);
    cameraRig.position.set(avatar.position.x, 0, avatar.position.z);
    showToast('✦ Punkt Zero');
  }, 650);

  setTimeout(() => passageFadeEl.classList.remove('active'), 1300);
}

const worldHub = createWorldHub(scene, {
  position: genesisPoint.group.position.clone(),
  onSelect: (destination, index) => {
    showToast(`${index + 1} • ${destination.label}`);
  },
  onActivate: (destination) => {
    localStorage.setItem('luminaVivens.destination', destination.id);
    if (realmRegistry[destination.id]) {
      enterRealm(destination.id);
      return;
    }
    showToast(`✦ Kierunek zapisany: ${destination.label}`);
    soundManager.playAwaken();
  },
});

const realityAtmosphere = createRealityAtmosphere(worldManager);
genesisPoint.setLayerVisual(worldManager.getCurrentLayer());
worldManager.subscribe(({ layer }) => {
  genesisPoint.setLayerVisual(layer);
  worldHub.setOpen(false);
  applyLayerPresentation(layer);
});

// ---------------------------------------------------------------------------
// Próg — świadomy powrót do Punktu Narodzin, bez kary, bez przerywania niczego
// ---------------------------------------------------------------------------

const GENESIS_RETURN_POSITION = new THREE.Vector3(0, 0, 3.5); // to samo miejsce, w którym startujesz za pierwszym razem

function triggerPassage() {
  soundManager.playPassage();
  passageFadeEl.classList.add('active');

  setTimeout(() => {
    avatar.position.copy(GENESIS_RETURN_POSITION);
    showToast('Wracasz przez światło.');
  }, 650);

  setTimeout(() => {
    passageFadeEl.classList.remove('active');
  }, 1400);
}

// Krótki, ciemny błysk przy teleportacji VR — typowa technika ograniczania
// choroby lokomocyjnej nawet przy teleportacji "skokowej" (nie płynnej),
// bo łagodzi wrażenie nagłego, natychmiastowego przeskoku pozycji
function triggerTeleportFlash() {
  passageFadeEl.classList.add('teleport-flash');
  setTimeout(() => passageFadeEl.classList.remove('teleport-flash'), 140);
}

threshold = createThreshold(scene, new THREE.Vector3(-14, 0, 14), {
  onPass: triggerPassage,
});

applyLayerPresentation(worldManager.getCurrentLayer());

// ---------------------------------------------------------------------------
// System puzzli
// ---------------------------------------------------------------------------

const puzzleManager = new PuzzleManager(scene, {
  onCollect: (piece) => {
    showToast(`Odnaleziono: ${piece.name}`);
    soundManager.playCollectSound(piece.world);
  },
  onLayerComplete: (layerNumber) => {
    showToast(`Warstwa ${layerNumber} wraca do oceanu — odsłania się kolejna`);
    soundManager.playLayerCompleteSound();
  },
});
puzzleManager.loadManifest();

// ---------------------------------------------------------------------------
// Imię gracza, czat, ekran startowy
// ---------------------------------------------------------------------------

const NAME_STORAGE_KEY = 'luminaVivens.playerName';
const NAME_LABEL_HEIGHT = 2.3;
const MAX_PLAY_RADIUS = 54; // tuż przed granicą, gdzie zaczynają się dekoracyjne wzgórza (DistantTerrain.js, promień 58)
const CHAT_BUBBLE_HEIGHT = 2.85;

let localPlayerName = '';
let localNameLabel = null;
let localChatBubble = null;
let network = null;
let gameStarted = false;

const nameEntryEl = document.getElementById('name-entry');
const nameInputEl = document.getElementById('name-input');
const nameSubmitEl = document.getElementById('name-submit');
const chatPanelEl = document.getElementById('chat-panel');
const chatLogEl = document.getElementById('chat-log');
const chatFormEl = document.getElementById('chat-form');
const chatInputEl = document.getElementById('chat-input');

nameInputEl.value = localStorage.getItem(NAME_STORAGE_KEY) ?? '';

function appendChatLine(name, text) {
  const line = document.createElement('div');
  line.className = 'chat-line';

  const nameSpan = document.createElement('span');
  nameSpan.className = 'chat-name';
  nameSpan.textContent = `${name}:`;

  line.appendChild(nameSpan);
  line.appendChild(document.createTextNode(text));
  chatLogEl.appendChild(line);
  chatLogEl.scrollTop = chatLogEl.scrollHeight;

  // Ogranicz historię, żeby panel nie rósł w nieskończoność
  while (chatLogEl.children.length > 30) {
    chatLogEl.removeChild(chatLogEl.firstChild);
  }
}

function submitName() {
  const chosen = nameInputEl.value.trim().slice(0, 16) || 'Wędrowiec';
  localPlayerName = chosen;
  localStorage.setItem(NAME_STORAGE_KEY, chosen);
  nameEntryEl.classList.add('hidden');
  chatPanelEl.classList.remove('hidden');

  localNameLabel = createNameLabel(chosen);
  localNameLabel.scale.multiplyScalar(0.55);
  scene.add(localNameLabel);

  localChatBubble = createChatBubble();
  scene.add(localChatBubble.sprite);

  genesisPoint.revealText();
  gameStarted = true;
  connectMultiplayer(chosen);
}

nameSubmitEl.addEventListener('click', submitName);
nameInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') submitName();
});
nameInputEl.focus();

chatFormEl.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = chatInputEl.value.trim();
  chatInputEl.value = '';
  if (!text) {
    chatInputEl.blur();
    return;
  }
  appendChatLine(localPlayerName, text);
  if (localChatBubble) localChatBubble.show(text);
  network?.sendChat(text);
  chatInputEl.blur();
});

chatInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') chatInputEl.blur();
});


// 1–5 przełączają warstwy. Gdy Mapa Świata jest otwarta, 1–7 wybiera
// zamiast tego węzeł podróży, więc oba systemy nie walczą o te same klawisze.
window.addEventListener('keydown', (e) => {
  if (!gameStarted || e.repeat) return;
  const active = document.activeElement;
  const isTyping = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
  if (isTyping) return;

  const index = Number(e.key) - 1;
  if (worldHub.isOpen()) {
    if (index >= 0 && index < 7) {
      e.preventDefault();
      worldHub.selectByIndex(index);
    }
    return;
  }

  if (index < 0 || index >= WORLD_LAYER_ORDER.length) return;
  worldManager.setLayer(WORLD_LAYER_ORDER[index]);
});

// M otwiera holograficzną Mapę Świata wyłącznie przy Genesis / Punkcie Zero.
window.addEventListener('keydown', (e) => {
  if (!gameStarted || e.repeat || e.code !== 'KeyM') return;
  const active = document.activeElement;
  const isTyping = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
  if (isTyping) return;

  if (worldHub.isOpen()) {
    worldHub.setOpen(false);
    return;
  }

  if (currentRealm !== 'world') {
    showToast('Mapa Świata pozostaje w Punkcie Zero.');
    return;
  }

  if (!genesisPoint.isLocalNear()) {
    showToast('Mapa Świata otwiera się przy Punkcie Zero.');
    return;
  }
  if (activeLayerId === 'dark_spiritual') {
    showToast('Ciemność Duchowa nie odsłania mapy.');
    return;
  }

  worldHub.setOpen(true);
  soundManager.playAwaken();
});

// Punkt Genesis jest docelowym, fizycznym interfejsem przejścia. Gdy gracz
// znajduje się w jego kręgu, E przełącza do kolejnej warstwy bez teleportacji.
window.addEventListener('keydown', (e) => {
  if (!gameStarted || e.repeat || e.code !== 'KeyE') return;

  // W destynacjach brama powrotna ma pierwszeństwo przed czatem.
  const currentRealmConfig = realmRegistry[currentRealm];
  if (currentRealmConfig?.realm.isNearReturn(avatar.position)) {
    e.preventDefault();
    chatInputEl?.blur();
    returnToPunktZero();
    return;
  }

  const active = document.activeElement;
  const isTyping = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
  if (isTyping || worldHub.isOpen()) return;

  if (currentRealm !== 'world') return;

  if (!genesisPoint.isLocalNear()) return;
  worldManager.cycle(1);
  soundManager.playAwaken();
});

// "Enter" poza polem czatu otwiera czat (skupia pole) — nie trzeba klikać
window.addEventListener('keydown', (e) => {
  if (!gameStarted) return;
  if (e.key === 'Escape' && worldHub.isOpen()) {
    e.preventDefault();
    worldHub.setOpen(false);
    return;
  }
  if (e.key === 'Enter' && worldHub.isOpen()) {
    e.preventDefault();
    worldHub.activateSelected();
    return;
  }
  if (e.key === 'Enter' && document.activeElement !== chatInputEl) {
    e.preventDefault();
    chatInputEl.focus();
  }
});

// ---------------------------------------------------------------------------
// Multiplayer — zdalni gracze
// ---------------------------------------------------------------------------

const remotePlayers = new Map();

function spawnRemotePlayer(id, state) {
  if (remotePlayers.has(id)) return;

  const group = createPlaceholderAvatar();
  const [x, y, z] = state.position ?? [0, 0, 0];
  group.position.set(x, y, z);
  group.rotation.y = state.heading ?? 0;
  scene.add(group);

  const displayName = state.name || 'Wędrowiec';
  const nameLabel = createNameLabel(displayName);
  scene.add(nameLabel);

  const chatBubble = createChatBubble();
  scene.add(chatBubble.sprite);

  const entry = {
    group,
    animator: null,
    nameLabel,
    chatBubble,
    lastName: displayName,
    targetPos: new THREE.Vector3(x, y, z),
    targetHeading: state.heading ?? 0,
    moving: state.moving ?? false,
    running: state.running ?? false,
  };
  remotePlayers.set(id, entry);

  if (avatarAssets) {
    entry.animator = createAvatarController(avatarAssets, group);
  }
}

function removeRemotePlayer(id) {
  const entry = remotePlayers.get(id);
  if (!entry) return;
  scene.remove(entry.group);
  scene.remove(entry.nameLabel);
  scene.remove(entry.chatBubble.sprite);
  remotePlayers.delete(id);
}

function connectMultiplayer(playerName) {
  network = new NetworkManager('wss://ws.luminavivens.eu', {
    onInit: (players) => {
      for (const p of players) spawnRemotePlayer(p.id, p);
    },
    onJoin: (data) => spawnRemotePlayer(data.id, data),
    onLeave: (id) => removeRemotePlayer(id),
    onState: (data) => {
      const entry = remotePlayers.get(data.id);
      if (!entry) {
        spawnRemotePlayer(data.id, data);
        return;
      }
      const [x, y, z] = data.position ?? [entry.targetPos.x, entry.targetPos.y, entry.targetPos.z];
      entry.targetPos.set(x, y, z);
      entry.targetHeading = data.heading ?? entry.targetHeading;
      entry.moving = data.moving ?? false;
      entry.running = data.running ?? false;

      if (data.name && data.name !== entry.lastName) {
        entry.lastName = data.name;
        updateNameLabelText(entry.nameLabel, data.name);
      }
    },
    onChat: (data) => {
      const entry = remotePlayers.get(data.id);
      const name = entry?.lastName ?? data.name ?? 'Ktoś';
      appendChatLine(name, data.text ?? '');
      if (entry?.chatBubble) entry.chatBubble.show(data.text ?? '');
    },
    onOpen: () => {
      network.sendState({
        position: [avatar.position.x, avatar.position.y, avatar.position.z],
        heading: playerController.heading,
        moving: playerController.lastMoving,
        running: playerController.lastRunning,
        name: playerName,
      });
      networkSendTimer = 0;
    },
  });
}

const NETWORK_SEND_INTERVAL = 0.1;
let networkSendTimer = 0;

// ---------------------------------------------------------------------------
// Kamera trzecioosobowa
// ---------------------------------------------------------------------------

const cameraOffset = new THREE.Vector3(0, 2.6, 5.2);
const cameraLookOffset = new THREE.Vector3(0, 1.4, 0);
const desiredCameraPos = new THREE.Vector3();
const desiredLookAt = new THREE.Vector3();
const lookQuat = new THREE.Quaternion();
const lookEuler = new THREE.Euler();

function updateThirdPersonCamera(delta) {
  if (renderer.xr.isPresenting) return;

  lookEuler.set(mouseLook.pitch, mouseLook.yaw, 0, 'YXZ');
  lookQuat.setFromEuler(lookEuler);

  desiredCameraPos
    .copy(cameraOffset)
    .applyQuaternion(lookQuat)
    .applyQuaternion(avatar.quaternion)
    .add(avatar.position);
  desiredLookAt.copy(cameraLookOffset).add(avatar.position);

  const smoothing = 1 - Math.pow(0.001, delta);
  camera.position.lerp(desiredCameraPos, smoothing);
  camera.lookAt(desiredLookAt);
}
// ---------------------------------------------------------------------------
// Pętla animacji
// ---------------------------------------------------------------------------

const clock = new THREE.Clock();

function animate() {
  const delta = Math.min(clock.getDelta(), 0.1);
vrLocomotion.update(delta);
energeticPlanet.update(delta);
energeticPortal.update(avatar.position);
energeticPocket.update(delta, avatar.position);
consciousnessPlanet.update(delta);
consciousnessPortal.update(avatar.position);


if (renderer.xr.isPresenting) {
  avatar.position.x = cameraRig.position.x;
  avatar.position.z = cameraRig.position.z;
}
  playerController.update(keyboardInput.state, delta);
if (planetSystem) planetSystem.update(delta);
if (planetPortal) planetPortal.update(avatar.position);

  // W VR poruszasz się wyłącznie przez teleportację (cameraRig), nie
  // przez WASD — bez tej synchronizacji multiplayer, etykiety, Ziarno
  // i Próg "widziałyby" Cię cały czas w miejscu, gdzie weszłeś w gogle,
  // ignorując każdy kolejny skok
  if (renderer.xr.isPresenting) {
    avatar.position.x = cameraRig.position.x;
    avatar.position.z = cameraRig.position.z;
  }

  // Niewidzialna granica grywalnego obszaru — tuż przed miejscem, gdzie
  // zaczynają się czysto dekoracyjne wzgórza (DistantTerrain.js). Bez
  // tego dałoby się w nie realnie wejść, a avatar zawsze stoi na płaskim
  // y=0 niezależnie od rzeźby terenu pod nim — więc "wchodzenie" w
  // wzgórze wyglądałoby dokładnie tak, jak na Twoim zrzucie ekranu.
  if (currentRealm === 'world') {
    const distFromCenter = Math.hypot(avatar.position.x, avatar.position.z);
    if (distFromCenter > MAX_PLAY_RADIUS) {
    const scale = MAX_PLAY_RADIUS / distFromCenter;
    avatar.position.x *= scale;
    avatar.position.z *= scale;
    // W VR to avatar jest "kopią" cameraRig (patrz wyżej) — jeśli avatar
    // został właśnie przycięty do granicy, cameraRig musi dostać to
    // z powrotem, inaczej gracz w goglach zobaczyłby się dalej za granicą
    if (renderer.xr.isPresenting) {
      cameraRig.position.x = avatar.position.x;
      cameraRig.position.z = avatar.position.z;
    }
    }
  } else {
    const realmConfig = realmRegistry[currentRealm];
    const realmCenter = realmConfig?.realm.center;
    if (realmCenter) {
      const dx = avatar.position.x - realmCenter.x;
      const dz = avatar.position.z - realmCenter.z;
      const dist = Math.hypot(dx, dz);
      if (dist > REALM_RADIUS) {
        const scale = REALM_RADIUS / dist;
        avatar.position.x = realmCenter.x + dx * scale;
        avatar.position.z = realmCenter.z + dz * scale;
        if (renderer.xr.isPresenting) {
          cameraRig.position.x = avatar.position.x;
          cameraRig.position.z = avatar.position.z;
        }
      }
    }
  }

if (avatarAnimator) {
  avatarAnimator.update(delta, playerController.lastMoving, playerController.lastRunning, playerController.grounded);
}

  puzzleManager.update(avatar.position, delta);
  teleportSystem.update();
  dayNightCycle.update(delta);

  const darkSpiritualActive = activeLayerId === 'dark_spiritual';
  hemiLight.intensity = darkSpiritualActive ? 0.05 : hemiLight.intensity;
  dirLight.intensity = darkSpiritualActive ? 0.12 : dirLight.intensity;
  avatarDarkLight.intensity += ((darkSpiritualActive ? 1.35 : 0) - avatarDarkLight.intensity) * Math.min(1, delta * 3.5);
  avatarDarkLight.position.set(avatar.position.x, avatar.position.y + 1.6, avatar.position.z);

  waterBody.update(delta);
  rain.update(delta, avatar.position);

  const inMainWorld = currentRealm === 'world';
  if (inMainWorld) threshold.update(delta, avatar.position);

  const allPlayerPositions = [avatar.position, ...[...remotePlayers.values()].map((e) => e.group.position)];
  if (inMainWorld) genesisPoint.update(delta, allPlayerPositions);
  worldHub.update(delta, inMainWorld ? avatar.position : null);
  mainPlazaFinish.update(delta, inMainWorld && activeLayerId !== 'dark_spiritual');
  realityAtmosphere.update(delta, avatar.position);
  waterCreationRealm.update(delta, avatar.position, currentRealm === 'woda-kreacji');
  elarionRealm.update(delta, avatar.position, currentRealm === 'elarion');
  algorithmsRealm.update(delta, avatar.position, currentRealm === 'algorytmy');
  memoryGateRealm.update(delta, avatar.position, currentRealm === 'brama-pamieci');
  observationTowerRealm.update(delta, avatar.position, currentRealm === 'wieza-obserwacji');
  darknessFieldRealm.update(delta, avatar.position, currentRealm === 'pole-ciemnosci');
  stoneCityRealm.update(delta, avatar.position, currentRealm === 'kamienne-miasto');

  if (currentRealm !== 'world' && performance.now() >= realmTransitionLockUntil) {
    const currentRealmConfig = realmRegistry[currentRealm];
    if (currentRealmConfig?.realm?.isNearReturn?.(avatar.position)) {
      realmTransitionLockUntil = performance.now() + 2000;
      returnToPunktZero();
    }
  }

  if (localNameLabel) {
    localNameLabel.position.set(avatar.position.x, avatar.position.y + NAME_LABEL_HEIGHT, avatar.position.z);
  }
  if (localChatBubble) {
    localChatBubble.sprite.position.set(avatar.position.x, avatar.position.y + CHAT_BUBBLE_HEIGHT, avatar.position.z);
    localChatBubble.update(delta);
  }

  if (network) {
    networkSendTimer += delta;
    if (networkSendTimer >= NETWORK_SEND_INTERVAL) {
      networkSendTimer = 0;
      network.sendState({
        position: [avatar.position.x, avatar.position.y, avatar.position.z],
        heading: playerController.heading,
        moving: playerController.lastMoving,
        running: playerController.lastRunning,
        name: localPlayerName,
      });
    }
  }

  for (const entry of remotePlayers.values()) {
    entry.group.position.lerp(entry.targetPos, 0.2);

    let diff = entry.targetHeading - entry.group.rotation.y;
    diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    entry.group.rotation.y += diff * 0.2;

    if (entry.animator) {
      entry.animator.update(delta, entry.moving, entry.running);
    }

    entry.nameLabel.position.set(
      entry.group.position.x,
      entry.group.position.y + NAME_LABEL_HEIGHT,
      entry.group.position.z
    );
    entry.chatBubble.sprite.position.set(
      entry.group.position.x,
      entry.group.position.y + CHAT_BUBBLE_HEIGHT,
      entry.group.position.z
    );
    entry.chatBubble.update(delta);
  }

  updateThirdPersonCamera(delta);

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);


