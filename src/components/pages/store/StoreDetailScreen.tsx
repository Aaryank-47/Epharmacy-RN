import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  TextInput,
  Platform,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import useThemePalette from '../../../hooks/useThemePalette';
import { StoreProduct } from '../../../api/types';
import { getMedicinesByStore, getStoreReviewStats } from '../../../api/storeApi';
import { toHumanReadableError } from '../../../utils/errorHandler';

const { width } = Dimensions.get('window');

// ============================================================================
// ROUTE AND PROPS TYPES
// ============================================================================

type StoreDetailRouteProp = RouteProp<
  { StoreDetailScreen: { storeId: string; storeName?: string; storeImage?: string } },
  'StoreDetailScreen'
>;

const StoreDetailScreen: React.FC = () => {
  const { isDark, serifFontFamily } = useThemePalette();
  const navigation = useNavigation();
  const route = useRoute<StoreDetailRouteProp>();

  const { storeId, storeName = 'Store', storeImage: defaultImage } = route.params || {};

  // ============================================================================
  // STATES
  // ============================================================================

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [items, setItems] = useState<StoreProduct[]>([]);
  const [filteredItems, setFilteredItems] = useState<StoreProduct[]>([]);
  const [categories, _setCategories] = useState<string[]>(['All', 'Medicines', 'Baby Care', 'Skin Care', 'Supplements']);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewStats, setReviewStats] = useState<any>(null);

  const themeBgColor = isDark ? '#1A1A1A' : '#F8F9FA';

  // ============================================================================
  // API CALLS
  // ============================================================================

  /**
   * Fetch store items and details
   */
  const fetchStoreItems = useCallback(async (showRefresh = false) => {
    try {
      if (!showRefresh) {
        setIsLoading(true);
      }
      setError(null);

      if (!storeId) {
        throw new Error('Store ID is missing');
      }

      // Fetch items
      const itemsResponse = await getMedicinesByStore(storeId, {
        limit: 50,
        page: 1,
      });

      if (itemsResponse.success && itemsResponse.data?.items) {
        setItems(itemsResponse.data.items);
        setFilteredItems(itemsResponse.data.items);
      }

      // Fetch review stats
      try {
        const statsResponse = await getStoreReviewStats(storeId);
        if (statsResponse.success) {
          setReviewStats(statsResponse.data);
        }
      } catch (err) {
        console.warn('[StoreDetail] Could not fetch review stats:', err);
      }
    } catch (err: any) {
      console.error('[StoreDetailScreen] Fetch error:', err);
      setError(err.userMessage || toHumanReadableError(err) || 'Failed to load store items');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [storeId]);

  /**
   * Load items on mount
   */
  useEffect(() => {
    fetchStoreItems();
  }, [fetchStoreItems]);

  /**
   * Handle search and filter
   */
  useEffect(() => {
    let filtered = [...items];

    // Apply category filter
    if (activeCategory !== 'All') {
      // In a real app, you'd filter by actual category field
      // For now, we'll just keep all items visible
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name?.toLowerCase().includes(searchLower) ||
        item.brand?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredItems(filtered);
  }, [searchQuery, activeCategory, items]);

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchStoreItems(true);
  }, [fetchStoreItems]);

  // ============================================================================
  // RENDERING FUNCTIONS
  // ============================================================================

  const ProductCard = useCallback(({ item }: { item: StoreProduct }) => (
    <View
      style={{ width: (width - 48) / 2 }}
      className={`rounded-2xl p-3 mb-4 border shadow-sm elevation-2 ${
        isDark ? 'bg-[#2A2A2A] border-[#3A3A3A] shadow-black/10' : 'bg-white border-[#E5E7EB] shadow-black/5'
      }`}
    >
      <View className="h-24 mb-3 relative">
        <Image
          source={{ uri: item.imageUrl }}
          className="w-full h-full rounded-xl"
          resizeMode="cover"
        />
        {item.discountBadge && (
          <View className="absolute top-1 left-1 bg-[#EF4444] px-1.5 py-0.5 rounded-md">
            <Text className="text-white text-[10px] font-bold">{item.discountBadge}</Text>
          </View>
        )}
      </View>

      {item.brand && (
        <Text
          className={`text-[11px] mb-0.5 ${
            isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'
          }`}
        >
          {item.brand}
        </Text>
      )}

      <Text
        numberOfLines={2}
        style={{ fontFamily: serifFontFamily }}
        className={`text-sm font-semibold mb-1 h-10 ${
          isDark ? 'text-white' : 'text-[#1F2937]'
        }`}
      >
        {item.name}
      </Text>

      <View className="flex-row items-center mb-1">
        <Text
          className={`text-base font-bold mr-1.5 ${
            isDark ? 'text-white' : 'text-[#1F2937]'
          }`}
        >
          ₹{item.price}
        </Text>
        {item.originalPrice && (
          <Text
            className={`text-xs line-through ${
              isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'
            }`}
          >
            ₹{item.originalPrice}
          </Text>
        )}
      </View>

      <Text
        className={`text-[11px] font-semibold mb-2.5 ${
          item.inStock ? 'text-[#10B981]' : 'text-[#EF4444]'
        }`}
      >
        {item.inStock ? 'In Stock' : 'Out of Stock'}
      </Text>

      {/* Add To Cart Button */}
      <TouchableOpacity
        disabled={!item.inStock}
        onPress={() => {
          if (item.inStock) {
            setCartCount((prev) => prev + 1);
            setCartTotal((prev) => prev + item.price);
          }
        }}
        className={`py-2 rounded-lg items-center ${
          item.inStock ? 'bg-[#10B981]' : isDark ? 'bg-[#3A3A3A]' : 'bg-[#F3F4F6]'
        }`}
      >
        <Text
          className={`text-[13px] font-bold ${
            item.inStock ? 'text-white' : 'text-[#9CA3AF]'
          }`}
        >
          {item.inStock ? 'ADD' : 'UNAVAILABLE'}
        </Text>
      </TouchableOpacity>
    </View>
  ), [isDark, serifFontFamily]);

  const ListHeader = useMemo(() => (
    <View className="pb-4">
      {/* 1. Store Image & Floating Back Button */}
      <View className="relative w-full h-52">
        <Image
          source={{ uri: defaultImage || 'https://images.unsplash.com/photo-1586015555751-63bb77f4322a?w=800&q=80' }}
          className="w-full h-full"
          resizeMode="cover"
        />
        {/* Dark Gradient Overlay for text readability */}
        <View className="absolute bottom-0 left-0 right-0 h-20 bg-black/40" />

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className={`absolute left-4 p-2 rounded-full ${
            Platform.OS === 'android' ? 'top-4' : 'top-12'
          } bg-white/90`}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1F2937" />
        </TouchableOpacity>

        {/* Title inside the image */}
        <View className="absolute bottom-4 left-4 right-4">
          <Text
            style={{ fontFamily: serifFontFamily }}
            className="text-white text-2xl font-bold"
          >
            {storeName}
          </Text>
        </View>
      </View>

      {/* 2. Store Details Area */}
      <View
        className={`p-4 border-b mb-4 ${
          isDark
            ? 'bg-[#2A2A2A] border-[#3A3A3A]'
            : 'bg-white border-[#E5E7EB]'
        }`}
      >
        <View className="flex-row items-center mb-3">
          <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
          <Text
            className={`text-sm font-semibold ml-1 ${
              isDark ? 'text-white' : 'text-[#1F2937]'
            }`}
          >
            {typeof reviewStats?.averageRating === 'number' ? reviewStats.averageRating.toFixed(1) : '4.8'} (
            {reviewStats?.totalReviews || 0} Reviews)
          </Text>
          <Text
            className={`text-[13px] ml-2 ${
              isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'
            }`}
          >
            • 0.8 km • 15 mins delivery
          </Text>
        </View>

        <View className="flex-row mb-2 items-start">
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={18}
            color={isDark ? '#9CA3AF' : '#6B7280'}
          />
          <View className="ml-2 flex-1">
            <Text
              className={`text-sm ${
                isDark ? 'text-white' : 'text-[#1F2937]'
              }`}
            >
              123 Health Ave, Wellness District
            </Text>
            <Text
              className={`text-[13px] mt-0.5 ${
                isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'
              }`}
            >
              Pune, Maharashtra 411014
            </Text>
          </View>
        </View>

        <View className="flex-row mb-2 items-center">
          <MaterialCommunityIcons
            name="clock-outline"
            size={18}
            color={isDark ? '#9CA3AF' : '#6B7280'}
          />
          <Text
            className={`text-sm ml-2 ${
              isDark ? 'text-white' : 'text-[#1F2937]'
            }`}
          >
            Open Mon-Sun: 8:00 AM - 11:00 PM
          </Text>
          <View className="ml-3 bg-[#10B981] px-1.5 py-0.5 rounded">
            <Text className="text-white text-[10px] font-bold">OPEN NOW</Text>
          </View>
        </View>

        <View className="flex-row items-center mb-2">
          <MaterialCommunityIcons
            name="phone-outline"
            size={18}
            color={isDark ? '#9CA3AF' : '#6B7280'}
          />
          <Text
            className={`text-sm ml-2 ${
              isDark ? 'text-white' : 'text-[#1F2937]'
            }`}
          >
            +91 98765 43210
          </Text>
        </View>
      </View>

      {/* 3. Search Bar */}
      <View className="px-4 pb-4">
        <View
          className={`flex-row items-center rounded-xl px-3 h-12 border ${
            isDark
              ? 'bg-[#2A2A2A] border-[#3A3A3A]'
              : 'bg-white border-[#E5E7EB]'
          }`}
        >
          <MaterialCommunityIcons name="magnify" size={24} color="#9CA3AF" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search medicines in this store"
            placeholderTextColor="#9CA3AF"
            className={`flex-1 ml-2 text-[15px] ${
              isDark ? 'text-white' : 'text-[#1F2937]'
            }`}
          />
          {searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons
                name="close-circle"
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 4. Categories */}
      <FlatList
        data={categories}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingBottom: 16 }}
        keyExtractor={(item) => item}
        renderItem={({ item }) => {
          const isActive = activeCategory === item;
          return (
            <TouchableOpacity
              onPress={() => setActiveCategory(item)}
              className={`px-4 py-2 rounded-full border ${
                isActive
                  ? 'bg-[#10B981] border-[#10B981]'
                  : isDark
                  ? 'bg-[#2A2A2A] border-[#3A3A3A]'
                  : 'bg-white border-[#E5E7EB]'
              }`}
            >
              <Text
                className={`text-[13px] ${
                  isActive
                    ? 'text-white font-bold'
                    : isDark
                    ? 'text-white font-medium'
                    : 'text-[#1F2937] font-medium'
                }`}
              >
                {item}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <View className="px-4 mb-3">
        <Text
          style={{ fontFamily: serifFontFamily }}
          className={`text-lg font-bold ${
            isDark ? 'text-white' : 'text-[#1F2937]'
          }`}
        >
          {filteredItems.length > 0
            ? `Explore Products (${filteredItems.length})`
            : 'Explore Products'}
        </Text>
      </View>
    </View>
  ), [
    activeCategory,
    searchQuery,
    isDark,
    serifFontFamily,
    navigation,
    storeName,
    defaultImage,
    categories,
    filteredItems.length,
    reviewStats,
  ]);

  // ============================================================================
  // ERROR AND LOADING STATES
  // ============================================================================

  const ErrorState = () => (
    <View className="flex-1 items-center justify-center px-6">
      <View
        className={`rounded-2xl p-6 mb-6 items-center border-2 ${
          isDark
            ? 'bg-[#2A2A2A] border-[#7F1D1D]'
            : 'bg-white border-[#FCA5A5]'
        }`}
      >
        <MaterialCommunityIcons
          name="alert-circle"
          size={64}
          color={isDark ? '#FCA5A5' : '#DC2626'}
          style={{ marginBottom: 16 }}
        />
        <Text
          style={{ fontFamily: serifFontFamily }}
          className={`text-lg font-bold text-center mb-2 ${
            isDark ? 'text-white' : 'text-[#1F2937]'
          }`}
        >
          Couldn't Load Items
        </Text>
        <Text
          className={`text-sm text-center mb-6 ${
            isDark ? 'text-[#D1D5DB]' : 'text-[#6B7280]'
          }`}
        >
          {error}
        </Text>

        <TouchableOpacity
          onPress={handleRefresh}
          className="bg-[#10B981] px-6 py-3 rounded-lg flex-row items-center"
        >
          <MaterialCommunityIcons name="refresh" size={18} color="#FFFFFF" />
          <Text className="text-white font-semibold ml-2">Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const LoadingState = () => (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color="#10B981" style={{ marginBottom: 16 }} />
      <Text
        className={`text-sm ${isDark ? 'text-[#D1D5DB]' : 'text-[#6B7280]'}`}
      >
        Loading items...
      </Text>
    </View>
  );

  const EmptyState = () => (
    <View className="flex-1 items-center justify-center px-6">
      <MaterialCommunityIcons
        name="package-variant-closed"
        size={80}
        color={isDark ? '#6B7280' : '#D1D5DB'}
        style={{ marginBottom: 16 }}
      />
      <Text
        style={{ fontFamily: serifFontFamily }}
        className={`text-lg font-bold text-center mb-2 ${
          isDark ? 'text-white' : 'text-[#1F2937]'
        }`}
      >
        No Items Found
      </Text>
      <Text
        className={`text-sm text-center ${
          isDark ? 'text-[#D1D5DB]' : 'text-[#6B7280]'
        }`}
      >
        {searchQuery
          ? 'Try adjusting your search query'
          : 'This store has no items available'}
      </Text>
    </View>
  );

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#1A1A1A]' : 'bg-[#F8F9FA]'}`}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />

      {/* MAIN CONTENT */}
      {isLoading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState />
      ) : filteredItems.length === 0 ? (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={EmptyState}
          showsVerticalScrollIndicator={false}
          bounces={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#10B981"
              colors={['#10B981']}
            />
          }
        />
      ) : (
        <FlatList
          data={filteredItems}
          numColumns={2}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ProductCard item={item} />}
          columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
          ListHeaderComponent={ListHeader}
          ListFooterComponent={<View className="h-20" />}
          showsVerticalScrollIndicator={false}
          bounces={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#10B981"
              colors={['#10B981']}
            />
          }
        />
      )}

      {/* Sticky Cart Bar */}
      {cartCount > 0 && (
        <View
          className={`absolute left-4 right-4 bg-[#10B981] rounded-xl p-4 flex-row justify-between items-center shadow-lg elevation-6 ${
            Platform.OS === 'ios' ? 'bottom-8' : 'bottom-4'
          }`}
        >
          <View>
            <Text className="text-white text-[13px] font-semibold">
              {cartCount} Items
            </Text>
            <Text className="text-white text-base font-bold">
              Total: ₹{cartTotal}
            </Text>
          </View>
          <TouchableOpacity className="flex-row items-center">
            <Text className="text-white text-base font-bold mr-1">View Cart</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default StoreDetailScreen;
