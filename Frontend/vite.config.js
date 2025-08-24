import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:4000',
      '/upload': 'http://localhost:4000',
      '/inventory': 'http://localhost:4000',
      '/sales': 'http://localhost:4000',
      '/marketing': 'http://localhost:4000'
    }
  }
})