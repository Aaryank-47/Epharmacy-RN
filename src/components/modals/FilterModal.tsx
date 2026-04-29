
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Dimensions,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import { useThemePalette } from '../../hooks/useThemePalette';

const { width } = Dimensions.get('window');

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: any) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({ visible, onClose, onApply }) => {
  const { isDark, accentColor, surfaceColor, textColor, placeholderColor, inputBg } = useThemePalette();

  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [distance, setDistance] = useState([0, 10]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [availability, setAvailability] = useState<'all' | 'in-stock'>('all');

  const brands = ['Apollo', 'LifeCare', 'Wellness', 'Cipla', 'Sun Pharma', 'Glenmark'];

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev => 
      prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]
    );
  };

  const resetFilters = () => {
    setPriceRange([0, 2000]);
    setDistance([0, 10]);
    setSelectedBrands([]);
    setAvailability('all');
  };

  const handleApply = () => {
    onApply({
      priceRange,
      distance,
      selectedBrands,
      availability,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View 
          className="rounded-t-[40px] p-6" 
          style={{ backgroundColor: surfaceColor, maxHeight: '85%' }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-black" style={{ color: textColor }}>Filters</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Icon name="close" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Price Range */}
            <View className="mb-8">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold" style={{ color: textColor }}>Price Range</Text>
                <Text className="font-black" style={{ color: accentColor }}>₹{priceRange[0]} - ₹{priceRange[1]}</Text>
              </View>
              <View className="items-center">
                <MultiSlider
                  values={[priceRange[0], priceRange[1]]}
                  sliderLength={width - 80}
                  onValuesChange={setPriceRange}
                  min={0}
                  max={5000}
                  step={50}
                  allowOverlap={false}
                  snapped
                  selectedStyle={{ backgroundColor: accentColor }}
                  unselectedStyle={{ backgroundColor: isDark ? '#3D4048' : '#E5E7EB' }}
                  markerStyle={{ 
                    backgroundColor: '#FFF', 
                    height: 24, 
                    width: 24, 
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: accentColor,
                    elevation: 3
                  }}
                />
              </View>
            </View>

            {/* Company / Brand */}
            <View className="mb-8">
              <Text className="text-lg font-bold mb-4" style={{ color: textColor }}>Company / Brand</Text>
              <View className="flex-row flex-wrap">
                {brands.map(brand => {
                  const isSelected = selectedBrands.includes(brand);
                  return (
                    <TouchableOpacity
                      key={brand}
                      onPress={() => toggleBrand(brand)}
                      className="px-4 py-2 rounded-full mr-2 mb-2 border"
                      style={{ 
                        backgroundColor: isSelected ? accentColor : 'transparent',
                        borderColor: isSelected ? accentColor : (isDark ? '#3D4048' : '#E5E7EB')
                      }}
                    >
                      <Text 
                        className="font-bold text-xs" 
                        style={{ color: isSelected ? '#FFF' : placeholderColor }}
                      >
                        {brand}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Distance */}
            <View className="mb-8">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold" style={{ color: textColor }}>Distance</Text>
                <Text className="font-black" style={{ color: accentColor }}>Up to {distance[1]} km</Text>
              </View>
              <View className="items-center">
                <MultiSlider
                  values={[0, distance[1]]}
                  sliderLength={width - 80}
                  onValuesChange={setDistance}
                  min={0}
                  max={50}
                  step={1}
                  selectedStyle={{ backgroundColor: accentColor }}
                  unselectedStyle={{ backgroundColor: isDark ? '#3D4048' : '#E5E7EB' }}
                  markerStyle={{ 
                    backgroundColor: '#FFF', 
                    height: 24, 
                    width: 24, 
                    borderRadius: 12,
                    borderWidth: 2,
                    borderColor: accentColor,
                    elevation: 3
                  }}
                />
              </View>
            </View>

            {/* Availability */}
            <View className="mb-8">
              <Text className="text-lg font-bold mb-4" style={{ color: textColor }}>Availability</Text>
              <View className="flex-row bg-gray-100 p-1 rounded-2xl" style={{ backgroundColor: inputBg }}>
                <TouchableOpacity 
                  onPress={() => setAvailability('all')}
                  className="flex-1 py-3 rounded-xl items-center"
                  style={{ backgroundColor: availability === 'all' ? accentColor : 'transparent' }}
                >
                  <Text className="font-bold" style={{ color: availability === 'all' ? '#FFF' : placeholderColor }}>All</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setAvailability('in-stock')}
                  className="flex-1 py-3 rounded-xl items-center"
                  style={{ backgroundColor: availability === 'in-stock' ? accentColor : 'transparent' }}
                >
                  <Text className="font-bold" style={{ color: availability === 'in-stock' ? '#FFF' : placeholderColor }}>In Stock Only</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View className="flex-row gap-4 mt-4">
            <TouchableOpacity 
              onPress={resetFilters}
              className="flex-1 py-4 rounded-2xl items-center border border-gray-200"
              style={{ borderColor: isDark ? '#3D4048' : '#E5E7EB' }}
            >
              <Text className="font-bold" style={{ color: placeholderColor }}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleApply}
              className="flex-2 py-4 rounded-2xl items-center"
              style={{ backgroundColor: accentColor, flex: 2 }}
            >
              <Text className="text-white font-bold text-lg">Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default FilterModal;
