import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/parking': {
        target: process.env.VITE_CDN_URL,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
