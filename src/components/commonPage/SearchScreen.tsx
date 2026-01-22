import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Keyboard,
  BackHandler,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  ToastAndroid,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useTrendingProducts } from '../../hooks/useTrendingProducts';
import { useThemePalette } from '../../hooks/useThemePalette';
import type { RecentSearch, SearchFilters } from '../../api/types';
import {
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
  deleteRecentSearch,
  searchMedicines
} from '../../api/medicinesApi';

// Components
import SearchComposite from './search/SearchComposite';
import RecentSearches from './search/RecentSearches';
import Tabs from './Tab';

const { width } = Dimensions.get('window');
const TRENDING_CARD_WIDTH = (width - 35) / 2;
const TRENDING_CARD_SPACING = 15;

const SearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark } = useThemePalette();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isRecentLoading, setIsRecentLoading] = useState(true);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  const { addToCart, isInCart } = useCart();
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlist();
  const { accentColor } = useThemePalette();

  // Search Results State
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isResultsLoading, setIsResultsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Trending Logic
  const { data: trendingProducts, isLoading: isTrendingLoading } = useTrendingProducts();
  const row2Ref = useRef<ScrollView>(null);

  const row1Data = useMemo(() => trendingProducts ? trendingProducts.slice(0, 6) : [], [trendingProducts]);
  const row2Data = useMemo(() => {
    if (!trendingProducts) return [];
    return trendingProducts.slice(6, 12).length > 0 ? trendingProducts.slice(6, 12) : trendingProducts.slice(0, 6);
  }, [trendingProducts]);
  // Tab Bar Animation
  const translateY = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);
  const isTabBarHidden = useRef(false);
  const TAB_BAR_HIDDEN_OFFSET = 100;

  const handleScrollRaw = useCallback((event: any) => {
    const currentY = event.nativeEvent.contentOffset.y;
    const dy = currentY - lastScrollY.current;

    // Detect if close to bottom
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;
    const contentHeight = event.nativeEvent.contentSize.height;
    const isCloseToBottom = layoutHeight + currentY >= contentHeight - 20;

    if (isCloseToBottom) {
      if (isTabBarHidden.current) {
        isTabBarHidden.current = false;
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    } else if (currentY > 50) {
      if (dy > 10 && !isTabBarHidden.current) {
        isTabBarHidden.current = true;
        Animated.timing(translateY, {
          toValue: TAB_BAR_HIDDEN_OFFSET,
          duration: 300,
          useNativeDriver: true,
        }).start();
      } else if (dy < -5 && isTabBarHidden.current) {
        isTabBarHidden.current = false;
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    } else if (currentY <= 50 && isTabBarHidden.current) {
      isTabBarHidden.current = false;
      Animated.timing(translateY, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
    lastScrollY.current = currentY;
  }, [translateY]);

  const onScrollEvent = useMemo(() => Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: handleScrollRaw,
    }
  ), [scrollY, handleScrollRaw]);

  useEffect(() => {
    if (row2Data.length > 0) {
      setTimeout(() => {
        row2Ref.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [row2Data]);

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

  useFocusEffect(
    useCallback(() => {
      fetchRecentSearches();
    }, [])
  );

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions([]);
        setIsLoadingSuggestions(false);
        return;
      }


      // If we are showing results, typing should revert to suggestions mode
      if (showResults) {
        setShowResults(false);
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
  }, [query, showResults]);

  const [popularTerms, setPopularTerms] = useState<any[]>([]);
  const [_isPopularLoading, setIsPopularLoading] = useState(true);

  useEffect(() => {
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

  const handleProductPress = async (item: any) => {
    saveRecentSearch({
      query: item.itemName || item.name,
      itemId: item._id || item.id,
      itemName: item.itemName || item.name,
      itemImage: item.image || (item.itemImages && item.itemImages[0])
    }).catch(err => console.error("Failed to save search", err));

    navigation.navigate('ProductDetail', { productId: item._id });
  };

  const handleAddToCart = useCallback((item: any) => {
    if (isInCart(item._id)) {
      ToastAndroid.show('Item has already been added to the cart', ToastAndroid.SHORT);
      return;
    }

    const price = item.itemDiscount ? (item.itemInitialPrice || 0) - ((item.itemInitialPrice || 0) * item.itemDiscount / 100) : (item.itemInitialPrice || item.itemFinalPrice || 0);

    addToCart({
      id: item._id,
      name: item.itemName || '',
      price: Math.round(price),
      quantity: 1,
    });
    ToastAndroid.show('Item has been added to the cart', ToastAndroid.SHORT);
  }, [isInCart, addToCart]);

  const handleToggleWishlist = useCallback((item: any) => {
    if (isInWishlist(item._id)) {
      removeFromWishlist(item._id);
    } else {
      addToWishlist({
        _id: item._id,
        itemName: item.itemName || '',
        itemDescription: item.itemDescription || '',
        image: item.image || (item.itemImages && item.itemImages[0]) || '',
        itemFinalPrice: Math.round(item.itemFinalPrice || 0),
        itemRatings: item.itemRatings || 0,
        itemDiscount: item.itemDiscount || 0,
        itemInitialPrice: item.itemInitialPrice || 0
      });
    }
  }, [isInWishlist, removeFromWishlist, addToWishlist]);

  const handleSearchSubmit = async () => {
    if (query.trim().length >= 2) {
      // Save search
      await saveRecentSearch({
        query: query.trim(),
      });
      fetchRecentSearches();
      Keyboard.dismiss();

      // Trigger Search
      setShowResults(true);
      performSearch(query.trim());
    }
  };

  const performSearch = async (searchQuery: string) => {
    setIsResultsLoading(true);
    try {
      const response = await searchMedicines(searchQuery, 1, 20, {}); // Empty filters
      setSearchResults(response.data.result || []);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsResultsLoading(false);
    }
  };



  const handleBackNavigation = () => {
    if (showResults) {
      setShowResults(false);
      return;
    }
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
        if (showResults) {
          setShowResults(false);
          return true;
        }
        if (query.length > 0) {
          setQuery('');
          Keyboard.dismiss();
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

      return () => subscription.remove();
    }, [query, showResults])
  );

  // Gradient colors
  const gradientColors = isDark ? ['#060606ff', '#272a31ff'] : ['#FFFFFF', '#F3F4F6'];

  // --- Render Functions for Recent & Trending Slots ---

  const renderRecent = () => (
    <RecentSearches
      recentSearches={recentSearches}
      onPress={(q) => setQuery(q)}
      onDelete={handleDeleteRecentSearch}
      onClearAll={handleClearAll}
    />
  );

  const renderTrendingProductItem = ({ item }: { item: any }) => {
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

          {/* Trending Icon (Left) */}
          <View
            className="absolute top-2 left-2 w-7 h-7 rounded-full bg-white/90 justify-center items-center"
          >
            <Icon
              name="trending-up"
              size={16}
              color="#EF4444"
            />
          </View>

          {/* Wishlist Icon (Right) */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => handleToggleWishlist(item)}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 justify-center items-center"
            style={{ elevation: 2 }}
          >
            <Icon
              name={isInWishlist(item._id) ? "heart" : "heart-outline"}
              size={16}
              color="#EF4444"
            />
          </TouchableOpacity>

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

            {/* Add to Cart Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => handleAddToCart(item)}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: isInCart(item._id) ? (isDark ? '#374151' : '#9CA3AF') : accentColor,
                justifyContent: 'center',
                alignItems: 'center',
                marginLeft: 'auto',
                elevation: 2,
              }}
            >
              <Icon name={isInCart(item._id) ? "checkmark" : "cart-outline"} size={16} color="#FFFFFF" />
            </TouchableOpacity>
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

  const renderTrending = () => {
    if (!trendingProducts || trendingProducts.length === 0) return null;

    return (
      <View>
        <View className="flex-row justify-between items-center px-5 mt-6 mb-3">
          <Text className="text-lg font-bold" style={{ color: isDark ? '#FFFFFF' : '#000000' }}>Trending Now</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        >
          {row1Data.map((item: any, idx) => (
            <View key={`row1-${item._id || idx}`} style={{ marginRight: idx === row1Data.length - 1 ? 0 : TRENDING_CARD_SPACING }}>
              {renderTrendingProductItem({ item })}
            </View>
          ))}
        </ScrollView>

        {row2Data.length > 0 && (
          <ScrollView
            ref={row2Ref}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, marginTop: 12 }}
          >
            {row2Data.map((item: any, idx) => (
              <View key={`row2-${item._id || idx}`} style={{ marginRight: idx === row2Data.length - 1 ? 0 : TRENDING_CARD_SPACING }}>
                {renderTrendingProductItem({ item })}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    );
  };

  /* Camera Logic */


  return (
    <Tabs
      translateY={translateY}
      onNavigate={(screen) => navigation.navigate(screen)}
      currentActiveTab="Home"
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1 }}
      >
        <SearchComposite
          query={query}
          onQueryChange={setQuery}
          onSubmitEditing={handleSearchSubmit}
          onBackPress={handleBackNavigation}
          suggestions={suggestions}
          isSuggestionsLoading={isLoadingSuggestions}
          onSuggestionPress={handleProductPress}
          popularTerms={popularTerms}
          onPopularTermPress={handleTermPress}
          isPageLoading={isPageLoading}
          renderRecent={renderRecent}
          renderTrending={renderTrending}
          showCamera={true}
          onScroll={onScrollEvent}
          showResults={showResults}
          renderSearchResults={() => {
            if (isResultsLoading) {
              return (
                <View className="flex-1 justify-center items-center">
                  <View className="p-4 bg-white/10 rounded-full mb-4">
                    <Icon name="search" size={32} color={isDark ? '#FFF' : '#000'} className="animate-pulse" />
                  </View>
                  <Text style={{ color: isDark ? '#FFF' : '#000' }}>Searching...</Text>
                </View>
              );
            }

            if (searchResults.length === 0) {
              return (
                <View className="flex-1 justify-center items-center mt-20">
                  <Icon name="cube-outline" size={48} color={isDark ? '#555' : '#CCC'} />
                  <Text className="text-gray-500 mt-2">No products found for "{query}"</Text>
                </View>
              );
            }

            return (
              <Animated.ScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
                onScroll={onScrollEvent}
                scrollEventThrottle={16}
              >
                <View className="flex-row flex-wrap justify-between">
                  {searchResults.map((item) => (
                    <View key={item._id} style={{ width: '48%', marginBottom: 15 }}>
                      {renderTrendingProductItem({ item })}
                    </View>
                  ))}
                </View>
              </Animated.ScrollView>
            );
          }}
        />
      </LinearGradient>
    </Tabs>
  );
};

export default SearchScreen;
