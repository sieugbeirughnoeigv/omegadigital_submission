import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  // relative paths so the build works from any static host or subfolder
  base: './',
  test: {
    environment: 'jsdom',
  },
})
