import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

const useCloudflarePlugin = process.env.CLOUDFLARE_VITE_PLUGIN === 'true' || process.env.CF_PAGES === '1'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), ...(useCloudflarePlugin ? [cloudflare()] : [])],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
})