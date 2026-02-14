import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    conditions: ['node'],
  },
  build: {
    outDir: '.vite/build',
    lib: {
      entry: 'src/main/index.ts',
      formats: ['cjs'],
      fileName: () => 'main.js',
    },
    rollupOptions: {
      external: ['electron', 'path', 'fs', 'fs/promises', 'child_process', 'os', 'url'],
    },
    sourcemap: true,
    minify: false,
  },
});
