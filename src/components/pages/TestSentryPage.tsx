import React, { useState } from 'react';
import { AlertTriangle, Bug, CheckCircle, X, Shield, Activity } from 'lucide-react';
import * as Sentry from "@sentry/react";
import { Button, Card } from '../ui';

export default function TestSentryPage() {
  const [errorSent, setErrorSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleTestError = () => {
    setIsLoading(true);
    
    // إرسال خطأ تجريبي إلى Sentry
    setTimeout(() => {
      try {
        throw new Error("Test Sentry error! - خطأ تجريبي من منصة المساعدات الإنسانية");
      } catch (error) {
        Sentry.captureException(error);
        setErrorSent(true);
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleTestMessage = () => {
    Sentry.captureMessage("رسالة تجريبية من منصة المساعدات الإنسانية", "info");
    alert("تم إرسال رسالة تجريبية إلى Sentry");
  };

  const handleTestUserContext = () => {
    Sentry.setUser({
      id: "test-user-123",
      username: "أحمد الإدمن",
      email: "admin@humanitarian.ps"
    });
    
    Sentry.captureMessage("تم تعيين معلومات المستخدم التجريبي", "info");
    alert("تم تعيين معلومات المستخدم في Sentry");
  };

  const handleTestTransaction = () => {
    const transaction = Sentry.startTransaction({
      name: "Test Transaction - معاملة تجريبية",
      op: "test"
    });

    // محاكاة عملية
    setTimeout(() => {
      transaction.setStatus("ok");
      transaction.finish();
      alert("تم إرسال معاملة تجريبية إلى Sentry");
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="bg-red-100 p-4 rounded-xl w-fit mx-auto mb-4">
          <Bug className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">اختبار Sentry</h1>
        <p className="text-gray-600">اختبار تكامل Sentry مع منصة المساعدات الإنسانية</p>
      </div>

      {/* Sentry Status */}
      <Card>
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="bg-green-100 p-3 rounded-xl">
            <Shield className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">حالة Sentry</h3>
            <p className="text-green-600 text-sm">متصل ومُهيأ بنجاح</p>
            <p className="text-gray-500 text-xs mt-1">
              DSN: https://8435e041aca5415ed15bcef69b70edeb@o4509869485522944.ingest.de.sentry.io/4509869529235536
            </p>
          </div>
        </div>
      </Card>

      {/* Test Actions */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">اختبار الأخطاء</h3>
          <p className="text-gray-600 mb-4 text-sm">
            اختبار إرسال الأخطاء إلى Sentry مع Source Maps
          </p>
          
          <div className="space-y-3">
            <Button
              variant="danger"
              onClick={handleTestError}
              loading={isLoading}
              disabled={isLoading}
              fullWidth
              icon={AlertTriangle}
              iconPosition="right"
            >
              {isLoading ? 'جاري إرسال الخطأ...' : 'إرسال خطأ تجريبي'}
            </Button>

            {errorSent && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-800 font-medium text-sm">
                    تم إرسال الخطأ إلى Sentry بنجاح!
                  </span>
                </div>
                <p className="text-green-700 text-xs mt-1">
                  تحقق من لوحة تحكم Sentry لرؤية الخطأ مع Source Maps
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">اختبارات أخرى</h3>
          <p className="text-gray-600 mb-4 text-sm">
            اختبار ميزات Sentry الأخرى
          </p>
          
          <div className="space-y-3">
            <Button
              variant="secondary"
              onClick={handleTestMessage}
              fullWidth
              icon={Activity}
              iconPosition="right"
            >
              إرسال رسالة تجريبية
            </Button>

            <Button
              variant="secondary"
              onClick={handleTestUserContext}
              fullWidth
              icon={Shield}
              iconPosition="right"
            >
              تعيين معلومات المستخدم
            </Button>

            <Button
              variant="secondary"
              onClick={handleTestTransaction}
              fullWidth
              icon={Activity}
              iconPosition="right"
            >
              إرسال معاملة تجريبية
            </Button>
          </div>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3 space-x-reverse">
          <Bug className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-blue-800 mb-3">تعليمات الاختبار</h4>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>اضغط على "إرسال خطأ تجريبي" لاختبار إرسال الأخطاء</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>تحقق من لوحة تحكم Sentry لرؤية الأخطاء مع Source Maps</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Source Maps تساعد في تحديد موقع الخطأ الدقيق في الكود</span>
              </li>
              <li className="flex items-start space-x-2 space-x-reverse">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>في الإنتاج، قلل tracesSampleRate إلى 0.2 لتوفير الموارد</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Environment Variables Info */}
      <Card className="bg-yellow-50 border-yellow-200">
        <div className="flex items-start space-x-3 space-x-reverse">
          <AlertTriangle className="w-6 h-6 text-yellow-600 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-yellow-800 mb-3">متغيرات البيئة المطلوبة</h4>
            <div className="text-sm text-yellow-700 space-y-2">
              <p>للحصول على SENTRY_AUTH_TOKEN:</p>
              <ol className="list-decimal list-inside space-y-1 mr-4">
                <li>اذهب إلى Sentry Dashboard</li>
                <li>Settings → Auth Tokens</li>
                <li>Create New Token</li>
                <li>اختر صلاحيات: project:releases, project:write</li>
                <li>انسخ التوكن وأضفه لملف .env</li>
              </ol>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}