import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuración de Vite para compilar el frontend React dentro del backend Express (carpeta public)
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../public',
    emptyOutDir: true, // Limpia la carpeta public del servidor antes de construir el nuevo bundle
  }
})
