import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,

  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
  Keyboard,
  BackHandler,

} from 'react-native';
import { ScrollView, TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useTrendingProducts } from '../../hooks/useTrendingProducts';
import { useThemePalette } from '../../hooks/useThemePalette';
import type { RecentSearch } from '../../api/types';
import {
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
  deleteRecentSearch
} from '../../api/medicinesApi';

const { width } = Dimensions.get('window');
// Trending card: 2 cards visible per frame (Screen - 32px Padding - 12px Gap) / 2
const TRENDING_CARD_WIDTH = (width - 35) / 2;
const RECENT_ITEM_WIDTH = (width - 70) / 4; // Width - Padding(32) - Gaps(3x16)
const TRENDING_CARD_SPACING = 15;

// TrendingCarousel Component - Simple horizontal FlatList
interface TrendingCarouselProps {
  products: any[];
  renderItem: (props: { item: any }) => React.ReactElement;
  onProductPress: (item: any) => void;
}

const TrendingCarousel: React.FC<TrendingCarouselProps> = ({ products, renderItem }) => {
  const row2Ref = useRef<ScrollView>(null);

  // Split products: first 6 in row1, next 6 in row2
  const row1Data = useMemo(() => products.slice(0, 6), [products]);
  const row2Data = useMemo(() => products.slice(6, 12).length > 0 ? products.slice(6, 12) : products.slice(0, 6), [products]);

  // Scroll row 2 to end initially for right-to-left effect
  useEffect(() => {
    if (row2Data.length > 0) {
      setTimeout(() => {
        row2Ref.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [row2Data]);

  if (products.length === 0) return null;

  return (
    <View>
      {/* Row 1: Left to Right */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      >
        {row1Data.map((item, idx) => (
          <View key={`row1-${item._id || idx}`} style={{ marginRight: idx === row1Data.length - 1 ? 0 : TRENDING_CARD_SPACING }}>
            {renderItem({ item })}
          </View>
        ))}
      </ScrollView>

      {/* Row 2: Right to Left (Starts at end) */}
      {row2Data.length > 0 && (
        <ScrollView
          ref={row2Ref}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, marginTop: 12 }}
        >
          {row2Data.map((item, idx) => (
            <View key={`row2-${item._id || idx}`} style={{ marginRight: idx === row2Data.length - 1 ? 0 : TRENDING_CARD_SPACING }}>
              {renderItem({ item })}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const SearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark, accentColor, inputBg, textColor, placeholderColor } = useThemePalette();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isRecentLoading, setIsRecentLoading] = useState(true);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  // State for suggestions and API loading
  const { data: trendingProducts, isLoading: isTrendingLoading } = useTrendingProducts();

  // Unified page loading state
  const isPageLoading = isRecentLoading || isTrendingLoading;

  const fetchRecentSearches = async () => {
    try {
      setIsRecentLoading(true);
      const output = await getRecentSearches();
      if (output.success && output.data.searches) {
        setRecentSearches(output.data.searches);
      }
    } catch (error) {
      console.error("Failed to fetch recent searches", error);
    } finally {
      setIsRecentLoading(false);
    }
  };

  // Re-fetch when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchRecentSearches();
    }, [])
  );

  // Custom Debounce Hook or simple timeout
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        setIsLoadingSuggestions(false);
        return;
      }

      setIsLoadingSuggestions(true);
      try {
        const response = await import('../../api/medicinesApi').then(mod => mod.getSearchSuggestions(query));
        if (response.success && response.data.suggestions) {
          setSuggestions(response.data.suggestions);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions", error);
      } finally {
        setIsLoadingSuggestions(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchSuggestions();
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const [popularTerms, setPopularTerms] = useState<any[]>([]);
  const [isPopularLoading, setIsPopularLoading] = useState(true);

  useEffect(() => {
    // Fetch Popular Terms on Mount
    setIsPopularLoading(true);
    import('../../api/medicinesApi').then(mod => {
      mod.getPopularSearchTerms().then(res => {
        if (res.success && res.data.terms) {
          setPopularTerms(res.data.terms);
        }
      }).catch(err => console.error(err))
        .finally(() => setIsPopularLoading(false));
    });
  }, []);

  const handleClearAll = async () => {
    try {
      await clearRecentSearches();
      setRecentSearches([]);
    } catch (error) {
      console.error("Failed to clear recent searches", error);
    }
  };

  const handleDeleteRecentSearch = async (queryToDelete: string) => {
    try {
      await deleteRecentSearch(queryToDelete);
      // Optimistic update
      setRecentSearches(prev => prev.filter(item => item.query !== queryToDelete));
    } catch (error) {
      console.error("Failed to delete recent search", error);
    }
  };

  const handleTermPress = async (term: string) => {
    setQuery(term);
    await saveRecentSearch({
      query: term,
    });
    fetchRecentSearches();
  };

  const renderPopularTermItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="p-4 rounded-3xl border justify-center"
      style={{
        borderColor: isDark ? '#2D3038' : '#F3F4F6',
        minHeight: 60,
      }}
      onPress={() => handleTermPress(item.term)}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-bold flex-1 mr-2" numberOfLines={2} style={{ color: textColor }}>
          {item.term}
        </Text>
        <Icon name="timer-outline" size={18} color={accentColor} />
      </View>
    </TouchableOpacity>
  );

  const handleProductPress = async (item: any) => {
    // Save to recent searches
    saveRecentSearch({
      query: item.itemName || item.name,
      itemId: item._id || item.id,
      itemName: item.itemName || item.name,
      itemImage: item.image || (item.itemImages && item.itemImages[0])
    }).catch(err => console.error("Failed to save search", err));

    navigation.navigate('ProductDetail', { productId: item._id });
  };

  const handleSearchSubmit = async () => {
    if (query.trim().length >= 2) {
      await saveRecentSearch({
        query: query.trim(),
      });
      fetchRecentSearches();
      Keyboard.dismiss();
    }
  };

  const renderRecentSearchItem = ({ item }: { item: RecentSearch }) => {
    const displayText = item.itemName || item.query;
    const imageUrl = item.itemImage;

    return (
      <TouchableOpacity
        className="items-center"
        style={{ width: RECENT_ITEM_WIDTH }}
        activeOpacity={0.7}
        onPress={() => setQuery(displayText)}
        onLongPress={() => handleDeleteRecentSearch(item.query)}
      >
        <View
          className="w-full aspect-square rounded-3xl border p-2 justify-center items-center mb-1"
          style={{
            borderColor: isDark ? '#333' : '#E5E7EB',
            backgroundColor: isDark ? '#222' : '#F9FAFB'
          }}
        >
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} className="w-full h-full rounded-2xl" />
          ) : (
            <Icon name="time-outline" size={28} color={placeholderColor} />
          )}
        </View>
        <Text
          className="text-xs font-semibold text-center w-full leading-4"
          style={{ color: textColor }}
          numberOfLines={2}
        >
          {displayText}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderTrendingItem = ({ item }: { item: any }) => {
    const discount = item.itemDiscount || 0;
    const hasDiscount = discount > 0;

    return (
      <TouchableOpacity
        className="rounded-xl overflow-hidden"
        style={{
          width: TRENDING_CARD_WIDTH,
          backgroundColor: isDark ? 'transparent' : 'transparent',
        }}
        onPress={() => handleProductPress(item)}
        activeOpacity={0.9}
      >
        {/* Image Section */}
        <View className="h-40 rounded-xl bg-gray-100 border border-gray-200 relative" style={{ backgroundColor: isDark ? '#2D3038' : '#f3f4f6', borderColor: isDark ? '#3D4048' : '#e5e7eb' }}>
          <Image
            source={{ uri: item.image }}
            className="w-full h-full rounded-xl"
            resizeMode="cover"
          />

          {/* Trending Icon */}
          <View
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 justify-center items-center"
          >
            <Icon
              name="trending-up"
              size={16}
              color="#EF4444"
            />
          </View>

          {/* Rating Badge (Bottom Left of Image) */}
          <View className="absolute bottom-2 left-2 bg-white/90 flex-row items-center px-1.5 py-0.5 rounded">
            <Text className="text-[10px] font-bold text-black">{item.itemRatings || '4.0'}</Text>
            <Icon name="star" size={10} color="#047857" style={{ marginLeft: 2 }} />
            <View className="w-[1px] h-2 bg-gray-300 mx-1" />
            <Text className="text-[10px] text-gray-500">{item.views || '10'}k</Text>
          </View>
        </View>

        {/* Content Section */}
        <View className="p-2">
          {/* Brand / Name */}
          <Text
            className={`text-sm font-bold mb-0.5 ${isDark ? 'text-white' : 'text-black'}`}
            numberOfLines={1}
          >
            {item.itemName?.split(' ')[0] || 'Brand'}
          </Text>
          <Text
            className={`text-xs mb-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
            numberOfLines={1}
          >
            {item.itemName}
          </Text>

          {/* Price Row */}
          <View className="flex-row items-center mb-1">
            {hasDiscount && (
              <>
                <Icon name="arrow-down" size={12} color="#16A34A" />
                <Text className="text-xs font-bold text-green-600 mr-1">{discount}%</Text>
                <Text className="text-xs line-through text-gray-400 mr-1.5">₹{item.itemInitialPrice}</Text>
              </>
            )}
            <Text className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              ₹{Math.round(item.itemFinalPrice || 0)}
            </Text>
          </View>

          {/* Deal Badge */}
          {hasDiscount && (
            <View className="bg-purple-100 px-1.5 py-0.5 self-start rounded mb-1.5" style={{ backgroundColor: isDark ? 'rgba(147, 51, 234, 0.2)' : '#f3e8ff' }}>
              <Text className="text-[10px] font-bold" style={{ color: isDark ? '#d8b4fe' : '#7c3aed' }}>Top Discount</Text>
            </View>
          )}

          {/* Delivery Info */}
          <Text className={`text-[10px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`} numberOfLines={1}>
            Delivery by <Text className="font-bold">21st Jan</Text>
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const handleBackNavigation = () => {
    if (query.length > 0) {
      setQuery('');
      Keyboard.dismiss();
    } else {
      navigation.goBack();
    }
  };

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (query.length > 0) {
          setQuery('');
          Keyboard.dismiss();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [query])
  );

  // Gradient colors matching HeroSection exactly
  const gradientColors = isDark ? ['#060606ff', '#272a31ff'] : ['#FFFFFF', '#F3F4F6'];

  return (
    <LinearGradient
      colors={gradientColors}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      {/* Search Header - Premium Redesign */}
      <View
        className="flex-row items-center px-4 py-3 pb-4"
        style={{
          zIndex: 10,
          backgroundColor: isDark ? '#040404ff' : '#FFFFFF'
        }}
      >
        <TouchableOpacity
          onPress={handleBackNavigation}
          className="p-2 -ml-1 mr-1 rounded-full"
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>

        <View
          className="flex-1 flex-row items-center h-12 rounded-3xl px-4"
          style={{
            backgroundColor: isDark ? '#1E2028' : '#F3F4F6',
            borderWidth: 1,
            borderColor: isDark ? '#2D3038' : 'transparent'
          }}
        >
          <Icon name="search" size={20} color={placeholderColor} className="mr-2 opacity-70" />
          <TextInput
            className="flex-1 text-base font-medium h-full"
            style={{ color: textColor }}
            placeholder="Search medicines, vitamins..."
            placeholderTextColor={placeholderColor}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoFocus={true}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} className="p-1">
              <Icon name="close-circle" size={18} color={placeholderColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      

      {/* Main Content or Suggestions */}
      {query.length > 0 ? (
        isLoadingSuggestions ? (
          <View className="flex-1 px-5 pt-2">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <View key={item} className="flex-row items-center py-3.5 border-b" style={{ borderBottomColor: isDark ? '#2D3038' : '#F3F4F6' }}>
                <View className="w-12 h-12 rounded-xl mr-3" style={{ backgroundColor: isDark ? '#2D3038' : '#E5E7EB', opacity: 0.5 }} />
                <View className="flex-1">
                  <View className="h-4 rounded mb-2" style={{ backgroundColor: isDark ? '#2D3038' : '#E5E7EB', opacity: 0.5, width: '70%' }} />
                  <View className="h-3 rounded" style={{ backgroundColor: isDark ? '#2D3038' : '#E5E7EB', opacity: 0.3, width: '40%' }} />
                </View>
              </View>
            ))}
          </View>
        ) : suggestions.length > 0 ? (
          <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
            {suggestions.map((item: any, index) => {
              const name = item.itemName || item.name || item.title || item.code;
              const price = item.itemFinalPrice || item.itemInitialPrice || item.price;
              const image = item.image || (item.itemImages && item.itemImages[0]);
              const id = item._id || item.id;


              return (
                <TouchableOpacity
                  key={id || index}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 20,
                    paddingVertical: 14,
                    borderBottomWidth: 0.5,
                    borderBottomColor: isDark ? '#374151' : '#E5E7EB',
                  }}
                  onPress={() => handleProductPress({ ...item, _id: id })}
                  activeOpacity={0.6}
                >
                  {/* Image */}
                  {image ? (
                    <Image
                      source={{ uri: image }}
                      style={{ width: 56, height: 56, borderRadius: 25 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 14,
                        justifyContent: 'center',
                        alignItems: 'center',
                        backgroundColor: isDark ? '#1F2937' : '#F3F4F6'
                      }}
                    >
                      <Icon name="bandage-outline" size={24} color={placeholderColor} />
                    </View>
                  )}

                  {/* Name */}
                  <Text
                    numberOfLines={1}
                    style={{
                      flex: 1,
                      fontSize: 15,
                      fontWeight: '600',
                      marginLeft: 14,
                      marginRight: 10,
                      color: textColor
                    }}
                  >
                    {name}
                  </Text>

                  {/* Price */}
                  {price && (
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: '700',
                        marginRight: 10,
                        color: accentColor
                      }}
                    >
                      ₹{price}
                    </Text>
                  )}

                  {/* Arrow Icon */}
                  <Icon
                    name="chevron-forward"
                    size={18}
                    color={placeholderColor}
                  />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        ) : (
          <View className="flex-1 justify-center items-center px-5">
            <Icon name="search-outline" size={48} color={placeholderColor} className="mb-3 opacity-30" />
            <Text className="text-base" style={{ color: placeholderColor }}>No results found</Text>
          </View>
        )
      ) : isPageLoading ? (
        /* Unified Skeleton Loading - All sections shown together */
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Recent Searches Skeleton */}
          <View className="px-5 mt-5">
            <View style={{ width: 140, height: 20, borderRadius: 6, marginBottom: 12, backgroundColor: isDark ? '#2D3038' : '#E5E7EB' }} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {[1, 2, 3, 4].map((item) => (
                <View key={item} style={{ width: RECENT_ITEM_WIDTH, marginRight: 16 }}>
                  <View style={{ width: '100%', aspectRatio: 1, borderRadius: 20, backgroundColor: isDark ? '#2D3038' : '#E5E7EB' }} />
                  <View style={{ width: '80%', height: 12, borderRadius: 4, marginTop: 8, backgroundColor: isDark ? '#2D3038' : '#E5E7EB' }} />
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Popular Searches Skeleton */}
          <View className="px-5 mt-8">
            <View style={{ width: 140, height: 20, borderRadius: 6, marginBottom: 16, backgroundColor: isDark ? '#2D3038' : '#E5E7EB' }} />
            <View className="flex-row flex-wrap justify-between">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <View key={item} style={{ width: '48%', marginBottom: 12 }}>
                  <View style={{ width: '100%', height: 40, borderRadius: 10, backgroundColor: isDark ? '#2D3038' : '#E5E7EB' }} />
                </View>
              ))}
            </View>
          </View>

          {/* Trending Now Skeleton */}
          <View className="px-5 mt-6 mb-3">
            <View style={{ width: 120, height: 20, borderRadius: 6, backgroundColor: isDark ? '#2D3038' : '#E5E7EB' }} />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
            {[1, 2, 3].map((item) => (
              <View key={item} style={{ width: 150, marginRight: 12 }}>
                <View style={{ width: '100%', height: 150, borderRadius: 16, backgroundColor: isDark ? '#2D3038' : '#E5E7EB' }} />
                <View style={{ width: '80%', height: 14, borderRadius: 4, marginTop: 10, backgroundColor: isDark ? '#2D3038' : '#E5E7EB' }} />
                <View style={{ width: '50%', height: 12, borderRadius: 4, marginTop: 6, backgroundColor: isDark ? '#2D3038' : '#E5E7EB' }} />
              </View>
            ))}
          </ScrollView>
          <View className="h-10" />
        </ScrollView>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Recently Searched */}
          {recentSearches.length > 0 && (
            <>
              <View className="flex-row justify-between items-center px-5 mt-5 mb-3">
                <Text className="text-lg font-bold" style={{ color: textColor }}>Recent Searches</Text>
                <TouchableOpacity onPress={handleClearAll}>
                  <Text className="text-sm" style={{ color: accentColor }}>Clear all</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={recentSearches}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                renderItem={renderRecentSearchItem}
                ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
                contentContainerClassName="px-4"
              />
            </>
          )}

          {/* Popular Searches / Terms */}
          {popularTerms.length > 0 && (
            <View>
              <View className="flex-row justify-between items-center px-5 mt-8 mb-8">
                <Text className="text-lg font-bold" style={{ color: textColor }}>Popular Searches</Text>
              </View>
              <View className="flex-row flex-wrap justify-between px-5">
                {popularTerms.map((term: any, index) => (
                  <View key={term.id || index} style={{ width: '48%', marginBottom: 8 }}>
                    {renderPopularTermItem({ item: term })}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Trending Now */}
          <View className="flex-row justify-between items-center px-5 mt-6 mb-3">
            <Text className="text-lg font-bold" style={{ color: textColor }}>Trending Now</Text>
          </View>
          <TrendingCarousel
            products={trendingProducts || []}
            renderItem={renderTrendingItem}
            onProductPress={handleProductPress}
          />

          {/* Bottom Buffer */}
          <View className="h-10" />
        </ScrollView>
      )}
    </LinearGradient>
  );
};

export default SearchScreen;
