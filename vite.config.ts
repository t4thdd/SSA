import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from "@sentry/vite-plugin";

// تأكد أن عندك SENTRY_AUTH_TOKEN في متغيرات البيئة
export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      org: "wef-by",          // من حساب Sentry
      project: "aid",         // من حساب Sentry
      authToken: process.env.SENTRY_AUTH_TOKEN,
      include: "./dist",      // ملفات الـ build
      url: "https://sentry.io/", 
    }),
  ],
  build: {
    sourcemap: true,  // مهم لرفع الخرائط وقراءة الأخطاء داخل الكود الحقيقي
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});