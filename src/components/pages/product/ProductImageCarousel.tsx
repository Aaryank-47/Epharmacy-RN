import React, { memo } from 'react';
import { View, Image, FlatList, TouchableOpacity, ScrollView, Animated, Dimensions, ListRenderItem } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface ProductImageCarouselProps {
    images: string[];
    activeImage: number;
    setActiveImage: (index: number) => void;
    scrollX: Animated.Value;
    imageRef: React.RefObject<FlatList>;
    isDark: boolean;
}

const ProductImageCarousel: React.FC<ProductImageCarouselProps> = memo(({
    images,
    activeImage,
    setActiveImage,
    scrollX,
    imageRef,
    isDark
}) => {
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

    return (
        <View className="w-full justify-center items-center bg-white dark:bg-[#1A1A1A] pb-12">
            <Animated.FlatList
                ref={imageRef}
                data={images}
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

            {/* Dots */}
            <View className="flex-row justify-center items-center w-full mt-2 mb-4">
                {images.map((_, i) => renderDot(i))}
            </View>

            {/* Thumbnails */}
            {images.length > 1 && (
                <View className="w-full px-4 items-start mt-2">
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingRight: 20 }}
                    >
                        {images.map((img, idx) => (
                            <TouchableOpacity
                                key={`thumb-${idx}`}
                                onPress={() => {
                                    setActiveImage(idx);
                                    imageRef.current?.scrollToIndex({ index: idx, animated: true });
                                }}
                                className={`w-16 h-16 rounded-xl mr-3 overflow-hidden border-2 ${activeImage === idx ? 'border-[#40C057]' : 'border-gray-200 dark:border-neutral-700'}`}
                            >
                                <Image source={{ uri: img }} className="w-full h-full" resizeMode="cover" />
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
});

export default ProductImageCarousel;
