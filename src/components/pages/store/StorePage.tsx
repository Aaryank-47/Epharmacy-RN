import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useThemePalette from '../../../hooks/useThemePalette';
import Tabs from '../../commonPage/Tab';
import FilterChips from '../../store/FilterChips';
import StoreList from '../../store/StoreList';
import { Store } from '../../../api/types';
import { getAllStores } from '../../../api/storeApi';
import { toHumanReadableError } from '../../../utils/errorHandler';

const CHIP_FILTERS = ['All', 'Nearby', 'Top Rated', 'Fast Delivery', 'Open Now'];

// ============================================================================
// ERROR STATE COMPONENT
// ============================================================================
interface ErrorStateProps {
  error: string;
  isDark: boolean;
  onRetry: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ error, isDark, onRetry }) => {
  const errorTextColor = isDark ? '#FCA5A5' : '#DC2626';
  return (
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
          color={errorTextColor}
          className="mb-4"
        />
        <Text
          className={`text-lg font-bold text-center mb-2 ${
            isDark ? 'text-white' : 'text-[#1F2937]'
          }`}
        >
          Couldn't Load Stores
        </Text>
        <Text
          className={`text-sm text-center mb-6 ${
            isDark ? 'text-[#D1D5DB]' : 'text-[#6B7280]'
          }`}
        >
          {error}
        </Text>

        <TouchableOpacity
          onPress={onRetry}
          className="bg-[#10B981] px-6 py-3 rounded-lg flex-row items-center"
        >
          <MaterialCommunityIcons name="refresh" size={18} color="#FFFFFF" />
          <Text className="text-white font-semibold ml-2">Try Again</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================
interface EmptyStateProps {
  isDark: boolean;
  searchQuery: string;
  onClearSearch: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ isDark, searchQuery, onClearSearch }) => (
  <View className="flex-1 items-center justify-center px-6">
    <MaterialCommunityIcons
      name="store-outline"
      size={80}
      color={isDark ? '#6B7280' : '#D1D5DB'}
      className="mb-4"
    />
    <Text
      className={`text-lg font-bold text-center mb-2 ${
        isDark ? 'text-white' : 'text-[#1F2937]'
      }`}
    >
      No Stores Found
    </Text>
    <Text
      className={`text-sm text-center mb-6 ${
        isDark ? 'text-[#D1D5DB]' : 'text-[#6B7280]'
      }`}
    >
      {searchQuery
        ? 'Try adjusting your search or filters'
        : 'No stores available in your area'}
    </Text>

    {searchQuery && (
      <TouchableOpacity
        onPress={onClearSearch}
        className="bg-[#10B981] px-6 py-3 rounded-lg"
      >
        <Text className="text-white font-semibold">Clear Search</Text>
      </TouchableOpacity>
    )}
  </View>
);

// ============================================================================
// LOADING STATE COMPONENT
// ============================================================================
interface LoadingStateProps {
  isDark: boolean;
}

const LoadingState: React.FC<LoadingStateProps> = ({ isDark }) => (
  <View className="flex-1 items-center justify-center">
    <ActivityIndicator size="large" color="#10B981" className="mb-4" />
    <Text
      className={`text-sm ${isDark ? 'text-[#D1D5DB]' : 'text-[#6B7280]'}`}
    >
      Loading stores...
    </Text>
  </View>
);

const StorePage: React.FC = () => {
  const { isDark, serifFontFamily, statusBarStyle } = useThemePalette();
  const navigation = useNavigation<any>();

  // States
  const [activeChip, setActiveChip] = useState<string>('All');
  const [originalStores, setOriginalStores] = useState<Store[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all stores from API
   */
  const fetchStores = useCallback(async (showRefresh = false) => {
    try {
      if (!showRefresh) {
        setIsLoading(true);
      }
      setError(null);

      const response = await getAllStores();
      
      if (response.success && response.data?.stores) {
        setOriginalStores(response.data.stores);
        setStores(response.data.stores);
        setActiveChip('All');
      } else {
        setError('Unable to load stores. Please try again.');
      }
    } catch (err: any) {
      const errorMsg = err?.userMessage || toHumanReadableError(err) || 'Failed to load stores';
      console.error(`[StorePage] Fetch error: ${errorMsg}`);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  /**
   * Load stores on component mount
   */
  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  /**
   * Apply filters based on active chip
   */
  const applyFilters = useCallback((filteredStores: Store[], selectedChip: string) => {
    let result = [...filteredStores];

    if (selectedChip === 'Open Now') {
      result = result.filter((s) => s.isOpen);
    } else if (selectedChip === 'Top Rated') {
      result = result.sort((a, b) => b.rating - a.rating);
    } else if (selectedChip === 'Fast Delivery') {
      // Filter stores with delivery time <= 20 minutes
      result = result.filter((s) => {
        const timeMatch = s.deliveryTime?.match(/(\d+)/);
        return timeMatch && parseInt(timeMatch[0], 10) <= 20;
      });
    } else if (selectedChip === 'Nearby') {
      // Filter stores within 2km
      result = result.filter((s) => {
        const distMatch = s.distance?.match(/(\d+\.?\d*)/);
        return distMatch && parseFloat(distMatch[0]) <= 2;
      });
    }

    return result;
  }, []);

  /**
   * Handle chip selection with filtering
   */
  const handleSelectChip = useCallback((chip: string) => {
    setActiveChip(chip);
    const filteredStores = applyFilters(originalStores, chip);
    setStores(filteredStores);
  }, [originalStores, applyFilters]);

  /**
   * Handle search query
   */
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      const filteredStores = applyFilters(originalStores, activeChip);
      setStores(filteredStores);
      return;
    }

    const searchLower = query.toLowerCase();
    const filtered = originalStores.filter((store) =>
      store.name.toLowerCase().includes(searchLower) ||
      store.description?.toLowerCase().includes(searchLower)
    );

    const finalFiltered = applyFilters(filtered, activeChip);
    setStores(finalFiltered);
  }, [originalStores, activeChip, applyFilters]);

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchStores(true);
  }, [fetchStores]);

  /**
   * Handle store press
   */
  const handleStorePress = useCallback((store: Store) => {
    navigation.navigate('StoreDetailScreen', {
      storeId: store.id,
      storeName: store.name,
      storeImage: store.imageUrl,
    });
  }, [navigation]);

  /**
   * Handle toggle favorite
   */
  const handleToggleFavorite = useCallback((storeId: string) => {
    setStores((prevStores) =>
      prevStores.map((s) =>
        s.id === storeId ? { ...s, isFavorite: !s.isFavorite } : s
      )
    );
    setOriginalStores((prevStores) =>
      prevStores.map((s) =>
        s.id === storeId ? { ...s, isFavorite: !s.isFavorite } : s
      )
    );
  }, []);

  const themeBgColor = '#08090D';
  const themeBgClass = 'bg-[#08090D]';
  const cardBgClass = 'bg-[#14161C]';
  const pinkAccent = '#F472B6';

  return (
    <Tabs currentActiveTab="Store">
      <SafeAreaView className={`flex-1 ${themeBgClass}`}>
        <StatusBar backgroundColor={themeBgColor} barStyle={statusBarStyle} />

        {/* HEADER SECTION */}
        <View className="px-4 pb-4 pt-2">
          {/* Location Row */}
          <View className="flex-row items-center justify-between mb-4 mt-2">
            <View className="flex-row items-center flex-1">
              <MaterialCommunityIcons name="map-marker" size={24} color={pinkAccent} />
              <View className="ml-2 flex-1">
                <Text className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">
                  Delivering to
                </Text>
                <View className="flex-row items-center mt-0.5">
                  <Text numberOfLines={1} className="text-base font-bold text-white">
                    Home - 411014, Pune
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={20} color="#FFFFFF" className="ml-1" />
                </View>
              </View>
            </View>

            <TouchableOpacity className="w-10 h-10 rounded-full items-center justify-center bg-white/5 border border-white/10">
              <MaterialCommunityIcons name="bell-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Search Bar Row */}
          <View className="flex-row items-center">
            <View className={`flex-1 flex-row items-center rounded-full px-4 py-3.5 border border-white/5 ${cardBgClass}`}>
              <MaterialCommunityIcons name="magnify" size={18} color="#9CA3AF" />
              <TextInput
                value={searchQuery}
                onChangeText={handleSearch}
                placeholder="Search stores..."
                placeholderTextColor="#9CA3AF"
                className="flex-1 ml-2 text-sm text-white"
                style={{ paddingVertical: 0 }}
              />
              {searchQuery && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                  <MaterialCommunityIcons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              activeOpacity={0.7}
              className="ml-3 p-3.5 rounded-2xl items-center justify-center"
              style={{ 
                backgroundColor: pinkAccent, 
                shadowColor: pinkAccent,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <MaterialCommunityIcons name="tune-variant" size={22} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* FILTER CHIPS SECTION */}
        <View className={`pt-4 ${themeBgClass}`}>
          <FilterChips
            chips={CHIP_FILTERS}
            activeChip={activeChip}
            onSelect={handleSelectChip}
          />
        </View>

        {/* CONTENT SECTION - Loading / Error / Stores / Empty */}
        {isLoading ? (
          <LoadingState isDark={isDark} />
        ) : error ? (
          <ErrorState error={error} isDark={isDark} onRetry={handleRefresh} />
        ) : stores.length === 0 ? (
          <EmptyState isDark={isDark} searchQuery={searchQuery} onClearSearch={() => {
            setSearchQuery('');
            const filteredStores = applyFilters(originalStores, activeChip);
            setStores(filteredStores);
          }} />
        ) : (
          <View className="flex-1">
            <StoreList
              stores={stores}
              onStorePress={handleStorePress}
              onToggleFavorite={handleToggleFavorite}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  tintColor="#10B981"
                  colors={['#10B981']}
                />
              }
            />
          </View>
        )}
      </SafeAreaView>
    </Tabs>
  );
};

export default StorePage;