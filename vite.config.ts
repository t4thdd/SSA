import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// تأكد أن عندك SENTRY_AUTH_TOKEN في متغيرات البيئة
export default defineConfig({
  plugins: [
    react(),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});