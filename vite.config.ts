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
      authToken: "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",
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