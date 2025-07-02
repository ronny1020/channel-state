import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@channel-state/core': '../../../packages/core/src',
      '@channel-state/vue': '../../../packages/vue/src',
    },
  },
})
