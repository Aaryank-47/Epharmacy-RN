import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Dimensions, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useThemePalette } from '../../../hooks/useThemePalette';
import UnifiedSearchSkeleton from './UnifiedSearchSkeleton';
import SearchHeader from './SearchHeader';

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

    // Results
    showResults?: boolean;
    renderSearchResults?: () => React.ReactNode;
    onFilterPress?: () => void;
    showCamera?: boolean;
    onScroll?: (event: any) => void;
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
    onCameraPress,
    showResults = false,
    renderSearchResults,
    onFilterPress,
    showCamera = false,
    onScroll
}) => {
    const { isDark, textColor, placeholderColor, accentColor } = useThemePalette();

    // --- Render Functions ---

    const renderHeader = () => (
        <SearchHeader
            query={query}
            onQueryChange={onQueryChange}
            onSubmitEditing={onSubmitEditing}
            onBackPress={onBackPress}
            onCameraPress={onCameraPress}
            onFilterPress={onFilterPress}
            showCamera={showCamera}
            isDark={isDark}
            textColor={textColor}
            placeholderColor={placeholderColor}
        />
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
            <Animated.ScrollView
                className="flex-1"
                keyboardShouldPersistTaps="handled"
                onScroll={onScroll}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
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
            </Animated.ScrollView>
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

            {showResults ? (
                renderSearchResults ? renderSearchResults() : null
            ) : query.length > 0 ? (
                renderSuggestions()
            ) : isPageLoading ? (
                <UnifiedSearchSkeleton />
            ) : (
                <Animated.ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    onScroll={onScroll}
                    scrollEventThrottle={16}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >
                    {/* Recent Searches (External) */}
                    {renderRecent && renderRecent()}

                    {/* Popular Searches (Internal) */}
                    {renderPopular()}

                    {/* Trending (External) */}
                    {renderTrending && renderTrending()}
                </Animated.ScrollView>
            )}
        </View>
    );
};


export default SearchComposite;
