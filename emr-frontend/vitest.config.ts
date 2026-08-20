// import { defineConfig } from 'vitest/config';
// import path from 'path';

// export default defineConfig({
//   test: {
//     environment: 'jsdom',
//     globals: true,
//     setupFiles: ['./vitest.setup.ts'],
//     include: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
//   },
//   resolve: {
//     alias: {
//       '@': path.resolve(__dirname, './'),
//     },
//   },
// });
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
    reporters: ['default', 'html'],
    outputFile: {
      html: './test-reports/integration-report.html',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});