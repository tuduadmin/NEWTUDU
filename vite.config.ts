import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { modeHeroDevApi } from './vite-plugins/modeHeroDevApi'

export default defineConfig(({ command, mode }) => ({
  optimizeDeps: {
    // Pre-bundling maplibre-gl breaks its ESM exports in dev (app bootstrap fails).
    exclude: ['maplibre-gl'],
  },
  plugins: [
    react(),
    tailwindcss(),
    ...(command === 'serve' ? [modeHeroDevApi()] : []),
    ...(mode === 'https' ? [basicSsl()] : []),
  ],
  server: {
    // Listen on all interfaces so mobile can reach dev server at your LAN IP (e.g. 172.16.x.x:5173).
    // Use the same URL on desktop and mobile — localhost vs IP are separate localStorage origins.
    host: true,
    port: 5173,
    strictPort: true,
    proxy: {
      '/map-tiles': {
        target: 'https://basemaps.cartocdn.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/map-tiles/, '/rastertiles/voyager'),
      },
    },
  },
  preview: {
    host: true,
    port: 5173,
    strictPort: false,
    proxy: {
      '/map-tiles': {
        target: 'https://basemaps.cartocdn.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/map-tiles/, '/rastertiles/voyager'),
      },
    },
  },
}))
