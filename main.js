import * as THREE from 'three';
import { VRButton } from './VRButtonPL.js';
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
import { createWaterBody } from './Water.js';
import { createRain } from './Rain.js';
import { createMirrorClock } from './MirrorClock.js';

// ---------------------------------------------------------------------------
// Scena, kamera, renderer
// ---------------------------------------------------------------------------

const container = document.getElementById('app');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x05070c);
scene.fog = new THREE.FogExp2(0x05070c, 0.015);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  200
);

const cameraRig = new THREE.Group();
cameraRig.add(camera);
scene.add(cameraRig);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.xr.enabled = true;
container.appendChild(renderer.domElement);

document.body.appendChild(VRButton.createButton(renderer));

// ---------------------------------------------------------------------------
// Światła
// ---------------------------------------------------------------------------

const hemiLight = new THREE.HemisphereLight(0x8fb3ff, 0x0a0a12, 0.6);
scene.add(hemiLight);

const dirLight = new THREE.DirectionalLight(0xfff2d9, 1.1);
dirLight.position.set(5, 10, 7);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.left = -15;
dirLight.shadow.camera.right = 15;
dirLight.shadow.camera.top = 15;
dirLight.shadow.camera.bottom = -15;
scene.add(dirLight);

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
scene.add(createDistantTerrain());

const sky = createSky(scene);

const waterBody = createWaterBody();
scene.add(waterBody.mesh);

const rain = createRain(scene);

createMirrorClock();

// ---------------------------------------------------------------------------
// Teleportacja VR
// ---------------------------------------------------------------------------

const teleportSystem = setupTeleportation(renderer, cameraRig, ground, scene);

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
// Dźwięk i Punkt Narodzin
// ---------------------------------------------------------------------------

const soundManager = new SoundManager();

const genesisPoint = createGenesisPoint(scene, {
  onAwaken: () => soundManager.playAwaken(),
  onResonance: () => soundManager.playResonance(),
});

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

// "Enter" poza polem czatu otwiera czat (skupia pole) — nie trzeba klikać
window.addEventListener('keydown', (e) => {
  if (!gameStarted) return;
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

function updateThirdPersonCamera(delta) {
  if (renderer.xr.isPresenting) return;

  desiredCameraPos.copy(cameraOffset).applyQuaternion(avatar.quaternion).add(avatar.position);
  desiredLookAt.copy(cameraLookOffset).add(avatar.position);

  const smoothing = 1 - Math.pow(0.001, delta);
  camera.position.lerp(desiredCameraPos, smoothing);
  camera.lookAt(desiredLookAt);
}

camera.position.copy(avatar.position).add(cameraOffset);
camera.lookAt(avatar.position.clone().add(cameraLookOffset));

// ---------------------------------------------------------------------------
// Pętla animacji
// ---------------------------------------------------------------------------

const clock = new THREE.Clock();

function animate() {
  const delta = Math.min(clock.getDelta(), 0.1);

  playerController.update(keyboardInput.state, delta);

  // Niewidzialna granica grywalnego obszaru — tuż przed miejscem, gdzie
  // zaczynają się czysto dekoracyjne wzgórza (DistantTerrain.js). Bez
  // tego dałoby się w nie realnie wejść, a avatar zawsze stoi na płaskim
  // y=0 niezależnie od rzeźby terenu pod nim — więc "wchodzenie" w
  // wzgórze wyglądałoby dokładnie tak, jak na Twoim zrzucie ekranu.
  const distFromCenter = Math.hypot(avatar.position.x, avatar.position.z);
  if (distFromCenter > MAX_PLAY_RADIUS) {
    const scale = MAX_PLAY_RADIUS / distFromCenter;
    avatar.position.x *= scale;
    avatar.position.z *= scale;
  }

  if (avatarAnimator) {
    avatarAnimator.update(delta, playerController.lastMoving, playerController.lastRunning);
  }

  puzzleManager.update(avatar.position, delta);
  teleportSystem.update();
  sky.update(delta);
  waterBody.update(delta);
  rain.update(delta, avatar.position);

  const allPlayerPositions = [avatar.position, ...[...remotePlayers.values()].map((e) => e.group.position)];
  genesisPoint.update(delta, allPlayerPositions);

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

// ---------------------------------------------------------------------------
// Responsywność
// ---------------------------------------------------------------------------

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
