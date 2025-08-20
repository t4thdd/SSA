import React, { useState } from 'react';
import { Download, FileText, Database, File, Calendar, Filter, CheckCircle, AlertTriangle, X, Settings, Eye } from 'lucide-react';
import { Button, Card, Input, Badge, Modal } from './index';
import { exportService, type ExportOptions, type ExportResult } from '../../utils/exportUtils';
import { useErrorLogger } from '../../utils/errorLogger';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any[];
  title: string;
  defaultFilename?: string;
  availableFields?: { key: string; label: string; }[];
  filters?: any;
}

export const ExportModal = ({
  isOpen,
  onClose,
  data,
  title,
  defaultFilename,
  availableFields = [],
  filters = {}
}: ExportModalProps) => {
  const { logInfo, logError } = useErrorLogger();
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    filename: defaultFilename || `تصدير_${new Date().toISOString().split('T')[0]}`,
    includeHeaders: true,
    customFields: availableFields.length > 0 ? availableFields.slice(0, 5).map(f => f.key) : []
  });
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);

  const formatOptions = [
    { value: 'csv', label: 'CSV', icon: FileText, description: 'ملف نصي مفصول بفواصل' },
    { value: 'json', label: 'JSON', icon: Database, description: 'ملف بيانات منظم' },
    { value: 'pdf', label: 'PDF', icon: File, description: 'ملف PDF للطباعة' },
    { value: 'excel', label: 'Excel', icon: FileText, description: 'ملف Excel للتحليل' }
  ];

  const handleExport = async () => {
    if (!data || data.length === 0) {
      logError(new Error('لا توجد بيانات للتصدير'), 'ExportModal');
      return;
    }

    setIsExporting(true);
    setExportResult(null);

    try {
      // تطبيق الفلاتر المخصصة إذا كانت متاحة
      let filteredData = [...data];
      
      // فلترة حسب التاريخ إذا كان محدد
      if (exportOptions.dateRange) {
        filteredData = filteredData.filter(item => {
          const itemDate = item.createdAt || item.timestamp || item.date;
          if (!itemDate) return true;
          
          const date = new Date(itemDate).toISOString().split('T')[0];
          return date >= exportOptions.dateRange!.from && date <= exportOptions.dateRange!.to;
        });
      }

      // تطبيق الحقول المخصصة
      if (exportOptions.customFields && exportOptions.customFields.length > 0) {
        filteredData = filteredData.map(item => {
          const filtered: any = {};
          exportOptions.customFields!.forEach(field => {
            filtered[field] = item[field];
          });
          return filtered;
        });
      }

      const result = await exportService.exportWithOptions(filteredData, {
        ...exportOptions,
        filters
      });

      setExportResult(result);
      
      if (result.success) {
        logInfo(`تم تصدير ${result.recordsCount} سجل بصيغة ${exportOptions.format}`, 'ExportModal');
      } else {
        logError(new Error(result.error || 'فشل التصدير'), 'ExportModal');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ في عملية التصدير';
      setExportResult({
        success: false,
        filename: '',
        recordsCount: 0,
        fileSize: '0 KB',
        error: errorMessage
      });
      logError(new Error(errorMessage), 'ExportModal');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePreview = () => {
    let filteredData = [...data];
    
    // تطبيق فلترة التاريخ
    if (exportOptions.dateRange) {
      filteredData = filteredData.filter(item => {
        const itemDate = item.createdAt || item.timestamp || item.date;
        if (!itemDate) return true;
        
        const date = new Date(itemDate).toISOString().split('T')[0];
        return date >= exportOptions.dateRange!.from && date <= exportOptions.dateRange!.to;
      });
    }

    // تطبيق الحقول المخصصة
    if (exportOptions.customFields && exportOptions.customFields.length > 0) {
      filteredData = filteredData.map(item => {
        const filtered: any = {};
        exportOptions.customFields!.forEach(field => {
          filtered[field] = item[field];
        });
        return filtered;
      });
    }

    setPreviewData(filteredData.slice(0, 10)); // أول 10 سجلات للمعاينة
    setShowPreview(true);
  };

  const handleFieldToggle = (fieldKey: string) => {
    setExportOptions(prev => ({
      ...prev,
      customFields: prev.customFields?.includes(fieldKey)
        ? prev.customFields.filter(f => f !== fieldKey)
        : [...(prev.customFields || []), fieldKey]
    }));
  };

  const getFormatIcon = (format: string) => {
    const formatOption = formatOptions.find(f => f.value === format);
    return formatOption ? formatOption.icon : FileText;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`تصدير ${title}`} size="lg">
      <div className="p-6 space-y-6">
        {/* Export Result */}
        {exportResult && (
          <Card className={exportResult.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} padding="sm">
            <div className="flex items-center space-x-3 space-x-reverse">
              {exportResult.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              )}
              <div className="flex-1">
                <span className={`font-medium ${exportResult.success ? 'text-green-800' : 'text-red-800'}`}>
                  {exportResult.success ? 'تم التصدير بنجاح!' : 'فشل في التصدير'}
                </span>
                {exportResult.success ? (
                  <p className="text-green-600 text-sm mt-1">
                    تم تصدير {exportResult.recordsCount} سجل ({exportResult.fileSize}) - {exportResult.filename}
                  </p>
                ) : (
                  <p className="text-red-600 text-sm mt-1">{exportResult.error}</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Export Format Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">صيغة التصدير</label>
          <div className="grid md:grid-cols-2 gap-3">
            {formatOptions.map((format) => {
              const IconComponent = format.icon;
              return (
                <div
                  key={format.value}
                  onClick={() => setExportOptions(prev => ({ ...prev, format: format.value as any }))}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                    exportOptions.format === format.value
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3 space-x-reverse">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <IconComponent className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{format.label}</h4>
                      <p className="text-sm text-gray-600">{format.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Filename */}
        <Input
          label="اسم الملف"
          type="text"
          value={exportOptions.filename}
          onChange={(e) => setExportOptions(prev => ({ ...prev, filename: e.target.value }))}
          placeholder="أدخل اسم الملف..."
        />

        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">فلترة حسب التاريخ (اختياري)</label>
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              label="من تاريخ"
              type="date"
              value={exportOptions.dateRange?.from || ''}
              onChange={(e) => setExportOptions(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, from: e.target.value, to: prev.dateRange?.to || '' }
              }))}
            />
            <Input
              label="إلى تاريخ"
              type="date"
              value={exportOptions.dateRange?.to || ''}
              onChange={(e) => setExportOptions(prev => ({
                ...prev,
                dateRange: { ...prev.dateRange, from: prev.dateRange?.from || '', to: e.target.value }
              }))}
            />
          </div>
        </div>

        {/* Custom Fields Selection */}
        {availableFields.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">الحقول المراد تصديرها</label>
            <div className="grid md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-4">
              {availableFields.map((field) => (
                <div key={field.key} className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    checked={exportOptions.customFields?.includes(field.key) || false}
                    onChange={() => handleFieldToggle(field.key)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">{field.label}</label>
                </div>
              ))}
            </div>
            <div className="mt-2 text-sm text-gray-600">
              محدد: {exportOptions.customFields?.length || 0} من {availableFields.length} حقل
            </div>
          </div>
        )}

        {/* Export Options */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <input
              type="checkbox"
              checked={exportOptions.includeHeaders !== false}
              onChange={(e) => setExportOptions(prev => ({ ...prev, includeHeaders: e.target.checked }))}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label className="text-sm text-gray-700">تضمين عناوين الأعمدة</label>
          </div>
        </div>

        {/* Data Summary */}
        <Card className="bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">ملخص البيانات</h4>
              <p className="text-sm text-gray-600 mt-1">
                {data.length} سجل إجمالي
                {exportOptions.dateRange?.from && exportOptions.dateRange?.to && (
                  <span> • مفلتر حسب التاريخ</span>
                )}
                {exportOptions.customFields && exportOptions.customFields.length > 0 && (
                  <span> • {exportOptions.customFields.length} حقل محدد</span>
                )}
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={Eye}
              iconPosition="right"
              onClick={handlePreview}
            >
              معاينة البيانات
            </Button>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex space-x-3 space-x-reverse justify-end pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose} disabled={isExporting}>
            إلغاء
          </Button>
          <Button 
            variant="primary" 
            icon={isExporting ? undefined : Download}
            iconPosition="right"
            onClick={handleExport}
            disabled={isExporting || data.length === 0}
            loading={isExporting}
          >
            {isExporting ? 'جاري التصدير...' : `تصدير ${exportOptions.format.toUpperCase()}`}
          </Button>
        </div>

        {/* Preview Modal */}
        {showPreview && (
          <Modal
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            title="معاينة البيانات"
            size="xl"
          >
            <div className="p-6">
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">معاينة أول 10 سجلات</h4>
                <p className="text-sm text-gray-600">
                  سيتم تصدير {data.length} سجل بصيغة {exportOptions.format.toUpperCase()}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
                <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                  {JSON.stringify(previewData, null, 2)}
                </pre>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button variant="primary" onClick={() => setShowPreview(false)}>
                  إغلاق المعاينة
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </Modal>
  );
};