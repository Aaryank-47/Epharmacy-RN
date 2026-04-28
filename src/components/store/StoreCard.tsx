import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import useThemePalette from '../../hooks/useThemePalette';
import { Store } from '../../api/types';

interface StoreCardProps {
  store: Store;
  onPress: (store: Store) => void;
  onToggleFavorite: (storeId: string) => void;
}

const StoreCard: React.FC<StoreCardProps> = ({ store, onPress, onToggleFavorite }) => {
  const { isDark, serifFontFamily } = useThemePalette(); // success #10B981
  
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(store)}
      className={`rounded-2xl mb-4 border overflow-hidden shadow-md elevation-3 ${
        isDark ? 'bg-[#2A2A2A] border-[#3A3A3A]' : 'bg-white border-[#F3F4F6] shadow-black/5'
      }`}
    >
      {/* 1. Top Image */}
      <View className="h-40 relative">
        <Image 
          source={{ uri: store.imageUrl }} 
          className="w-full h-full"
          resizeMode="cover"
        />
        
        {/* Discount Badge */}
        {store.discountBadge && (
          <View className="absolute top-3 right-3 bg-[#EF4444] px-2.5 py-1 rounded-lg">
            <Text className="text-white text-xs font-bold">
              {store.discountBadge}
            </Text>
          </View>
        )}

        {/* Favorite Icon */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onToggleFavorite(store.id)}
          className="absolute top-3 left-3 bg-white/90 p-1.5 rounded-full"
        >
          <MaterialCommunityIcons 
            name={store.isFavorite ? "heart" : "heart-outline"} 
            size={20} 
            color={store.isFavorite ? "#EF4444" : "#6B7280"} 
          />
        </TouchableOpacity>
      </View>

      {/* Content Container */}
      <View className="p-3.5">
        
        {/* 2. Store Info & 5. Status Indicator */}
        <View className="flex-row items-center justify-between mb-1">
          <Text 
            numberOfLines={1}
            style={{ fontFamily: serifFontFamily }}
            className={`text-lg font-bold flex-1 mr-2 ${isDark ? 'text-white' : 'text-[#1F2937]'}`}
          >
            {store.name}
          </Text>
          <View className="flex-row items-center">
            <View className={`w-2 h-2 rounded-full mr-1 ${store.isOpen ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
            <Text className={`text-xs font-semibold ${store.isOpen ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
              {store.isOpen ? 'Open Now' : 'Closed'}
            </Text>
          </View>
        </View>  

        <Text 
          numberOfLines={1}
          className={`text-sm mb-3 ${isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}
        >
          {store.description}
        </Text>

        {/* 3. Meta Info Row */}
        <View className="flex-row items-center mb-3">
          <View className="flex-row items-center bg-orange-100 px-2 py-0.5 rounded mr-3">
            <MaterialCommunityIcons name="star" size={14} color="#F59E0B" />
            <Text className="text-[#D97706] text-[13px] font-bold ml-1">
              {typeof store.rating === 'number' ? store.rating.toFixed(1) : '4.5'}
            </Text>
          </View>
          <Text className={`text-[13px] mr-2.5 ${isDark ? 'text-[#9CA3AF]' : 'text-[#6B7280]'}`}>
            {store.reviewsCount || '0'} Reviews
          </Text>

          {store.freeDelivery && (
            <View className="flex-row items-center">
              <View className="w-1 h-1 rounded-full bg-[#D1D5DB] mr-2.5" />
              <MaterialCommunityIcons name="truck-fast" size={16} color="#10B981" className="mr-1" />
              <Text className="text-[#10B981] text-xs font-semibold">Free Delivery</Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View className={`h-px mb-3 ${isDark ? 'bg-[#3A3A3A]' : 'bg-[#F3F4F6]'}`} />

        {/* 4. Bottom Info Row */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="map-marker-outline" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text className={`text-[13px] ml-1 font-medium ${isDark ? 'text-[#D1D5DB]' : 'text-[#4B5563]'}`}>
              {store.distance}
            </Text>
          </View>
          
          <View className="flex-row items-center">
            <MaterialCommunityIcons name="clock-outline" size={16} color={isDark ? '#9CA3AF' : '#6B7280'} />
            <Text className={`text-[13px] ml-1 font-medium ${isDark ? 'text-[#D1D5DB]' : 'text-[#4B5563]'}`}>
              {store.deliveryTime}
            </Text>
          </View>
        </View>

      </View>
    </TouchableOpacity>
  );
};

export default React.memo(StoreCard);
