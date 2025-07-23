import { defineConfig } from 'tsup'
import GlobalsPlugin from 'esbuild-plugin-globals'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs', 'iife'],
  globalName: 'ChannelState',
  dts: true,
  clean: true,
  minify: false,
  sourcemap: true,
  external: ['react', 'react-dom', 'vue', 'svelte', '@channel-state/core'],
  esbuildPlugins: [
    GlobalsPlugin({
      react: 'React',
      'react-dom': 'ReactDOM',
      vue: 'Vue',
      svelte: 'Svelte',
      '@channel-state/core': 'ChannelState',
    }),
  ],
  treeshake: true,
  splitting: false,
  tsconfig: './tsconfig.json',
})
