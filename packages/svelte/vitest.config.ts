import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte({})],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['../../vitest.setup.ts'],
    include: ['src/*.{test,spec}.{ts,tsx,svelte}'],
    testTransformMode: {
      web: ['.svelte'],
    },
  },
})
