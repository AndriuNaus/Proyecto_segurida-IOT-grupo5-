import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuración de Vite para compilar el frontend React dentro del backend Express (carpeta public)
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    outDir: '../public',
    emptyOutDir: true, // Limpia la carpeta public del servidor antes de construir el nuevo bundle
  }
})
