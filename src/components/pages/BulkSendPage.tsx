import React, { useState } from 'react';
import { Users, Upload, Send, CheckCircle, AlertTriangle, FileText, Download, Package, MapPin, Phone, Eye, Edit, Filter, Search, X, Plus, Trash2, Calendar, Clock, Star, TrendingUp, Building2, Heart, RefreshCw, BarChart3 } from 'lucide-react';
import { 
  type Beneficiary, 
  mockBeneficiaries, 
  mockOrganizations, 
  mockPackageTemplates,
  type Organization,
  type PackageTemplate
} from '../../data/mockData';
import { useErrorLogger } from '../../utils/errorLogger'; // Assuming errorLogger.ts is correctly imported
import { Button, Card, Input, Badge, Modal } from '../ui';
import * as Sentry from '@sentry/react';

export default function BulkSendPage() {
  const { logInfo, logError } = useErrorLogger();
  const [selectedInstitution, setSelectedInstitution] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [institutionSearch, setInstitutionSearch] = useState('');
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showConfirmSendModal, setShowConfirmSendModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFileAnalysisModal, setShowFileAnalysisModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [importResults, setImportResults] = useState<any>(null);
  const [fileAnalysisResults, setFileAnalysisResults] = useState<any>(null);
  const [sendResults, setSendResults] = useState<any>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    benefitStatus: '',
    familySize: '',
    hasChildren: '',
    hasElderly: '',
    area: '',
    lastReceived: '',
    dateAdded: ''
  });

  // استخدام البيانات الوهمية مباشرة
  const institutions = mockOrganizations;
  const packageTemplates = mockPackageTemplates;
  const allBeneficiaries = mockBeneficiaries;
  const loading = false;
  const organizationsError = null;
  const packageTemplatesError = null;
  const beneficiariesError = null;

  const regions = ['شمال غزة', 'مدينة غزة', 'الوسط', 'خان يونس', 'رفح'];

  const handleInstitutionSelect = (institutionId: string) => {
    setSelectedInstitution(institutionId);
    setSelectedTemplate(''); // Reset template selection
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleFilterChange = (filterKey: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterKey]: value }));
  };

  const getFilteredBeneficiaries = () => {
    return allBeneficiaries.filter(beneficiary => {
      // Apply search filter
      if (searchTerm && !beneficiary.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !beneficiary.nationalId.includes(searchTerm) && !beneficiary.phone.includes(searchTerm)) {
        return false;
      }

      // Apply other filters
      if (filters.benefitStatus === 'never' && beneficiary.totalPackages > 0) return false;
      if (filters.benefitStatus === 'recent' && beneficiary.totalPackages === 0) return false;
      
      if (filters.area && beneficiary.detailedAddress.governorate !== getGovernorateFromFilter(filters.area)) return false;
      
      return true;
    });
  };

  const getGovernorateFromFilter = (area: string) => {
    const areaMap: { [key: string]: string } = {
      'north': 'شمال غزة',
      'gaza': 'غزة',
      'middle': 'الوسطى',
      'khan-younis': 'خان يونس',
      'rafah': 'رفح'
    };
    return areaMap[area] || area;
  };

  const filteredInstitutions = institutions.filter(inst =>
    inst.name.toLowerCase().includes(institutionSearch.toLowerCase())
  );

  const availableTemplates = packageTemplates.filter(template => 
    template.organization_id === selectedInstitution
  );

  const selectedTemplateData = packageTemplates.find(t => t.id === selectedTemplate);
  const selectedInstitutionData = institutions.find(i => i.id === selectedInstitution);
  const filteredBeneficiaries = getFilteredBeneficiaries();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setShowUploadModal(false);
      setShowFileAnalysisModal(true);
      
      // محاكاة تحليل الملف
      setIsProcessing(true);
      setTimeout(() => {
        const analysisResults = {
          fileName: file.name,
          fileSize: (file.size / 1024).toFixed(1) + ' KB',
          totalRows: 27,
          validRows: 25,
          invalidRows: 2,
          duplicates: 1,
          newBeneficiaries: 24,
          existingBeneficiaries: 1,
          errors: [
            { row: 15, error: 'رقم هوية غير صحيح', data: 'أحمد محمد - 12345' },
            { row: 23, error: 'رقم هاتف مفقود', data: 'فاطمة علي - 987654321' }
          ],
          preview: [
            { name: 'محمد أحمد الخالدي', nationalId: '900123456', phone: '0597123456', area: 'خان يونس' },
            { name: 'فاطمة سالم النجار', nationalId: '900234567', phone: '0598234567', area: 'غزة' },
            { name: 'أحمد علي الغزاوي', nationalId: '900345678', phone: '0599345678', area: 'رفح' }
          ]
        };
        setFileAnalysisResults(analysisResults);
        setIsProcessing(false);
        logInfo(`تم تحليل الملف: ${file.name}`, 'BulkSendPage');
      }, 2000);
    }
  };

  const handleBulkSend = () => {
    if (!selectedInstitution || !selectedTemplate || filteredBeneficiaries.length === 0) {
      setNotification({ 
        message: 'يرجى اختيار المؤسسة والقالب والتأكد من وجود مستفيدين', 
        type: 'error' 
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    setShowConfirmSendModal(true);
  };

  const handlePreview = () => {
    if (!selectedInstitution || !selectedTemplate) {
      setNotification({ 
        message: 'يرجى اختيار المؤسسة والقالب أولاً', 
        type: 'error' 
      });
      setTimeout(() => setNotification(null), 3000);
      return;
    }
    setShowPreviewModal(true);
  };

  const executeBulkSend = async () => {
    setShowConfirmSendModal(false);
    setIsProcessing(true);
    
    try {
      // محاكاة عملية الإرسال الجماعي
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const sendId = `BULK-${Date.now().toString().slice(-6)}`;
      const results = {
        sendId,
        institutionName: selectedInstitutionData?.name,
        templateName: selectedTemplateData?.name,
        totalBeneficiaries: filteredBeneficiaries.length,
        totalCost: filteredBeneficiaries.length * (selectedTemplateData?.estimatedCost || 0),
        estimatedDeliveryTime: '24-48 ساعة',
        assignedCouriers: Math.min(filteredBeneficiaries.length, 5),
        priority: 'عادية'
      };
      
      setSendResults(results);
      setShowSuccessModal(true);
      
      // إعادة تعيين النموذج
      setSelectedInstitution('');
      setSelectedTemplate('');
      setFilters({
        benefitStatus: '',
        familySize: '',
        hasChildren: '',
        hasElderly: '',
        area: '',
        lastReceived: '',
        dateAdded: ''
      });
      
      logInfo(`تم تنفيذ إرسال جماعي: ${sendId}`, 'BulkSendPage');
    } catch (error) {
      Sentry.captureException(error);
      logError(error as Error, 'BulkSendPage');
      setNotification({ 
        message: 'حدث خطأ في عملية الإرسال الجماعي', 
        type: 'error' 
      });
      setTimeout(() => setNotification(null), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmFileImport = () => {
    if (fileAnalysisResults) {
      setImportResults({
        imported: fileAnalysisResults.newBeneficiaries,
        errors: fileAnalysisResults.invalidRows,
        total: fileAnalysisResults.totalRows
      });
      
      setNotification({ 
        message: `تم استيراد ${fileAnalysisResults.newBeneficiaries} مستفيد جديد بنجاح`, 
        type: 'success' 
      });
      setTimeout(() => setNotification(null), 3000);
      
      setShowFileAnalysisModal(false);
      setFileAnalysisResults(null);
      logInfo(`تم استيراد ${fileAnalysisResults.newBeneficiaries} مستفيد من ملف`, 'BulkSendPage');
    }
  };

  const getNotificationClasses = (type: 'success' | 'error' | 'warning') => {
    switch (type) {
      case 'success': return 'bg-green-100 border-green-200 text-green-800';
      case 'error': return 'bg-red-100 border-red-200 text-red-800';
      case 'warning': return 'bg-orange-100 border-orange-200 text-orange-800';
    }
  };

  const getNotificationIcon = (type: 'success' | 'error' | 'warning') => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-600" />;
      case 'warning': return <Clock className="w-5 h-5 text-orange-600" />;
    }
  };
  const downloadTemplate = () => {
    const csvContent = "اسم المستفيد,رقم الهوية,رقم الهاتف,المحافظة,المدينة,الحي,عدد الأفراد,لديه أطفال,كبار سن,ملاحظات\n" +
                      "أحمد محمد الخالدي,900123456,0597123456,خان يونس,خان يونس,الكتيبة,6,نعم,لا,حالة عاجلة\n" +
                      "فاطمة سالم النجار,900234567,0598234567,غزة,غزة,الشجاعية,5,نعم,نعم,";
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'قالب_المستفيدين.csv';
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center space-x-3 space-x-reverse ${getNotificationClasses(notification.type)}`}>
          {getNotificationIcon(notification.type)}
          <span className="font-medium">{notification.message}</span>
          <button onClick={() => setNotification(null)} className="text-gray-500 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <Card className="p-8 text-center">
            <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-2">جاري المعالجة...</h3>
            <p className="text-gray-600">يرجى الانتظار، قد تستغرق العملية عدة دقائق</p>
          </Card>
        </div>
      )}

      {/* Data Source Indicator */}
      <Card className="bg-blue-50 border-blue-200" padding="sm">
        <div className="flex items-center space-x-2 space-x-reverse text-blue-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">
            البيانات الوهمية محملة - {institutions.length} مؤسسة، {packageTemplates.length} قالب، {allBeneficiaries.length} مستفيد
          </span>
        </div>
      </Card>

      {/* Progress Indicator */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">خطوات الإرسال الجماعي</h3>
          <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-600">
            <Clock className="w-4 h-4" />
            <span>الخطوة {selectedInstitution ? (selectedTemplate ? '3' : '2') : '1'} من 3</span>
          </div>
        </div>
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className={`flex items-center space-x-2 space-x-reverse ${selectedInstitution ? 'text-green-600' : 'text-blue-600'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedInstitution ? 'bg-green-100' : 'bg-blue-100'}`}>
              {selectedInstitution ? <CheckCircle className="w-4 h-4" /> : <span className="text-sm font-bold">1</span>}
            </div>
            <span className="text-sm font-medium">اختيار المؤسسة</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200"></div>
          <div className={`flex items-center space-x-2 space-x-reverse ${selectedTemplate ? 'text-green-600' : selectedInstitution ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedTemplate ? 'bg-green-100' : selectedInstitution ? 'bg-blue-100' : 'bg-gray-100'}`}>
              {selectedTemplate ? <CheckCircle className="w-4 h-4" /> : <span className="text-sm font-bold">2</span>}
            </div>
            <span className="text-sm font-medium">اختيار القالب</span>
          </div>
          <div className="flex-1 h-0.5 bg-gray-200"></div>
          <div className={`flex items-center space-x-2 space-x-reverse ${selectedTemplate && selectedInstitution ? 'text-blue-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedTemplate && selectedInstitution ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <span className="text-sm font-bold">3</span>
            </div>
            <span className="text-sm font-medium">اختيار المستفيدين</span>
          </div>
        </div>
      </Card>

      {/* Institution Selection */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">اختيار المؤسسة المانحة</h3>
          {selectedInstitution && (
            <div className="flex items-center space-x-2 space-x-reverse text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">تم الاختيار</span>
            </div>
          )}
        </div>

        {/* Institution Search */}
        <div className="relative mb-4">
          <Search className="w-5 h-5 absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ابحث عن المؤسسة..."
            value={institutionSearch}
            onChange={(e) => setInstitutionSearch(e.target.value)}
            className="w-full pr-12 pl-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Popular Institutions */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 space-x-reverse mb-3">
            <Star className="w-4 h-4 text-yellow-500" />
            <h4 className="font-medium text-gray-900">المؤسسات الأكثر استخداماً</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {institutions.filter(inst => inst.isPopular).map(institution => (
              <button
                key={institution.id}
                onClick={() => handleInstitutionSelect(institution.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedInstitution === institution.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {institution.name}
              </button>
            ))}
          </div>
        </div>

        {/* All Institutions */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">جميع المؤسسات</h4>
          {institutions.length > 0 ? (
            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl">
              {filteredInstitutions.map(institution => (
                <div
                  key={institution.id}
                  onClick={() => handleInstitutionSelect(institution.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                    selectedInstitution === institution.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Building2 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{institution.name}</p>
                        <p className="text-sm text-gray-600">
                          {institution.packagesAvailable || 0} طرد متاح • {institution.templatesCount || 0} قوالب
                        </p>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded border-2 ${
                      selectedInstitution === institution.id 
                        ? 'bg-blue-600 border-blue-600' 
                        : 'border-gray-300'
                    }`}>
                      {selectedInstitution === institution.id && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>لا توجد مؤسسات متاحة</p>
              <p className="text-sm">يرجى إضافة مؤسسات أولاً</p>
            </div>
          )}
        </div>
      </Card>

      {/* Template Selection */}
      {selectedInstitution && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">اختيار قالب الطرد</h3>
            {selectedTemplate && (
              <div className="flex items-center space-x-2 space-x-reverse text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">تم الاختيار</span>
              </div>
            )}
          </div>

          {availableTemplates.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {availableTemplates.map(template => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedTemplate === template.id
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-2xl">
                      {template.type === 'food' ? '🍚' : 
                       template.type === 'clothing' ? '👕' : 
                       template.type === 'medical' ? '💊' : '📦'}
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold text-green-600">{template.estimatedCost} ₪</span>
                      <p className="text-xs text-gray-500">{template.totalWeight} كيلو</p>
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{template.name}</h4>
                  <p className="text-sm text-gray-600 mb-3">{template.contents.length} أصناف</p>
                  <div className="text-xs text-gray-500">
                    {template.contents.slice(0, 2).map(item => item.name).join(', ')}
                    {template.contents.length > 2 && '...'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>لا توجد قوالب متاحة لهذه المؤسسة</p>
              <p className="text-sm">يرجى إضافة قوالب طرود للمؤسسة المحددة</p>
            </div>
          )}
        </Card>
      )}

      {/* Import Section */}
      {selectedTemplate && (
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-4">استيراد مستفيدين جدد</h3>
          
          <div 
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
            onClick={() => setShowUploadModal(true)}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">استيراد قائمة مستفيدين من ملف Excel</h4>
            <p className="text-gray-600 mb-4">اسحب الملف هنا أو اضغط للاختيار (xlsx, xls, csv)</p>
            <div className="flex space-x-3 space-x-reverse justify-center">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
                <Upload className="w-4 h-4 ml-2" />
                اختيار ملف
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  downloadTemplate();
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
              >
                <Download className="w-4 h-4 ml-2" />
                تحميل قالب جاهز
              </button>
            </div>
          </div>

          {importResults && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
              <h4 className="font-medium text-green-800 mb-2">نتائج الاستيراد:</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div><strong>تم الاستيراد:</strong> {importResults.imported}</div>
                <div><strong>أخطاء:</strong> {importResults.errors}</div>
                <div><strong>الإجمالي:</strong> {importResults.total}</div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Beneficiaries Filters */}
      {selectedTemplate && (
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-4">فلاتر المستفيدين</h3>
          
          <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">حالة الاستفادة</label>
              <select
                value={filters.benefitStatus}
                onChange={(e) => handleFilterChange('benefitStatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">جميع الحالات</option>
                <option value="never">لم يستفيدوا مطلقاً</option>
                <option value="recent">استفادوا مؤخراً</option>
                <option value="old">لم يستفيدوا منذ فترة</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">حجم الأسرة</label>
              <select
                value={filters.familySize}
                onChange={(e) => handleFilterChange('familySize', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">جميع الأحجام</option>
                <option value="small">أقل من 5 أشخاص</option>
                <option value="medium">5-10 أشخاص</option>
                <option value="large">أكبر من 10 أشخاص</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">المنطقة</label>
              <select
                value={filters.area}
                onChange={(e) => handleFilterChange('area', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">جميع المناطق</option>
                <option value="north">شمال غزة</option>
                <option value="gaza">مدينة غزة</option>
                <option value="middle">الوسط</option>
                <option value="khan-younis">خان يونس</option>
                <option value="rafah">رفح</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">آخر استلام</label>
              <select
                value={filters.lastReceived}
                onChange={(e) => handleFilterChange('lastReceived', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">غير محدد</option>
                <option value="week">خلال أسبوع</option>
                <option value="month">خلال شهر</option>
                <option value="quarter">خلال 3 أشهر</option>
                <option value="never">لم يستلم أبداً</option>
              </select>
            </div>
          </div>

          {/* Beneficiaries Preview */}
          <div className="bg-blue-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-blue-800">المستفيدين المطابقين</h4>
              <span className="text-2xl font-bold text-blue-900">{filteredBeneficiaries.length}</span>
            </div>
            
            {filteredBeneficiaries.length > 0 ? (
              <div className="max-h-48 overflow-y-auto space-y-2">
                {filteredBeneficiaries.slice(0, 10).map(beneficiary => (
                  <div key={beneficiary.id} className="bg-white p-3 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{beneficiary.name}</p>
                      <p className="text-sm text-gray-600">{beneficiary.detailedAddress?.district || 'غير محدد'} - {beneficiary.phone}</p>
                    </div>
                    <span className="text-xs text-gray-500">#{beneficiary.id}</span>
                  </div>
                ))}
                {filteredBeneficiaries.length > 10 && (
                  <div className="text-center text-gray-600 text-sm py-2">
                    ... و {filteredBeneficiaries.length - 10} مستفيد آخر
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-600 py-8">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>لا يوجد مستفيدين مطابقين للفلاتر المحددة</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Send Summary */}
      {selectedTemplate && selectedInstitution && filteredBeneficiaries.length > 0 && (
        <Card>
          <h3 className="text-lg font-bold text-gray-900 mb-6">ملخص الإرسال</h3>
          
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-blue-800">عدد المستفيدين</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{filteredBeneficiaries.length}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-xl border border-green-200">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <Package className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">نوع الطرد</span>
              </div>
              <p className="text-lg font-bold text-green-900">{selectedTemplateData?.name}</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-purple-800">التكلفة الإجمالية</span>
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {(filteredBeneficiaries.length * (selectedTemplateData?.estimatedCost || 0)).toLocaleString()} ₪
              </p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <Star className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-orange-800">الوزن الإجمالي</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">
                {(filteredBeneficiaries.length * (selectedTemplateData?.totalWeight || 0)).toFixed(1)} كيلو
              </p>
            </div>
          </div>

          <div className="flex space-x-3 space-x-reverse justify-end">
            <button
              onClick={handlePreview}
              className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors flex items-center"
            >
              <Eye className="w-4 h-4 ml-2" />
              معاينة الإرسال
            </button>
            <button
              onClick={handleBulkSend}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl hover:from-blue-700 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center"
            >
              <Send className="w-5 h-5 ml-2" />
              تأكيد الإرسال ({filteredBeneficiaries.length} طرد)
            </button>
          </div>
        </Card>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <Modal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          title="رفع ملف المستفيدين"
          size="sm"
        >
          <div className="p-6">
            <div className="text-center py-8">
              <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">اختر ملف Excel أو CSV يحتوي على بيانات المستفيدين</p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors cursor-pointer inline-flex items-center"
              >
                <Upload className="w-4 h-4 ml-2" />
                اختيار ملف
              </label>
              <p className="text-xs text-gray-500 mt-4">
                الصيغ المدعومة: CSV, XLSX, XLS (حد أقصى 10 ميجابايت)
              </p>
            </div>
          </div>
        </Modal>
      )}

      {/* File Analysis Modal */}
      {showFileAnalysisModal && fileAnalysisResults && (
        <Modal
          isOpen={showFileAnalysisModal}
          onClose={() => setShowFileAnalysisModal(false)}
          title="نتائج تحليل الملف"
          size="lg"
        >
          <div className="p-6 space-y-6">
            {isProcessing ? (
              <div className="text-center py-12">
                <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">جاري تحليل الملف...</h3>
                <p className="text-gray-600">يرجى الانتظار بينما نقوم بتحليل البيانات</p>
              </div>
            ) : (
              <>
                {/* File Info */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <h4 className="font-semibold text-blue-800 mb-3">معلومات الملف</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">اسم الملف:</span>
                      <span className="font-medium text-blue-900 mr-2">{fileAnalysisResults.fileName}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">حجم الملف:</span>
                      <span className="font-medium text-blue-900 mr-2">{fileAnalysisResults.fileSize}</span>
                    </div>
                    <div>
                      <span className="text-blue-700">إجمالي الصفوف:</span>
                      <span className="font-medium text-blue-900 mr-2">{fileAnalysisResults.totalRows}</span>
                    </div>
                  </div>
                </div>

                {/* Analysis Results */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-green-50 p-4 rounded-xl border border-green-200 text-center">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-sm text-green-600">صفوف صحيحة</p>
                    <p className="text-2xl font-bold text-green-900">{fileAnalysisResults.validRows}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 text-center">
                    <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm text-blue-600">مستفيدين جدد</p>
                    <p className="text-2xl font-bold text-blue-900">{fileAnalysisResults.newBeneficiaries}</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 text-center">
                    <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-sm text-orange-600">أخطاء</p>
                    <p className="text-2xl font-bold text-orange-900">{fileAnalysisResults.invalidRows}</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 text-center">
                    <RefreshCw className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-sm text-yellow-600">مكررين</p>
                    <p className="text-2xl font-bold text-yellow-900">{fileAnalysisResults.duplicates}</p>
                  </div>
                </div>

                {/* Errors List */}
                {fileAnalysisResults.errors.length > 0 && (
                  <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                    <h4 className="font-semibold text-red-800 mb-3">الأخطاء المكتشفة</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {fileAnalysisResults.errors.map((error: any, index: number) => (
                        <div key={index} className="bg-white p-3 rounded-lg flex justify-between items-center">
                          <div>
                            <p className="font-medium text-red-900">الصف {error.row}: {error.error}</p>
                            <p className="text-sm text-red-600">{error.data}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview Data */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-semibold text-gray-800 mb-3">معاينة البيانات (أول 3 صفوف)</h4>
                  <div className="space-y-2">
                    {fileAnalysisResults.preview.map((row: any, index: number) => (
                      <div key={index} className="bg-white p-3 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">{row.name}</p>
                          <p className="text-sm text-gray-600">{row.nationalId} - {row.phone}</p>
                        </div>
                        <span className="text-sm text-gray-500">{row.area}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-3 space-x-reverse justify-end pt-4">
                  <Button variant="secondary" onClick={() => setShowFileAnalysisModal(false)}>
                    إلغاء
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleConfirmFileImport}
                    disabled={fileAnalysisResults.validRows === 0}
                  >
                    تأكيد الاستيراد ({fileAnalysisResults.newBeneficiaries} مستفيد)
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Confirm Send Modal */}
      {showConfirmSendModal && selectedTemplateData && selectedInstitutionData && (
        <Modal
          isOpen={showConfirmSendModal}
          onClose={() => setShowConfirmSendModal(false)}
          title="تأكيد الإرسال الجماعي"
          size="md"
        >
          <div className="p-6 text-center">
            <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-4">هل أنت متأكد من تنفيذ الإرسال الجماعي؟</h3>
            <p className="text-gray-600 mb-6">
              سيتم إنشاء {filteredBeneficiaries.length} مهمة توزيع وإشعار جميع المستفيدين.
            </p>
            
            {/* Send Details */}
            <div className="bg-gray-50 p-4 rounded-lg text-right mb-6">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">المؤسسة المانحة:</span>
                  <span className="font-medium text-gray-900 mr-2">{selectedInstitutionData.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">قالب الطرد:</span>
                  <span className="font-medium text-gray-900 mr-2">{selectedTemplateData.name}</span>
                </div>
                <div>
                  <span className="text-gray-600">عدد المستفيدين:</span>
                  <span className="font-medium text-blue-600 mr-2">{filteredBeneficiaries.length}</span>
                </div>
                <div>
                  <span className="text-gray-600">التكلفة المتوقعة:</span>
                  <span className="font-medium text-green-600 mr-2">
                    {(filteredBeneficiaries.length * selectedTemplateData.estimatedCost).toLocaleString()} ₪
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">الوزن الإجمالي:</span>
                  <span className="font-medium text-gray-900 mr-2">
                    {(filteredBeneficiaries.length * selectedTemplateData.totalWeight).toFixed(1)} كيلو
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">وقت التسليم المتوقع:</span>
                  <span className="font-medium text-gray-900 mr-2">24-48 ساعة</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 space-x-reverse justify-center">
              <Button variant="secondary" onClick={() => setShowConfirmSendModal(false)}>
                إلغاء
              </Button>
              <Button variant="primary" onClick={executeBulkSend}>
                تأكيد الإرسال النهائي
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Success Modal */}
      {showSuccessModal && sendResults && (
        <Modal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          title="تم الإرسال بنجاح!"
          size="md"
        >
          <div className="p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-4">تم تأكيد الإرسال الجماعي بنجاح!</h3>
            <p className="text-gray-600 mb-6">
              تم إنشاء جميع مهام التوزيع وسيتم البدء في التحضير والتوزيع قريباً.
            </p>
            
            {/* Send Results */}
            <div className="bg-green-50 p-4 rounded-lg mb-6">
              <h4 className="font-semibold text-green-800 mb-3">تفاصيل الإرسالية</h4>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-right">
                <div>
                  <span className="text-green-700">رقم الإرسالية:</span>
                  <span className="font-mono font-bold text-green-900 mr-2">{sendResults.sendId}</span>
                </div>
                <div>
                  <span className="text-green-700">المؤسسة:</span>
                  <span className="font-medium text-green-900 mr-2">{sendResults.institutionName}</span>
                </div>
                <div>
                  <span className="text-green-700">نوع الطرد:</span>
                  <span className="font-medium text-green-900 mr-2">{sendResults.templateName}</span>
                </div>
                <div>
                  <span className="text-green-700">عدد المستفيدين:</span>
                  <span className="font-medium text-green-900 mr-2">{sendResults.totalBeneficiaries}</span>
                </div>
                <div>
                  <span className="text-green-700">التكلفة الإجمالية:</span>
                  <span className="font-medium text-green-900 mr-2">{sendResults.totalCost.toLocaleString()} ₪</span>
                </div>
                <div>
                  <span className="text-green-700">وقت التسليم المتوقع:</span>
                  <span className="font-medium text-green-900 mr-2">{sendResults.estimatedDeliveryTime}</span>
                </div>
                <div>
                  <span className="text-green-700">المندوبين المعينين:</span>
                  <span className="font-medium text-green-900 mr-2">{sendResults.assignedCouriers}</span>
                </div>
                <div>
                  <span className="text-green-700">الأولوية:</span>
                  <span className="font-medium text-green-900 mr-2">{sendResults.priority}</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <div className="flex items-center space-x-2 space-x-reverse text-blue-600 mb-2">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">الخطوات التالية:</span>
              </div>
              <ul className="text-sm text-blue-700 space-y-1 text-right">
                <li>• سيتم إشعار جميع المستفيدين برسائل نصية</li>
                <li>• سيتم تعيين المندوبين وتحديد مواعيد التسليم</li>
                <li>• يمكنك متابعة التقدم من صفحة "تتبع الإرسالات"</li>
                <li>• ستصلك تنبيهات عند اكتمال كل مرحلة</li>
              </ul>
            </div>

            <Button variant="primary" onClick={() => setShowSuccessModal(false)} className="w-full">
              فهمت، شكراً
            </Button>
          </div>
        </Modal>
      )}

      {/* Preview Modal */}
      {showPreviewModal && selectedTemplateData && selectedInstitutionData && (
        <Modal
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
          title="معاينة الإرسال الجماعي"
          size="xl"
        >
          <div className="p-6 space-y-6">
            <div className="p-6 space-y-6">
              {/* Summary */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">تفاصيل الإرسال</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">المؤسسة المانحة:</span>
                      <span className="font-medium">{selectedInstitutionData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">قالب الطرد:</span>
                      <span className="font-medium">{selectedTemplateData.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">عدد المستفيدين:</span>
                      <span className="font-medium">{filteredBeneficiaries.length} مستفيد</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">التكلفة المتوقعة:</span>
                      <span className="font-medium text-green-600">
                        {(filteredBeneficiaries.length * selectedTemplateData.estimatedCost).toLocaleString()} ₪
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">الفلاتر المطبقة</h4>
                  <div className="space-y-2 text-sm">
                    {Object.entries(filters).map(([key, value]) => {
                      if (!value) return null;
                      return (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600">{getFilterLabel(key)}:</span>
                          <span className="font-medium">{getFilterDisplayValue(key, value)}</span>
                        </div>
                      );
                    })}
                    {Object.values(filters).every(v => !v) && (
                      <p className="text-gray-500 italic">لا توجد فلاتر مطبقة</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sample Beneficiaries */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-3">عينة من المستفيدين (أول 10)</h4>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {filteredBeneficiaries.slice(0, 10).map((beneficiary, index) => (
                    <div key={beneficiary.id} className="bg-white p-3 rounded-lg flex justify-between items-center">
                      <div className="flex items-center space-x-3 space-x-reverse">
                        <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900">{beneficiary.name}</p>
                          <p className="text-sm text-gray-600">{beneficiary.detailedAddress?.district || 'غير محدد'}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500">{beneficiary.nationalId}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 space-x-reverse justify-end pt-4 border-t border-gray-200">
                <button 
                  onClick={() => setShowPreviewModal(false)}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  العودة للتعديل
                </button>
                <button 
                  onClick={() => {
                    setShowPreviewModal(false);
                    handleBulkSend();
                  }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Send className="w-4 h-4 ml-2" />
                  تأكيد الإرسال النهائي
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// Helper functions
function getFilterLabel(key: string): string {
  const labels: { [key: string]: string } = {
    benefitStatus: 'حالة الاستفادة',
    familySize: 'حجم الأسرة',
    hasChildren: 'وجود أطفال',
    hasElderly: 'كبار السن',
    area: 'المنطقة',
    lastReceived: 'آخر استلام',
    dateAdded: 'تاريخ الإضافة'
  };
  return labels[key] || key;
}

function getFilterDisplayValue(key: string, value: string): string {
  const displayValues: { [key: string]: { [value: string]: string } } = {
    benefitStatus: {
      'never': 'لم يستفيدوا مطلقاً',
      'recent': 'استفادوا مؤخراً',
      'old': 'لم يستفيدوا منذ فترة'
    },
    familySize: {
      'small': 'أقل من 5 أشخاص',
      'medium': '5-10 أشخاص',
      'large': 'أكبر من 10 أشخاص'
    },
    area: {
      'north': 'شمال غزة',
      'gaza': 'مدينة غزة',
      'middle': 'الوسط',
      'khan-younis': 'خان يونس',
      'rafah': 'رفح'
    }
  };
  
  return displayValues[key]?.[value] || value;
}