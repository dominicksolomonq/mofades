import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'test123.glb', 'real logo website.png'],
        manifest: {
          name: 'MO FADES',
          short_name: 'MO FADES',
          description: 'Premium Barber Services & Community',
          theme_color: '#050505',
          background_color: '#050505',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: 'real logo website.png',
              sizes: '192x192', // Ideally resizing would be better but using source for now
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: 'real logo website.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
