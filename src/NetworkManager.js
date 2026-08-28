const RECONNECT_DELAY = 3000;

/**
 * NetworkManager
 * --------------
 * Cała wiedza o WebSocketach i formacie wiadomości siedzi tutaj —
 * reszta gry dostaje tylko proste callbacki i metody sendState()/sendChat().
 *
 * Automatycznie próbuje połączyć się ponownie po utracie połączenia —
 * gra działa dalej lokalnie (jako singleplayer) w międzyczasie.
 */
export class NetworkManager {
  constructor(url, { onInit, onJoin, onLeave, onState, onOpen, onChat } = {}) {
    this.url = url;
    this.onInit = onInit ?? (() => {});
    this.onJoin = onJoin ?? (() => {});
    this.onLeave = onLeave ?? (() => {});
    this.onState = onState ?? (() => {});
    this.onOpen = onOpen ?? (() => {});
    this.onChat = onChat ?? (() => {});
    this.ws = null;
    this.myId = null;
    this.connected = false;
    this._connect();
  }

  _connect() {
    this.ws = new WebSocket(this.url);

    this.ws.addEventListener('open', () => {
      this.connected = true;
      console.log('[Network] Połączono z serwerem multiplayer');
      this.onOpen();
    });

    this.ws.addEventListener('message', (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      switch (data.type) {
        case 'init':
          this.myId = data.id;
          this.onInit(data.players ?? []);
          break;
        case 'join':
          this.onJoin(data);
          break;
        case 'leave':
          this.onLeave(data.id);
          break;
        case 'state':
          this.onState(data);
          break;
        case 'chat':
          this.onChat(data);
          break;
      }
    });

    this.ws.addEventListener('close', () => {
      this.connected = false;
      console.warn('[Network] Rozłączono z serwerem — ponawiam próbę za chwilę');
      setTimeout(() => this._connect(), RECONNECT_DELAY);
    });

    this.ws.addEventListener('error', () => {
      // 'close' i tak się wywoła zaraz po błędzie — nie trzeba dublować logiki
    });
  }

  sendState(state) {
    if (!this.connected || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'state', ...state }));
  }

  sendChat(text) {
    if (!this.connected || this.ws.readyState !== WebSocket.OPEN) return;
    this.ws.send(JSON.stringify({ type: 'chat', text }));
  }
}
