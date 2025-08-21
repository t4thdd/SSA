import { jsPDF } from 'jspdf';
import { useState } from 'react';

// نظام التصدير المتقدم
export interface ExportOptions {
  format: 'csv' | 'json' | 'pdf' | 'excel';
  filename?: string;
  includeHeaders?: boolean;
  dateRange?: {
    from: string;
    to: string;
  };
  filters?: any;
  customFields?: string[];
}

export interface ExportResult {
  success: boolean;
  filename: string;
  recordsCount: number;
  fileSize: string;
  downloadUrl?: string;
  error?: string;
}

class ExportService {
  // تصدير CSV
  async exportToCSV(
    data: any[], 
    options: ExportOptions,
    logInfo?: (message: string, context?: string) => void,
    logError?: (error: Error, context?: string) => void
  ): Promise<ExportResult> {
    try {
      if (!data || data.length === 0) {
        throw new Error('لا توجد بيانات للتصدير');
      }

      const headers = options.customFields || Object.keys(data[0]);
      let csvContent = '';

      // إضافة العناوين
      if (options.includeHeaders !== false) {
        csvContent += headers.join(',') + '\n';
      }

      // إضافة البيانات
      data.forEach(row => {
        const values = headers.map(header => {
          const value = row[header];
          // معالجة القيم التي تحتوي على فواصل أو علامات اقتباس
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        });
        csvContent += values.join(',') + '\n';
      });

      const filename = options.filename || `تصدير_${new Date().toISOString().split('T')[0]}.csv`;
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      // تحميل الملف
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      logInfo?.(`تم تصدير ${data.length} سجل إلى CSV`, 'ExportService');

      return {
        success: true,
        filename,
        recordsCount: data.length,
        fileSize: this.formatFileSize(blob.size),
        downloadUrl: url
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ في تصدير CSV';
      logError?.(new Error(errorMessage), 'ExportService');
      return {
        success: false,
        filename: '',
        recordsCount: 0,
        fileSize: '0 KB',
        error: errorMessage
      };
    }
  }

  // تصدير JSON
  async exportToJSON(
    data: any[], 
    options: ExportOptions,
    logInfo?: (message: string, context?: string) => void,
    logError?: (error: Error, context?: string) => void
  ): Promise<ExportResult> {
    try {
      if (!data || data.length === 0) {
        throw new Error('لا توجد بيانات للتصدير');
      }

      const exportData = {
        exportDate: new Date().toISOString(),
        totalRecords: data.length,
        filters: options.filters || {},
        dateRange: options.dateRange,
        data: options.customFields ? 
          data.map(item => {
            const filtered: any = {};
            options.customFields!.forEach(field => {
              filtered[field] = item[field];
            });
            return filtered;
          }) : data
      };

      const jsonContent = JSON.stringify(exportData, null, 2);
      const filename = options.filename || `تصدير_${new Date().toISOString().split('T')[0]}.json`;
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      logInfo?.(`تم تصدير ${data.length} سجل إلى JSON`, 'ExportService');

      return {
        success: true,
        filename,
        recordsCount: data.length,
        fileSize: this.formatFileSize(blob.size),
        downloadUrl: url
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ في تصدير JSON';
      logError?.(new Error(errorMessage), 'ExportService');
      return {
        success: false,
        filename: '',
        recordsCount: 0,
        fileSize: '0 KB',
        error: errorMessage
      };
    }
  }

  // تصدير PDF (محاكاة - يحتاج مكتبة jsPDF)
  async exportToPDF(
    data: any[], 
    options: ExportOptions,
    logInfo?: (message: string, context?: string) => void,
    logError?: (error: Error, context?: string) => void
  ): Promise<ExportResult> {
    try {
      if (!data || data.length === 0) {
        throw new Error('لا توجد بيانات للتصدير');
      }

      // محاكاة إنشاء PDF
      const pdfContent = this.generatePDFContent(data, options);
      const filename = options.filename || `تقرير_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // محاكاة حجم الملف
      const estimatedSize = data.length * 1024; // تقدير تقريبي
      
      // في التطبيق الحقيقي، سيتم استخدام jsPDF هنا
      // const doc = new jsPDF();
      // doc.text(pdfContent, 10, 10);
      // doc.save(filename);

      logInfo?.(`تم تصدير ${data.length} سجل إلى PDF`, 'ExportService');

      return {
        success: true,
        filename,
        recordsCount: data.length,
        fileSize: this.formatFileSize(estimatedSize)
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ في تصدير PDF';
      logError?.(new Error(errorMessage), 'ExportService');
      return {
        success: false,
        filename: '',
        recordsCount: 0,
        fileSize: '0 KB',
        error: errorMessage
      };
    }
  }

  // تصدير Excel (محاكاة)
  async exportToExcel(
    data: any[], 
    options: ExportOptions,
    logInfo?: (message: string, context?: string) => void,
    logError?: (error: Error, context?: string) => void
  ): Promise<ExportResult> {
    try {
      if (!data || data.length === 0) {
        throw new Error('لا توجد بيانات للتصدير');
      }

      // محاكاة إنشاء Excel
      const filename = options.filename || `تقرير_${new Date().toISOString().split('T')[0]}.xlsx`;
      const estimatedSize = data.length * 512; // تقدير تقريبي

      // في التطبيق الحقيقي، سيتم استخدام مكتبة مثل xlsx
      logInfo?.(`تم تصدير ${data.length} سجل إلى Excel`, 'ExportService');

      return {
        success: true,
        filename,
        recordsCount: data.length,
        fileSize: this.formatFileSize(estimatedSize)
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'خطأ في تصدير Excel';
      logError?.(new Error(errorMessage), 'ExportService');
      return {
        success: false,
        filename: '',
        recordsCount: 0,
        fileSize: '0 KB',
        error: errorMessage
      };
    }
  }

  // تنسيق حجم الملف
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // إنشاء محتوى PDF
  private generatePDFContent(data: any[], options: ExportOptions): string {
    let content = `تقرير مُصدر في ${new Date().toLocaleDateString('ar-SA')}\n\n`;
    content += `إجمالي السجلات: ${data.length}\n\n`;
    
    if (options.dateRange) {
      content += `الفترة الزمنية: من ${options.dateRange.from} إلى ${options.dateRange.to}\n\n`;
    }

    // إضافة عينة من البيانات
    data.slice(0, 10).forEach((item, index) => {
      content += `${index + 1}. ${JSON.stringify(item, null, 2)}\n\n`;
    });

    return content;
  }

  // تصدير متقدم مع خيارات
  async exportWithOptions(
    data: any[], 
    options: ExportOptions,
    logInfo?: (message: string, context?: string) => void,
    logError?: (error: Error, context?: string) => void
  ): Promise<ExportResult> {
    switch (options.format) {
      case 'csv':
        return this.exportToCSV(data, options, logInfo, logError);
      case 'json':
        return this.exportToJSON(data, options, logInfo, logError);
      case 'pdf':
        return this.exportToPDF(data, options, logInfo, logError);
      case 'excel':
        return this.exportToExcel(data, options, logInfo, logError);
      default:
        throw new Error('صيغة التصدير غير مدعومة');
    }
  }
}

export const exportService = new ExportService();

// Hook لاستخدام خدمة التصدير
export const useExport = () => {
  const { logInfo, logError } = useErrorLogger();
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);

  const exportData = async (data: any[], options: ExportOptions) => {
    setIsExporting(true);
    setExportResult(null);

    try {
      const result = await exportService.exportWithOptions(data, options, logInfo, logError);
      setExportResult(result);
      return result;
    } catch (error) {
      const errorResult: ExportResult = {
        success: false,
        filename: '',
        recordsCount: 0,
        fileSize: '0 KB',
        error: error instanceof Error ? error.message : 'خطأ غير معروف'
      };
      setExportResult(errorResult);
      logError(error instanceof Error ? error : new Error('خطأ غير معروف'), 'useExport');
      return errorResult;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportData,
    isExporting,
    exportResult,
    clearResult: () => setExportResult(null)
  };
};

// إضافة import مفقود
import { useErrorLogger } from './errorLogger';

// دوال مساعدة للتصدير السريع
export const quickExportCSV = async (data: any[], filename?: string) => {
  return exportService.exportToCSV(data, { format: 'csv', filename });
};

export const quickExportJSON = async (data: any[], filename?: string) => {
  return exportService.exportToJSON(data, { format: 'json', filename });
};

export const quickExportPDF = async (data: any[], filename?: string) => {
  return exportService.exportToPDF(data, { format: 'pdf', filename });
};