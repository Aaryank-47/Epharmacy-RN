import React from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Dimensions, Animated, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { getRecentlyViewedItems } from '../../../api/medicinesApi';
import useThemePalette from '../../../hooks/useThemePalette';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.46; // Larger cards (~160-170px)

interface RecentlyViewedSectionProps {
    transparentBackground?: boolean;
}

const RecentlyViewedSection = ({ transparentBackground = false }: RecentlyViewedSectionProps) => {
    const navigation = useNavigation<any>();
    const { isDark, accentColor, surfaceColor } = useThemePalette();

    const { data: apiResponse, isLoading } = useQuery({
        queryKey: ['recentlyViewed'],
        queryFn: getRecentlyViewedItems,
    });

    const recentlyViewedItems = apiResponse?.data?.data || [];

    // Skeleton Animation Hooks - Must be before early return!
    const opacityValue = React.useRef(new Animated.Value(0.3)).current;
    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(opacityValue, { toValue: 1, duration: 1000, useNativeDriver: true }),
                Animated.timing(opacityValue, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
            ])
        ).start();
    }, [opacityValue]);

    if (recentlyViewedItems.length === 0 && !isLoading) {
        return null;
    }

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            onPress={() => navigation.push('ProductDetail', { productId: item._id })}
            activeOpacity={0.9}
            style={[
                styles.card,
                {
                    backgroundColor: isDark ? '#1E2028' : '#FFFFFF',
                    shadowColor: isDark ? '#000' : '#000',
                    shadowOpacity: isDark ? 0.3 : 0.08,
                    shadowRadius: 10,
                    elevation: 4,
                    borderWidth: isDark ? 1 : 0,
                    borderColor: isDark ? '#2D3038' : 'transparent',
                }
            ]}
        >
            {/* Image Container with Soft Background */}
            <View className="p-3">
                <View
                    style={{ backgroundColor: isDark ? '#2A2D38' : '#F3F4F6' }}
                    className="h-[140px] w-full rounded-[20px] items-center justify-center overflow-hidden"
                >
                    {item.itemImages && item.itemImages[0] ? (
                        <Image
                            source={{ uri: item.itemImages[0] }}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    ) : (
                        <Icon name="image-outline" size={32} color={isDark ? '#555' : '#DDD'} />
                    )}

                    {/* Floating 'View' Action */}
                    <View
                        className="absolute bottom-2 right-2 w-8 h-8 rounded-full items-center justify-center shadow-sm"
                        style={{ backgroundColor: isDark ? '#3A3A3A' : '#FFF' }}
                    >
                        <Icon name="arrow-forward" size={14} color={accentColor} />
                    </View>
                </View>
            </View>

            {/* Info Section */}
            <View className="px-3 pb-4">
                <Text
                    numberOfLines={1}
                    className="text-[10px] uppercase font-bold tracking-wider opacity-60 mb-1"
                    style={{ color: isDark ? '#AAA' : '#888' }}
                >
                    Recently Viewed
                </Text>

                <Text
                    className="text-sm font-bold mb-1 leading-5"
                    numberOfLines={2}
                    style={{ color: isDark ? '#FFF' : '#1A1A1A' }}
                >
                    {item.itemName}
                </Text>

                <Text
                    className="text-xs font-bold mb-1 leading-5"
                    numberOfLines={2}
                    style={{ color: isDark ? '#ffffffd8' : '#1A1A1A' }}
                >
                    {item.itemDescription}
                </Text>
                <View className="flex-row items-center mt-1">
                    {item.itemFinalPrice ? (
                        <Text
                            className="text-base font-extrabold"
                            style={{ color: accentColor }}
                        >
                            ₹{item.itemFinalPrice}
                        </Text>
                    ) : (
                        <Text className="text-sm text-gray-400">Out of Stock</Text>
                    )}
                </View>
            </View>
        </TouchableOpacity>
    );

    // Skeleton Animation Hooks moved to top

    const renderSkeleton = () => (
        <View className="flex-row px-5">
            {[1, 2, 3].map((i) => (
                <View
                    key={i}
                    style={{ width: CARD_WIDTH, marginRight: 16 }}
                    className="rounded-[24px] overflow-hidden bg-white dark:bg-[#1E2028] p-3"
                >
                    <Animated.View style={{ opacity: opacityValue }} className="h-[140px] w-full rounded-[20px] bg-gray-100 dark:bg-[#2A2D38] mb-3" />
                    <Animated.View style={{ opacity: opacityValue }} className="h-3 w-16 bg-gray-100 dark:bg-neutral-800 rounded mb-2" />
                    <Animated.View style={{ opacity: opacityValue }} className="h-4 w-full bg-gray-100 dark:bg-neutral-800 rounded mb-3" />
                    <Animated.View style={{ opacity: opacityValue }} className="h-5 w-20 bg-gray-100 dark:bg-neutral-800 rounded" />
                </View>
            ))}
        </View>
    );

    if (isLoading) {
        return (
            <View className="mb-8 mt-2">
                <View className="px-5 mb-4">
                    <Animated.View style={{ opacity: opacityValue }} className="h-6 w-40 bg-gray-200 dark:bg-neutral-800 rounded" />
                </View>
                {renderSkeleton()}
            </View>
        );
    }

    if (transparentBackground) {
        return (
            <View className="mb-0 py-0">
                <View className="px-4 mb-2 flex-row items-center justify-between">
                    <Text
                        className="text-xl font-bold tracking-tight"
                        style={{ color: isDark ? '#FFF' : '#1A1A1A' }}
                    >
                        Pick up where you left off
                    </Text>
                </View>

                <FlatList
                    data={recentlyViewedItems}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 9, paddingBottom: 10, paddingTop: 10 }}
                    snapToInterval={CARD_WIDTH + 12}
                    decelerationRate="fast"
                />
            </View>
        );
    }

    return (
        <LinearGradient
            colors={isDark ? ['#121212', '#2A2D35'] : ['#FFFFFF', '#F3F4F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="mb-0 py-0"
        >
            <View className="px-4 mb-2 flex-row items-center justify-between">
                <Text
                    className="text-xl font-bold tracking-tight"
                    style={{ color: isDark ? '#FFF' : '#1A1A1A' }}
                >
                    Pick up where you left off
                </Text>
            </View>

            <FlatList
                data={recentlyViewedItems}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 9, paddingBottom: 10, paddingTop: 10 }}
                snapToInterval={CARD_WIDTH + 12}
                decelerationRate="fast"
            />
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    card: {
        width: CARD_WIDTH,
        marginRight: 12,
        borderRadius: 24,
        borderWidth: 1,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 2,
    }
});

export default RecentlyViewedSection;
