import React, { useEffect, useRef, memo, useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Dimensions, Animated, Image, ToastAndroid } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemePalette } from '../../../hooks/useThemePalette';
import { useDealsOfTheDay } from '../../../hooks/useDealsOfTheDay';
import { useCart } from '../../../context/CartContext';
import { useWishlist } from '../../../context/WishlistContext';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width: screenWidth } = Dimensions.get('window');

const SkeletonShimmer = memo<{ width: number | string; height: number; borderRadius?: number }>(({ width, height, borderRadius = 8 }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const { isDark } = useThemePalette();

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] });

  return <Animated.View style={{ width: width as any, height, borderRadius, opacity, backgroundColor: isDark ? '#374151' : '#E5E7EB' }} />;
});

const TimerIcon = memo<{ isDark: boolean }>(({ isDark }) => {
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -17, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 17, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -17, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 17, duration: 100, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        Animated.delay(800),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [shakeAnim]);

  return (
    <Animated.View style={{ transform: [{ rotate: shakeAnim.interpolate({ inputRange: [-15, 15], outputRange: ['-15deg', '15deg'] }) }] }}>
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? 'rgba(251, 191, 36, 0.15)' : 'rgba(245, 158, 11, 0.15)', justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="time-outline" size={18} color={isDark ? '#FBBF24' : '#DC2626'} />
      </View>
    </Animated.View>
  );
});

const DealCard = memo<{ item: any; isDark: boolean; accentColor: string; onPress: () => void; onAddToCart: () => void; isInCart: boolean; onToggleWishlist: (item: any) => void; isInWishlist: boolean }>(
  ({ item, isDark, onPress, onToggleWishlist, isInWishlist }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const images = item.itemImages || [];
    const hasMultipleImages = images.length > 1;

    useEffect(() => {
      if (!hasMultipleImages || isPaused) return;

      const interval = setInterval(() => {
        setCurrentImageIndex(prev => (prev + 1) % images.length);
      }, 2000);

      return () => clearInterval(interval);
    }, [hasMultipleImages, images.length, isPaused]);

    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={() => setIsPaused(true)}
        onPressOut={() => setIsPaused(false)}
        style={{ width: (screenWidth - 18) / 2, marginHorizontal: 3, backgroundColor: isDark ? '#1F2937' : '#FFFFFF', borderRadius: 12, shadowOpacity: isDark ? 0.2 : 0.0, shadowRadius: 4, overflow: 'hidden', marginBottom: 0 }}
      >
        <View style={{ height: 190, width: '100%', backgroundColor: isDark ? '#374151' : '#F5F5F5', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          <View style={{ width: '100%', height: '100%' }}>
            <Image source={{ uri: images[currentImageIndex] || '' }} style={{ width: '100%', height: '100%', borderTopLeftRadius: 16, borderTopRightRadius: 26 }} resizeMode="contain" />
          </View>
          {item.itemDiscount && (
            <View style={{ position: 'absolute', top: 0, left: 0, backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 4, borderTopLeftRadius: 16, borderBottomRightRadius: 12, shadowColor: '#10B981', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 }}>
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 }}>-{item.itemDiscount}% OFF</Text>
            </View>
          )}
          <TouchableOpacity onPress={(e) => { e.stopPropagation(); onToggleWishlist(item); }} activeOpacity={0.7} style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.95)', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 }}>
            <Ionicons name={isInWishlist ? 'heart' : 'heart-outline'} size={18} color={isInWishlist ? '#EF4444' : (isDark ? '#E5E7EB' : '#EF4444')} />
          </TouchableOpacity>
          <View style={{ position: 'absolute', bottom: 8, left: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: isDark ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.95)', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: isDark ? '#E5E7EB' : '#111827' }}>{item.itemRatings ? item.itemRatings.toFixed(1) : '4.5'}</Text>
            <Ionicons name="star" size={11} color="#10B981" style={{ marginLeft: 2, marginRight: 2 }} />
            <Text style={{ fontSize: 10, fontWeight: '400', color: isDark ? '#9CA3AF' : '#6B7280' }}>({item.itemReviews || '100'})</Text>
          </View>
        </View>
        <View style={{ padding: 8 }}>
          <Text numberOfLines={2} ellipsizeMode="tail" style={{ fontSize: 13, fontWeight: '400', color: isDark ? '#D1D5DB' : '#374151', marginBottom: 6, lineHeight: 17 }}>{item.itemName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              {item.itemInitialPrice && item.itemInitialPrice !== item.itemFinalPrice && (
                <Text style={{ fontSize: 11, color: isDark ? '#6B7280' : '#9CA3AF', textDecorationLine: 'line-through', marginBottom: 2, fontWeight: '400' }}>
                  ₹{item.itemInitialPrice.toLocaleString('en-IN')}
                </Text>
              )}
              <Text style={{ fontSize: 17, fontWeight: '700', color: isDark ? '#FFFFFF' : '#111827', letterSpacing: -0.2 }}>
                ₹{(item.itemFinalPrice || 0).toLocaleString('en-IN')}
              </Text>
            </View>
            <TimerIcon isDark={isDark} />
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

const DealOfDaySection: React.FC<{ visible?: boolean; onReady?: () => void }> = ({ visible = false, onReady }) => {
  const navigation = useNavigation<any>();
  const { isDark, accentColor } = useThemePalette();
  const { addToCart, isInCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { data, isLoading, error } = useDealsOfTheDay();
  const deals = data?.deals || [];
  const totalDeals = data?.totalDeals || 0;

  useEffect(() => {
    if (!isLoading) {
      onReady?.();
    }
  }, [isLoading, onReady]);

  const handleAddToCart = useCallback((item: any) => {
    const itemId = item._id || item.id;
    if (isInCart(itemId)) {
      ToastAndroid.show('Item already in cart', ToastAndroid.SHORT);
      return;
    }
    addToCart({ id: itemId, name: item.itemName, price: item.itemFinalPrice || 0, quantity: 1 });
    ToastAndroid.show('Added to cart', ToastAndroid.SHORT);
  }, [addToCart, isInCart]);

  const handleToggleWishlist = useCallback((item: any) => {
    if (!item || !item._id) {
      console.warn('Invalid item passed to handleToggleWishlist');
      return;
    }
    const itemId = item._id;
    if (isInWishlist(itemId)) {
      removeFromWishlist(itemId);
    } else {
      addToWishlist({ 
        _id: itemId, 
        itemName: item.itemName, 
        itemFinalPrice: item.itemFinalPrice || 0, 
        image: item.itemImages?.[0] || '',
        itemImages: item.itemImages || []
      });
    }
  }, [addToWishlist, removeFromWishlist, isInWishlist]);

  const handleProductPress = useCallback((item: any) => {
    const itemId = item._id || item.id;
    if (itemId) navigation.navigate('ProductDetail', { productId: itemId });
  }, [navigation]);

  const gradientColors = useMemo(() => (isDark ? ['#181A20', '#2A2D35'] : ['#F9FAFB', '#F3F4F6']), [isDark]);
  const timerGradient = useMemo(() => (isDark ? ['#7F1D1D', '#991B1B'] : ['#FEE2E2', '#FECACA']), [isDark]);

  if (!visible) return null;
  if (!isLoading && totalDeals < 3) return null;

  const showShimmer = isLoading || error || deals.length === 0;

  return (
    <LinearGradient colors={gradientColors} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ marginTop: 0, paddingVertical: 24 }}>
      <View style={{ marginHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name="flash-outline" size={18} color={isDark ? '#FBBF24' : '#F59E0B'} style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 16, fontWeight: '800', color: isDark ? '#FFFFFF' : '#111827', letterSpacing: -0.5 }}>DEAL OF THE DAY</Text>
          </View>
          <Text style={{ fontSize: 12, color: isDark ? '#9CA3AF' : '#6B7280', fontWeight: '500', marginLeft: 24 }}>Prices slashed for 24 hours!</Text>
        </View>
        <LinearGradient colors={timerGradient} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: isDark ? '#B91C1C' : '#FCA5A5' }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: isDark ? '#FECACA' : '#DC2626', fontVariant: ['tabular-nums'] }}>12:00:00 LEFT</Text>
        </LinearGradient>
      </View>
      {showShimmer ? (
        <FlatList horizontal showsHorizontalScrollIndicator={false} data={[1, 2, 3, 4]} keyExtractor={(_, i) => `shimmer-${i}`} contentContainerStyle={{ paddingHorizontal: 12 }} renderItem={() => (
          <View style={{ width: screenWidth * 0.46, marginRight: 12, backgroundColor: isDark ? '#1A1C23' : '#FFFFFF', borderRadius: 12, padding: 8, borderWidth: 1, borderColor: isDark ? '#2D3038' : '#F3F4F6' }}>
            <SkeletonShimmer width="100%" height={120} borderRadius={8} />
            <View style={{ marginTop: 12 }}>
              <SkeletonShimmer width="80%" height={14} borderRadius={4} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <View>
                <SkeletonShimmer width={60} height={16} borderRadius={4} />
                <View style={{ marginTop: 4 }}>
                  <SkeletonShimmer width={40} height={10} borderRadius={4} />
                </View>
              </View>
              <SkeletonShimmer width={32} height={32} borderRadius={16} />
            </View>
          </View>
        )} />
      ) : (
        <FlatList horizontal showsHorizontalScrollIndicator={false} data={deals} keyExtractor={(item) => item._id || item.itemName || String(Math.random())} contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 12 }} renderItem={({ item }) => (
          <DealCard item={item} isDark={isDark} accentColor={accentColor} onPress={() => handleProductPress(item)} onAddToCart={() => handleAddToCart(item)} isInCart={isInCart(item._id || (item as any).id)} onToggleWishlist={() => handleToggleWishlist(item)} isInWishlist={isInWishlist(item._id || (item as any).id)} />
        )} />
      )}
    </LinearGradient>
  );
};

export default memo(DealOfDaySection);
