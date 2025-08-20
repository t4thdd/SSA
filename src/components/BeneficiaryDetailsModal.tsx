import React from 'react';
import { X, User, Phone, MapPin, Calendar, Shield, Package, Clock, FileText } from 'lucide-react';
import { type Beneficiary } from '../data/mockData';
import { Modal, Button, Badge } from './ui';

interface BeneficiaryDetailsModalProps {
  beneficiary: Beneficiary;
  onClose: () => void;
}

export default function BeneficiaryDetailsModal({ beneficiary, onClose }: BeneficiaryDetailsModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'suspended': return 'error';
      default: return 'neutral';
    }
  };

  const getIdentityColor = (status: string) => {
    switch (status) {
      case 'verified': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      default: return 'neutral';
    }
  };

  const getIdentityText = (status: string) => {
    switch (status) {
      case 'verified': return 'موثق';
      case 'pending': return 'بانتظار التوثيق';
      case 'rejected': return 'مرفوض التوثيق';
      default: return 'غير محدد';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'pending': return 'معلق';
      case 'suspended': return 'موقوف';
      default: return 'غير محدد';
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="تفاصيل المستفيد"
      size="lg"
    >
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="bg-blue-100 p-3 rounded-xl">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900">{beneficiary.name}</h3>
            <p className="text-gray-600">{beneficiary.fullName}</p>
            <div className="flex items-center space-x-2 space-x-reverse mt-2">
              <Badge variant={getIdentityColor(beneficiary.identityStatus)}>
                {getIdentityText(beneficiary.identityStatus)}
              </Badge>
              <Badge variant={getStatusColor(beneficiary.status)}>
                {getStatusText(beneficiary.status)}
              </Badge>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-gray-50 p-4 rounded-xl">
          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="w-4 h-4 ml-2" />
            المعلومات الشخصية
          </h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">رقم الهوية:</span>
              <span className="font-medium text-gray-900 mr-2">{beneficiary.nationalId}</span>
            </div>
            <div>
              <span className="text-gray-600">تاريخ الميلاد:</span>
              <span className="font-medium text-gray-900 mr-2">
                {new Date(beneficiary.dateOfBirth).toLocaleDateString('ar-SA')}
              </span>
            </div>
            <div>
              <span className="text-gray-600">الجنس:</span>
              <span className="font-medium text-gray-900 mr-2">
                {beneficiary.gender === 'male' ? 'ذكر' : 'أنثى'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">الهاتف:</span>
              <span className="font-medium text-gray-900 mr-2">{beneficiary.phone}</span>
            </div>
            <div>
              <span className="text-gray-600">المهنة:</span>
              <span className="font-medium text-gray-900 mr-2">{beneficiary.profession}</span>
            </div>
            <div>
              <span className="text-gray-600">الحالة الاجتماعية:</span>
              <span className="font-medium text-gray-900 mr-2">
                {beneficiary.maritalStatus === 'single' ? 'أعزب' :
                 beneficiary.maritalStatus === 'married' ? 'متزوج' :
                 beneficiary.maritalStatus === 'divorced' ? 'مطلق' : 'أرمل'}
              </span>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-blue-50 p-4 rounded-xl">
          <h4 className="font-semibold text-blue-800 mb-4 flex items-center">
            <MapPin className="w-4 h-4 ml-2" />
            معلومات العنوان
          </h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-blue-700">المحافظة:</span>
              <span className="font-medium text-blue-900 mr-2">{beneficiary.detailedAddress.governorate}</span>
            </div>
            <div>
              <span className="text-blue-700">المدينة:</span>
              <span className="font-medium text-blue-900 mr-2">{beneficiary.detailedAddress.city}</span>
            </div>
            <div>
              <span className="text-blue-700">الحي/المنطقة:</span>
              <span className="font-medium text-blue-900 mr-2">{beneficiary.detailedAddress.district}</span>
            </div>
            <div>
              <span className="text-blue-700">الشارع:</span>
              <span className="font-medium text-blue-900 mr-2">{beneficiary.detailedAddress.street || 'غير محدد'}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-blue-700">العنوان الكامل:</span>
              <span className="font-medium text-blue-900 mr-2">{beneficiary.address}</span>
            </div>
            {beneficiary.detailedAddress.additionalInfo && (
              <div className="md:col-span-2">
                <span className="text-blue-700">معلومات إضافية:</span>
                <span className="font-medium text-blue-900 mr-2">{beneficiary.detailedAddress.additionalInfo}</span>
              </div>
            )}
          </div>
        </div>

        {/* Package Information */}
        <div className="bg-green-50 p-4 rounded-xl">
          <h4 className="font-semibold text-green-800 mb-4 flex items-center">
            <Package className="w-4 h-4 ml-2" />
            معلومات الطرود
          </h4>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-green-700">إجمالي الطرود:</span>
              <span className="font-medium text-green-900 mr-2">{beneficiary.totalPackages}</span>
            </div>
            <div>
              <span className="text-green-700">آخر استلام:</span>
              <span className="font-medium text-green-900 mr-2">
                {new Date(beneficiary.lastReceived).toLocaleDateString('ar-SA')}
              </span>
            </div>
            <div>
              <span className="text-green-700">عدد أفراد الأسرة:</span>
              <span className="font-medium text-green-900 mr-2">{beneficiary.membersCount}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {beneficiary.notes && (
          <div className="bg-yellow-50 p-4 rounded-xl">
            <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
              <FileText className="w-4 h-4 ml-2" />
              ملاحظات
            </h4>
            <p className="text-yellow-700 text-sm">{beneficiary.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-3 space-x-reverse justify-end pt-4 border-t border-gray-200">
          <Button variant="secondary" onClick={onClose}>
            إغلاق
          </Button>
        </div>
      </div>
    </Modal>
  );
}