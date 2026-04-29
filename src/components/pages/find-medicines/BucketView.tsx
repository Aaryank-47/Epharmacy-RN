import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemePalette } from '../../../hooks/useThemePalette';
import type { BucketItem } from '../../../hooks/usePrescriptionOCR';

interface Props {
  bucketItems: BucketItem[];
  selectedDelivery: 'pickup' | 'delivery';
  setSelectedDelivery: (v: 'pickup' | 'delivery') => void;
  onUpdateQuantity: (index: number, delta: number) => void;
  onRemove: (index: number) => void;
  onProceed: () => void;
  bucketTotal: number;
}

const MEDICINE_COLORS = ['#6C63FF', '#E91E63', '#FF9800', '#00BCD4', '#4CAF50', '#9C27B0'];

export const BucketView: React.FC<Props> = ({
  bucketItems,
  selectedDelivery,
  setSelectedDelivery,
  onUpdateQuantity,
  onRemove,
  onProceed,
  bucketTotal,
}) => {
  const { isDark, accentColor } = useThemePalette();
  const nearestShop = useMemo(() => ({ name: 'LifeCare Pharmacy', distance: 1.2 }), []);

  const textColor = isDark ? '#FFFFFF' : '#1F2937';
  const subText = isDark ? '#9CA3AF' : '#6B7280';
  const cardBg = isDark ? '#1C1F28' : '#FFFFFF';
  const borderColor = isDark ? '#2A2D35' : '#F0F0F0';
  const sectionBg = isDark ? '#13151C' : '#F9FAFB';
  const sectionLabel = isDark ? '#6B7280' : '#9CA3AF';

  if (bucketItems.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            backgroundColor: accentColor + '18',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Icon name="basket-outline" size={34} color={accentColor} />
        </View>
        <Text style={{ fontSize: 18, fontWeight: '700', color: textColor, marginBottom: 8 }}>
          Bucket is Empty
        </Text>
        <Text
          style={{ fontSize: 13, color: subText, textAlign: 'center', lineHeight: 20 }}
        >
          Add medicines from the Medicines tab to proceed to checkout
        </Text>
      </View>
    );
  }

  const shopInitials = nearestShop?.name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() ?? 'LC';

  const estMinutes = nearestShop ? Math.ceil(nearestShop.distance * 5 + 3) : 8;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Selected pharmacy */}
        <View
          style={{
            backgroundColor: cardBg,
            borderRadius: 16,
            borderWidth: 1,
            borderColor,
            padding: 14,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              backgroundColor: '#6C63FF',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#FFF', fontWeight: '800', fontSize: 14 }}>{shopInitials}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: textColor, marginBottom: 3 }}>
              {nearestShop?.name ?? 'LifeCare Pharmacy'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="map-marker-outline" size={12} color={subText} />
              <Text style={{ fontSize: 12, color: subText }}>
                {nearestShop?.distance.toFixed(1) ?? '1.2'} km · ready in {estMinutes} min
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() =>
              Alert.alert('Change Pharmacy', 'Switch to a different pharmacy?', [
                { text: 'Cancel', style: 'cancel' },
              ])
            }
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              backgroundColor: '#EF444415',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="delete-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Medicine items */}
        {bucketItems.map((item, index) => {
          const color = MEDICINE_COLORS[index % MEDICINE_COLORS.length];
          return (
            <View
              key={`bucket_${item.medicine.drugName}_${index}`}
              style={{
                backgroundColor: cardBg,
                borderRadius: 14,
                borderWidth: 1,
                borderColor,
                padding: 12,
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              {/* Medicine icon */}
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: color + '20',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="pill" size={20} color={color} />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: textColor,
                    marginBottom: 3,
                  }}
                >
                  {item.medicine.drugName}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {item.medicine.dosage !== 'Not specified' && (
                    <Text style={{ fontSize: 11, color: subText }}>{item.medicine.dosage}</Text>
                  )}
                  <View
                    style={{
                      backgroundColor: '#6C63FF18',
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 5,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: '800',
                        color: '#6C63FF',
                        letterSpacing: 0.3,
                      }}
                    >
                      PRESCRIBED
                    </Text>
                  </View>
                </View>
              </View>

              {/* Qty controls */}
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: accentColor }}>
                  ₹{item.medicine.price * item.quantity}
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: isDark ? '#2A2D35' : '#F3F4F6',
                    borderRadius: 10,
                    overflow: 'hidden',
                  }}
                >
                  <TouchableOpacity
                    onPress={() => onUpdateQuantity(index, -1)}
                    style={{
                      width: 30,
                      height: 28,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="minus" size={14} color={textColor} />
                  </TouchableOpacity>
                  <Text
                    style={{
                      minWidth: 24,
                      textAlign: 'center',
                      fontSize: 14,
                      fontWeight: '700',
                      color: textColor,
                    }}
                  >
                    {item.quantity}
                  </Text>
                  <TouchableOpacity
                    onPress={() => onUpdateQuantity(index, 1)}
                    style={{
                      width: 30,
                      height: 28,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="plus" size={14} color={accentColor} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}

        {/* Delivery method */}
        <View style={{ marginTop: 8 }}>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '800',
              color: sectionLabel,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 10,
            }}
          >
            Delivery Method
          </Text>

          <TouchableOpacity
            onPress={() => setSelectedDelivery('pickup')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor:
                selectedDelivery === 'pickup'
                  ? accentColor + '15'
                  : cardBg,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor:
                selectedDelivery === 'pickup' ? accentColor : borderColor,
              padding: 14,
              marginBottom: 8,
              gap: 12,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor:
                  selectedDelivery === 'pickup'
                    ? accentColor + '20'
                    : (isDark ? '#2A2D35' : '#F3F4F6'),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon
                name="store-outline"
                size={18}
                color={selectedDelivery === 'pickup' ? accentColor : subText}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: textColor,
                  marginBottom: 2,
                }}
              >
                Self pickup
              </Text>
              <Text style={{ fontSize: 12, color: subText }}>
                Ready in {estMinutes} min
              </Text>
            </View>
            <View
              style={{
                backgroundColor: '#10B98120',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '800',
                  color: '#10B981',
                }}
              >
                FREE
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedDelivery('delivery')}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor:
                selectedDelivery === 'delivery'
                  ? accentColor + '15'
                  : cardBg,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor:
                selectedDelivery === 'delivery' ? accentColor : borderColor,
              padding: 14,
              gap: 12,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor:
                  selectedDelivery === 'delivery'
                    ? accentColor + '20'
                    : (isDark ? '#2A2D35' : '#F3F4F6'),
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon
                name="truck-delivery-outline"
                size={18}
                color={selectedDelivery === 'delivery' ? accentColor : subText}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '700',
                  color: textColor,
                  marginBottom: 2,
                }}
              >
                Standard delivery
              </Text>
              <Text style={{ fontSize: 12, color: subText }}>In 45 min</Text>
            </View>
            <View
              style={{
                backgroundColor: '#10B98120',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#10B981' }}>FREE</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: isDark ? '#1C1F28' : '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: borderColor,
          padding: 14,
        }}
      >
        <TouchableOpacity
          onPress={onProceed}
          style={{
            backgroundColor: accentColor,
            borderRadius: 16,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            shadowColor: accentColor,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 6,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontWeight: '800',
              color: '#FFF',
              letterSpacing: 1.2,
              textTransform: 'uppercase',
            }}
          >
            Proceed to Order
          </Text>
          <Icon name="chevron-right" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};
