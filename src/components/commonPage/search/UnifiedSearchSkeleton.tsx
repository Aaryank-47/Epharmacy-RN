import React from 'react';
import { View, ScrollView, Dimensions } from 'react-native';
import { useThemePalette } from '../../../hooks/useThemePalette';

const { width } = Dimensions.get('window');
const RECENT_ITEM_WIDTH = (width - 70) / 4;

const UnifiedSearchSkeleton: React.FC = () => {
    const { isDark } = useThemePalette();

    return (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Search Bar Skeleton */}
            <View
                className="flex-row items-center px-4 py-3 pb-4"
                style={{
                    // Mocking the header spacing
                    marginBottom: 4
                }}
            >
                <View
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        marginRight: 8,
                        backgroundColor: isDark ? '#2D3038' : '#E5E7EB',
                    }}
                />
                <View
                    style={{
                        flex: 1,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: isDark ? '#2D3038' : '#E5E7EB',
                    }}
                />

                {/* Camera Placeholder */}
                <View
                    style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        marginLeft: 8,
                        backgroundColor: isDark ? '#2D3038' : '#E5E7EB',
                    }}
                />
            </View>

            {/* Recent Searches Skeleton */}
            <View className="px-5 mt-2">
                <View style={{ width: 140, height: 20, borderRadius: 6, marginBottom: 12, backgroundColor: isDark ? '#2D3038' : '#E5E7EB' }} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {[1, 2, 3, 4].map((item) => (
                        <View key={item} style={{ width: RECENT_ITEM_WIDTH, marginRight: 16 }}>
                            <View style={{ width: '100%', aspectRatio: 1, borderRadius: 100, backgroundColor: isDark ? '#2D3038' : '#E5E7EB' }} />
                            <View style={{ width: '80%', height: 12, borderRadius: 4, marginTop: 8, backgroundColor: isDark ? '#2D3038' : '#E5E7EB' }} />
                        </View>
                    ))}
                </ScrollView>
            </View>

            {/* Popular Searches Skeleton */}
            <View className="px-5 mt-8">
                <View style={{ width: 140, height: 20, borderRadius: 6, marginBottom: 16, backgroundColor: isDark ? '#2D3038' : '#E5E7EB' }} />
                <View className="flex-row flex-wrap justify-between">
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                        <View key={item} style={{ width: '48%', marginBottom: 12 }}>
                            <View style={{ width: '100%', height: 40, borderRadius: 10, backgroundColor: isDark ? '#2D3038' : '#E5E7EB' }} />
                        </View>
                    ))}
                </View>
            </View>

            {/* Trending Now Skeleton */}
            <View className="px-5 mt-6 mb-3">
                <View style={{ width: 120, height: 20, borderRadius: 6, backgroundColor: isDark ? '#2D3038' : '#E5E7EB' }} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
                {[1, 2, 3].map((item) => (
                    <View key={item} style={{ width: 150, marginRight: 12 }}>
                        <View style={{ width: '100%', height: 150, borderRadius: 16, backgroundColor: isDark ? '#2D3038' : '#E5E7EB' }} />
                        <View style={{ width: '80%', height: 14, borderRadius: 4, marginTop: 10, backgroundColor: isDark ? '#2D3038' : '#E5E7EB' }} />
                        <View style={{ width: '50%', height: 12, borderRadius: 4, marginTop: 6, backgroundColor: isDark ? '#2D3038' : '#E5E7EB' }} />
                    </View>
                ))}
            </ScrollView>
            <View className="h-10" />
        </ScrollView>
    );
};

export default UnifiedSearchSkeleton;
