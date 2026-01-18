import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, StatusBar, StyleSheet, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LottieView from 'lottie-react-native';

// Components
import ProductImageCarousel from './product/ProductImageCarousel'; // Adjusted path if needed, assuming user moves them there or I put them in correct relative path
import ProductInfoCard from './product/ProductInfoCard';
import ProductBottomBar from './product/ProductBottomBar';
import SimilarProducts from './product/SimilarProducts';
import ShareOverlay from '../commonPage/ShareOverlay';

// Hook
import { useProductDetail } from '../../hooks/useProductDetail';

const ProductDetail: React.FC = () => {
  // Custom Hook (MVVM Pattern)
  const {
    product, isLoading, error, isDark, insets,
    activeImage, setActiveImage, selectedUnit, setSelectedUnit, quantity,
    showShareOptions, setShowShareOptions, showShareArcOverlay, setShowShareArcOverlay,
    scaleValue, bottomBarTranslateY, scrollX, imageRef,
    handleToggleWishlist, handleAddToCart, handleShare, isInWishlist, navigation,
    handleScrollBeginDrag, handleScrollEnd
  } = useProductDetail();

  const shareOptions = [
    { id: 'whatsapp', name: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
    { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
    { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E4405F' },
  ];

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-[#0B0B0B]">
        <LottieView
          source={require('../../assets/animations/Loading 48 _ Mortar & Pestle.json')}
          autoPlay loop style={{ width: 270, height: 270 }}
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
          autoPlay loop style={{ width: 200, height: 200 }}
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
          <TouchableOpacity className="p-2 ml-2" onPress={handleToggleWishlist}>
            <Icon
              name={isInWishlist(product.id) ? "heart" : "heart-outline"}
              size={22}
              color={isInWishlist(product.id) ? "#EF4444" : (isDark ? '#fff' : '#000')}
            />
          </TouchableOpacity>
          <TouchableOpacity className="p-2 ml-2">
            <Icon name="cart-outline" size={22} color={isDark ? '#fff' : '#000'} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        onScrollBeginDrag={handleScrollBeginDrag}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        scrollEventThrottle={16}
      >
        <ProductImageCarousel
          images={product.images}
          activeImage={activeImage}
          setActiveImage={setActiveImage}
          scrollX={scrollX}
          imageRef={imageRef}
          isDark={isDark}
        />

        <ProductInfoCard
          product={product}
          isDark={isDark}
          selectedUnit={selectedUnit}
          setSelectedUnit={setSelectedUnit}
          onShare={() => setShowShareArcOverlay(true)}
        />

        <SimilarProducts productId={product.id} />

      </ScrollView>

      {/* Share Modal */}
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
            onShareWhatsapp={() => handleShare('whatsapp')}
            onShareInsta={() => handleShare('instagram')}
            onShareFB={() => handleShare('facebook')}
            onShareX={() => handleShare('x')}
            onShareTelegram={() => handleShare('telegram')}
          />
        </View>
      )}

      <ProductBottomBar
        product={product}
        quantity={quantity}
        bottomBarTranslateY={bottomBarTranslateY}
        scaleValue={scaleValue}
        onAddToCart={handleAddToCart}
        isDark={isDark}
      />
    </View>
  );
};

export default ProductDetail;
