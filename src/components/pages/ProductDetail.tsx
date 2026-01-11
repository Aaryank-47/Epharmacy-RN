
import React, { useContext, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  Dimensions,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Animated,
  Modal,
  StatusBar,
  ListRenderItem,
  ActivityIndicator,
  Easing,
  StyleSheet,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useQuery } from '@tanstack/react-query';
import { CartContext } from '../../context/CartContext';
import { getItemDetails, addItemToRecentlyViewed } from '../../api/medicinesApi';
import { ItemDetails } from '../../api/types';
import ShareOverlay from '../commonPage/ShareOverlay';

const { width: screenWidth } = Dimensions.get('window');


// --- Types ---

interface Product {
  id: string;
  name: string;
  shortTitle: string;
  images: string[];
  units: string[];
  rating: number;
  reviews: number;
  price: number;
  finalPrice: number;
  discountPercent: number | string;
  gst: string;
  deliveryTime: string;
  description: string;
  benefits: string[];
  safetyAdvice: string[];
  sideEffects: string[];
  howToUse: string;
  ingredients: string[];
  precautions: string[];
  similar: SimilarProduct[];
}

interface SimilarProduct {
  id: string;
  name: string;
  price: number;
  discount: number;
  image: string;
  rating: number;
}

interface ProductDetailProps {
  navigation: any;
  route: any;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ navigation, route }) => {
  // @ts-ignore - CartContext is now exported but types might need checking if strict
  const { addToCart } = useContext(CartContext) || {};
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const productId = route?.params?.productId;

  // Animation for Buy Now Button
  const scaleValue = useRef(new Animated.Value(1)).current;

  // Animation for Bottom Bar Hide on Scroll
  const bottomBarTranslateY = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
        Animated.timing(scaleValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.ease),
        }),
      ]),
    ).start();
  }, [scaleValue]);

  // Track Recently Viewed
  React.useEffect(() => {
    if (productId) {
      addItemToRecentlyViewed(productId)
        .then(() => {})
        .catch(() => {});
    }
  }, [productId]);

  // Fetch product data
  const { data: apiResponse, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => getItemDetails(productId),
    enabled: !!productId,
  });

  const apiData = apiResponse?.data?.data;

  // Map API data to UI Product Interface safely
  const product: Product | null = useMemo(() => {
    if (!apiData) return null;

    const unitList = [];
    if (apiData.units?.parent?.name) unitList.push(apiData.units.parent.name);
    if (apiData.units?.child?.name) unitList.push(apiData.units.child.name);
    if (unitList.length === 0) unitList.push('Standard Unit');

    return {
      id: apiData._id,
      name: apiData.itemName,
      shortTitle: apiData.otherInformation?.howToUse || apiData.itemDescription || '',
      images: apiData.itemImages?.length > 0 ? apiData.itemImages : ['https://via.placeholder.com/800x600.png?text=No+Image'],
      units: unitList,
      rating: apiData.itemRatings || 0,
      reviews: 0,
      price: apiData.itemInitialPrice,
      finalPrice: apiData.itemFinalPrice,
      discountPercent: apiData.itemDiscount,
      gst: `${apiData.gst?.rate || 0}%`,
      deliveryTime: apiData.deliveryTime || '2 - 4 days',
      description: apiData.itemDescription || 'No description available',
      benefits: apiData.otherInformation?.benefits || [],
      safetyAdvice: apiData.otherInformation?.safetyAdvice || [],
      sideEffects: apiData.otherInformation?.sideEffects || [],
      howToUse: apiData.otherInformation?.howToUse || '',
      ingredients: apiData.otherInformation?.ingredients || [],
      precautions: apiData.otherInformation?.precautions || [],
      similar: [],
    };
  }, [apiData]);


  const [activeImage, setActiveImage] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const imageRef = useRef<FlatList>(null);
  const [selectedUnit, setSelectedUnit] = useState<string>('');

  // Update selected unit when product loads
  React.useEffect(() => {
    if (product && product.units.length > 0) {
      setSelectedUnit(product.units[0]);
    }
  }, [product]);

  const [quantity, setQuantity] = useState(1);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showShareArcOverlay, setShowShareArcOverlay] = useState(false);

  const shareOptions = [
    { id: 'whatsapp', name: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
    { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
    { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E4405F' },
  ];

  const handleShare = (platform: string) => {
    setShowShareOptions(false);
    };

  const renderImage: ListRenderItem<string> = ({ item }) => (
    <View className="items-center justify-center p-2" style={{ width: screenWidth, height: screenWidth * 0.80 }}>
      <Image
        source={{ uri: item }}
        className="w-full h-full rounded-[30px]"
        resizeMode="cover"
      />
    </View>
  );

  const renderDot = (idx: number) => {
    const inputRange = [
      (idx - 1) * screenWidth,
      idx * screenWidth,
      (idx + 1) * screenWidth,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1.4, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.6, 1, 0.6],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        key={`dot-${idx}`}
        style={{
          transform: [{ scale }],
          opacity,
        }}
        className={`w-1.5 h-1.5 rounded-full mx-1 ${isDark ? 'bg-white' : 'bg-black'}`}
      />
    );
  };

  const renderUnit = (unit: string) => (
    <TouchableOpacity
      key={unit}
      className={`px-4 py-2.5 rounded-xl mr-2.5 border ${selectedUnit === unit
        ? isDark
          ? 'border-[#40C057] bg-[#40C057]/20'
          : 'border-[#40C057] bg-[#40C057]/10'
        : isDark
          ? 'border-neutral-700 bg-neutral-800'
          : 'border-gray-200 bg-gray-50'
        }`}
      onPress={() => setSelectedUnit(unit)}
    >
      <Text className={`text-sm font-semibold ${selectedUnit === unit
        ? 'text-[#40C057]'
        : isDark ? 'text-white' : 'text-neutral-800'
        }`}>
        {unit}
      </Text>
    </TouchableOpacity>
  );

  const renderSimilarProduct: ListRenderItem<SimilarProduct> = ({ item }) => (
    <TouchableOpacity
      className="w-[150px] rounded-xl mr-4 overflow-hidden shadow-sm bg-white dark:bg-neutral-800"
      onPress={() => navigation.push('ProductDetail', { productId: item.id, product: item })}
    >
      <View className="relative">
        <Image source={{ uri: item.image }} className="w-[150px] h-[120px]" />
        {item.discount > 0 && (
          <View className="absolute top-2 right-2 bg-[#FA5252] px-1.5 py-0.5 rounded">
            <Text className="text-white text-[10px] font-bold">-{item.discount}%</Text>
          </View>
        )}
      </View>
      <View className="p-3">
        <Text className="text-sm font-semibold mb-1.5 h-9 text-neutral-800 dark:text-white" numberOfLines={2}>
          {item.name}
        </Text>
        <View className="flex-row items-center mb-1">
          <Icon name="star" size={12} color="#FFD166" />
          <Text className="text-xs ml-1 text-gray-500 dark:text-gray-400">
            {item.rating}
          </Text>
        </View>
        <View className="flex-row items-baseline gap-1">
          <Text className="text-sm font-bold text-neutral-800 dark:text-white">
            ₹{item.price}
          </Text>
          {item.discount > 0 && (
            <Text className="text-xs text-gray-400 line-through">
              ₹{Math.round(item.price * 100 / (100 - item.discount))}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-[#0B0B0B]">
        <LottieView
          source={require('../../assets/animations/Loading 48 _ Mortar & Pestle.json')}
          autoPlay
          loop
          style={{ width: 270, height: 270 }}
        />
        <Text className="mt-[-20px] text-gray-500 dark:text-gray-400 font-medium">Loading details...</Text>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-[#0B0B0B] p-5">
        <LottieView
          source={require('../../assets/animations/404 Lost in Space.json')}
          autoPlay
          loop
          style={{ width: 200, height: 200 }}
        />
        <Text className="mt-[-10px] text-lg font-bold text-neutral-900 dark:text-white text-center">
          Failed to load product
        </Text>
        <TouchableOpacity
          className="mt-6 px-6 py-3 bg-[#40C057] rounded-full"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-white font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#0B0B0B]">
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        className="flex-row items-center justify-between px-4 py-3 z-10 bg-white dark:bg-[#1A1A1A] shadow-sm"
        style={{ paddingTop: Math.max(12) }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
          <Icon name="arrow-back" size={24} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-black dark:text-white">Product Details</Text>
        <View className="flex-row items-center">
          <TouchableOpacity className="p-2 ml-2" onPress={() => { }}>
            <Icon name="heart-outline" size={22} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
          <TouchableOpacity className="p-2 ml-2" onPress={() => navigation.navigate('Cart')}>
            <Icon name="cart-outline" size={22} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }} // Space for bottom bar
        onScrollBeginDrag={() => {
          Animated.timing(bottomBarTranslateY, {
            toValue: 200, // Move down
            duration: 300,
            useNativeDriver: true,
            easing: Easing.ease,
          }).start();
        }}
        onMomentumScrollEnd={() => {
          Animated.timing(bottomBarTranslateY, {
            toValue: 0, // Move up
            duration: 300,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }).start();
        }}
        onScrollEndDrag={() => {
          // Also handle end drag if momentum doesn't kick in
          Animated.timing(bottomBarTranslateY, {
            toValue: 0, // Move up
            duration: 300,
            useNativeDriver: true,
            easing: Easing.out(Easing.ease),
          }).start();
        }}
        scrollEventThrottle={16}
      >
        {/* Image carousel and Thumbnails */}
        <View className="w-full justify-center items-center bg-white dark:bg-[#1A1A1A] pb-12">
          <Animated.FlatList
            ref={imageRef}
            data={product.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            renderItem={renderImage}
            keyExtractor={(_, idx) => `img-${idx}`}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            onMomentumScrollEnd={(ev) => {
              const idx = Math.round(ev.nativeEvent.contentOffset.x / screenWidth);
              setActiveImage(idx);
            }}
          />

          {/* Dots - Relative Position */}
          <View className="flex-row justify-center items-center w-full mt-2 mb-4">
            {product.images.map((_, i) => renderDot(i))}
          </View>

          {/* Thumbnails - Left Aligned */}
          {product.images.length > 1 && (
            <View className="w-full px-4 items-start">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 20 }}
              >
                {product.images.map((img, idx) => (
                  <TouchableOpacity
                    key={`thumb-${idx}`}
                    onPress={() => {
                      setActiveImage(idx);
                      imageRef.current?.scrollToIndex({ index: idx, animated: true });
                    }}
                    className={`w-16 h-16 rounded-xl mr-3 overflow-hidden border-2 ${activeImage === idx ? 'border-[#40C057]' : 'border-gray-200 dark:border-neutral-700'
                      }`}
                  >
                    <Image source={{ uri: img }} className="w-full h-full" resizeMode="cover" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Product details card */}
        <View className="-mt-6 rounded-t-[24px] px-5 py-6 bg-white dark:bg-[#1A1A1A] shadow-lg">
          {/* Product title and price */}
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-xl font-bold flex-1 mr-4 text-neutral-900 dark:text-white">
              {product.name}
            </Text>
            <View className="items-end">
              <Text className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                ₹{product.finalPrice}
              </Text>
              {Number(product.discountPercent) > 0 && (
                <Text className="text-base text-gray-400 line-through mt-0.5">
                  ₹{product.price}
                </Text>
              )}
            </View>
          </View>

          {/* Discount badge */}
          {Number(product.discountPercent) > 0 && (
            <View className="mb-3">
              <View className="bg-[#FA5252] px-2.5 py-1 rounded-md self-start">
                <Text className="text-white font-bold text-xs">
                  {product.discountPercent}% OFF
                </Text>
              </View>
            </View>
          )}

          {/* Rating and reviews */}
          <View className="flex-row items-center mb-2">
            <View className="flex-row mr-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={star}
                  name={star <= Math.floor(product.rating) ? "star" : "star-outline"}
                  size={16}
                  color="#FFD166"
                />
              ))}
            </View>
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              {product.reviews.toLocaleString()} reviews
            </Text>
          </View>

          {/* Trust Markers */}
          <View className="flex-row items-center justify-between mb-5 mt-2 bg-gray-50 dark:bg-neutral-800 p-3 rounded-xl border border-gray-100 dark:border-neutral-700">
            <View className="flex-row items-center gap-1.5">
              <Icon name="shield-checkmark" size={16} color="#40C057" />
              <Text className="text-xs font-semibold text-neutral-700 dark:text-gray-300">100% Genuine</Text>
            </View>
            <View className="h-4 w-[1px] bg-gray-300 dark:bg-neutral-600" />
            <View className="flex-row items-center gap-1.5">
              <Icon name="cube-outline" size={16} color="#228BE6" />
              <Text className="text-xs font-semibold text-neutral-700 dark:text-gray-300">Easy Returns</Text>
            </View>
            <View className="h-4 w-[1px] bg-gray-300 dark:bg-neutral-600" />
            <View className="flex-row items-center gap-1.5">
              <Icon name="ribbon-outline" size={16} color="#FAB005" />
              <Text className="text-xs font-semibold text-neutral-700 dark:text-gray-300">Top Rated</Text>
            </View>
          </View>

          {/* Safety Advice Card (New) */}
          {product.safetyAdvice.length > 0 && (
            <View className="mb-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <View className="flex-row items-center mb-2">
                <Icon name="warning-outline" size={20} color="#F59F00" />
                <Text className="ml-2 text-base font-bold text-amber-900 dark:text-amber-500">
                  Safety Advice
                </Text>
              </View>
              {product.safetyAdvice.map((advice, idx) => (
                <View key={idx} className="flex-row items-start mt-1.5">
                  <View className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 mr-2" />
                  <Text className="text-sm text-amber-800 dark:text-amber-200 flex-1 leading-5">
                    {advice}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Short description */}
          <Text className="text-base text-gray-500 dark:text-gray-400 mb-4">
            {product.shortTitle}
          </Text>

          {/* Benefits */}
          {product.benefits && product.benefits.length > 0 && (
            <View className="mb-5">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-lg font-bold text-neutral-900 dark:text-white">Key Benefits</Text>
                <TouchableOpacity
                  className="w-9 h-9 rounded-full border justify-center items-center ml-3 border-black dark:border-[#FF69B4]"
                  onPress={() => setShowShareOptions(true)}
                >
                  <Icon name="share-social" size={16} color={isDark ? '#FF69B4' : '#000'} />
                </TouchableOpacity>
              </View>
              {product.benefits.map((benefit, index) => (
                <View key={index} className="flex-row items-center mt-2.5">
                  <View className="w-6 h-6 rounded-full justify-center items-center mr-2.5 bg-gray-100 dark:bg-neutral-800">
                    <Icon name="checkmark" size={16} color="#40C057" />
                  </View>
                  <Text className="text-sm flex-1 text-gray-500 dark:text-gray-400">
                    {benefit}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Ingredients (New) */}
          {product.ingredients.length > 0 && (
            <View className="mb-5">
              <Text className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Ingredients</Text>
              <View className="flex-row flex-wrap gap-2">
                {product.ingredients.map((item, idx) => (
                  <View key={idx} className="bg-gray-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-neutral-700">
                    <Text className="text-xs font-medium text-gray-700 dark:text-gray-300">{item}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Side Effects (New) */}
          {product.sideEffects.length > 0 && (
            <View className="mb-5">
              <Text className="text-lg font-bold text-neutral-900 dark:text-white mb-2">Side Effects</Text>
              <View className="bg-rose-50 dark:bg-rose-900/10 rounded-xl p-4 border border-rose-100 dark:border-rose-900/30">
                {product.sideEffects.map((effect, idx) => (
                  <View key={idx} className="flex-row items-center mb-1">
                    <Icon name="alert-circle" size={14} color="#FA5252" />
                    <Text className="text-sm text-gray-600 dark:text-gray-300 ml-2">{effect}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Unit selection */}
          <View className="mb-5">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-bold text-neutral-900 dark:text-white">
                Select Unit
              </Text>
              <TouchableOpacity
                className={`w-10 h-10 rounded-full justify-center items-center border ${isDark ? 'border-neutral-700 bg-neutral-800' : 'border-gray-200 bg-white'
                  }`}
                style={{ marginTop: 8 }}
                onPress={() => setShowShareArcOverlay(true)}
              >
                <Icon name="share-social-outline" size={22} color="#40C057" />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-1"
              contentContainerStyle={{ paddingHorizontal: 4 }}
            >
              {product.units.map(renderUnit)}
            </ScrollView>
          </View>

          {/* Description */}
          <View className="mb-5">
            <Text className="text-lg font-bold mb-3 text-neutral-900 dark:text-white">
              Description
            </Text>
            <Text className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
              {product.description}
            </Text>
          </View>

          {/* Delivery info */}
          <View className="flex-row items-center p-4 rounded-xl mb-4 bg-gray-50 dark:bg-neutral-800">
            <Icon name="time-outline" size={24} color="#40C057" />
            <View className="ml-3 flex-1">
              <Text className="text-base font-semibold mb-1 text-neutral-900 dark:text-white">
                Delivery in {product.deliveryTime}
              </Text>
              <Text className="text-sm text-gray-500 dark:text-gray-400">
                Order in the next 2 hours to get it by {product.deliveryTime}
              </Text>
            </View>
          </View>

          {/* GST info */}
          <View className="mb-5">
            <Text className="text-sm text-gray-500 dark:text-gray-400">
              GST: {product.gst}
            </Text>
          </View>
        </View>

        {/* Similar products */}
        {product.similar.length > 0 && (
          <View className="px-5 pb-5">
            <Text className="text-lg font-bold mb-4 text-neutral-900 dark:text-white">
              Similar Products
            </Text>
            <FlatList
              data={product.similar}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              renderItem={renderSimilarProduct}
              contentContainerStyle={{ paddingRight: 20 }}
            />
          </View>
        )}
      </ScrollView>

      {/* Share Options Modal */}
      <Modal
        visible={showShareOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowShareOptions(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-center items-center p-5"
          activeOpacity={1}
          onPress={() => setShowShareOptions(false)}
        >
          <View className="w-4/5 rounded-xl overflow-hidden shadow-xl bg-white dark:bg-[#1A1A1A]">
            <View>
              {shareOptions.map((option, index) => (
                <TouchableOpacity
                  key={option.id}
                  className={`flex-row items-center p-4 ${index < shareOptions.length - 1 ? 'border-b border-gray-100 dark:border-neutral-800' : ''}`}
                  onPress={() => handleShare(option.id)}
                >
                  <Icon name={option.icon} size={24} color={option.color} />
                  <Text className="text-base font-semibold ml-3 text-neutral-900 dark:text-white">
                    {option.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ARC Share Overlay */}
      {showShareArcOverlay && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]} pointerEvents="box-none">
          <Animated.View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setShowShareArcOverlay(false)} />
          </Animated.View>
          <ShareOverlay
            onClose={() => setShowShareArcOverlay(false)}
            onShareWhatsapp={() => {}}
            onShareInsta={() => {}}
            onShareFB={() => {}}
            onShareTelegram={() => {}}
          />
        </View>
      )}

      {/* Floating Premium Bottom Bar */}
      <Animated.View
        className="absolute bottom-4 left-2 right-2"
        style={{ transform: [{ translateY: bottomBarTranslateY }] }}
      >
        <View
          className="flex-row items-center justify-between p-3 pl-6 rounded-[24px] shadow-xl w-full"
          style={{
            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 8,
            elevation: 4,
            borderWidth: isDark ? 2 : 0, // w-0.5 is approx 2px
            borderColor: isDark ? '#374151' : 'transparent', // dark gray for border
          }}
        >
          {/* Price Section - Simplified */}
          <View>
            <Text className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-0.5">
              Final Price
            </Text>
            <Text className="text-2xl font-bold text-neutral-900 dark:text-white">
              ₹{product.finalPrice * quantity}
            </Text>
          </View>

          {/* Action Buttons */}
          <View className="flex-row items-center gap-3">

            {/* Add to Cart - Minimalist
            <TouchableOpacity
              className="w-12 h-12 rounded-full items-center justify-center border border-gray-200 dark:border-neutral-700 bg-gray-50 dark:bg-neutral-800"
              activeOpacity={0.7}
              onPress={() => {
                if (addToCart && product) {
                  addToCart({
                    id: product.id,
                    name: product.name,
                    price: product.finalPrice,
                    quantity: quantity
                  });
                  navigation.navigate('CheckoutPage');
                }
              }}
            >
              <Icon name="cart-outline" size={22} color={isDark ? '#FFF' : '#333'} />
            </TouchableOpacity> */}

            {/* Buy Now - Animated & Premium */}
            <Animated.View style={{ transform: [{ scale: scaleValue }] }}>
              <TouchableOpacity
                className="flex-row items-center justify-center h-12 px-6 rounded-full bg-[#40C057] shadow-lg shadow-green-500/40"
                activeOpacity={0.9}
                onPress={() => {
                  // Add professional press animation here later if needed, utilizing standard Touchable feedback for now which is professional
                }}
              >
                <Text className="text-white font-bold text-base mr-2 tracking-wide">Buy Now</Text>
                <Icon name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default ProductDetail;
