import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  minify: false,
  sourcemap: true,
  external: ['react', 'react-dom', 'vue', '@channel-state/core'],
  treeshake: true,
  splitting: false,
  tsconfig: './tsconfig.json',
})
