import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  UIManager,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useThemePalette } from '../../../hooks/useThemePalette';
import type { PrescriptionMedicine } from '../../../api/types';

// Use the generated image for medicines
const DEFAULT_MED_IMAGE =
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&h=300&fit=crop';
const SYRUP_IMAGE =
  'https://images.unsplash.com/photo-1550572017-ed2002b42d7e?w=300&h=300&fit=crop';
const PILL_IMAGE =
  'https://images.unsplash.com/photo-1471864190281-ad5f9f33d70e?w=300&h=300&fit=crop';

const getMedImage = (name: string, type?: string) => {
  if (type?.toLowerCase().includes('syrup')) return SYRUP_IMAGE;
  if (name.toLowerCase().includes('paracetamol')) return DEFAULT_MED_IMAGE;
  return PILL_IMAGE;
};

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
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

const GENERIC_ALTERNATIVES: Record<string, { name: string; savings: number }> =
  {
    Paracetamol: { name: 'Calpol 500', savings: 12 },
    Ibuprofen: { name: 'Mox 400', savings: 17 },
    Cetirizine: { name: 'Zyrtec 10mg', savings: 8 },
    Amoxicillin: { name: 'Mox 500', savings: 22 },
    'Cough Syrup': { name: 'Benadryl', savings: 15 },
  };

interface NearbyStore {
  id: string;
  name: string;
  short: string;
  color: string;
  distanceKm: number;
  etaMin: number;
  pin: { left: number; top: number };
  callout: { left: number; top: number; placement: 'right' | 'left' };
}

const NEARBY_STORES: NearbyStore[] = [
  {
    id: 'lc',
    name: 'LifeCare',
    short: 'LC',
    color: '#3B82F6',
    distanceKm: 0.8,
    etaMin: 6,
    pin: { left: 96, top: 92 },
    callout: { left: 110, top: 70, placement: 'right' },
  },
  {
    id: 'ap',
    name: 'Apollo',
    short: 'AP',
    color: '#10B981',
    distanceKm: 1.4,
    etaMin: 11,
    pin: { left: 232, top: 56 },
    callout: { left: 154, top: 38, placement: 'right' },
  },
  {
    id: 'wf',
    name: 'Wellness',
    short: 'WF',
    color: '#F59E0B',
    distanceKm: 2.1,
    etaMin: 16,
    pin: { left: 256, top: 156 },
    callout: { left: 174, top: 178, placement: 'right' },
  },
];

export const MedicineCard: React.FC<Props> = ({
  medicine,
  index,
  isExpanded,
  onToggle,
  onCompareStores,
  onAddToBucket,
}) => {
  const { isDark, accentColor, ctaGradient } = useThemePalette();
  const fadeIn = useRef(new Animated.Value(0)).current;
  const slideIn = useRef(new Animated.Value(20)).current;
  const [showMap, setShowMap] = useState(false);
  const mapAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 500,
        delay: index * 60,
        useNativeDriver: true,
      }),
      Animated.spring(slideIn, {
        toValue: 0,
        delay: index * 60,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
    ]).start();
  }, []);

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  const handleMapToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowMap(v => !v);
    Animated.timing(mapAnim, {
      toValue: showMap ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const generic = GENERIC_ALTERNATIVES[medicine.drugName];
  const storesCount = NEARBY_STORES.length;
  const inStock = medicine.availability;

  const textColor = isDark ? '#FFFFFF' : '#111827';
  const subText = isDark ? '#9CA3AF' : '#6B7280';
  const cardBg = isDark ? '#1C1F28' : '#FFFFFF';
  const borderColor = isDark ? '#2A2D35' : '#F3F4F6';
  const detailBg = isDark ? '#161922' : '#F9FAFB';
  const divider = isDark ? '#2A2D35' : '#E5E7EB';

  return (
    <Animated.View
      style={{
        opacity: fadeIn,
        transform: [{ translateY: slideIn }],
        marginBottom: 16,
        borderRadius: 24,
        backgroundColor: cardBg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: showMap ? accentColor + '40' : borderColor,
        shadowColor: isDark ? '#000' : '#E2E8F0',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDark ? 0.4 : 0.12,
        shadowRadius: 16,
        elevation: 5,
      }}
    >
      <TouchableOpacity
        onPress={handleToggle}
        activeOpacity={0.9}
        style={{ padding: 12 }}
      >
        <View style={{ flexDirection: 'row', gap: 16 }}>
          {/* High-quality medicine image */}
          <View style={{ position: 'relative' }}>
            <Image
              source={{ uri: getMedImage(medicine.drugName, medicine.dosage) }}
              style={{
                width: 90,
                height: 90,
                borderRadius: 20,
                backgroundColor: isDark ? '#2A2D35' : '#F9FAFB',
              }}
            />
            <View
              style={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: accentColor,
                borderWidth: 3,
                borderColor: cardBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="check" size={14} color="#FFF" />
            </View>
          </View>

          {/* Main Info */}
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: '800',
                    color: textColor,
                    letterSpacing: -0.4,
                    marginBottom: 2,
                  }}
                  numberOfLines={1}
                >
                  {medicine.drugName}
                </Text>
                <Text
                  style={{ fontSize: 13, color: subText, fontWeight: '600' }}
                >
                  {medicine.dosage !== 'Not specified'
                    ? medicine.dosage
                    : 'Tablet'}{' '}
                  · {medicine.frequency}
                </Text>
              </View>
              <Text
                style={{ fontSize: 18, fontWeight: '900', color: accentColor }}
              >
                ₹{medicine.price}
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
                marginTop: 10,
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: isDark ? '#2A2D35' : '#F3F4F6',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderRadius: 10,
                }}
              >
                <Icon name="store-outline" size={14} color={accentColor} />
                <Text
                  style={{ fontSize: 11, fontWeight: '700', color: textColor }}
                >
                  {storesCount} Stores
                </Text>
              </View>

              {!inStock && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: '#FEF3C7',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Icon name="alert-circle" size={12} color="#D97706" />
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '800',
                      color: '#D97706',
                    }}
                  >
                    LOW STOCK
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Quick action strip */}
        <View
          style={{
            flexDirection: 'row',
            marginTop: 14,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: borderColor,
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <TouchableOpacity
            onPress={e => {
              e.stopPropagation();
              handleMapToggle();
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: showMap ? accentColor + '15' : 'transparent',
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 12,
            }}
          >
            <Icon
              name={showMap ? 'map-marker' : 'map-marker-outline'}
              size={18}
              color={showMap ? accentColor : subText}
            />
            <Text
              style={{
                fontSize: 12,
                fontWeight: '700',
                color: showMap ? accentColor : subText,
              }}
            >
              {showMap ? 'Hide Map' : 'Nearby Stores'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={e => {
              e.stopPropagation();
              onAddToBucket?.();
            }}
            style={{
              backgroundColor: accentColor,
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 24,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              shadowColor: accentColor,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Icon name="pail-outline" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Map panel — slides in when icon toggled */}
      {showMap && (
        <NearbyMap
          isDark={isDark}
          accentColor={accentColor}
          onClose={handleMapToggle}
          onCompareStores={onCompareStores}
        />
      )}

      {/* Expanded details */}
      {isExpanded && (
        <View
          style={{
            backgroundColor: detailBg,
            borderTopWidth: 1,
            borderTopColor: divider,
          }}
        >
          <View style={{ padding: 14, gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  backgroundColor: '#8B5CF618',
                  borderWidth: 1,
                  borderColor: '#8B5CF640',
                  paddingHorizontal: 9,
                  paddingVertical: 4,
                  borderRadius: 6,
                }}
              >
                <Icon name="prescription" size={11} color="#8B5CF6" />
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '800',
                    color: '#8B5CF6',
                    letterSpacing: 0.6,
                  }}
                >
                  PRESCRIBED
                </Text>
              </View>
              {generic && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: '#10B98118',
                    borderWidth: 1,
                    borderColor: '#10B98140',
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    borderRadius: 6,
                  }}
                >
                  <Icon name="leaf" size={11} color="#10B981" />
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '800',
                      color: '#10B981',
                      letterSpacing: 0.6,
                    }}
                  >
                    GENERIC AVAILABLE
                  </Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 8 }}>
              <DetailChip
                label="Dosage"
                value={
                  medicine.dosage !== 'Not specified' ? medicine.dosage : '—'
                }
                accentColor={accentColor}
                isDark={isDark}
              />
              <DetailChip
                label="Duration"
                value={medicine.duration}
                accentColor={accentColor}
                isDark={isDark}
              />
              <DetailChip
                label="Frequency"
                value={medicine.frequency}
                accentColor={accentColor}
                isDark={isDark}
              />
            </View>

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
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '700',
                      color: isDark ? '#D1FAE5' : '#065F46',
                    }}
                  >
                    {generic.name}{' '}
                    <Text
                      style={{
                        fontSize: 12,
                        color: '#10B981',
                        fontWeight: '600',
                      }}
                    >
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
                  <Text
                    style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}
                  >
                    Swap
                  </Text>
                </TouchableOpacity>
              </View>
            )}

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
                <Text
                  style={{ fontSize: 12, fontWeight: '700', color: textColor }}
                >
                  Compare stores
                </Text>
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
                  <Text
                    style={{ fontSize: 12, fontWeight: '700', color: '#FFF' }}
                  >
                    Add to Bucket
                  </Text>
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
      backgroundColor: isDark ? '#262A35' : '#FFFFFF',
      padding: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? '#374151' : '#E5E7EB',
    }}
  >
    <Text
      style={{
        fontSize: 9,
        color: isDark ? '#9CA3AF' : '#6B7280',
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 2,
      }}
    >
      {label}
    </Text>
    <Text
      style={{
        fontSize: 13,
        fontWeight: '800',
        color: isDark ? '#FFFFFF' : '#111827',
      }}
    >
      {value}
    </Text>
  </View>
);

// ─── Production-grade nearby map (Uber/Rapido-style) ────────────────────────

const NearbyMap: React.FC<{
  isDark: boolean;
  accentColor: string;
  onClose: () => void;
  onCompareStores?: () => void;
}> = ({ isDark, accentColor, onClose, onCompareStores }) => {
  const slide = useRef(new Animated.Value(0)).current;
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const liveDot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(slide, {
      toValue: 1,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    const ringLoop = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );

    const dotLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(liveDot, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(liveDot, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    const r1 = ringLoop(pulse1, 0);
    const r2 = ringLoop(pulse2, 900);
    r1.start();
    r2.start();
    dotLoop.start();

    return () => {
      r1.stop();
      r2.stop();
      dotLoop.stop();
    };
  }, []);

  const ringStyle = (val: Animated.Value) => ({
    transform: [
      {
        scale: val.interpolate({ inputRange: [0, 1], outputRange: [1, 3.2] }),
      },
    ],
    opacity: val.interpolate({
      inputRange: [0, 0.2, 1],
      outputRange: [0.55, 0.35, 0],
    }),
  });

  // Map palette — Uber-like dark / Rapido light
  const baseBg = isDark ? '#0E1117' : '#E8EEF4';
  const blockBg = isDark ? '#181C25' : '#FFFFFF';
  const blockBgAlt = isDark ? '#1C2130' : '#F4F7FB';
  const parkBg = isDark ? '#0F2A1F' : '#D7EBDA';
  const waterBg = isDark ? '#0E2336' : '#C7DEEF';
  const roadMain = isDark ? '#2A3142' : '#FFFFFF';
  const roadMinor = isDark ? '#1E2330' : '#F0F4F9';
  const roadEdge = isDark ? '#0E1117' : '#DCE3EC';

  const userPos = { left: 152, top: 124 }; // center-ish

  return (
    <Animated.View
      style={{
        opacity: slide,
        transform: [
          {
            translateY: slide.interpolate({
              inputRange: [0, 1],
              outputRange: [-8, 0],
            }),
          },
        ],
      }}
    >
      <View
        style={{
          height: 270,
          backgroundColor: baseBg,
          position: 'relative',
          overflow: 'hidden',
          borderTopWidth: 1,
          borderBottomWidth: 1,
          borderColor: isDark ? '#262A35' : '#DCE3EC',
        }}
      >
        {/* Park (top-right) */}
        <View
          style={{
            position: 'absolute',
            right: -10,
            top: -10,
            width: 110,
            height: 80,
            backgroundColor: parkBg,
            borderRadius: 30,
            opacity: 0.85,
          }}
        />
        {/* Water sliver (bottom-left) */}
        <View
          style={{
            position: 'absolute',
            left: -30,
            bottom: -20,
            width: 160,
            height: 70,
            backgroundColor: waterBg,
            borderRadius: 40,
            opacity: 0.85,
            transform: [{ rotate: '-12deg' }],
          }}
        />

        {/* Building blocks — varied sizes for organic feel */}
        {[
          { left: 8, top: 12, w: 44, h: 28, alt: false },
          { left: 58, top: 8, w: 64, h: 32, alt: true },
          { left: 12, top: 46, w: 38, h: 38, alt: true },
          { left: 56, top: 48, w: 30, h: 36, alt: false },
          { left: 92, top: 50, w: 36, h: 36, alt: false },
          { left: 132, top: 12, w: 56, h: 30, alt: true },
          { left: 196, top: 14, w: 42, h: 26, alt: false },
          { left: 134, top: 50, w: 42, h: 36, alt: false },
          { left: 180, top: 50, w: 50, h: 36, alt: true },
          { left: 8, top: 96, w: 52, h: 36, alt: false },
          { left: 66, top: 96, w: 38, h: 36, alt: true },
          { left: 110, top: 96, w: 30, h: 36, alt: false },
          { left: 178, top: 100, w: 36, h: 32, alt: true },
          { left: 220, top: 100, w: 50, h: 32, alt: false },
          { left: 12, top: 142, w: 60, h: 38, alt: true },
          { left: 80, top: 142, w: 52, h: 38, alt: false },
          { left: 198, top: 144, w: 44, h: 36, alt: true },
          { left: 250, top: 144, w: 42, h: 36, alt: false },
          { left: 18, top: 188, w: 46, h: 30, alt: false },
          { left: 72, top: 188, w: 56, h: 30, alt: true },
          { left: 200, top: 192, w: 48, h: 28, alt: false },
          { left: 254, top: 192, w: 42, h: 28, alt: true },
          { left: 16, top: 230, w: 42, h: 26, alt: true },
          { left: 64, top: 228, w: 50, h: 28, alt: false },
          { left: 200, top: 232, w: 46, h: 26, alt: true },
        ].map((b, i) => (
          <View
            key={`blk-${i}`}
            style={{
              position: 'absolute',
              left: b.left,
              top: b.top,
              width: b.w,
              height: b.h,
              backgroundColor: b.alt ? blockBgAlt : blockBg,
              borderRadius: 4,
              borderWidth: isDark ? 0 : 0.5,
              borderColor: '#E1E7EE',
            }}
          />
        ))}

        {/* Roads — main (with edge for that mapped look) */}
        {/* Horizontal arterial */}
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 88,
            height: 12,
            backgroundColor: roadEdge,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 89,
            height: 10,
            backgroundColor: roadMain,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 134,
            height: 10,
            backgroundColor: roadEdge,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 135,
            height: 8,
            backgroundColor: roadMain,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 182,
            height: 8,
            backgroundColor: roadMinor,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 222,
            height: 8,
            backgroundColor: roadMinor,
          }}
        />

        {/* Vertical streets */}
        <View
          style={{
            position: 'absolute',
            left: 124,
            top: 0,
            bottom: 0,
            width: 12,
            backgroundColor: roadEdge,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 125,
            top: 0,
            bottom: 0,
            width: 10,
            backgroundColor: roadMain,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 188,
            top: 0,
            bottom: 0,
            width: 8,
            backgroundColor: roadMinor,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 244,
            top: 0,
            bottom: 0,
            width: 8,
            backgroundColor: roadMinor,
          }}
        />
        <View
          style={{
            position: 'absolute',
            left: 50,
            top: 0,
            bottom: 0,
            width: 6,
            backgroundColor: roadMinor,
          }}
        />

        {/* Diagonal expressway accent */}
        <View
          style={{
            position: 'absolute',
            left: -40,
            top: 60,
            width: 360,
            height: 6,
            backgroundColor: roadMinor,
            opacity: 0.7,
            transform: [{ rotate: '14deg' }],
          }}
        />

        {/* Dashed route line: user → nearest store (LifeCare) */}
        {Array.from({ length: 8 }).map((_, i) => {
          // Diagonal dashes from userPos toward LifeCare pin (96, 92)
          const t = i / 7;
          const x = userPos.left - (userPos.left - 96) * t;
          const y = userPos.top - (userPos.top - 92) * t;
          return (
            <View
              key={`dash-${i}`}
              style={{
                position: 'absolute',
                left: x - 3,
                top: y - 3,
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#3B82F6',
                opacity: 0.95 - i * 0.07,
                shadowColor: '#3B82F6',
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.7,
                shadowRadius: 4,
              }}
            />
          );
        })}

        {/* Store pins + callouts */}
        {NEARBY_STORES.map(store => (
          <React.Fragment key={store.id}>
            {/* Callout pill */}
            <View
              style={{
                position: 'absolute',
                left: store.callout.left,
                top: store.callout.top,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 6,
                backgroundColor: isDark ? '#1A1D26' : '#FFFFFF',
                paddingLeft: 4,
                paddingRight: 9,
                paddingVertical: 4,
                borderRadius: 14,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: isDark ? 0.5 : 0.18,
                shadowRadius: 6,
                elevation: 5,
                borderWidth: 1,
                borderColor: isDark ? '#262A35' : '#ECEEF2',
              }}
            >
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  backgroundColor: store.color,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '800' }}>
                  {store.short}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 10.5,
                  fontWeight: '700',
                  color: isDark ? '#FFF' : '#0F172A',
                }}
              >
                {store.name}
              </Text>
              <View
                style={{
                  width: 1,
                  height: 10,
                  backgroundColor: isDark ? '#2A3142' : '#E1E7EE',
                }}
              />
              <Text
                style={{ fontSize: 10, fontWeight: '700', color: '#10B981' }}
              >
                {store.etaMin}m
              </Text>
            </View>

            {/* Pin marker */}
            <View
              style={{
                position: 'absolute',
                left: store.pin.left - 9,
                top: store.pin.top - 9,
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: store.color,
                borderWidth: 3,
                borderColor: '#FFFFFF',
                shadowColor: store.color,
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.6,
                shadowRadius: 5,
                elevation: 5,
              }}
            />
            {/* Pin tail */}
            <View
              style={{
                position: 'absolute',
                left: store.pin.left - 3,
                top: store.pin.top + 6,
                width: 6,
                height: 6,
                backgroundColor: store.color,
                transform: [{ rotate: '45deg' }],
              }}
            />
          </React.Fragment>
        ))}

        {/* User location — pulsing */}
        <View
          style={{
            position: 'absolute',
            left: userPos.left - 11,
            top: userPos.top - 11,
            width: 22,
            height: 22,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {[pulse1, pulse2].map((p, i) => (
            <Animated.View
              key={i}
              style={[
                {
                  position: 'absolute',
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: '#3B82F6',
                },
                ringStyle(p),
              ]}
            />
          ))}
          <View
            style={{
              width: 14,
              height: 14,
              borderRadius: 7,
              backgroundColor: '#3B82F6',
              borderWidth: 3,
              borderColor: '#FFFFFF',
              shadowColor: '#3B82F6',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.9,
              shadowRadius: 8,
              elevation: 6,
            }}
          />
        </View>

        {/* Top-left: live tracking pill */}
        <View
          style={{
            position: 'absolute',
            left: 10,
            top: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            backgroundColor: isDark
              ? 'rgba(26,29,38,0.92)'
              : 'rgba(255,255,255,0.96)',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 14,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.18,
            shadowRadius: 4,
            elevation: 3,
            borderWidth: 1,
            borderColor: isDark ? '#262A35' : '#ECEEF2',
          }}
        >
          <Animated.View
            style={{
              width: 7,
              height: 7,
              borderRadius: 3.5,
              backgroundColor: '#10B981',
              opacity: liveDot,
            }}
          />
          <Text
            style={{
              fontSize: 10,
              fontWeight: '800',
              color: isDark ? '#FFF' : '#0F172A',
              letterSpacing: 0.5,
            }}
          >
            LIVE
          </Text>
          <View
            style={{
              width: 1,
              height: 10,
              backgroundColor: isDark ? '#2A3142' : '#E1E7EE',
            }}
          />
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: isDark ? '#9CA3AF' : '#475569',
            }}
          >
            {NEARBY_STORES.length} stores · 2.1 km
          </Text>
        </View>

        {/* Top-right: close button */}
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={0.75}
          style={{
            position: 'absolute',
            right: 10,
            top: 10,
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: isDark
              ? 'rgba(26,29,38,0.92)'
              : 'rgba(255,255,255,0.96)',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.18,
            shadowRadius: 4,
            elevation: 3,
            borderWidth: 1,
            borderColor: isDark ? '#262A35' : '#ECEEF2',
          }}
        >
          <Icon name="close" size={16} color={isDark ? '#FFF' : '#0F172A'} />
        </TouchableOpacity>

        {/* Right side: control stack */}
        <View
          style={{
            position: 'absolute',
            right: 10,
            top: 50,
            backgroundColor: isDark
              ? 'rgba(26,29,38,0.92)'
              : 'rgba(255,255,255,0.96)',
            borderRadius: 10,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.18,
            shadowRadius: 4,
            elevation: 3,
            borderWidth: 1,
            borderColor: isDark ? '#262A35' : '#ECEEF2',
          }}
        >
          {[].map((c, i) => (
            <TouchableOpacity
              key={c.name}
              activeOpacity={0.65}
              style={{
                width: 30,
                height: 30,
                alignItems: 'center',
                justifyContent: 'center',
                borderBottomWidth: c.divider ? 1 : 0,
                borderBottomColor: isDark ? '#262A35' : '#ECEEF2',
              }}
            >
              <Icon
                name={c.name}
                size={i === 2 ? 13 : 14}
                color={i === 2 ? '#3B82F6' : isDark ? '#FFF' : '#0F172A'}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Bottom sheet: fastest store
        <View
          style={{
            position: 'absolute',
            left: 10,
            right: 10,
            bottom: 10,
            backgroundColor: isDark ? '#1A1D26' : '#FFFFFF',
            borderRadius: 14,
            padding: 10,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.22,
            shadowRadius: 8,
            elevation: 6,
            borderWidth: 1,
            borderColor: isDark ? '#262A35' : '#ECEEF2',
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              backgroundColor: '#3B82F6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 13 }}>
              LC
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
            >
              <Text
                style={{
                  fontSize: 12.5,
                  fontWeight: '700',
                  color: isDark ? '#FFF' : '#0F172A',
                }}
              >
                LifeCare Pharmacy
              </Text>
              <Icon name="check-decagram" size={12} color="#10B981" />
            </View>
            <View
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 2,
                  backgroundColor: '#10B98118',
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                  borderRadius: 4,
                }}
              >
                <Icon name="lightning-bolt" size={9} color="#10B981" />
                <Text
                  style={{
                    fontSize: 9.5,
                    fontWeight: '800',
                    color: '#10B981',
                  }}
                >
                  6 MIN
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 10.5,
                  color: isDark ? '#9CA3AF' : '#64748B',
                  fontWeight: '600',
                }}
              >
                0.8 km · ⭐ 4.8
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onCompareStores}
            activeOpacity={0.85}
            style={{ borderRadius: 20, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={['#3B82F6', '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 12,
                paddingVertical: 7,
                gap: 4,
              }}
            >
              <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '800' }}>
                Order
              </Text>
              <Icon name="arrow-right" size={12} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View> */}
      </View>
    </Animated.View>
  );
};
