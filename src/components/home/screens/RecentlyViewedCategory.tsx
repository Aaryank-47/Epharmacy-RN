import React, { useMemo } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, Dimensions, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { getRecentlyViewedCategories } from '../../../api/medicinesApi';
import useThemePalette from '../../../hooks/useThemePalette';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 32) / 4; // 4 items per row logic like CategoriesSection

interface RecentlyViewedCategoryProps {
    transparentBackground?: boolean;
}

const RecentlyViewedCategory = ({ transparentBackground = false }: RecentlyViewedCategoryProps) => {
    const navigation = useNavigation<any>();
    const { isDark } = useThemePalette();

    const { data: apiResponse, isLoading } = useQuery({
        queryKey: ['recentlyViewedCategories'],
        queryFn: getRecentlyViewedCategories,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });

    const categories = useMemo(() => apiResponse?.data?.data || [], [apiResponse]);

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            onPress={() => {
                // Assuming navigation logic similar to CategoriesSection
                // navigation.navigate('Category', { name: item.name, id: item._id });
                console.log('Navigating to category:', item.name);
            }}
            style={{
                width: ITEM_WIDTH,
                alignItems: 'center',
                justifyContent: 'flex-start',
                marginRight: 8,
            }}
            activeOpacity={0.7}
        >
            <LinearGradient
                colors={isDark ? ['#2A2A2A', '#3A3A3A'] : ['#FFF', '#F4F4F6']}
                style={{
                    width: ITEM_WIDTH * 0.8,
                    height: ITEM_WIDTH * 0.8,
                    borderRadius: (ITEM_WIDTH * 0.8) / 2,
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflow: 'hidden',
                    borderWidth: 1,
                    borderColor: isDark ? '#374151' : '#E5E7EB',
                }}
            >
                {item.imageUrl ? (
                    <Image
                        source={{ uri: item.imageUrl }}
                        style={{ width: '100%', height: '100%', borderRadius: (ITEM_WIDTH * 0.8) / 2 }}
                        resizeMode="cover"
                    />
                ) : (
                    <Icon name="image-outline" size={24} color={isDark ? '#555' : '#DDD'} />
                )}
            </LinearGradient>
            <Text
                numberOfLines={1}
                className="mt-1.5 text-xs text-center font-medium"
                style={{
                    color: isDark ? '#E5E7EB' : '#1F2937',
                    width: '100%',
                    paddingHorizontal: 4,
                }}
            >
                {item.name}
            </Text>
        </TouchableOpacity>
    );

    const renderSkeleton = () => (
        <View className="flex-row px-4">
            {[1, 2, 3, 4].map((i) => (
                <View key={i} style={{ width: ITEM_WIDTH, alignItems: 'center', marginRight: 8 }}>
                    <View
                        style={{
                            width: ITEM_WIDTH * 0.8,
                            height: ITEM_WIDTH * 0.8,
                            borderRadius: (ITEM_WIDTH * 0.8) / 2,
                            backgroundColor: isDark ? '#2A2A2A' : '#E5E7EB'
                        }}
                    />
                    <View
                        style={{
                            width: ITEM_WIDTH * 0.6,
                            height: 12,
                            marginTop: 8,
                            borderRadius: 4,
                            backgroundColor: isDark ? '#2A2A2A' : '#E5E7EB'
                        }}
                    />
                </View>
            ))}
        </View>
    );

    if (isLoading) {
        return (
            <View className="mb-4 mt-2">
                <View className="px-5 mb-3">
                    <View style={{ width: 140, height: 20, borderRadius: 4, backgroundColor: isDark ? '#2A2A2A' : '#E5E7EB' }} />
                </View>
                {renderSkeleton()}
            </View>
        );
    }

    if (categories.length === 0) {
        return null;
    }

    const Content = (
        <>
            <View className="px-4 mb-3 flex-row items-center justify-between">
                <Text
                    className="text-lg font-bold tracking-tight"
                    style={{ color: isDark ? '#FFF' : '#1A1A1A' }}
                >
                    Recently Viewed Categories
                </Text>
            </View>

            <FlatList
                data={categories}
                renderItem={renderItem}
                keyExtractor={(item) => item._id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 10 }}
                initialNumToRender={5}
                maxToRenderPerBatch={5}
                windowSize={3}
                removeClippedSubviews={true}
            />
        </>
    );

    if (transparentBackground) {
        return (
            <View className="mb-4 py-0">
                {Content}
            </View>
        );
    }

    return (
        <LinearGradient
            colors={isDark ? ['#121212', '#2A2D35'] : ['#F3F4F6', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            className="mb-4 py-3"
        >
            {Content}
        </LinearGradient>
    );
};

export default React.memo(RecentlyViewedCategory);
