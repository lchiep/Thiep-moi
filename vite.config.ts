import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(() => {
  return {
    plugins: [react()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { port: 5173 },
    build: {
      target: 'es2022',
      rollupOptions: {
        output: {
          // Tách thư viện nặng ra chunk riêng để màn mở đầu tải nhanh
          manualChunks(id) {
            if (id.includes('node_modules/three') || id.includes('@react-three')) return 'three'
            if (id.includes('node_modules/gsap') || id.includes('node_modules/animejs')) return 'motion'
          },
        },
      },
    },
  }
})
