import React, { useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StatusBar } from 'react-native';
import Tabs from '../commonPage/Tab';
import { useNavigation } from '@react-navigation/native';
import { useCart } from '../../context/CartContext';
import { useThemePalette } from '../../hooks/useThemePalette';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';

const ShoppingBagScreen: React.FC = () => {
  const navigation = useNavigation();
  const { items, removeFromCart, updateQuantity, getCartTotal } = useCart();
  const { isDark, accentColor } = useThemePalette();
  const [selectedItems, setSelectedItems] = React.useState<string[]>([]);
  const insets = useSafeAreaInsets();

  // Tab Bar & Layout Calculation
  const isGestureNav = insets.bottom > 20;
  const TAB_BAR_HEIGHT = isGestureNav ? 70 : 60; // Approximate tab bar height
  const CHECKOUT_BAR_HEIGHT = 100;
  const BOTTOM_PADDING = TAB_BAR_HEIGHT + CHECKOUT_BAR_HEIGHT + (isGestureNav ? 0 : 20);

  // --- Handlers ---

  const toggleSelection = useCallback((id: string) => {
    setSelectedItems(prev => {
      if (prev.includes(id)) return prev.filter(item => item !== id);
      return [...prev, id];
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(i => i.id));
    }
  }, [items, selectedItems]);

  const handleCheckout = useCallback(() => {
    // Navigate to checkout logic here
    // For now just show alert or log
    console.log("Proceeding to checkout with", selectedItems.length > 0 ? selectedItems : "all items");
  }, [selectedItems]);

  // --- Calculations ---

  const subtotal = useMemo(() => {
    const targetItems = selectedItems.length > 0
      ? items.filter(i => selectedItems.includes(i.id))
      : items;
    return targetItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [items, selectedItems]);

  const savings = useMemo(() => {
    // Mock savings calculation (e.g. 10-15% discount for demo)
    return Math.floor(subtotal * 0.12);
  }, [subtotal]);

  const deliveryFee = subtotal > 500 ? 0 : 40;
  const finalTotal = subtotal + deliveryFee;

  // --- UI Components ---

  const renderCartItem = useCallback(({ item }: { item: any }) => {
    const isSelected = selectedItems.includes(item.id);

    return (
      <View
        className={`mb-4 rounded-2xl p-3 flex-row items-center border-[0.5px] ${isDark ? 'bg-[#1E2028] border-gray-700' : 'bg-white border-gray-100'}`}
        style={{
          shadowColor: isDark ? '#000' : '#888',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.3 : 0.08,
          shadowRadius: 12,
          elevation: 4
        }}
      >
        {/* Checkbox */}
        <TouchableOpacity
          onPress={() => toggleSelection(item.id)}
          className="p-2 mr-1"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isSelected ? "checkbox" : "square-outline"}
            size={22}
            color={isSelected ? accentColor : (isDark ? '#6B7280' : '#D1D5DB')}
          />
        </TouchableOpacity>

        {/* Image */}
        <TouchableOpacity
          onPress={() => (navigation as any).navigate('ProductDetail', { productId: item.id })}
          className={`w-20 h-20 rounded-xl mr-3 justify-center items-center overflow-hidden ${isDark ? 'bg-[#2A2D35]' : 'bg-gray-50'}`}
        >
          {/* Replace with actual Image component if URL exists, fallback to Icon */}
          <Ionicons name="medkit-outline" size={32} color={isDark ? '#4B5563' : '#9CA3AF'} />
          {/* <Image source={{ uri: item.image }} className="w-full h-full" resizeMode="cover" /> */}
        </TouchableOpacity>

        {/* Details */}
        <View className="flex-1 justify-between h-20 py-1">
          <View>
            <Text
              numberOfLines={1}
              className={`text-base font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}
            >
              {item.name}
            </Text>
            <Text className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              100ml Bottle • 💊 Pill
            </Text>
          </View>

          <View className="flex-row justify-between items-end mt-2">
            <Text className={`text-lg font-extrabold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              ₹{item.price}
            </Text>

            {/* Quantity Control (Pill Shape) */}
            <View className={`flex-row items-center rounded-full px-1 ${isDark ? 'bg-[#2A2D35]' : 'bg-gray-100'}`}>
              <TouchableOpacity
                onPress={() => {
                  if (item.quantity > 1) updateQuantity(item.id, item.quantity - 1);
                  else removeFromCart(item.id);
                }}
                className="w-8 h-8 justify-center items-center"
              >
                <Ionicons name="remove" size={16} color={isDark ? '#FFF' : '#374151'} />
              </TouchableOpacity>

              <Text className={`font-bold mx-1 text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {item.quantity}
              </Text>

              <TouchableOpacity
                onPress={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-8 h-8 justify-center items-center"
              >
                <Ionicons name="add" size={16} color={isDark ? '#FFF' : '#374151'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }, [isDark, accentColor, selectedItems, navigation, updateQuantity, removeFromCart, toggleSelection]);

  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center px-8" style={{ marginTop: '40%' }}>
      <View className={`w-32 h-32 rounded-full justify-center items-center mb-6 ${isDark ? 'bg-[#1E2028]' : 'bg-gray-100'}`}>
        <Ionicons name="cart-outline" size={64} color={isDark ? '#4B5563' : '#9CA3AF'} />
      </View>
      <Text className={`text-2xl font-bold mb-2 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
        Your Bag is Empty
      </Text>
      <Text className={`text-center mb-8 leading-5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        Looks like you haven't made your choice yet. Browse our medicines and find what you need.
      </Text>
      <TouchableOpacity
        onPress={() => (navigation as any).navigate('Home')}
        className="w-full py-4 rounded-full shadow-lg items-center"
        style={{ backgroundColor: accentColor, shadowColor: accentColor, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 }}
      >
        <Text className="text-white font-bold text-lg">Start Shopping</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Tabs currentActiveTab="Cart" onNavigate={(screen) => navigation.navigate(screen as never)}>
      <View className={`flex-1 ${isDark ? 'bg-[#121212]' : 'bg-[#F9FAFB]'}`}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#121212' : '#F9FAFB'} />

        {/* Header */}
        <View className={`px-5 py-4 flex-row justify-between items-center ${isDark ? 'bg-[#121212]' : 'bg-[#F9FAFB]'}`}>
          <Text className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
            My Bag <Text className="text-2xl font-normal text-gray-400">({items.length})</Text>
          </Text>
          {items.length > 0 && (
            <TouchableOpacity onPress={selectAll}>
              <Text className={`text-sm font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {selectedItems.length === items.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {items.length === 0 ? (
          renderEmptyState()
        ) : (
          <>
            <FlatList
              data={items}
              keyExtractor={item => item.id}
              renderItem={renderCartItem}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: BOTTOM_PADDING + 20 }}
              showsVerticalScrollIndicator={false}
            />

            {/* Sticky Checkout Bar */}
            <LinearGradient
              colors={isDark ? ['transparent', '#121212', '#121212'] : ['rgba(255,255,255,0)', '#ffffff', '#ffffff']}
              locations={[0, 0.2, 1]}
              className="absolute bottom-0 left-0 right-0 px-5 pt-8 pb-4 z-50 justify-end"
              style={{ paddingBottom: TAB_BAR_HEIGHT + (isGestureNav ? 0 : 20) }}
            >
              <View className={`rounded-3xl p-5 ${isDark ? 'bg-[#1E2028]' : 'bg-white'}`}
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: isDark ? 0.3 : 0.1,
                  shadowRadius: 16,
                  elevation: 20
                }}
              >
                {/* Savings Tag */}
                {savings > 0 && (
                  <View className="bg-green-100 dark:bg-green-900/30 self-start px-3 py-1 rounded-lg mb-4 flex-row items-center">
                    <Ionicons name="pricetag" size={14} color="#16A34A" />
                    <Text className="text-green-600 dark:text-green-400 text-xs font-bold ml-1">
                      You are saving ₹{savings} on this order!
                    </Text>
                  </View>
                )}

                {/* Totals Row */}
                <View className="flex-row justify-between items-center mb-5">
                  <View>
                    <Text className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      Total Estimate
                    </Text>
                    <Text className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      ₹{finalTotal}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs text-gray-400 line-through">₹{subtotal + savings}</Text>
                    <Text className={`text-xs font-medium ${deliveryFee === 0 ? 'text-green-500' : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
                      {deliveryFee === 0 ? 'Free Delivery' : `+ ₹${deliveryFee} Delivery`}
                    </Text>
                  </View>
                </View>

                {/* Checkout Button */}
                <TouchableOpacity
                  onPress={handleCheckout}
                  activeOpacity={0.8}
                  className="w-full py-4 rounded-2xl flex-row justify-center items-center shadow-lg"
                  style={{ backgroundColor: accentColor, shadowColor: accentColor, shadowOpacity: 0.4, shadowRadius: 10, elevation: 6 }}
                >
                  <Text className="text-white font-bold text-lg mr-2">Proceed to Checkout</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </>
        )}
      </View>
    </Tabs>
  );
};

export default ShoppingBagScreen;
