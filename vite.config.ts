import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), ...(mode === 'https' ? [basicSsl()] : [])],
  server: {
    // Listen on all interfaces so mobile can reach dev server at your LAN IP (e.g. 172.16.x.x:5173).
    // Use the same URL on desktop and mobile — localhost vs IP are separate localStorage origins.
    host: true,
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: true,
    port: 5173,
    strictPort: false,
  },
}))
