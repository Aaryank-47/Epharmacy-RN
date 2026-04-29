import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemePalette } from '../../../hooks/useThemePalette';
import { CustomSlider } from './CustomSlider';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface FilterState {
  sortBy: 'nearest' | 'price_asc' | 'top_rated' | 'fastest';
  maxPrice: number;
  brands: string[];
  maxDistance: number;
  availability: 'all' | 'in_stock' | 'rx_only';
}

const DEFAULT_FILTERS: FilterState = {
  sortBy: 'nearest',
  maxPrice: 2000,
  brands: [],
  maxDistance: 25,
  availability: 'all',
};

const SORT_OPTIONS: { key: FilterState['sortBy']; label: string; icon: string }[] = [
  { key: 'nearest', label: 'Nearest', icon: 'map-marker-radius-outline' },
  { key: 'price_asc', label: 'Price ↑', icon: 'currency-inr' },
  { key: 'top_rated', label: 'Top rated', icon: 'star-outline' },
  { key: 'fastest', label: 'Fastest', icon: 'lightning-bolt-outline' },
];

const BRANDS = [
  'Apollo', 'LifeCare', 'Wellness',
  'Cipla', 'Sun Pharma', 'Glenmark',
  'Mankind', "Dr Reddy's",
];

const AVAILABILITY_OPTIONS: { key: FilterState['availability']; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'in_stock', label: 'In stock' },
  { key: 'rx_only', label: 'Rx only' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters?: FilterState;
}

export const FiltersSheet: React.FC<Props> = ({
  visible,
  onClose,
  onApply,
  initialFilters = DEFAULT_FILTERS,
}) => {
  const { isDark, accentColor } = useThemePalette();
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      setFilters(initialFilters);
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 10,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const activeCount = (() => {
    let n = 0;
    if (filters.sortBy !== 'nearest') n++;
    if (filters.maxPrice < 2000) n++;
    if (filters.brands.length > 0) n++;
    if (filters.maxDistance < 25) n++;
    if (filters.availability !== 'all') n++;
    return n;
  })();

  const toggleBrand = (brand: string) => {
    setFilters(prev => ({
      ...prev,
      brands: prev.brands.includes(brand)
        ? prev.brands.filter(b => b !== brand)
        : [...prev.brands, brand],
    }));
  };

  const handleReset = () => setFilters(DEFAULT_FILTERS);

  const textColor = isDark ? '#FFFFFF' : '#1F2937';
  const subText = isDark ? '#9CA3AF' : '#6B7280';
  const sheetBg = isDark ? '#1C1F28' : '#FFFFFF';
  const borderColor = isDark ? '#2A2D35' : '#E5E7EB';
  const pillBg = isDark ? '#2A2D35' : '#F3F4F6';
  const sectionLabel = isDark ? '#6B7280' : '#9CA3AF';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        style={{ flex: 1, backgroundColor: isDark ? '#000000AA' : '#00000066' }}
      />

      {/* Sheet */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: sheetBg,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: SCREEN_HEIGHT * 0.88,
          transform: [{ translateY: slideAnim }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 20,
        }}
      >
        {/* Drag handle */}
        <View style={{ alignItems: 'center', paddingTop: 10, paddingBottom: 6 }}>
          <View
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: isDark ? '#3A3D45' : '#D1D5DB',
            }}
          />
        </View>

        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingBottom: 14,
            borderBottomWidth: 1,
            borderBottomColor: borderColor,
          }}
        >
          <View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: textColor, marginBottom: 3 }}>
              Filters
            </Text>
            <Text style={{ fontSize: 12, color: subText }}>
              Refine results to find what you need fast.
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: isDark ? '#2A2D35' : '#F3F4F6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="close" size={18} color={textColor} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Sort by */}
          <SectionLabel label="Sort by" color={sectionLabel} />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {SORT_OPTIONS.map(opt => {
              const active = filters.sortBy === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setFilters(prev => ({ ...prev, sortBy: opt.key }))}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 22,
                    backgroundColor: active ? accentColor : pillBg,
                    borderWidth: 1.5,
                    borderColor: active ? accentColor : 'transparent',
                  }}
                >
                  <Icon name={opt.icon} size={13} color={active ? '#FFF' : subText} />
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: active ? '#FFF' : textColor,
                    }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Price Range */}
          <SectionLabel label="Price Range" color={sectionLabel} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 12, color: subText }}>₹0</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: accentColor }}>
              ₹0 – ₹{filters.maxPrice.toLocaleString()}
            </Text>
          </View>
          <CustomSlider
            min={0}
            max={2000}
            value={filters.maxPrice}
            step={50}
            onChange={v => setFilters(prev => ({ ...prev, maxPrice: v }))}
            accentColor={accentColor}
            trackColor={isDark ? '#2A2D35' : '#E5E7EB'}
          />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
            <Text style={{ fontSize: 11, color: subText }}>₹0</Text>
            <Text style={{ fontSize: 11, color: subText }}>₹2000</Text>
          </View>

          {/* Company / Brand */}
          <SectionLabel label="Company / Brand" color={sectionLabel} />
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: 8,
              marginBottom: 24,
            }}
          >
            {BRANDS.map(brand => {
              const active = filters.brands.includes(brand);
              return (
                <TouchableOpacity
                  key={brand}
                  onPress={() => toggleBrand(brand)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 22,
                    backgroundColor: active ? accentColor + '18' : pillBg,
                    borderWidth: 1.5,
                    borderColor: active ? accentColor : 'transparent',
                  }}
                >
                  {active && <Icon name="check" size={12} color={accentColor} />}
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: active ? '700' : '500',
                      color: active ? accentColor : textColor,
                    }}
                  >
                    {brand}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Distance */}
          <SectionLabel label="Distance" color={sectionLabel} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontSize: 12, color: subText }}>0 km</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: accentColor }}>
              Up to {filters.maxDistance} km
            </Text>
          </View>
          <CustomSlider
            min={1}
            max={25}
            value={filters.maxDistance}
            step={1}
            onChange={v => setFilters(prev => ({ ...prev, maxDistance: v }))}
            accentColor={accentColor}
            trackColor={isDark ? '#2A2D35' : '#E5E7EB'}
          />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 24,
            }}
          >
            <Text style={{ fontSize: 11, color: subText }}>1 km</Text>
            <Text style={{ fontSize: 11, color: subText }}>25 km</Text>
          </View>

          {/* Availability */}
          <SectionLabel label="Availability" color={sectionLabel} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {AVAILABILITY_OPTIONS.map(opt => {
              const active = filters.availability === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() =>
                    setFilters(prev => ({ ...prev, availability: opt.key }))
                  }
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    paddingVertical: 10,
                    borderRadius: 12,
                    backgroundColor: active ? accentColor : pillBg,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: active ? '#FFF' : textColor,
                    }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Footer */}
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderTopWidth: 1,
            borderTopColor: borderColor,
          }}
        >
          <TouchableOpacity
            onPress={handleReset}
            style={{
              flex: 1,
              paddingVertical: 14,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              onApply(filters);
              onClose();
            }}
            style={{
              flex: 2,
              paddingVertical: 14,
              borderRadius: 14,
              backgroundColor: accentColor,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
              gap: 6,
              shadowColor: accentColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFF' }}>
              Apply Filters
            </Text>
            {activeCount > 0 && (
              <View
                style={{
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFF' }}>
                  {activeCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
};

const SectionLabel: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <Text
    style={{
      fontSize: 11,
      fontWeight: '800',
      color,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: 10,
    }}
  >
    {label}
  </Text>
);
