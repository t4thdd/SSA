import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from "@sentry/react";
import App from './App.tsx';
import './index.css';

Sentry.init({
  dsn: "https://8435e041aca5415ed15bcef69b70edeb@o4509869485522944.ingest.de.sentry.io/4509869529235536",
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  tracesSampleRate: 1.0,   // نسبة جمع بيانات الأداء (قللها في الإنتاج مثلاً 0.2)
  replaysSessionSampleRate: 0.1, // (اختياري) لتسجيل جلسات المستخدمين
  replaysOnErrorSampleRate: 1.0, // تسجيل كامل عند حصول خطأ
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
