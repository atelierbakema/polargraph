import { defineConfig } from 'vite';

export default defineConfig({
  // Relatieve paden, zodat de app overal kan staan (bijv. atelierbakema.com/polargraph/).
  base: './',
  build: { target: 'es2022' },
});
