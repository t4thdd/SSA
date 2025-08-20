import { useState, useEffect, useMemo } from 'react';
import { 
  mockGovernorates, 
  getCitiesByGovernorate, 
  getDistrictsByCity,
  type Governorate,
  type City,
  type District
} from '../data/mockData';
import { useErrorLogger } from '../utils/errorLogger';

export const useGeographicData = () => {
  const { logInfo, logError } = useErrorLogger();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // جلب جميع المحافظات
  const governorates = useMemo(() => {
    return mockGovernorates;
  }, []);

  // دالة للحصول على المدن حسب المحافظة
  const getCities = (governorateId: number): City[] => {
    try {
      return getCitiesByGovernorate(governorateId);
    } catch (err) {
      logError(err as Error, 'useGeographicData');
      return [];
    }
  };

  // دالة للحصول على الأحياء حسب المدينة
  const getDistricts = (cityId: number): District[] => {
    try {
      return getDistrictsByCity(cityId);
    } catch (err) {
      logError(err as Error, 'useGeographicData');
      return [];
    }
  };

  // دالة للحصول على اسم المحافظة
  const getGovernorateName = (governorateId: number): string => {
    const governorate = governorates.find(g => g.id === governorateId);
    return governorate?.name || 'غير محدد';
  };

  // دالة للحصول على اسم المدينة
  const getCityName = (cityId: number): string => {
    for (const governorate of governorates) {
      const city = governorate.cities.find(c => c.id === cityId);
      if (city) {
        return city.name;
      }
    }
    return 'غير محدد';
  };

  // دالة للحصول على اسم الحي
  const getDistrictName = (districtId: number): string => {
    for (const governorate of governorates) {
      for (const city of governorate.cities) {
        const district = city.districts.find(d => d.id === districtId);
        if (district) {
          return district.name;
        }
      }
    }
    return 'غير محدد';
  };

  // دالة للبحث في المناطق
  const searchAreas = (searchTerm: string) => {
    const results: Array<{
      type: 'governorate' | 'city' | 'district';
      id: number;
      name: string;
      parentName?: string;
    }> = [];

    const searchLower = searchTerm.toLowerCase();

    governorates.forEach(governorate => {
      // البحث في المحافظات
      if (governorate.name.toLowerCase().includes(searchLower)) {
        results.push({
          type: 'governorate',
          id: governorate.id,
          name: governorate.name
        });
      }

      // البحث في المدن
      governorate.cities.forEach(city => {
        if (city.name.toLowerCase().includes(searchLower)) {
          results.push({
            type: 'city',
            id: city.id,
            name: city.name,
            parentName: governorate.name
          });
        }

        // البحث في الأحياء
        city.districts.forEach(district => {
          if (district.name.toLowerCase().includes(searchLower)) {
            results.push({
              type: 'district',
              id: district.id,
              name: district.name,
              parentName: `${city.name} - ${governorate.name}`
            });
          }
        });
      });
    });

    return results;
  };

  // إحصائيات جغرافية
  const statistics = useMemo(() => {
    const totalGovernorates = governorates.length;
    const totalCities = governorates.reduce((sum, gov) => sum + gov.cities.length, 0);
    const totalDistricts = governorates.reduce((sum, gov) => 
      sum + gov.cities.reduce((citySum, city) => citySum + city.districts.length, 0), 0
    );

    return {
      totalGovernorates,
      totalCities,
      totalDistricts
    };
  }, [governorates]);

  return {
    governorates,
    getCities,
    getDistricts,
    getGovernorateName,
    getCityName,
    getDistrictName,
    searchAreas,
    statistics,
    loading,
    error
  };
};

// Hook مخصص لاختيار المناطق في النماذج
export const useAreaSelector = () => {
  const [selectedGovernorate, setSelectedGovernorate] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<number | null>(null);

  const { 
    governorates, 
    getCities, 
    getDistricts, 
    getGovernorateName, 
    getCityName, 
    getDistrictName 
  } = useGeographicData();

  const availableCities = selectedGovernorate ? getCities(selectedGovernorate) : [];
  const availableDistricts = selectedCity ? getDistricts(selectedCity) : [];

  const resetSelection = () => {
    setSelectedGovernorate(null);
    setSelectedCity(null);
    setSelectedDistrict(null);
  };

  const getSelectedAreaText = () => {
    const parts = [];
    if (selectedGovernorate) parts.push(getGovernorateName(selectedGovernorate));
    if (selectedCity) parts.push(getCityName(selectedCity));
    if (selectedDistrict) parts.push(getDistrictName(selectedDistrict));
    return parts.join(' - ') || 'غير محدد';
  };

  // إعادة تعيين المدينة والحي عند تغيير المحافظة
  const handleGovernorateChange = (governorateId: number | null) => {
    setSelectedGovernorate(governorateId);
    setSelectedCity(null);
    setSelectedDistrict(null);
  };

  // إعادة تعيين الحي عند تغيير المدينة
  const handleCityChange = (cityId: number | null) => {
    setSelectedCity(cityId);
    setSelectedDistrict(null);
  };

  return {
    governorates,
    availableCities,
    availableDistricts,
    selectedGovernorate,
    selectedCity,
    selectedDistrict,
    setSelectedGovernorate: handleGovernorateChange,
    setSelectedCity: handleCityChange,
    setSelectedDistrict,
    resetSelection,
    getSelectedAreaText,
    getGovernorateName,
    getCityName,
    getDistrictName
  };
};