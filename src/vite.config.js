import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Three.js (silnik 3D) rzadko się zmienia między aktualizacjami
          // Twojego kodu gry — trzymając go w osobnym pliku, przeglądarka
          // odwiedzającego może go zapamiętać (cache) i przy kolejnej
          // aktualizacji gry pobrać tylko Twój, znacznie mniejszy kod,
          // zamiast ściągać za każdym razem całość od nowa.
          three: ['three'],
        },
      },
    },
  },
});
