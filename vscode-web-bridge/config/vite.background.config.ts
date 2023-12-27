import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { CRX_BACKGROUND_OUTDIR } from '../globalConfig'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: CRX_BACKGROUND_OUTDIR,
    lib: {
      entry: resolve(__dirname, '../src/background/index.ts'),
      formats: ['es'],
      fileName: 'background',
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  plugins: [vue()],
})
