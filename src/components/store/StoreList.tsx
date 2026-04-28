import React from 'react';
import { View, FlatList, Text, RefreshControl } from 'react-native';
import StoreCard from './StoreCard';
import { Store } from '../../api/types';
import useThemePalette from '../../hooks/useThemePalette';

interface StoreListProps {
  stores: Store[];
  onStorePress: (store: Store) => void;
  onToggleFavorite: (storeId: string) => void;
  refreshControl?: React.ReactElement<any>;
}

const StoreList: React.FC<StoreListProps> = ({ 
  stores, 
  onStorePress, 
  onToggleFavorite,
  refreshControl,
}) => {
  const { isDark, serifFontFamily } = useThemePalette();

  const renderItem = ({ item }: { item: Store }) => (
    <StoreCard 
      store={item} 
      onPress={onStorePress} 
      onToggleFavorite={onToggleFavorite} 
    />
  );

  return (
    <FlatList
      data={stores}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      className="px-4 pb-[100px]"
      refreshControl={refreshControl}
      ListHeaderComponent={() => (
        <View className="flex-row items-center justify-between mb-4 mt-2">
          <Text 
            style={{ fontFamily: serifFontFamily }}
            className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#1F2937]'}`}
          >
            All Pharmacies <Text className="text-[#9CA3AF] text-sm font-medium">({stores.length})</Text>
          </Text>
          <Text className="text-[#10B981] text-sm font-semibold">
            Most Popular ▾
          </Text>
        </View>
      )}
      ListEmptyComponent={() => (
        <View className="items-center justify-center py-10">
          <Text className={`text-base ${isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>
            No stores found.
          </Text>
        </View>
      )}
    />
  );
};

export default React.memo(StoreList);
