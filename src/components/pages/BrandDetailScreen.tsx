import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Platform,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Share,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useThemePalette } from '../../hooks/useThemePalette';
import Icon from 'react-native-vector-icons/Ionicons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'BrandDetail'>;

interface Product {
  id: string;
  name: string;
  image: string;
  price: number;
  originalPrice?: number;
  rating: number;
  discount?: number;
}

const BrandDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { brand } = route.params;
  const { isDark } = useThemePalette();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'featured' | 'bestsellers' | 'new'>('all');
  const [isFollowing, setIsFollowing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // const [loading, setLoading] = useState(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  // Sample products (you can replace with actual API data)
  const sampleProducts: Product[] = [
    {
      id: '1',
      name: 'Vitamin C Serum',
      image: brand.imageUrl,
      price: 299,
      originalPrice: 499,
      rating: 4.5,
      discount: 40,
    },
    {
      id: '2',
      name: 'Multivitamin Capsules',
      image: brand.imageUrl,
      price: 399,
      originalPrice: 599,
      rating: 4.8,
      discount: 33,
    },
    {
      id: '3',
      name: 'Omega-3 Fish Oil',
      image: brand.imageUrl,
      price: 599,
      originalPrice: 899,
      rating: 4.6,
      discount: 33,
    },
    {
      id: '4',
      name: 'Probiotic Supplement',
      image: brand.imageUrl,
      price: 449,
      originalPrice: 649,
      rating: 4.7,
      discount: 31,
    },
  ];

  const categories = [
    { id: 'all', label: 'All Products' },
    { id: 'featured', label: 'Featured' },
    { id: 'bestsellers', label: 'Best Sellers' },
    { id: 'new', label: 'New Arrivals' },
  ];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
      showToast('Products refreshed!');
    }, 1500);
  }, []);

  const showToast = (message: string) => {
    Alert.alert('Success', message, [{ text: 'OK' }]);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out ${brand.brandDetails?.brandName || brand.title} on our app!`,
        title: brand.brandDetails?.brandName || brand.title,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleFollowBrand = () => {
    setIsFollowing(!isFollowing);
    showToast(isFollowing ? 'Unfollowed brand' : 'Following brand! You\'ll get updates.');
  };

  const handleAddToCart = async (product: Product) => {
    setAddingToCart(product.id);
    // Simulate API call
    setTimeout(() => {
      setAddingToCart(null);
      showToast(`${product.name} added to cart!`);
    }, 800);
  };

  const renderProductCard = ({ item }: { item: Product }) => (
    <TouchableOpacity
      className={`rounded-2xl border overflow-hidden w-[48%] ${
        isDark ? 'bg-[#1E2026] border-[#2A2D35]' : 'bg-white border-gray-200'
      }`}
      onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
    >
      {item.discount && (
        <View className="absolute top-2 left-2 bg-red-500 px-2 py-1 rounded-lg z-10">
          <Text className="text-white text-[10px] font-bold">{item.discount}% OFF</Text>
        </View>
      )}
      <View className="w-full h-[140px] bg-gray-100">
        <Image
          source={{ uri: item.image }}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>
      <View className="p-3">
        <Text
          className={`text-sm font-semibold mb-1.5 h-9 ${isDark ? 'text-white' : 'text-gray-900'}`}
          numberOfLines={2}
        >
          {item.name}
        </Text>
        <View className="flex-row items-center gap-1 mb-2">
          <Icon name="star" size={14} color="#FFC107" />
          <Text className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {item.rating}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Text className={`text-base font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
            ₹{item.price}
          </Text>
          {item.originalPrice && (
            <Text className={`text-xs line-through ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              ₹{item.originalPrice}
            </Text>
          )}
        </View>
        <TouchableOpacity 
          className="absolute bottom-3 right-3 bg-green-500 w-9 h-9 rounded-full items-center justify-center"
          onPress={() => handleAddToCart(item)}
          disabled={addingToCart === item.id}
        >
          {addingToCart === item.id ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Icon name="cart-outline" size={18} color="#FFFFFF" />
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className={`flex-1 ${isDark ? 'bg-[#181A20]' : 'bg-gray-50'}`}>
      {/* Header */}
      <LinearGradient
        colors={isDark ? ['#1E2026', '#181A20'] : ['#FFFFFF', '#F9FAFB']}
        className={`flex-row items-center justify-between px-4 border-b border-black/5 ${Platform.OS === 'ios' ? 'pt-12' : 'pt-4'} pb-4`}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            isDark ? 'bg-[#2A2D35]' : 'bg-gray-100'
          }`}
        >
          <Icon
            name="arrow-back"
            size={24}
            color={isDark ? '#FFFFFF' : '#111827'}
          />
        </TouchableOpacity>
        <Text
          className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}
        >
          Brand Details
        </Text>
        <TouchableOpacity
          className={`w-10 h-10 rounded-full items-center justify-center ${
            isDark ? 'bg-[#2A2D35]' : 'bg-gray-100'
          }`}
          onPress={handleShare}
          accessibilityLabel="Share brand"
          accessibilityHint="Share this brand with others"
        >
          <Icon
            name="share-social-outline"
            size={22}
            color={isDark ? '#FFFFFF' : '#111827'}
          />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#22C55E']}
            tintColor="#22C55E"
          />
        }
      >
        {/* Brand Header */}
        <LinearGradient
          colors={isDark ? ['#1E2026', '#2A2D35'] : ['#FFFFFF', '#F3F4F6']}
          className="mx-5 mt-5 rounded-3xl p-6 items-center"
        >
          <View className="w-[100px] h-[100px] rounded-full bg-white items-center justify-center p-2.5 shadow-lg">
            <Image
              source={{ uri: brand.imageUrl }}
              className="w-full h-full"
              resizeMode="contain"
            />
          </View>
          <Text className={`text-2xl font-black mt-4 text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {brand.brandDetails?.brandName || brand.title}
          </Text>
          <Text className={`text-sm mt-2 text-center leading-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {brand.brandDetails?.brandDescription || brand.description}
          </Text>

          {/* Stats */}
          <View className="flex-row mt-6 items-center justify-around w-full">
            <View className="items-center flex-1">
              <Text className={`text-xl font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                250+
              </Text>
              <Text className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Products
              </Text>
            </View>
            <View className={`w-px h-10 ${isDark ? 'bg-[#2A2D35]' : 'bg-gray-200'}`} />
            <View className="items-center flex-1">
              <Text className={`text-xl font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                4.8
              </Text>
              <Text className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Rating
              </Text>
            </View>
            <View className={`w-px h-10 ${isDark ? 'bg-[#2A2D35]' : 'bg-gray-200'}`} />
            <View className="items-center flex-1">
              <Text className={`text-xl font-black mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                50K+
              </Text>
              <Text className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Customers
              </Text>
            </View>
          </View>

          {/* Follow Button */}
          <TouchableOpacity
            className={`mt-5 rounded-[25px] overflow-hidden w-full ${
              isFollowing ? 'border border-green-500' : ''
            }`}
            onPress={handleFollowBrand}
            accessibilityLabel={isFollowing ? 'Unfollow brand' : 'Follow brand'}
            accessibilityHint="Get updates from this brand"
          >
            <LinearGradient
              colors={isFollowing ? ['transparent', 'transparent'] : ['#22C55E', '#16A34A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="flex-row items-center justify-center py-3.5 gap-2"
            >
              <Icon
                name={isFollowing ? 'checkmark-circle' : 'add-circle-outline'}
                size={20}
                color={isFollowing ? '#22C55E' : '#FFFFFF'}
              />
              <Text className={`text-base font-bold ${isFollowing ? 'text-green-500' : 'text-white'}`}>
                {isFollowing ? 'Following' : 'Follow Brand'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>

        {/* Category Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-5 mb-4"
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => setSelectedCategory(category.id as any)}
              className={`py-2.5 px-5 rounded-3xl mr-2.5 border ${
                selectedCategory === category.id
                  ? 'bg-green-500 border-transparent'
                  : isDark
                  ? 'bg-[#2A2D35] border-[#2A2D35]'
                  : 'bg-white border-gray-200'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  selectedCategory === category.id
                    ? 'text-white'
                    : isDark
                    ? 'text-gray-400'
                    : 'text-gray-600'
                }`}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Products Grid */}
        <View className="px-5">
          <Text className={`text-xl font-extrabold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Products
          </Text>
          <FlatList
            data={sampleProducts}
            renderItem={renderProductCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={{ justifyContent: 'space-between', marginBottom: 16 }}
            contentContainerStyle={{ paddingBottom: 10 }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default BrandDetailScreen;
