import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 8000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'transformers': ['@huggingface/transformers']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['@huggingface/transformers']
  }
});
