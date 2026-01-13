import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BagItem {
  id: string;
  price: number;
  quantity: number;
}

// Calculate bag subtotal
export const calculateBagSubtotal = (items: BagItem[]): number => {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
};

// Count total items
export const countTotalItems = (items: BagItem[]): number => {
  return items.reduce((count, item) => count + item.quantity, 0);
};

// Check if bag is empty
export const isBagEmpty = (items: BagItem[]): boolean => {
  return items.length === 0;
};

// Get savings amount
export const calculateSavings = (originalTotal: number, currentTotal: number): number => {
  return Math.max(0, originalTotal - currentTotal);
};

import Tabs from '../commonPage/Tab';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../../context/CartContext';
import { useThemePalette } from '../../hooks/useThemePalette';
import { FlatList, TouchableOpacity, Image } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ShoppingBagScreen: React.FC = () => {
  const navigation = useNavigation();
  const { items, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const { isDark, surfaceColor, accentColor } = useThemePalette();
  const [selectedItems, setSelectedItems] = React.useState<string[]>([]);
  const insets = useSafeAreaInsets();

  // Calculate Tab Bar Height to position Checkout Bar above it
  const bottomInset = insets.bottom;
  const isGestureNav = bottomInset > 45;
  const TAB_CONTENT_HEIGHT = isGestureNav ? 20 : 69;
  const effectiveBottomPadding = isGestureNav ? bottomInset : 4;
  const tabBarHeight = TAB_CONTENT_HEIGHT + effectiveBottomPadding;

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const selectedTotal = items
    .filter(item => selectedItems.includes(item.id))
    .reduce((sum, item) => sum + item.price * item.quantity, 0);

  const totalAmount = getCartTotal();

  const renderCartItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => (navigation as any).navigate('ProductDetail', { productId: item.id })}
      style={{
        flexDirection: 'row',
        backgroundColor: isDark ? '#1E2028' : '#FFFFFF',
        borderRadius: 16,
        marginBottom: 16,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        alignItems: 'center', // Align checkbox
      }}>
      {/* Checkbox */}
      <TouchableOpacity
        onPress={() => toggleSelection(item.id)}
        style={{ padding: 8, marginRight: 4 }}
      >
        <Ionicons
          name={selectedItems.includes(item.id) ? "checkbox" : "square-outline"}
          size={24}
          color={selectedItems.includes(item.id) ? accentColor : (isDark ? '#4B5563' : '#9CA3AF')}
        />
      </TouchableOpacity>

      {/* Image Placeholder */}
      <View style={{
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: isDark ? '#2A2D35' : '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
      }}>
        <Ionicons name="medkit-outline" size={30} color={isDark ? '#4B5563' : '#9CA3AF'} />
      </View>

      {/* Details */}
      <View style={{ flex: 1, justifyContent: 'space-between' }}>
        <View>
          <Text style={{
            fontSize: 16,
            fontWeight: '700',
            color: isDark ? '#FFFFFF' : '#1F2937',
            marginBottom: 4,
          }} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={{
            fontSize: 14,
            fontWeight: '600',
            color: isDark ? '#9CA3AF' : '#6B7280',
          }}>
            ₹{item.price}
          </Text>
        </View>

        {/* Action Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          {/* Quantity Controls */}
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? '#2A2D35' : '#F3F4F6', borderRadius: 8 }}>
            <TouchableOpacity
              style={{ padding: 8 }}
              onPress={() => {
                if (item.quantity > 1) {
                  updateQuantity(item.id, item.quantity - 1);
                } else {
                  removeFromCart(item.id);
                }
              }}
            >
              <Ionicons name="remove" size={16} color={isDark ? '#FFF' : '#333'} />
            </TouchableOpacity>

            <Text style={{ fontWeight: '600', color: isDark ? '#FFF' : '#333', marginHorizontal: 8 }}>
              {item.quantity}
            </Text>

            <TouchableOpacity
              style={{ padding: 8 }}
              onPress={() => updateQuantity(item.id, item.quantity + 1)}
            >
              <Ionicons name="add" size={16} color={isDark ? '#FFF' : '#333'} />
            </TouchableOpacity>
          </View>

          {/* Delete Button */}
          <TouchableOpacity
            onPress={() => removeFromCart(item.id)}
            style={{
              padding: 8,
              backgroundColor: '#FFdede',
              borderRadius: 8,
            }}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <Tabs
      currentActiveTab="Cart"
      onNavigate={(screen) => navigation.navigate(screen as never)}
    >
      <View style={[styles.container, { backgroundColor: surfaceColor }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={[styles.title, { color: isDark ? '#FFF' : '#1F2937' }]}>Shopping Bag</Text>
          <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280' }}>
            {items.length} Items
          </Text>
        </View>

        {items.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="cart-outline" size={64} color={isDark ? '#374151' : '#E5E7EB'} />
            <Text style={{ marginTop: 16, fontSize: 16, color: isDark ? '#9CA3AF' : '#6B7280' }}>Your bag is empty</Text>
          </View>
        ) : (
          <>
            <FlatList
              data={items}
              keyExtractor={item => item.id}
              renderItem={renderCartItem}
              contentContainerStyle={{ paddingBottom: tabBarHeight + 100 }}
              showsVerticalScrollIndicator={false}
            />

            {/* Checkout Section */}
            <View style={{
              position: 'absolute',
              bottom: tabBarHeight - 5,
              left: 0,
              right: 0,
              backgroundColor: isDark ? '#1E2028' : '#FFFFFF',
              padding: 20,
              borderTopWidth: 1,
              borderTopColor: isDark ? '#2D3038' : '#F3F4F6',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 90, // Ensure it sits properly
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 4
            }}>
              <View>
                <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280', fontSize: 12, marginBottom: 4 }}>
                  {selectedItems.length > 0 ? 'Selected Total' : 'Total'}
                </Text>
                <Text style={{ color: isDark ? '#FFF' : '#1F2937', fontSize: 24, fontWeight: '800' }}>
                  ₹{selectedItems.length > 0 ? selectedTotal : totalAmount}
                </Text>
              </View>
              <TouchableOpacity style={{
                backgroundColor: selectedItems.length > 0 ? accentColor : (isDark ? '#374151' : '#E5E7EB'),
                paddingHorizontal: 32,
                paddingVertical: 14,
                borderRadius: 16,
                shadowColor: selectedItems.length > 0 ? accentColor : 'transparent',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4
              }}>
                <Text style={{ color: selectedItems.length > 0 ? '#FFF' : (isDark ? '#9CA3AF' : '#9CA3AF'), fontWeight: '700', fontSize: 16 }}>
                  {selectedItems.length > 0 ? `Buy Now (${selectedItems.length})` : 'Select Items'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Tabs>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingBottom: 80, // Space for checkout bar
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -1,
  },
});

export default ShoppingBagScreen;
