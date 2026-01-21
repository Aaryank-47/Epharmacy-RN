import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemePalette } from '../../../hooks/useThemePalette';
import UnifiedSearchSkeleton from './UnifiedSearchSkeleton';

const { width } = Dimensions.get('window');

interface SearchCompositeProps {
    query: string;
    onQueryChange: (text: string) => void;
    onSubmitEditing: () => void;
    onBackPress: () => void;

    // Suggestions Props
    suggestions: any[];
    isSuggestionsLoading: boolean;
    onSuggestionPress: (item: any) => void;

    // Popular Props
    popularTerms: any[];
    onPopularTermPress: (term: string) => void;

    // Page State
    isPageLoading: boolean;

    // Slots
    renderRecent?: () => React.ReactNode;
    renderTrending?: () => React.ReactNode;

    // Actions
    onCameraPress?: () => void;
}

const SearchComposite: React.FC<SearchCompositeProps> = ({
    query,
    onQueryChange,
    onSubmitEditing,
    onBackPress,
    suggestions,
    isSuggestionsLoading,
    onSuggestionPress,
    popularTerms,
    onPopularTermPress,
    isPageLoading,
    renderRecent,
    renderTrending,
    onCameraPress
}) => {
    const { isDark, textColor, placeholderColor, accentColor } = useThemePalette();

    // --- Render Functions (previously separate components) ---

    const renderHeader = () => (
        <View
            className="flex-row items-center px-4 py-3 pb-4"
            style={{
                zIndex: 10,
                backgroundColor: isDark ? '#040404ff' : '#FFFFFF'
            }}
        >
            <TouchableOpacity
                onPress={onBackPress}
                className="p-2 -ml-1 mr-1 rounded-full"
                activeOpacity={0.7}
            >
                <Icon name="arrow-back" size={24} color={textColor} />
            </TouchableOpacity>

            <View
                className="flex-1 flex-row items-center h-12 rounded-3xl px-4"
                style={{
                    backgroundColor: isDark ? '#1E2028' : '#F3F4F6',
                    borderWidth: 1,
                    borderColor: isDark ? '#2D3038' : 'transparent'
                }}
            >
                <Icon name="search" size={20} color={placeholderColor} className="mr-2 opacity-70" />
                <TextInput
                    className="flex-1 text-base font-medium h-full"
                    style={{ color: textColor }}
                    placeholder="Search medicines, vitamins..."
                    placeholderTextColor={placeholderColor}
                    value={query}
                    onChangeText={onQueryChange}
                    onSubmitEditing={onSubmitEditing}
                    returnKeyType="search"
                    autoFocus={true}
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={() => onQueryChange('')} className="p-1">
                        <Icon name="close-circle" size={18} color={placeholderColor} />
                    </TouchableOpacity>
                )}
            </View>

            <TouchableOpacity
                onPress={onCameraPress}
                className="p-2 ml-1 -mr-1 rounded-full"
                activeOpacity={0.7}
            >
                <Icon name="camera-outline" size={24} color={textColor} />
            </TouchableOpacity>
        </View>
    );

    const renderSuggestions = () => {
        if (isSuggestionsLoading) {
            return (
                <View className="flex-1 px-5 pt-2">
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                        <View key={item} className="flex-row items-center py-3.5 border-b" style={{ borderBottomColor: isDark ? '#2D3038' : '#F3F4F6' }}>
                            <View className="w-12 h-12 rounded-xl mr-3" style={{ backgroundColor: isDark ? '#2D3038' : '#E5E7EB', opacity: 0.5 }} />
                            <View className="flex-1">
                                <View className="h-4 rounded mb-2" style={{ backgroundColor: isDark ? '#2D3038' : '#E5E7EB', opacity: 0.5, width: '70%' }} />
                                <View className="h-3 rounded" style={{ backgroundColor: isDark ? '#2D3038' : '#E5E7EB', opacity: 0.3, width: '40%' }} />
                            </View>
                        </View>
                    ))}
                </View>
            );
        }

        if (suggestions.length === 0) {
            return (
                <View className="flex-1 justify-center items-center px-5">
                    <Icon name="search-outline" size={48} color={placeholderColor} className="mb-3 opacity-30" />
                    <Text className="text-base" style={{ color: placeholderColor }}>No results found</Text>
                </View>
            );
        }

        return (
            <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
                {suggestions.map((item: any, index) => {
                    const name = item.itemName || item.name || item.title || item.code;
                    const price = item.itemFinalPrice || item.itemInitialPrice || item.price;
                    const image = item.image || (item.itemImages && item.itemImages[0]);
                    const id = item._id || item.id;

                    return (
                        <TouchableOpacity
                            key={id || index}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingHorizontal: 20,
                                paddingVertical: 14,
                                borderBottomWidth: 0.5,
                                borderBottomColor: isDark ? '#374151' : '#E5E7EB',
                            }}
                            onPress={() => onSuggestionPress({ ...item, _id: id })}
                            activeOpacity={0.6}
                        >
                            {image ? (
                                <Image
                                    source={{ uri: image }}
                                    style={{ width: 56, height: 56, borderRadius: 25 }}
                                    resizeMode="cover"
                                />
                            ) : (
                                <View
                                    style={{
                                        width: 56,
                                        height: 56,
                                        borderRadius: 14,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        backgroundColor: isDark ? '#1F2937' : '#F3F4F6'
                                    }}
                                >
                                    <Icon name="bandage-outline" size={24} color={placeholderColor} />
                                </View>
                            )}

                            <Text
                                numberOfLines={1}
                                style={{
                                    flex: 1,
                                    fontSize: 15,
                                    fontWeight: '600',
                                    marginLeft: 14,
                                    marginRight: 10,
                                    color: textColor
                                }}
                            >
                                {name}
                            </Text>

                            {price && (
                                <Text
                                    style={{
                                        fontSize: 15,
                                        fontWeight: '700',
                                        marginRight: 10,
                                        color: accentColor
                                    }}
                                >
                                    ₹{price}
                                </Text>
                            )}

                            <Icon name="chevron-forward" size={18} color={placeholderColor} />
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        );
    };

    const renderPopular = () => {
        if (popularTerms.length === 0) return null;

        return (
            <View>
                <View className="flex-row justify-between items-center px-5 mt-8 mb-8">
                    <Text className="text-lg font-bold" style={{ color: textColor }}>Popular Searches</Text>
                </View>
                <View className="flex-row flex-wrap justify-between px-5">
                    {popularTerms.map((term: any, index) => (
                        <View key={term.id || index} style={{ width: '48%', marginBottom: 8 }}>
                            <TouchableOpacity
                                className="p-4 rounded-3xl border justify-center"
                                style={{
                                    borderColor: isDark ? '#2D3038' : '#F3F4F6',
                                    minHeight: 60,
                                }}
                                onPress={() => onPopularTermPress(term.term)}
                                activeOpacity={0.7}
                            >
                                <View className="flex-row items-center justify-between">
                                    <Text className="text-sm font-bold flex-1 mr-2" numberOfLines={2} style={{ color: textColor }}>
                                        {term.term}
                                    </Text>
                                    <Icon name="timer-outline" size={18} color={accentColor} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </View>
        );
    };

    // --- Main Render ---

    return (
        <View style={{ flex: 1 }}>
            {!isPageLoading && renderHeader()}

            {query.length > 0 ? (
                renderSuggestions()
            ) : isPageLoading ? (
                <UnifiedSearchSkeleton />
            ) : (
                <ScrollView className="flex-1" showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                    {/* Recent Searches (External) */}
                    {renderRecent && renderRecent()}

                    {/* Popular Searches (Internal) */}
                    {renderPopular()}

                    {/* Trending (External) */}
                    {renderTrending && renderTrending()}

                    <View className="h-10" />
                </ScrollView>
            )}
        </View>
    );
};

export default SearchComposite;
