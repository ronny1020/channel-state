import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    svelte({
      compilerOptions: {
        compatibility: {
          componentApi: 4,
        },
      },
    }),
  ],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@channel-state/core': '../../../packages/core/src',
      '@channel-state/svelte': '../../../packages/svelte/src',
    },
  },
})
