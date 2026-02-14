import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/renderer',
  build: {
    outDir: '../../.vite/renderer',
  },
  server: {
    port: 5173,
  },
});
