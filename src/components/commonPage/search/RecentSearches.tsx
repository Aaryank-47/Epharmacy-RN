import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemePalette } from '../../../hooks/useThemePalette';
import type { RecentSearch } from '../../../api/types';

const { width } = Dimensions.get('window');
const RECENT_ITEM_WIDTH = (width - 70) / 4;

interface RecentSearchesProps {
    recentSearches: RecentSearch[];
    onPress: (query: string) => void;
    onDelete: (query: string) => void;
    onClearAll: () => void;
}

const RecentSearches: React.FC<RecentSearchesProps> = ({
    recentSearches,
    onPress,
    onDelete,
    onClearAll
}) => {
    const { isDark, textColor, placeholderColor, accentColor } = useThemePalette();

    if (recentSearches.length === 0) return null;

    const renderRecentSearchItem = ({ item }: { item: RecentSearch }) => {
        const displayText = item.itemName || item.query;
        const imageUrl = item.itemImage;

        return (
            <View
                className="items-center relative"
                style={{ width: RECENT_ITEM_WIDTH }}
            >
                <TouchableOpacity
                    className="w-full aspect-square rounded-full border p-2 justify-center items-center mb-1"
                    style={{
                        borderColor: isDark ? '#333' : '#E5E7EB',
                        backgroundColor: isDark ? '#222' : '#F9FAFB'
                    }}
                    activeOpacity={0.7}
                    onPress={() => onPress(displayText)}
                >
                    {imageUrl ? (
                        <Image source={{ uri: imageUrl }} className="w-full h-full rounded-full" />
                    ) : (
                        <Icon name="time-outline" size={28} color={placeholderColor} />
                    )}
                </TouchableOpacity>

                {/* Delete Button */}
                <TouchableOpacity
                    className="absolute top-0 right-0 bg-gray-200 rounded-full p-0.5 border border-white"
                    style={{
                        backgroundColor: isDark ? '#374151' : '#E5E7EB',
                        borderColor: isDark ? '#000' : '#FFF'
                    }}
                    onPress={() => onDelete(item.query)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Icon name="close" size={14} color={textColor} />
                </TouchableOpacity>

                <Text
                    className="text-xs font-semibold text-center w-full leading-4"
                    style={{ color: textColor }}
                    numberOfLines={2}
                >
                    {displayText}
                </Text>
            </View>
        );
    };

    return (
        <View>
            <View className="flex-row justify-between items-center px-5 mt-5 mb-3">
                <Text className="text-lg font-bold" style={{ color: textColor }}>Recent Searches</Text>
                <TouchableOpacity onPress={onClearAll}>
                    <Text className="text-sm" style={{ color: accentColor }}>Clear all</Text>
                </TouchableOpacity>
            </View>
            <FlatList
                data={recentSearches}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item, index) => item.id?.toString() || index.toString()}
                renderItem={renderRecentSearchItem}
                ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
                contentContainerClassName="px-4"
            />
        </View>
    );
};

export default RecentSearches;
