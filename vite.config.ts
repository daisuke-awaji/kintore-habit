import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages: https://daisuke-awaji.github.io/kintore-habit/
export default defineConfig({
  base: '/kintore-habit/',
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: false,
  },
});
