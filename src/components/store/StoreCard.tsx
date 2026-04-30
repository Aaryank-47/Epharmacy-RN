import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Store } from '../../api/types';

interface StoreCardProps {
  store: Store;
  onPress: (store: Store) => void;
  onToggleFavorite: (storeId: string) => void;
}

const StoreCard: React.FC<StoreCardProps> = ({ store, onPress, onToggleFavorite }) => {
  const cardBgClass = 'bg-[#14161C]';
  const pinkAccent = '#F472B6';
  
  // Extract initials for the avatar if needed, or just use an icon.
  const avatarText = store.name.substring(0, 2).toUpperCase();

  return (
    <View className="mb-4 rounded-3xl overflow-hidden border border-white/5" style={{ backgroundColor: '#14161C' }}>
      <TouchableOpacity 
        activeOpacity={0.8}
        onPress={() => onPress(store)}
        className="p-5 flex-row items-center"
      >
        <View className="w-12 h-12 rounded-2xl items-center justify-center relative bg-indigo-900/40 border border-indigo-500/20">
          <MaterialCommunityIcons name="storefront-outline" size={24} color="#818CF8" />
          <View className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${store.isOpen ? 'bg-green-500' : 'bg-red-500'}`} />
        </View>
        <View className="flex-1 ml-4">
          <View className="flex-row items-center">
            <Text className="text-base font-bold text-white" numberOfLines={1}>{store.name}</Text>
            {/* Assume true for isVerified for now, or you can add to type */}
            <MaterialCommunityIcons name="check-decagram" size={14} color="#3B82F6" className="ml-1" />
          </View>
          <View className="flex-row items-center mt-1">
            <MaterialCommunityIcons name="walk" size={12} color="#9CA3AF" />
            <Text className="text-xs ml-1 text-gray-400">{store.distance || '1.5 km'}</Text>
            <Text className="text-xs mx-1.5 text-gray-400">•</Text>
            <MaterialCommunityIcons name="clock-outline" size={12} color="#9CA3AF" />
            <Text className="text-xs ml-1 text-gray-400">{store.deliveryTime || '15 min'}</Text>
            <Text className="text-xs mx-1.5 text-gray-400">•</Text>
            <MaterialCommunityIcons name="star" size={12} color="#FBBF24" />
            <Text className="text-xs ml-1 font-bold text-yellow-400">{store.rating || '4.5'}</Text>
          </View>
        </View>
        <TouchableOpacity 
          className="items-center justify-center bg-white/5 w-8 h-8 rounded-full ml-2"
          onPress={() => onToggleFavorite(store.id)}
        >
          <MaterialCommunityIcons 
            name={store.isFavorite ? "heart" : "heart-outline"} 
            size={16} 
            color={store.isFavorite ? pinkAccent : "#FFFFFF"} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );
};

export default React.memo(StoreCard);
