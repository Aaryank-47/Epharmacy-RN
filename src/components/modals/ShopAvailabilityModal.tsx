/**
 * Shop Availability Modal Component
 * Displays all shops where a specific medicine is available with details
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemePalette } from '../../hooks/useThemePalette';
import { Shop, findShopsWithMedicine } from '../../data/shopData';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface ShopAvailabilityModalProps {
  visible: boolean;
  medicineName: string;
  onClose: () => void;
}

const ShopAvailabilityModal: React.FC<ShopAvailabilityModalProps> = ({
  visible,
  medicineName,
  onClose,
}) => {
  const { isDark, accentColor, surfaceColor } = useThemePalette();
  const [availableShops, setAvailableShops] = useState<Shop[]>([]);
  const [expandedShopId, setExpandedShopId] = useState<string | null>(null);

  // Define text and border colors based on theme
  const textColor = isDark ? '#FFFFFF' : '#1F2937';
  const secondaryTextColor = isDark ? '#9CA3AF' : '#6B7280';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

  React.useEffect(() => {
    if (visible && medicineName) {
      // Search shops immediately (hardcoded data, no API call needed)
      const shops = findShopsWithMedicine(medicineName);
      setAvailableShops(shops);
      setExpandedShopId(null); // Reset expanded state on new search
    }
  }, [visible, medicineName]);

  const toggleExpand = (shopId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedShopId(expandedShopId === shopId ? null : shopId);
  };

  const handleCallShop = (phoneNumber: string) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleGetDirections = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const handleEmailShop = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const getMedicinePrice = (shop: Shop) => {
    const medicine = shop.availableMedicines.find(m =>
      m.name.toLowerCase().includes(medicineName.toLowerCase())
    );
    return medicine ? medicine.price : null;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: isDark ? '#000a' : '#0001',
          justifyContent: 'flex-end',
        }}
      >
        <View
          style={{
            backgroundColor: surfaceColor,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: '90%',
            paddingTop: 20,
            flex: 1,
          }}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingBottom: 15,
              borderBottomWidth: 1,
              borderBottomColor: borderColor,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: textColor,
                  marginBottom: 5,
                }}
              >
                {medicineName}
              </Text>
              <Text style={{ fontSize: 12, color: secondaryTextColor, fontWeight: '500' }}>
                Available in {availableShops.length} shops in Raipur
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
              <Icon name="close" size={24} color={textColor} />
            </TouchableOpacity>
          </View>

          {/* Shop List - Show immediately */}
          {availableShops.length === 0 ? (
            <View style={{ flex: 1, padding: 40, justifyContent: 'center', alignItems: 'center' }}>
              <Icon name="alert-circle" size={50} color={accentColor} />
              <Text style={{ color: textColor, marginTop: 15, fontSize: 18, fontWeight: '700' }}>
                No Shops Found
              </Text>
              <Text
                style={{
                  color: secondaryTextColor,
                  marginTop: 8,
                  textAlign: 'center',
                  fontSize: 13,
                }}
              >
                This medicine is not available in our partner shops right now.
              </Text>
            </View>
          ) : (
            <ScrollView
              style={{ flex: 1, paddingHorizontal: 0 }}
              contentContainerStyle={{ paddingBottom: 20 }}
              showsVerticalScrollIndicator={false}
            >
              {availableShops.map((shop, index) => {
                const isExpanded = expandedShopId === shop.id;
                const price = getMedicinePrice(shop);

                return (
                  <View key={shop.id} style={{ borderBottomWidth: 1, borderBottomColor: borderColor }}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => toggleExpand(shop.id)}
                      style={{
                        paddingHorizontal: 20,
                        paddingVertical: 15,
                        backgroundColor: isDark ? '#1a1a1a' : '#f9f9f9',
                      }}
                    >
                      {/* Shop Name & Price Header */}
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <View style={{ flex: 1, paddingRight: 10 }}>
                          <Text
                            style={{
                              fontSize: 16,
                              fontWeight: '700',
                              color: textColor,
                              marginBottom: 4,
                            }}
                          >
                            {index + 1}. {shop.name}
                          </Text>


                        </View>

                        <View style={{ alignItems: 'flex-end' }}>
                          {price !== null && (
                            <Text
                              style={{
                                fontSize: 16,
                                fontWeight: '800',
                                color: accentColor,
                                marginBottom: 4,
                              }}
                            >
                              ₹{price}
                            </Text>
                          )}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <View
                              style={{
                                backgroundColor: shop.isOpen ? '#4CAF5020' : '#FF573320',
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 6,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 10,
                                  fontWeight: '700',
                                  color: shop.isOpen ? '#4CAF50' : '#FF5733',
                                }}
                              >
                                {shop.isOpen ? 'OPEN' : 'CLOSED'}
                              </Text>
                            </View>
                            <Icon
                              name={isExpanded ? 'chevron-up' : 'chevron-down'}
                              size={24}
                              color={secondaryTextColor}
                            />
                          </View>

                        </View>
                      </View>
                    </TouchableOpacity>

                    {/* Expandable Details Section */}
                    {isExpanded && (
                      <View
                        style={{
                          paddingHorizontal: 20,
                          paddingBottom: 20,
                          backgroundColor: isDark ? '#1a1a1a' : '#f9f9f9',
                        }}
                      >
                        <View
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: accentColor + '20',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12,
                            alignSelf: 'flex-start',
                            marginBottom: 10,
                          }}
                        >
                          <Icon name="map-marker" size={12} color={accentColor} />
                          <Text
                            style={{
                              fontSize: 11,
                              color: accentColor,
                              fontWeight: '600',
                              marginLeft: 4,
                            }}
                          >
                            {shop.distance.toFixed(1)} km away
                          </Text>
                        </View>
                        {/* Address */}
                        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                          <Icon name="home-outline" size={14} color={accentColor} />
                          <Text
                            style={{
                              fontSize: 12,
                              color: textColor,
                              marginLeft: 8,
                              flex: 1,
                              fontWeight: '500',
                            }}
                          >
                            {shop.address}
                          </Text>
                        </View>

                        {/* Timings */}
                        <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                          <Icon name="clock-outline" size={14} color={accentColor} />
                          <Text
                            style={{
                              fontSize: 12,
                              color: textColor,
                              marginLeft: 8,
                              fontWeight: '500',
                            }}
                          >
                            {shop.openTime} - {shop.closeTime}
                          </Text>
                        </View>

                        {/* Contact Details */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                          <Icon name="phone-outline" size={14} color={accentColor} />
                          <Text
                            style={{
                              fontSize: 12,
                              color: accentColor,
                              marginLeft: 8,
                              fontWeight: '600',
                            }}
                          >
                            {shop.contactNumber}
                          </Text>
                        </View>

                        {/* Available Medicines Count */}
                        <View
                          style={{
                            backgroundColor: accentColor + '15',
                            paddingHorizontal: 10,
                            paddingVertical: 8,
                            borderRadius: 8,
                            marginBottom: 12,
                          }}
                        >
                          <Text style={{ fontSize: 11, color: accentColor, fontWeight: '600' }}>
                            📦 {shop.availableMedicines.length} medicines available
                          </Text>
                        </View>

                        {/* Email */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                          <Icon name="email-outline" size={14} color={accentColor} />
                          <Text
                            style={{
                              fontSize: 12,
                              color: accentColor,
                              marginLeft: 8,
                              fontWeight: '600',
                            }}
                          >
                            {shop.email}
                          </Text>
                        </View>

                        {/* Action Buttons */}
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            gap: 10,
                          }}
                        >
                          <TouchableOpacity
                            onPress={() => handleCallShop(shop.contactNumber)}
                            style={{
                              flex: 1,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: accentColor,
                              paddingVertical: 10,
                              borderRadius: 8,
                              gap: 6,
                            }}
                          >
                            <Icon name="phone" size={14} color="#fff" />
                            <Text style={{ fontSize: 12, color: '#fff', fontWeight: '600' }}>
                              Call
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleGetDirections(shop.latitude, shop.longitude)}
                            style={{
                              flex: 1,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: accentColor + '30',
                              paddingVertical: 10,
                              borderRadius: 8,
                              gap: 6,
                              borderWidth: 1,
                              borderColor: accentColor,
                            }}
                          >
                            <Icon name="directions" size={14} color={accentColor} />
                            <Text style={{ fontSize: 12, color: accentColor, fontWeight: '600' }}>
                              Map
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            onPress={() => handleEmailShop(shop.email)}
                            style={{
                              flex: 1,
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: accentColor + '20',
                              paddingVertical: 10,
                              borderRadius: 8,
                              gap: 6,
                            }}
                          >
                            <Icon name="email-outline" size={14} color={accentColor} />
                            <Text style={{ fontSize: 12, color: accentColor, fontWeight: '600' }}>
                              Email
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default ShopAvailabilityModal;
