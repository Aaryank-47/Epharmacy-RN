import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, LayoutAnimation } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemePalette } from '../../../hooks/useThemePalette';

interface FilterBarProps {
    onFilterPress: () => void;
    showStores: boolean;
    onToggleStores: () => void;
    translateY?: Animated.AnimatedInterpolation<number>;
}

const FilterBar: React.FC<FilterBarProps> = ({
    onFilterPress,
    showStores,
    onToggleStores,
    translateY
}) => {
    const { isDark } = useThemePalette();
    const gradientColors = isDark ? ['#000000ff', '#191b1fff'] : ['#FFFFFF', '#F3F4F6'];

    return (
        <Animated.View
            style={{
                position: 'absolute',
                top: 60,
                zIndex: 2,
                left: 0,
                right: 0,
                transform: translateY ? [{ translateY }] : [],
                overflow: 'hidden',
            }}
        >
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 14 }}
                    style={{
                        borderBottomWidth: 1,
                        borderBottomColor: isDark ? '#2D3038' : '#E5E7EB',
                    }}
                >
                    {/* Filter Icon Button */}
                    <TouchableOpacity
                        className="flex-row items-center px-4 py-2.5 mr-3 rounded-lg border"
                        style={{
                            backgroundColor: isDark ? '#2D3038' : '#F3F4F6',
                            borderColor: isDark ? '#3D4451' : '#E5E7EB',
                        }}
                        onPress={onFilterPress}
                    >
                        <Icon name="options-outline" size={18} color={isDark ? '#fff' : '#000'} />
                    </TouchableOpacity>

                    {/* Sort by */}
                    <TouchableOpacity
                        className="flex-row items-center px-4 py-2.5 mr-3 rounded-lg border"
                        style={{
                            backgroundColor: isDark ? '#1E2028' : '#F3F4F6',
                            borderColor: isDark ? '#2D3038' : '#E5E7EB',
                        }}
                    >
                        <Icon name="swap-vertical" size={16} color={isDark ? '#fff' : '#000'} style={{ marginRight: 5 }} />
                        <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>Sort by</Text>
                    </TouchableOpacity>

                    {/* Free Delivery */}
                    <TouchableOpacity
                        className="px-4 py-2.5 mr-3 rounded-lg border"
                        style={{
                            backgroundColor: isDark ? '#1E2028' : '#F3F4F6',
                            borderColor: isDark ? '#2D3038' : '#E5E7EB',
                        }}
                    >
                        <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>Free Delivery</Text>
                    </TouchableOpacity>

                    {/* Stores */}
                    <TouchableOpacity
                        className="px-4 py-2.5 mr-3 rounded-lg border"
                        style={{
                            backgroundColor: showStores ? (isDark ? '#1E2028' : '#DBEAFE') : (isDark ? '#1E2028' : '#F3F4F6'),
                            borderColor: showStores ? '#3B82F6' : (isDark ? '#2D3038' : '#E5E7EB'),
                        }}
                        onPress={onToggleStores}
                    >
                        <Text
                            className="text-sm font-medium"
                            style={{ color: showStores ? '#3B82F6' : (isDark ? '#fff' : '#4B5563') }}
                        >
                            Stores
                        </Text>
                    </TouchableOpacity>

                    {/* Fruits */}
                    <TouchableOpacity
                        className="px-4 py-2.5 mr-3 rounded-lg border"
                        style={{
                            backgroundColor: isDark ? '#1E2028' : '#F3F4F6',
                            borderColor: isDark ? '#2D3038' : '#E5E7EB',
                        }}
                    >
                        <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>Fruits</Text>
                    </TouchableOpacity>

                    {/* Vegetables */}
                    <TouchableOpacity
                        className="px-4 py-2.5 mr-3 rounded-lg border"
                        style={{
                            backgroundColor: isDark ? '#1E2028' : '#F3F4F6',
                            borderColor: isDark ? '#2D3038' : '#E5E7EB',
                        }}
                    >
                        <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>Vegetables</Text>
                    </TouchableOpacity>

                    {/* Snacks */}
                    <TouchableOpacity
                        className="px-4 py-2.5 mr-3 rounded-lg border"
                        style={{
                            backgroundColor: isDark ? '#1E2028' : '#F3F4F6',
                            borderColor: isDark ? '#2D3038' : '#E5E7EB',
                        }}
                    >
                        <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>Snacks</Text>
                    </TouchableOpacity>

                    {/* Discounts */}
                    <TouchableOpacity
                        className="px-4 py-2.5 mr-3 rounded-lg border"
                        style={{
                            backgroundColor: isDark ? '#2D3038' : '#F3F4F6',
                            borderColor: isDark ? '#3D4451' : '#E5E7EB',
                        }}
                    >
                        <Text className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>Discounts</Text>
                    </TouchableOpacity>
                </ScrollView>
            </LinearGradient>
        </Animated.View>
    );
};

export default React.memo(FilterBar);
