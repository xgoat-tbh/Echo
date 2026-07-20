import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    proxy: {
      '/ws': { target: 'ws://localhost:4000', ws: true },
      '/api': { target: 'http://localhost:4000' },
    },
  },
  define: {
    __WS_URL__: JSON.stringify(process.env.VITE_WS_URL || 'ws://localhost:4000'),
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || 'http://localhost:4000'),
    __TURN_URLS__: JSON.stringify((process.env.VITE_TURN_URLS || '').split(',')),
    __TURN_USERNAME__: JSON.stringify(process.env.VITE_TURN_USERNAME || ''),
    __TURN_CREDENTIAL__: JSON.stringify(process.env.VITE_TURN_CREDENTIAL || ''),
  },
  build: {
    target: 'es2023',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'vendor'
          if (id.includes('node_modules/mediasoup-client')) return 'voice'
        },
      },
    },
  },
})
