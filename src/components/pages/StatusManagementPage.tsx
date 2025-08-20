import React, { useState, useMemo } from 'react';
import { Search, CheckCircle, XCircle, AlertTriangle, User, FileText, Download, Edit, Eye } from 'lucide-react';
import { Card } from '../ui'; // Import from barrel file
import { Button } from '../ui/Button'; // Assuming Button is correctly imported
import { Input } from '../ui/Input'; // Assuming Input is correctly imported
import { Badge } from '../ui'; // Import Badge from barrel file
import { Modal } from '../ui/Modal'; // Assuming Modal is correctly imported
import { StatCard } from '../ui/StatCard'; // Assuming StatCard is correctly imported
import { ExportModal } from '../ui/ExportModal'; // Assuming ExportModal is correctly imported
import BeneficiaryForm from '../BeneficiaryForm'; // Assuming BeneficiaryForm is correctly imported
import { useBeneficiaries } from '../../hooks/useBeneficiaries';
import { useErrorLogger } from '../../utils/errorLogger';
import { useExport } from '../../utils/exportUtils';
import { useAlerts } from '../../context/AlertsContext';

interface BeneficiaryProfileModalProps {
  beneficiary: any;
  isOpen: boolean;
  onClose: () => void;
}

const BeneficiaryProfileModal: React.FC<BeneficiaryProfileModalProps> = ({ beneficiary, isOpen, onClose }) => {
  if (!beneficiary) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ملف المستفيد">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">الاسم الكامل</label>
            <p className="text-gray-900">{beneficiary.name}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">رقم الهوية</label>
            <p className="text-gray-900">{beneficiary.nationalId}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">رقم الهاتف</label>
            <p className="text-gray-900">{beneficiary.phone}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">العنوان</label>
            <p className="text-gray-900">{beneficiary.address}</p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">حالة الهوية</label>
            <Badge variant={
              beneficiary.identityStatus === 'موثق' ? 'success' : 
              beneficiary.identityStatus === 'مرفوض' ? 'error' : 'warning'
            }>
              {beneficiary.identityStatus}
            </Badge>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">الحالة العامة</label>
            <Badge variant={beneficiary.status === 'نشط' ? 'success' : 'warning'}>
              {beneficiary.status}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">ملاحظات</label>
          <p className="text-gray-600 bg-gray-50 p-3 rounded-lg">
            {beneficiary.notes || 'لا توجد ملاحظات'}
          </p>
        </div>

        <div className="flex justify-end space-x-2 space-x-reverse">
          <Button variant="outline" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export const StatusManagementPage: React.FC = () => {
  const { beneficiaries, loading, error } = useBeneficiaries();
  const { logInfo, logError } = useErrorLogger();
  const { exportData } = useExport();
  const { addAlert } = useAlerts();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('الكل');
  const [identityFilter, setIdentityFilter] = useState('الكل');
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // تصفية البيانات
  const filteredBeneficiaries = useMemo(() => {
    if (!beneficiaries) return [];
    
    return beneficiaries.filter(beneficiary => {
      const matchesSearch = beneficiary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           beneficiary.nationalId.includes(searchTerm) ||
                           beneficiary.phone.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'الكل' || beneficiary.status === statusFilter;
      const matchesIdentity = identityFilter === 'الكل' || beneficiary.identityStatus === identityFilter;
      
      return matchesSearch && matchesStatus && matchesIdentity;
    });
  }, [beneficiaries, searchTerm, statusFilter, identityFilter]);

  // إحصائيات الحالة
  const stats = useMemo(() => {
    if (!beneficiaries) return { total: 0, verified: 0, pending: 0, rejected: 0 };
    
    const total = beneficiaries.length;
    const verified = beneficiaries.filter(b => b.identityStatus === 'موثق').length;
    const pending = beneficiaries.filter(b => b.identityStatus === 'قيد المراجعة').length;
    const rejected = beneficiaries.filter(b => b.identityStatus === 'مرفوض').length;
    
    return { total, verified, pending, rejected };
  }, [beneficiaries]);

  const handleViewProfile = (beneficiary: any) => {
    setSelectedBeneficiary(beneficiary);
    setShowProfile(true);
    logInfo('عرض ملف المستفيد', { beneficiaryId: beneficiary.id });
  };

  const handleEditBeneficiary = (beneficiary: any) => {
    setSelectedBeneficiary(beneficiary);
    setShowEditForm(true);
    logInfo('تعديل بيانات المستفيد', { beneficiaryId: beneficiary.id });
  };

  const handleVerifyIdentity = (beneficiary: any) => {
    addAlert({
      type: 'success',
      message: `تم توثيق هوية ${beneficiary.name} بنجاح`,
      duration: 3000
    });
    logInfo('توثيق هوية المستفيد', { beneficiaryId: beneficiary.id });
  };

  const handleRejectIdentity = (beneficiary: any) => {
    addAlert({
      type: 'warning',
      message: `تم رفض هوية ${beneficiary.name}`,
      duration: 3000
    });
    logInfo('رفض هوية المستفيد', { beneficiaryId: beneficiary.id });
  };

  const handleRequestReupload = (beneficiary: any) => {
    addAlert({
      type: 'info',
      message: `تم طلب إعادة رفع الهوية من ${beneficiary.name}`,
      duration: 3000
    });
    logInfo('طلب إعادة رفع الهوية', { beneficiaryId: beneficiary.id });
  };

  const handleExport = () => {
    setShowExportModal(true);
  };

  const handleFormSubmit = (formData: any) => {
    addAlert({
      type: 'success',
      message: 'تم تحديث بيانات المستفيد بنجاح',
      duration: 3000
    });
    setShowEditForm(false);
    setSelectedBeneficiary(null);
    logInfo('تحديث بيانات المستفيد', { beneficiaryId: selectedBeneficiary?.id });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="mr-2 text-gray-600">جاري تحميل البيانات...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">حدث خطأ في تحميل البيانات: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* العنوان والإحصائيات */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">إدارة الحالة</h1>
          <p className="text-gray-600">إدارة حالات المستفيدين والتحقق من الهويات</p>
        </div>
        <Button onClick={handleExport} className="flex items-center space-x-2 space-x-reverse">
          <Download className="w-4 h-4" />
          <span>تصدير القائمة</span>
        </Button>
      </div>

      {/* بطاقات الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard
          title="إجمالي المستفيدين"
          value={stats.total}
          icon={User}
          color="blue"
        />
        <StatCard
          title="هويات موثقة"
          value={stats.verified}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="قيد المراجعة"
          value={stats.pending}
          icon={AlertTriangle}
          color="yellow"
        />
        <StatCard
          title="هويات مرفوضة"
          value={stats.rejected}
          icon={XCircle}
          color="red"
        />
      </div>

      {/* البحث والفلاتر */}
      <Card>
        <div className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="البحث بالاسم أو رقم الهوية أو الهاتف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="الكل">جميع الحالات</option>
                <option value="نشط">نشط</option>
                <option value="غير نشط">غير نشط</option>
                <option value="معلق">معلق</option>
              </select>
              <select
                value={identityFilter}
                onChange={(e) => setIdentityFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="الكل">جميع حالات الهوية</option>
                <option value="موثق">موثق</option>
                <option value="قيد المراجعة">قيد المراجعة</option>
                <option value="مرفوض">مرفوض</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* قائمة التحقق من الهوية */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            قائمة التحقق من الهوية ({filteredBeneficiaries.length})
          </h2>
          
          {filteredBeneficiaries.length === 0 ? (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">لا يوجد مستفيدون مطابقون للفلاتر المحددة</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      المستفيد
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      حالة الهوية
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الحالة العامة
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      الإجراءات
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBeneficiaries.map((beneficiary) => (
                    <tr key={beneficiary.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="w-8 h-8 text-gray-400 ml-3" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {beneficiary.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {beneficiary.nationalId}
                            </div>
                            <div className="text-sm text-gray-500">
                              {beneficiary.phone}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          beneficiary.identityStatus === 'موثق' ? 'success' : 
                          beneficiary.identityStatus === 'مرفوض' ? 'error' : 'warning'
                        }>
                          {beneficiary.identityStatus}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={beneficiary.status === 'نشط' ? 'success' : 'warning'}>
                          {beneficiary.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2 space-x-reverse">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewProfile(beneficiary)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditBeneficiary(beneficiary)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          {beneficiary.identityStatus === 'قيد المراجعة' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleVerifyIdentity(beneficiary)}
                                className="text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRejectIdentity(beneficiary)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          {beneficiary.identityStatus === 'مرفوض' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRequestReupload(beneficiary)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <FileText className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* نافذة عرض الملف الشخصي */}
      <BeneficiaryProfileModal
        beneficiary={selectedBeneficiary}
        isOpen={showProfile}
        onClose={() => {
          setShowProfile(false);
          setSelectedBeneficiary(null);
        }}
      />

      {/* نافذة تعديل البيانات */}
      {showEditForm && selectedBeneficiary && (
        <Modal
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false);
            setSelectedBeneficiary(null);
          }}
          title="تعديل بيانات المستفيد"
        >
          <BeneficiaryForm
            initialData={selectedBeneficiary}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowEditForm(false);
              setSelectedBeneficiary(null);
            }}
          />
        </Modal>
      )}

      {/* نافذة التصدير */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        data={filteredBeneficiaries}
        filename="status-management"
        title="تصدير قائمة إدارة الحالة"
      />
    </div>
  );
};