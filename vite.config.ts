import path from 'path'

import { defineConfig } from 'vite'

export default defineConfig({
  root: path.resolve(__dirname, './src'),
  publicDir: path.resolve(__dirname, './public'),
  build: {
    outDir: path.resolve(__dirname, './dist'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
