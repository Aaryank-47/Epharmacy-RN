import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  BackHandler
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
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
const COLUMN_COUNT = 2;
const ITEM_SPACING = 12;
const ITEM_WIDTH = (width - 48 - ITEM_SPACING) / COLUMN_COUNT; // 48 is padding (16*2 outer + gap)

const SearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark, accentColor, inputBg, textColor, placeholderColor } = useThemePalette();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isRecentLoading, setIsRecentLoading] = useState(false);

  // State for suggestions and API loading
  const { data: trendingProducts, isLoading: isTrendingLoading } = useTrendingProducts();

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
        return;
      }

      try {
        const response = await import('../../api/medicinesApi').then(mod => mod.getSearchSuggestions(query));
        if (response.success && response.data.suggestions) {
          setSuggestions(response.data.suggestions);
        }
      } catch (error) {
        console.error("Failed to fetch suggestions", error);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchSuggestions();
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const [popularTerms, setPopularTerms] = useState<any[]>([]);

  useEffect(() => {
    // Fetch Popular Terms on Mount
    import('../../api/medicinesApi').then(mod => {
      mod.getPopularSearchTerms().then(res => {
        if (res.success && res.data.terms) {
          setPopularTerms(res.data.terms);
        }
      }).catch(err => console.error(err));
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
      className="px-3 py-2 rounded-full"
      style={{ backgroundColor: isDark ? '#2D3038' : '#F3F4F6' }}
      onPress={() => handleTermPress(item.term)}
    >
      <Text className="text-xs font-medium" style={{ color: textColor }}>{item.term}</Text>
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
        className="mr-4 items-center"
        activeOpacity={0.7}
        onPress={() => setQuery(displayText)}
        onLongPress={() => handleDeleteRecentSearch(item.query)}
      >
        <View
          className="w-16 h-16 rounded-full overflow-hidden border p-0.5 justify-center items-center"
          style={{
            borderColor: isDark ? '#333' : '#eee',
            backgroundColor: isDark ? '#222' : '#f9f9f9'
          }}
        >
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} className="w-full h-full rounded-full" />
          ) : (
            <Icon name="time-outline" size={24} color={placeholderColor} />
          )}
        </View>
        <Text
          className="mt-2 text-xs font-medium text-center w-16"
          style={{ color: textColor }}
          numberOfLines={1}
        >
          {displayText}
        </Text>
        {item.timeAgo && (
          <Text
            className="mt-0.5 text-[10px] text-center w-16"
            style={{ color: placeholderColor }}
            numberOfLines={1}
          >
            {item.timeAgo}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  const renderTrendingItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="rounded-2xl overflow-hidden border"
      style={{
        backgroundColor: isDark ? '#1E2028' : '#fff',
        borderColor: isDark ? '#2D3038' : '#F3F4F6'
      }}
      onPress={() => handleProductPress(item)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.image }} className="w-full h-[120px] bg-gray-100" resizeMode="cover" />
      <View className="p-3">
        <Text className="text-sm font-bold mb-1" style={{ color: textColor }} numberOfLines={1}>
          {item.itemName}
        </Text>
        <Text className="text-xs text-gray-400">
          {item.itemFinalPrice ? `₹${item.itemFinalPrice}` : 'Trending'}
        </Text>
      </View>
    </TouchableOpacity>
  );

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

  return (
    <View className="flex-1" style={{ backgroundColor: isDark ? '#14161B' : '#FFFFFF' }}>
      {/* Search Header */}
      <View
        className="flex-row items-center p-4 border-b"
        style={{ borderBottomColor: isDark ? '#2D3038' : '#F3F4F6' }}
      >
        <TouchableOpacity onPress={handleBackNavigation} className="mr-3">
          <Icon name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <View
          className="flex-1 flex-row items-center h-11 rounded-xl px-3"
          style={{ backgroundColor: inputBg }}
        >
          <Icon name="search" size={20} color={placeholderColor} className="mr-2" />
          <TextInput
            className="flex-1 text-base py-0 h-full"
            style={{ color: textColor }}
            placeholder="Search medicines, vitamins..."
            placeholderTextColor={placeholderColor}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoFocus={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Icon name="close-circle" size={18} color={placeholderColor} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content or Suggestions */}
      {query.length > 0 && suggestions.length > 0 ? (
        <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
          {suggestions.map((item: any, index) => {
            const name = item.itemName || item.name || item.title || item.code;
            const price = item.itemFinalPrice || item.itemInitialPrice || item.price;
            const image = item.image || (item.itemImages && item.itemImages[0]);
            const id = item._id || item.id;

            return (
              <TouchableOpacity
                key={id || index}
                className="flex-row items-center py-3.5 px-5 border-b"
                style={{ borderBottomColor: isDark ? '#2D3038' : '#F3F4F6' }}
                onPress={() => handleProductPress({ ...item, _id: id })}
              >
                {image ? (
                  <Image source={{ uri: image }} className="w-10 h-10 rounded-lg mr-3" />
                ) : (
                  <Icon name="search-outline" size={18} color={placeholderColor} className="mr-3" />
                )}
                <View className="flex-1">
                  <Text className="text-base" style={{ color: textColor }}>{name}</Text>
                  {price && (
                    <Text className="text-xs" style={{ color: accentColor }}>₹{price}</Text>
                  )}
                </View>
                <Icon name="arrow-forward-outline" size={18} color={placeholderColor} className="ml-auto" />
              </TouchableOpacity>
            );
          })}
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
                contentContainerClassName="px-4"
              />
            </>
          )}

          {/* Popular Searches / Terms */}
          {popularTerms.length > 0 && (
            <View>
              <View className="flex-row justify-between items-center px-5 mt-6 mb-2">
                <Text className="text-lg font-bold" style={{ color: textColor }}>Popular Searches</Text>
              </View>
              <View className="flex-row flex-wrap px-5">
                {popularTerms.map((term: any, index) => (
                  <View key={term.id || index} className="mr-2 mb-2">
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

          {isTrendingLoading ? (
            <ActivityIndicator size="large" color={accentColor} className="mt-5" />
          ) : (
            <View className="flex-row flex-wrap px-4 justify-between">
              {trendingProducts && Array.isArray(trendingProducts) && trendingProducts.map((item: any) => (
                <View key={item._id} style={{ width: ITEM_WIDTH, marginBottom: 16 }}>
                  {renderTrendingItem({ item })}
                </View>
              ))}
            </View>
          )}

          {/* Bottom Buffer */}
          <View className="h-10" />
        </ScrollView>
      )}
    </View>
  );
};

export default SearchScreen;
