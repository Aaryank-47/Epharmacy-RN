import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useThemePalette } from '../../../hooks/useThemePalette';
import type { PrescriptionMedicine } from '../../../api/types';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  medicine: PrescriptionMedicine;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onCompareStores?: () => void;
  onAddToBucket?: () => void;
}

const GENERIC_ALTERNATIVES: Record<string, { name: string; savings: number }> = {
  Paracetamol: { name: 'Calpol 500', savings: 12 },
  Ibuprofen: { name: 'Mox 400', savings: 17 },
  Cetirizine: { name: 'Zyrtec 10mg', savings: 8 },
  Amoxicillin: { name: 'Mox 500', savings: 22 },
  'Cough Syrup': { name: 'Benadryl', savings: 15 },
};

export const MedicineCard: React.FC<Props> = ({ medicine, index, isExpanded, onToggle, onCompareStores, onAddToBucket }) => {
  const { isDark, accentColor, ctaGradient } = useThemePalette();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideIn = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 400,
        delay: index * 70,
        useNativeDriver: true,
      }),
      Animated.spring(slideIn, {
        toValue: 0,
        delay: index * 70,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }),
    ]).start();
  }, []);

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  const generic = GENERIC_ALTERNATIVES[medicine.drugName];
  const storesCount = Math.floor(Math.random() * 5) + 2;
  const inStock = medicine.availability;

  const textColor = isDark ? '#FFFFFF' : '#1F2937';
  const subText = isDark ? '#9CA3AF' : '#6B7280';
  const cardBg = isDark ? '#1C1F28' : '#FFFFFF';
  const borderColor = isDark ? '#2A2D35' : '#EBEBEB';
  const detailBg = isDark ? '#14161E' : '#F8F8F8';
  const divider = isDark ? '#252830' : '#EFEFEF';

  // Icon container uses a purple tone matching Figma
  const iconBg = '#8B5CF620';
  const iconBorder = '#8B5CF640';
  const iconColor = '#8B5CF6';

  return (
    <Animated.View
      style={{
        opacity: fadeIn,
        transform: [{ translateY: slideIn }],
        marginBottom: 10,
        borderRadius: 18,
        backgroundColor: cardBg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor,
        shadowColor: isDark ? '#000' : '#9CA3AF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.3 : 0.09,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Collapsed header row */}
      <TouchableOpacity onPress={handleToggle} activeOpacity={0.75} style={{ padding: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          {/* Pill icon container */}
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              backgroundColor: iconBg,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1.5,
              borderColor: iconBorder,
            }}
          >
            <Icon name="pill" size={22} color={iconColor} />
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: textColor, flex: 1 }} numberOfLines={1}>
                {medicine.drugName}
              </Text>
              {/* Rx badge — blue, like Figma */}
              <View
                style={{
                  backgroundColor: '#3B82F620',
                  paddingHorizontal: 7,
                  paddingVertical: 2,
                  borderRadius: 6,
                  borderWidth: 1,
                  borderColor: '#3B82F640',
                }}
              >
                <Text style={{ fontSize: 9, fontWeight: '800', color: '#3B82F6', letterSpacing: 0.5 }}>Rx</Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
              <Text style={{ fontSize: 12, color: subText }}>
                {medicine.dosage !== 'Not specified' ? medicine.dosage : 'Tablet'}
              </Text>
              <Text style={{ color: subText, fontSize: 12 }}>·</Text>
              <Text style={{ fontSize: 12, color: subText }}>
                In {storesCount} stores
              </Text>
              {!inStock && (
                <>
                  <Text style={{ color: subText, fontSize: 12 }}>·</Text>
                  <Text style={{ fontSize: 11, color: '#F97316', fontWeight: '600' }}>Low stock</Text>
                </>
              )}
            </View>
          </View>

          {/* Price + chevron */}
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: accentColor }}>
              ₹{medicine.price}
            </Text>
            <Icon
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={subText}
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* Expanded details */}
      {isExpanded && (
        <View style={{ backgroundColor: detailBg, borderTopWidth: 1, borderTopColor: divider }}>
          <View style={{ padding: 14, gap: 12 }}>
            {/* Detail chips row */}
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <DetailChip label="Dosage" value={medicine.dosage !== 'Not specified' ? medicine.dosage : '—'} accentColor={accentColor} isDark={isDark} />
              <DetailChip label="Duration" value={medicine.duration} accentColor={accentColor} isDark={isDark} />
              <DetailChip label="Frequency" value={medicine.frequency} accentColor={accentColor} isDark={isDark} />
            </View>

            {/* Generic alternative banner */}
            {generic && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isDark ? '#0D2B20' : '#ECFDF5',
                  borderWidth: 1,
                  borderColor: isDark ? '#10B98130' : '#A7F3D0',
                  borderRadius: 14,
                  padding: 12,
                  gap: 10,
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 11,
                    backgroundColor: '#10B98125',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="leaf" size={17} color="#10B981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 9,
                      fontWeight: '800',
                      color: '#10B981',
                      letterSpacing: 0.8,
                      marginBottom: 2,
                      textTransform: 'uppercase',
                    }}
                  >
                    Generic Alternative
                  </Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#D1FAE5' : '#065F46' }}>
                    {generic.name}{' '}
                    <Text style={{ fontSize: 12, color: '#10B981', fontWeight: '600' }}>
                      save ₹{generic.savings}
                    </Text>
                  </Text>
                </View>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#10B981',
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 20,
                  }}
                >
                  <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Swap</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Compare + Add to Bucket */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 2 }}>
              <TouchableOpacity
                onPress={onCompareStores}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1.5,
                  borderColor: isDark ? '#374151' : '#D1D5DB',
                  paddingVertical: 11,
                  borderRadius: 24,
                  gap: 6,
                  backgroundColor: isDark ? '#1C1F28' : '#FFFFFF',
                }}
              >
                <Icon name="store-outline" size={15} color={subText} />
                <Text style={{ fontSize: 12, fontWeight: '700', color: textColor }}>Compare stores</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={onAddToBucket}
                style={{ flex: 1, borderRadius: 24, overflow: 'hidden' }}
              >
                <LinearGradient
                  colors={ctaGradient as unknown as string[]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 11,
                    gap: 6,
                  }}
                >
                  <Icon name="basket-plus-outline" size={15} color="#FFF" />
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFF' }}>Add to Bucket</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </Animated.View>
  );
};

const DetailChip: React.FC<{
  label: string;
  value: string;
  accentColor: string;
  isDark: boolean;
}> = ({ label, value, accentColor, isDark }) => (
  <View
    style={{
      flex: 1,
      backgroundColor: isDark ? accentColor + '15' : accentColor + '10',
      borderRadius: 12,
      padding: 9,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: accentColor + '25',
    }}
  >
    <Text
      style={{
        fontSize: 9,
        fontWeight: '700',
        color: accentColor,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 3,
      }}
    >
      {label}
    </Text>
    <Text
      style={{
        fontSize: 11,
        fontWeight: '600',
        color: isDark ? '#E5E7EB' : '#374151',
        textAlign: 'center',
      }}
      numberOfLines={1}
    >
      {value || '—'}
    </Text>
  </View>
);
