import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, useWindowDimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useThemePalette } from '../../hooks/useThemePalette';

interface Store {
    id: string;
    name: string;
    image: string;
}

const STORES_DATA: Store[] = [
    { id: '1', name: 'Apollo Pharmacy', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRglgqkuZcUG21NU8gfLP_cETrGoTBvJYiQ0Q&s' },
    { id: '2', name: 'MedPlus', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR9j6ZsZ4wFq13mvGYD5R-ae-NunJr6PAqbwQ&s' },
    { id: '3', name: 'Wellness Forever', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXav8OmdpNuTLgRinM-sBtLNrVl_dYgTZ_9A&s' },
    { id: '4', name: 'PharmEasy', image: 'https://www.shutterstock.com/image-vector/medical-store-logo-template-illustration-260nw-2029889303.jpg' },
    { id: '5', name: '1mg', image: 'https://img.freepik.com/premium-vector/medical-store-logo_880781-2359.jpg' },
    { id: '6', name: 'Netmeds', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRiKclBdLl-sdj18LBYROLl3xPdqCdIaazQdQ&s' },
    { id: '7', name: 'Tata 1mg', image: 'https://img.freepik.com/premium-vector/medical-store-logo_880781-2285.jpg' },
    { id: '8', name: 'HealthKart', image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT3qYwNvilVJAd7NX9hwNyYA48gqijCBa9S4Q&s' },
];

interface TopStoresProps {
    loading?: boolean;
}

const TopStores: React.FC<TopStoresProps> = ({ loading = false }) => {
    const { isDark } = useThemePalette();
    const { width: screenWidth } = useWindowDimensions();
    const itemWidth = (screenWidth - 16) / 4; // Same as CategoryItem - 4 items per row

    if (loading) {
        return (
            <View className="py-3">
                <View className="px-4 mb-2">
                    <View
                        className="rounded"
                        style={{
                            width: 100,
                            height: 18,
                            backgroundColor: isDark ? '#2D3038' : '#E5E7EB',
                            opacity: 0.6
                        }}
                    />
                </View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 6, alignItems: 'center' }}
                >
                    {Array.from({ length: 5 }).map((_, i) => {
                        const circleSize = itemWidth * 0.8;
                        return (
                            <View key={i} style={{ width: itemWidth, alignItems: 'center' }}>
                                <View
                                    className="rounded-full"
                                    style={{
                                        width: circleSize,
                                        height: circleSize,
                                        backgroundColor: isDark ? '#2D3038' : '#E5E7EB',
                                        opacity: 0.6
                                    }}
                                />
                                <View
                                    className="mt-1.5 rounded"
                                    style={{
                                        width: itemWidth * 0.6,
                                        height: 12,
                                        backgroundColor: isDark ? '#2D3038' : '#E5E7EB',
                                        opacity: 0.6
                                    }}
                                />
                            </View>
                        );
                    })}
                </ScrollView>
            </View>
        );
    }

    return (
        <View className="py-3">
            <View className="px-4 mb-2 flex-row justify-between items-center">
                <Text
                    className="text-lg font-bold"
                    style={{ color: isDark ? '#fff' : '#1F2937' }}
                >
                    Top Stores
                </Text>
                <TouchableOpacity>
                    <Text className="text-xs font-medium" style={{ color: '#3B82F6' }}>
                        View all
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 8, paddingVertical: 6, alignItems: 'center' }}
            >
                {STORES_DATA.map((store) => {
                    const circleSize = itemWidth * 0.8;
                    const circleRadius = circleSize / 2;

                    return (
                        <TouchableOpacity
                            key={store.id}
                            style={{ width: itemWidth, alignItems: 'center', justifyContent: 'flex-start' }}
                            activeOpacity={0.7}
                        >
                            <LinearGradient
                                colors={isDark ? ['#1E2028', '#2D3038'] : ['#FFF', '#F4F4F6']}
                                style={{
                                    width: circleSize,
                                    height: circleSize,
                                    borderRadius: circleRadius,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    overflow: 'hidden',
                                    borderWidth: 1.5,
                                    borderColor: isDark ? '#3D4451' : '#E5E7EB',
                                }}
                            >
                                <Image
                                    source={{ uri: store.image }}
                                    style={{ width: '100%', height: '100%', borderRadius: circleRadius }}
                                    resizeMode="cover"
                                />
                            </LinearGradient>
                            <Text
                                numberOfLines={1}
                                className="mt-1.5 text-xs text-center font-medium"
                                style={{
                                    color: isDark ? '#E5E7EB' : '#1F2937',
                                    width: '100%',
                                    paddingHorizontal: 4
                                }}
                            >
                                {store.name}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

export default TopStores;
