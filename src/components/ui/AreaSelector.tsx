import React from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { useAreaSelector } from '../../hooks/useGeographicData';
import { FormField } from './FormField';

interface AreaSelectorProps {
  label?: string;
  required?: boolean;
  onSelectionChange?: (governorate: number | null, city: number | null, district: number | null) => void;
  initialGovernorate?: number | null;
  initialCity?: number | null;
  initialDistrict?: number | null;
  showDistricts?: boolean;
  className?: string;
  error?: string;
  helpText?: string;
}

export const AreaSelector = ({
  label = 'المنطقة الجغرافية',
  required = false,
  onSelectionChange,
  initialGovernorate = null,
  initialCity = null,
  initialDistrict = null,
  showDistricts = true,
  className = '',
  error,
  helpText
}: AreaSelectorProps) => {
  const {
    governorates,
    availableCities,
    availableDistricts,
    selectedGovernorate,
    selectedCity,
    selectedDistrict,
    setSelectedGovernorate,
    setSelectedCity,
    setSelectedDistrict,
    getSelectedAreaText
  } = useAreaSelector();

  // تعيين القيم الأولية
  React.useEffect(() => {
    if (initialGovernorate) setSelectedGovernorate(initialGovernorate);
    if (initialCity) setSelectedCity(initialCity);
    if (initialDistrict) setSelectedDistrict(initialDistrict);
  }, [initialGovernorate, initialCity, initialDistrict, setSelectedGovernorate, setSelectedCity, setSelectedDistrict]);

  // إشعار المكون الأب بالتغييرات
  React.useEffect(() => {
    if (onSelectionChange) {
      onSelectionChange(selectedGovernorate, selectedCity, selectedDistrict);
    }
  }, [selectedGovernorate, selectedCity, selectedDistrict, onSelectionChange]);

  return (
    <div className={`space-y-4 ${className}`}>
      {label && (
        <FormField
          label={label}
          required={required}
          error={error}
          helpText={helpText}
        >
          <div className="space-y-3">
            {/* Governorate Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                المحافظة {required && <span className="text-red-500">*</span>}
              </label>
              <div className="relative">
                <select
                  value={selectedGovernorate || ''}
                  onChange={(e) => setSelectedGovernorate(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="">اختر المحافظة</option>
                  {governorates.map(governorate => (
                    <option key={governorate.id} value={governorate.id}>
                      {governorate.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* City Selection */}
            {selectedGovernorate && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المدينة/المخيم {required && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <select
                    value={selectedCity || ''}
                    onChange={(e) => setSelectedCity(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="">اختر المدينة</option>
                    {availableCities.map(city => (
                      <option key={city.id} value={city.id}>
                        {city.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* District Selection */}
            {selectedCity && showDistricts && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الحي/المنطقة {required && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <select
                    value={selectedDistrict || ''}
                    onChange={(e) => setSelectedDistrict(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="">اختر الحي/المنطقة</option>
                    {availableDistricts.map(district => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Selected Area Summary */}
            {(selectedGovernorate || selectedCity || selectedDistrict) && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">المنطقة المحددة:</span>
                </div>
                <p className="text-blue-900 font-medium mt-1">{getSelectedAreaText()}</p>
              </div>
            )}
          </div>
        </FormField>
      )}
    </div>
  );
};