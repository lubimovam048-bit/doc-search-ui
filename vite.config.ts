import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // относительные пути: работает и в корне домена, и в подпапке GitHub Pages
  base: './',
  server: { port: 5173 },
});
