import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tensil/kinetic-input': path.resolve(__dirname, '../packages/number-picker/src'),
      '@tensil/kinetic-input-css': path.resolve(__dirname, '../packages/number-picker/dist'),
    },
  },
  server: {
    port: 3001,
    watch: {
      // Prevent watching the package dist to avoid HMR loops
      ignored: ['**/node_modules/**', '**/packages/number-picker/dist/**'],
    },
  },
  optimizeDeps: {
    // Force Vite to optimize the workspace package to prevent re-render loops
    include: ['@tensil/kinetic-input'],
  },
});
