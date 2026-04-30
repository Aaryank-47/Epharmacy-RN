import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useThemePalette } from '../../../hooks/useThemePalette';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface StoreMedicine {
  name: string;
  price: number;
  oldPrice?: number;
  available: boolean;
  lowStock?: boolean;
  lowStockText?: string;
}

interface StoreItem {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  pinColor: string;
  verified: boolean;
  distance: number;
  timeMin: number;
  rating: number;
  ratingCount: number;
  medicines: StoreMedicine[];
  pin: { left: number; top: number };
  callout: { left: number; top: number };
}

const MOCK_STORES: StoreItem[] = [
  {
    id: '1',
    name: 'LifeCare Pharmacy',
    initials: 'LC',
    avatarColor: '#3B82F6',
    pinColor: '#3B82F6',
    verified: true,
    distance: 0.8,
    timeMin: 6,
    rating: 4.8,
    ratingCount: 1240,
    medicines: [
      { name: 'Amoxicillin 500mg', price: 45, oldPrice: 52, available: true },
      { name: 'Paracetamol 650mg', price: 20, oldPrice: 24, available: true },
      {
        name: 'Cetrizine 10mg',
        price: 15,
        available: true,
        lowStock: true,
        lowStockText: 'Only 2 left',
      },
    ],
    pin: { left: 116, top: 128 },
    callout: { left: 130, top: 106 },
  },
  {
    id: '2',
    name: 'Apollo Pharmacy',
    initials: 'AP',
    avatarColor: '#10B981',
    pinColor: '#10B981',
    verified: true,
    distance: 1.4,
    timeMin: 11,
    rating: 4.6,
    ratingCount: 3120,
    medicines: [
      { name: 'Amoxicillin 500mg', price: 48, available: true },
      { name: 'Paracetamol 650mg', price: 22, available: true },
      { name: 'Cetrizine 10mg', price: 16, available: false },
    ],
    pin: { left: 248, top: 70 },
    callout: { left: 168, top: 50 },
  },
  {
    id: '3',
    name: 'Wellness Forever',
    initials: 'WF',
    avatarColor: '#F59E0B',
    pinColor: '#F59E0B',
    verified: true,
    distance: 2.1,
    timeMin: 16,
    rating: 4.5,
    ratingCount: 892,
    medicines: [
      { name: 'Amoxicillin 500mg', price: 50, available: true },
      { name: 'Paracetamol 650mg', price: 25, available: true },
      { name: 'Cetrizine 10mg', price: 18, available: true },
    ],
    pin: { left: 270, top: 196 },
    callout: { left: 188, top: 218 },
  },
  {
    id: '4',
    name: 'MedPlus',
    initials: 'MP',
    avatarColor: '#EF4444',
    pinColor: '#EF4444',
    verified: false,
    distance: 2.8,
    timeMin: 19,
    rating: 4.3,
    ratingCount: 412,
    medicines: [
      { name: 'Amoxicillin 500mg', price: 47, available: true },
      { name: 'Paracetamol 650mg', price: 21, available: true },
      { name: 'Cetrizine 10mg', price: 17, available: true },
    ],
    pin: { left: 56, top: 232 },
    callout: { left: 70, top: 254 },
  },
];

// ─── Production-grade Uber/Rapido style map ─────────────────────────────────

const ProMapView: React.FC<{ isDark: boolean }> = ({ isDark }) => {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;
  const pulse3 = useRef(new Animated.Value(0)).current;
  const liveDot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ringLoop = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 2000,
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
    const r2 = ringLoop(pulse2, 700);
    const r3 = ringLoop(pulse3, 1400);
    r1.start();
    r2.start();
    r3.start();
    dotLoop.start();

    return () => {
      r1.stop();
      r2.stop();
      r3.stop();
      dotLoop.stop();
    };
  }, []);

  const ringStyle = (val: Animated.Value) => ({
    transform: [
      {
        scale: val.interpolate({ inputRange: [0, 1], outputRange: [1, 3.4] }),
      },
    ],
    opacity: val.interpolate({
      inputRange: [0, 0.2, 1],
      outputRange: [0.55, 0.35, 0],
    }),
  });

  const baseBg = isDark ? '#0E1117' : '#E8EEF4';
  const blockBg = isDark ? '#181C25' : '#FFFFFF';
  const blockBgAlt = isDark ? '#1C2130' : '#F4F7FB';
  const parkBg = isDark ? '#0F2A1F' : '#D7EBDA';
  const waterBg = isDark ? '#0E2336' : '#C7DEEF';
  const roadMain = isDark ? '#2A3142' : '#FFFFFF';
  const roadMinor = isDark ? '#1E2330' : '#F0F4F9';
  const roadEdge = isDark ? '#0E1117' : '#DCE3EC';

  const userPos = { left: 172, top: 158 };

  return (
    <View
      style={{
        height: 320,
        backgroundColor: baseBg,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          position: 'absolute',
          right: -30,
          top: -30,
          width: 160,
          height: 110,
          backgroundColor: parkBg,
          borderRadius: 60,
          opacity: 0.85,
        }}
      />
      <View
        style={{
          position: 'absolute',
          right: 20,
          top: 22,
          width: 60,
          height: 50,
          backgroundColor: parkBg,
          borderRadius: 24,
          opacity: 0.7,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: -50,
          bottom: -30,
          width: 220,
          height: 90,
          backgroundColor: waterBg,
          borderRadius: 50,
          opacity: 0.85,
          transform: [{ rotate: '-12deg' }],
        }}
      />

      {[
        { left: 8, top: 14, w: 50, h: 30, alt: false },
        { left: 64, top: 8, w: 70, h: 36, alt: true },
        { left: 140, top: 12, w: 64, h: 32, alt: false },
        { left: 12, top: 50, w: 44, h: 42, alt: true },
        { left: 62, top: 50, w: 36, h: 40, alt: false },
        { left: 104, top: 52, w: 40, h: 40, alt: true },
        { left: 150, top: 50, w: 50, h: 40, alt: false },
        { left: 14, top: 116, w: 56, h: 38, alt: true },
        { left: 76, top: 116, w: 42, h: 38, alt: false },
        { left: 124, top: 118, w: 32, h: 36, alt: true },
        { left: 188, top: 118, w: 40, h: 36, alt: false },
        { left: 234, top: 118, w: 40, h: 36, alt: true },
        { left: 14, top: 168, w: 38, h: 30, alt: false },
        { left: 60, top: 168, w: 50, h: 30, alt: true },
        { left: 116, top: 170, w: 40, h: 32, alt: false },
        { left: 200, top: 170, w: 50, h: 32, alt: true },
        { left: 14, top: 208, w: 50, h: 36, alt: true },
        { left: 70, top: 208, w: 44, h: 36, alt: false },
        { left: 122, top: 212, w: 40, h: 32, alt: true },
        { left: 168, top: 212, w: 30, h: 32, alt: false },
        { left: 204, top: 212, w: 36, h: 32, alt: true },
        { left: 246, top: 212, w: 50, h: 32, alt: false },
        { left: 14, top: 264, w: 56, h: 32, alt: false },
        { left: 76, top: 264, w: 44, h: 32, alt: true },
        { left: 130, top: 266, w: 36, h: 30, alt: false },
        { left: 174, top: 268, w: 50, h: 28, alt: true },
        { left: 230, top: 268, w: 48, h: 28, alt: false },
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

      {[
        { top: 100, h: 14, edge: true },
        { top: 158, h: 12, edge: true },
        { top: 204, h: 8, edge: false },
        { top: 256, h: 8, edge: false },
      ].map((r, i) => (
        <React.Fragment key={`hr-${i}`}>
          {r.edge && (
            <View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: r.top - 1,
                height: r.h + 2,
                backgroundColor: roadEdge,
              }}
            />
          )}
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: r.top,
              height: r.h,
              backgroundColor: r.edge ? roadMain : roadMinor,
            }}
          />
        </React.Fragment>
      ))}

      {[
        { left: 158, w: 14, edge: true },
        { left: 224, w: 8, edge: false },
        { left: 56, w: 8, edge: false },
        { left: 110, w: 6, edge: false },
      ].map((r, i) => (
        <React.Fragment key={`vr-${i}`}>
          {r.edge && (
            <View
              style={{
                position: 'absolute',
                left: r.left - 1,
                top: 0,
                bottom: 0,
                width: r.w + 2,
                backgroundColor: roadEdge,
              }}
            />
          )}
          <View
            style={{
              position: 'absolute',
              left: r.left,
              top: 0,
              bottom: 0,
              width: r.w,
              backgroundColor: r.edge ? roadMain : roadMinor,
            }}
          />
        </React.Fragment>
      ))}

      <View
        style={{
          position: 'absolute',
          left: -40,
          top: 70,
          width: 420,
          height: 6,
          backgroundColor: roadMinor,
          opacity: 0.7,
          transform: [{ rotate: '12deg' }],
        }}
      />

      {MOCK_STORES.map(store =>
        Array.from({ length: 7 }).map((_, i) => {
          const t = (i + 1) / 8;
          const x = userPos.left + (store.pin.left - userPos.left) * t;
          const y = userPos.top + (store.pin.top - userPos.top) * t;
          return (
            <View
              key={`dash-${store.id}-${i}`}
              style={{
                position: 'absolute',
                left: x - 2.5,
                top: y - 2.5,
                width: 5,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: store.pinColor,
                opacity: 0.85 - i * 0.07,
              }}
            />
          );
        }),
      )}

      {MOCK_STORES.map(store => (
        <View
          key={`cal-${store.id}`}
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
              backgroundColor: store.avatarColor,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#FFF', fontSize: 8, fontWeight: '800' }}>
              {store.initials}
            </Text>
          </View>
          <Text
            style={{
              fontSize: 10.5,
              fontWeight: '700',
              color: isDark ? '#FFF' : '#0F172A',
            }}
          >
            {store.name.split(' ')[0]}
          </Text>
          <View
            style={{
              width: 1,
              height: 10,
              backgroundColor: isDark ? '#2A3142' : '#E1E7EE',
            }}
          />
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#10B981' }}>
            {store.timeMin}m
          </Text>
        </View>
      ))}

      {MOCK_STORES.map(store => (
        <React.Fragment key={`pin-${store.id}`}>
          <View
            style={{
              position: 'absolute',
              left: store.pin.left - 10,
              top: store.pin.top - 10,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: store.pinColor,
              borderWidth: 3,
              borderColor: '#FFFFFF',
              shadowColor: store.pinColor,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.6,
              shadowRadius: 5,
              elevation: 5,
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: store.pin.left - 3,
              top: store.pin.top + 7,
              width: 6,
              height: 6,
              backgroundColor: store.pinColor,
              transform: [{ rotate: '45deg' }],
            }}
          />
        </React.Fragment>
      ))}

      <View
        style={{
          position: 'absolute',
          left: userPos.left - 12,
          top: userPos.top - 12,
          width: 24,
          height: 24,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {[pulse1, pulse2, pulse3].map((p, i) => (
          <Animated.View
            key={i}
            style={[
              {
                position: 'absolute',
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: '#3B82F6',
              },
              ringStyle(p),
            ]}
          />
        ))}
        <View
          style={{
            width: 16,
            height: 16,
            borderRadius: 8,
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

      <View
        style={{
          position: 'absolute',
          left: 10,
          top: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: isDark
            ? 'rgba(26,29,38,0.94)'
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
          {MOCK_STORES.length} stores · 5 km
        </Text>
      </View>

    </View>
  );
};

// ─── Store card ─────────────────────────────────────────────────────────────

const StoreCard: React.FC<{
  store: StoreItem;
  isDark: boolean;
  textColor: string;
  subText: string;
  borderColor: string;
  defaultExpanded?: boolean;
  accentColor: string;
}> = ({
  store,
  isDark,
  textColor,
  subText,
  borderColor,
  defaultExpanded = false,
  accentColor,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const cardBg = isDark ? '#1A1D26' : '#FFFFFF';
  const itemDivider = isDark ? '#2A2D35' : '#F1F5F9';

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(v => !v);
  };

  return (
    <View
      style={{
        backgroundColor: 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: isDark ? '#2A2D35' : '#E2E8F0',
        paddingBottom: 12,
        marginBottom: 12,
        overflow: 'hidden',
      }}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleToggle}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <View
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: store.avatarColor,
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16, letterSpacing: 0.5 }}>
            {store.initials}
          </Text>
          {store.verified && (
            <View
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: '#10B981',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: isDark ? '#11141C' : '#FFFFFF',
              }}
            >
              <Icon name="check" size={10} color="#FFF" />
            </View>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginBottom: 6,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: '800',
                color: textColor,
                flex: 1,
                letterSpacing: -0.3,
              }}
              numberOfLines={1}
            >
              {store.name}
            </Text>
            {store.verified && (
              <Icon name="check-decagram" size={16} color="#10B981" />
            )}
          </View>
          
          <View
            style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
                backgroundColor: isDark ? '#10B98120' : '#ECFDF5',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: isDark ? '#10B98140' : '#D1FAE5',
              }}
            >
              <Icon name="lightning-bolt" size={11} color="#10B981" />
              <Text
                style={{ fontSize: 10, fontWeight: '800', color: '#059669' }}
              >
                {store.timeMin} mins
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: isDark ? '#2A2D35' : '#F1F5F9',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
              }}
            >
              <Icon name="map-marker-distance" size={11} color={subText} />
              <Text style={{ fontSize: 10, color: subText, fontWeight: '700' }}>
                {store.distance} km
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: '#FFFBEB',
                ...(isDark && { backgroundColor: '#F59E0B20' }),
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 8,
              }}
            >
              <Icon name="star" size={11} color="#F59E0B" />
              <Text style={{ fontSize: 10, color: '#D97706', fontWeight: '800' }}>
                {store.rating}
              </Text>
              <Text style={{ fontSize: 10, color: isDark ? '#FBBF2480' : '#FCD34D', fontWeight: '700' }}>
                ({store.ratingCount > 999
                  ? `${(store.ratingCount / 1000).toFixed(1)}k`
                  : store.ratingCount})
              </Text>
            </View>
          </View>
        </View>

        <View style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: expanded ? (isDark ? '#2A2D35' : '#F1F5F9') : 'transparent',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Icon
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={expanded ? textColor : subText}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View
          style={{
            backgroundColor: 'transparent',
            marginTop: 8,
          }}
        >
          {store.medicines.map((med, i) => (
            <View
              key={`${store.id}_${i}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderBottomWidth: i < store.medicines.length - 1 ? 1 : 0,
                borderBottomColor: isDark ? '#2A2D35' : '#F1F5F9',
                backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
                borderRadius: 12,
                marginBottom: 6,
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: med.available ? (isDark ? '#10B98125' : '#DCFCE7') : (isDark ? '#EF444425' : '#FEE2E2'),
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: med.available ? (isDark ? '#10B98140' : '#A7F3D0') : (isDark ? '#EF444440' : '#FECACA'),
                }}
              >
                <Icon
                  name={med.available ? 'check-bold' : 'close-thick'}
                  size={12}
                  color={med.available ? '#10B981' : '#EF4444'}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: med.available ? textColor : subText,
                    textDecorationLine: med.available ? 'none' : 'line-through',
                    marginBottom: 2,
                  }}
                >
                  {med.name}
                </Text>
                {med.lowStock && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Icon name="alert-circle" size={12} color="#F59E0B" />
                    <Text
                      style={{
                        color: '#D97706',
                        fontSize: 11,
                        fontWeight: '700',
                      }}
                    >
                      {med.lowStockText}
                    </Text>
                  </View>
                )}
                {!med.available && (
                   <Text style={{ fontSize: 11, fontWeight: '600', color: '#EF4444' }}>Out of Stock</Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '800',
                    color: med.available ? accentColor : subText,
                  }}
                >
                  ₹{med.price}
                </Text>
                {med.oldPrice && (
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: '600',
                      color: subText,
                      textDecorationLine: 'line-through',
                      marginTop: 2,
                    }}
                  >
                    ₹{med.oldPrice}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Main StoresView ────────────────────────────────────────────────────────

export const StoresView: React.FC<{
  onFilterPress: () => void;
  onScroll?: (event: any) => void;
}> = ({ onScroll }) => {
  const { isDark, accentColor } = useThemePalette();

  const [showMap, setShowMap] = useState(true);

  const toggleMap = (next: boolean) => {
    if (next === showMap) return;
    LayoutAnimation.configureNext({
      duration: 280,
      create: { type: 'easeInEaseOut', property: 'opacity' },
      update: { type: 'easeInEaseOut' },
      delete: { type: 'easeInEaseOut', property: 'opacity' },
    });
    setShowMap(next);
  };

  const textColor = isDark ? '#FFFFFF' : '#0F172A';
  const subText = isDark ? '#9CA3AF' : '#64748B';
  const borderColor = isDark ? '#262A35' : '#ECEEF2';
  const headerBg = isDark ? '#0F1117' : '#F5F6FA';
  const iconBg = isDark ? '#262C3A' : '#EAEAEA';

  return (
    <View style={{ flex: 1 }}>
      {/* Header: count + radio toggle (List ↔ Map) */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
        
        }}
      >
        <Text style={{ flex: 1, fontSize: 13, color: subText }}>
          <Text style={{ fontWeight: '800', color: textColor }}>
            {MOCK_STORES.length} pharmacies
          </Text>{' '}
          within 5 km
        </Text>

        <View
          style={{
            flexDirection: 'row',
            backgroundColor: isDark ? '#1A1D26' : '#F1F5F9',
            borderRadius: 20,
            padding: 6,
            borderWidth: 0,
            borderColor: isDark ? '#2A2D35' : '#E2E8F0',
          }}
        >
          <TouchableOpacity
            onPress={() => toggleMap(false)}
            activeOpacity={0.8}
            accessibilityRole="radio"
            accessibilityState={{ selected: !showMap }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: !showMap
                ? accentColor
                : 'transparent',
              shadowColor: !showMap ? accentColor : 'transparent',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: !showMap ? 0.35 : 0,
              shadowRadius: 6,
              elevation: !showMap ? 4 : 0,
            }}
          >
            <Icon
              name="format-list-bulleted"
              size={15}
              color={!showMap ? '#FFFFFF' : subText}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                color: !showMap ? '#FFFFFF' : subText,
                letterSpacing: 0.3,
              }}
            >
              LIST
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => toggleMap(true)}
            activeOpacity={0.8}
            accessibilityRole="radio"
            accessibilityState={{ selected: showMap }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 16,
              backgroundColor: showMap
                ? accentColor
                : 'transparent',
              shadowColor: showMap ? accentColor : 'transparent',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: showMap ? 0.35 : 0,
              shadowRadius: 6,
              elevation: showMap ? 4 : 0,
            }}
          >
            <Icon
              name="map-outline"
              size={15}
              color={showMap ? '#FFFFFF' : subText}
            />
            <Text
              style={{
                fontSize: 11,
                fontWeight: '800',
                color: showMap ? '#FFFFFF' : subText,
                letterSpacing: 0.3,
              }}
            >
              MAP
            </Text>
           
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={1}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {showMap && (
          <View
            style={{
              marginHorizontal: 10,
              marginTop: 10,
              borderRadius: 24,
              backgroundColor: isDark ? '#1A1D26' : '#FFFFFF',
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: isDark ? '#2A2D35' : '#ECEEF2',
              shadowColor: isDark ? '#000' : '#64748B',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: isDark ? 0.4 : 0.12,
              shadowRadius: 16,
              elevation: 6,
            }}
          >
            <ProMapView isDark={isDark} />
          </View>
        )}

        <View style={{ paddingHorizontal: 14, paddingTop: 14 }}>
          {MOCK_STORES.map((store, idx) => (
            <StoreCard
              key={store.id}
              store={store}
              isDark={isDark}
              textColor={textColor}
              subText={subText}
              borderColor={borderColor}
              defaultExpanded={idx === 0}
              accentColor={accentColor}
            />
          ))}
        </View>
      </Animated.ScrollView>
    </View>
  );
};
