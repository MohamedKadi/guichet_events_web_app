import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: ['eventick.shop', 'www.eventick.shop'],
    proxy: {
      '/api': {
        target: 'http://backend:5000',
        changeOrigin: true,
      },
    },
  },
});
