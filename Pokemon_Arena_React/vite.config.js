import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,              // Change default port
    proxy: {                 // Proxy API calls to Flask backend
      '/api': 'http://localhost:5000'
    }
  }
})
