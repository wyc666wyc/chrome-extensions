import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { CRX_PAGE_OUTDIR } from '../globalConfig'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: CRX_PAGE_OUTDIR,
    lib: {
      entry: resolve(__dirname, '../src/page/index.ts'),
      formats: ['es'],
      fileName: 'page',
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  plugins: [vue()],
})
