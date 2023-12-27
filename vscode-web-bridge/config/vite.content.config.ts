import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { CRX_CONTENT_OUTDIR } from '../globalConfig'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    outDir: CRX_CONTENT_OUTDIR,
    lib: {
      entry: resolve(__dirname, '../src/content/index.ts'),
      formats: ['es'],
      fileName: 'content',
    },
    rollupOptions: {
      output: {
        assetFileNames: () => {
          return 'content.css'
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  define: {
    'process.env.NODE_ENV': null
  },
  plugins: [vue()],
})
