import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemePalette } from '../../../hooks/useThemePalette';

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
  pillPos: { left: number; top: number };
}

const MOCK_STORES: StoreItem[] = [
  {
    id: '1',
    name: 'LifeCare Pharmacy',
    initials: 'LC',
    avatarColor: '#3B82F6',
    pinColor: '#3B82F6',
    verified: true,
    distance: 1.2,
    timeMin: 8,
    rating: 4.8,
    ratingCount: 1240,
    medicines: [
      { name: 'Amoxicillin 500mg', price: 45, oldPrice: 52, available: true },
      { name: 'Paracetamol 650mg', price: 20, oldPrice: 24, available: true },
      { name: 'Cetrizine 10mg', price: 15, available: true, lowStock: true, lowStockText: 'Only 2 left' },
    ],
    pin: { left: 150, top: 80 },
    pillPos: { left: 110, top: 60 },
  },
  {
    id: '2',
    name: 'Apollo Pharmacy',
    initials: 'AP',
    avatarColor: '#10B981',
    pinColor: '#10B981',
    verified: true,
    distance: 2.5,
    timeMin: 14,
    rating: 4.6,
    ratingCount: 3120,
    medicines: [
      { name: 'Amoxicillin 500mg', price: 48, available: true },
      { name: 'Paracetamol 650mg', price: 22, available: true },
      { name: 'Cetrizine 10mg', price: 16, available: false },
    ],
    pin: { left: 240, top: 50 },
    pillPos: { left: 195, top: 30 },
  },
  {
    id: '3',
    name: 'Wellness Forever',
    initials: 'WF',
    avatarColor: '#F59E0B',
    pinColor: '#F59E0B',
    verified: true,
    distance: 3.1,
    timeMin: 18,
    rating: 4.5,
    ratingCount: 892,
    medicines: [
      { name: 'Amoxicillin 500mg', price: 50, available: true },
      { name: 'Paracetamol 650mg', price: 25, available: true },
      { name: 'Cetrizine 10mg', price: 18, available: true },
    ],
    pin: { left: 250, top: 130 },
    pillPos: { left: 200, top: 110 },
  },
];

const MapView: React.FC<{ isDark: boolean; accentColor: string }> = ({ isDark, accentColor }) => {
  const mapBg = isDark ? '#0F1219' : '#EBE3D4';
  const blockColor = isDark ? '#1A1E2A' : '#DDD3BD';
  const roadColor = isDark ? '#262C3A' : '#D2C7AE';

  return (
    <View
      style={{
        height: 220,
        backgroundColor: mapBg,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Building blocks */}
      {[
        { left: 0, top: 0, w: 60, h: 35 },
        { left: 70, top: 0, w: 80, h: 35 },
        { left: 160, top: 0, w: 70, h: 35 },
        { left: 240, top: 0, w: 80, h: 35 },
        { left: 0, top: 45, w: 60, h: 50 },
        { left: 70, top: 45, w: 80, h: 50 },
        { left: 160, top: 45, w: 70, h: 50 },
        { left: 240, top: 45, w: 80, h: 50 },
        { left: 0, top: 105, w: 60, h: 50 },
        { left: 70, top: 105, w: 80, h: 50 },
        { left: 160, top: 105, w: 70, h: 50 },
        { left: 240, top: 105, w: 80, h: 50 },
        { left: 0, top: 165, w: 60, h: 50 },
        { left: 70, top: 165, w: 80, h: 50 },
        { left: 240, top: 165, w: 80, h: 50 },
      ].map((b, i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: b.left,
            top: b.top,
            width: b.w,
            height: b.h,
            backgroundColor: blockColor,
            borderRadius: 3,
          }}
        />
      ))}

      {/* Roads (diagonal-ish lines) */}
      {[37, 97, 157].map(top => (
        <View
          key={`h${top}`}
          style={{
            position: 'absolute',
            top,
            left: 0,
            right: 0,
            height: 6,
            backgroundColor: roadColor,
          }}
        />
      ))}
      {[62, 152, 232].map(left => (
        <View
          key={`v${left}`}
          style={{
            position: 'absolute',
            left,
            top: 0,
            bottom: 0,
            width: 6,
            backgroundColor: roadColor,
          }}
        />
      ))}

      {/* "YOU · 3 NEARBY" pill */}
      <View
        style={{
          position: 'absolute',
          left: 12,
          top: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: isDark ? '#1C1F28' : '#FFFFFF',
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        <View
          style={{
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: accentColor,
          }}
        />
        <Text
          style={{
            fontSize: 10,
            fontWeight: '700',
            color: isDark ? '#FFF' : '#1F2937',
            letterSpacing: 0.5,
          }}
        >
          YOU · 3 NEARBY
        </Text>
      </View>

      {/* Floating store pills */}
      {MOCK_STORES.map(store => (
        <View
          key={`pill-${store.id}`}
          style={{
            position: 'absolute',
            left: store.pillPos.left,
            top: store.pillPos.top,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            backgroundColor: isDark ? '#1C1F28' : '#FFFFFF',
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
            elevation: 4,
          }}
        >
          <Icon name="map-marker" size={10} color={store.pinColor} />
          <Text
            style={{
              fontSize: 10,
              fontWeight: '700',
              color: isDark ? '#FFF' : '#1F2937',
            }}
          >
            {store.name.split(' ')[0]} · {store.distance} km
          </Text>
        </View>
      ))}

      {/* Center "you are here" marker */}
      <View
        style={{
          position: 'absolute',
          left: 152,
          top: 145,
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: accentColor,
          borderWidth: 3,
          borderColor: '#FFFFFF',
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 8,
          elevation: 6,
        }}
      />

      {/* Zoom controls */}
      <View
        style={{
          position: 'absolute',
          right: 10,
          bottom: 10,
          backgroundColor: isDark ? '#1C1F28' : '#FFFFFF',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <TouchableOpacity
          style={{
            width: 28,
            height: 28,
            alignItems: 'center',
            justifyContent: 'center',
            borderBottomWidth: 1,
            borderBottomColor: isDark ? '#262C3A' : '#E5E7EB',
          }}
        >
          <Icon name="plus" size={14} color={isDark ? '#FFF' : '#1F2937'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={{
            width: 28,
            height: 28,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="minus" size={14} color={isDark ? '#FFF' : '#1F2937'} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

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
  const cardBg = isDark ? '#1C1F28' : '#FFFFFF';
  const itemDivider = isDark ? '#262C3A' : '#F0F0F0';

  return (
    <View
      style={{
        backgroundColor: cardBg,
        borderRadius: 16,
        borderWidth: 1,
        borderColor,
        marginBottom: 10,
        overflow: 'hidden',
        shadowColor: isDark ? '#000' : '#9CA3AF',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.28 : 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <TouchableOpacity
        activeOpacity={0.82}
        onPress={() => setExpanded(v => !v)}
        style={{
          padding: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 13,
            backgroundColor: store.avatarColor,
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 16 }}>
            {store.initials}
          </Text>
          {store.verified && (
            <View
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 14,
                height: 14,
                borderRadius: 7,
                backgroundColor: '#10B981',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: cardBg,
              }}
            >
              <Icon name="check" size={8} color="#FFF" />
            </View>
          )}
        </View>

        <View style={{ flex: 1 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              marginBottom: 4,
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: textColor,
                flex: 1,
              }}
              numberOfLines={1}
            >
              {store.name}
            </Text>
            {store.verified && (
              <Icon name="check-decagram" size={14} color="#10B981" />
            )}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Icon name="map-marker-outline" size={11} color={subText} />
            <Text style={{ fontSize: 11, color: subText }}>
              {store.distance} km
            </Text>
            <Text style={{ fontSize: 11, color: subText }}>·</Text>
            <Icon name="clock-outline" size={11} color={subText} />
            <Text style={{ fontSize: 11, color: subText }}>
              {store.timeMin} min
            </Text>
            <Text style={{ fontSize: 11, color: subText }}>·</Text>
            <Icon name="star" size={11} color="#FBBF24" />
            <Text style={{ fontSize: 11, color: subText }}>
              {store.rating}
            </Text>
          </View>
        </View>

        <Icon
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={subText}
        />
      </TouchableOpacity>

      {expanded && (
        <View
          style={{
            borderTopWidth: 1,
            borderTopColor: itemDivider,
          }}
        >
          {store.medicines.map((med, i) => (
            <View
              key={`${store.id}_${i}`}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 11,
                borderBottomWidth: i < store.medicines.length - 1 ? 1 : 0,
                borderBottomColor: itemDivider,
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: med.available ? '#10B98120' : '#EF444420',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon
                  name={med.available ? 'check' : 'close'}
                  size={11}
                  color={med.available ? '#10B981' : '#EF4444'}
                />
              </View>
              <Text
                style={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: '600',
                  color: textColor,
                }}
              >
                {med.name}
                {med.lowStock && (
                  <Text
                    style={{ color: '#F59E0B', fontSize: 11, fontWeight: '600' }}
                  >
                    {'  '}⚡ {med.lowStockText}
                  </Text>
                )}
              </Text>
              <View style={{ alignItems: 'flex-end' }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '800',
                    color: accentColor,
                  }}
                >
                  ₹{med.price}
                </Text>
                {med.oldPrice && (
                  <Text
                    style={{
                      fontSize: 10,
                      color: subText,
                      textDecorationLine: 'line-through',
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

export const StoresView: React.FC<{ onFilterPress: () => void }> = () => {
  const { isDark, accentColor } = useThemePalette();

  const textColor = isDark ? '#FFFFFF' : '#1F2937';
  const subText = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? '#262C3A' : '#F0F0F0';
  const headerBg = isDark ? '#181A20' : '#F5F6FA';
  const iconBg = isDark ? '#262C3A' : '#EAEAEA';

  return (
    <View style={{ flex: 1 }}>
      {/* Count + sort info */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingVertical: 10,
          backgroundColor: headerBg,
        }}
      >
        <Text style={{ flex: 1, fontSize: 13, color: subText }}>
          <Text style={{ fontWeight: '700', color: textColor }}>
            {MOCK_STORES.length} stores
          </Text>{' '}
          within 5 km
        </Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              backgroundColor: accentColor + '25',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="format-list-bulleted" size={16} color={accentColor} />
          </TouchableOpacity>

          <TouchableOpacity
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              backgroundColor: iconBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="map-outline" size={16} color={subText} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Map */}
        <MapView isDark={isDark} accentColor={accentColor} />

        {/* Store cards */}
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
      </ScrollView>
    </View>
  );
};
