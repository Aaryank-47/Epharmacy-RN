import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Dimensions, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchCamera } from 'react-native-image-picker';
import { useThemePalette } from '../../../hooks/useThemePalette';

const { width } = Dimensions.get('window');
const RECENT_ITEM_WIDTH = (width - 70) / 4;

// ============================================================================
// SEARCH HEADER COMPONENT
// ============================================================================

interface SearchHeaderProps {
    query?: string;
    onQueryChange?: (text: string) => void;
    onSubmitEditing?: () => void;
    onBackPress: () => void;
    onCameraPress?: () => void;
    showCamera?: boolean;
    isDark: boolean;
    textColor: string;
    placeholderColor: string;
    editable?: boolean;
    onSearchPress?: () => void;
    onFilterPress?: () => void;
    activeFilterCount?: number;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({
    query = "",
    onQueryChange,
    onSubmitEditing,
    onBackPress,
    onCameraPress,
    showCamera = false,
    isDark,
    textColor,
    placeholderColor,
    editable = true,
    onSearchPress,
    onFilterPress,
    activeFilterCount = 0
}) => {
    const handleDefaultCameraPress = async () => {
        try {
            const result = await launchCamera({
                mediaType: 'photo',
                cameraType: 'back',
                quality: 0.8,
            });

            if (result.didCancel) {
                console.log('User cancelled camera');
            } else if (result.errorCode) {
                console.log('Camera Error: ', result.errorMessage);
            } else if (result.assets && result.assets.length > 0) {
                const image = result.assets[0];
                console.log('Image captured:', image.uri);
            }
        } catch (error) {
            console.error("Camera launch failed", error);
        }
    };

    const finalOnCameraPress = onCameraPress || (showCamera ? handleDefaultCameraPress : undefined);

    return (
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

            <TouchableOpacity
                className="flex-1 flex-row items-center h-12 rounded-3xl pl-4 pr-2"
                style={{
                    backgroundColor: isDark ? '#1E2028' : '#F3F4F6',
                    borderWidth: 1,
                    borderColor: isDark ? '#2D3038' : 'transparent'
                }}
                activeOpacity={editable ? 1 : 0.7}
                onPress={!editable ? onSearchPress : undefined}
            >
                <Icon name="search" size={20} color={placeholderColor} className="mr-2 opacity-70" />
                <TextInput
                    className="flex-1 text-base font-medium h-full"
                    style={{ color: textColor }}
                    placeholder="Search medicines, vitamins"
                    placeholderTextColor={placeholderColor}
                    value={query}
                    onChangeText={onQueryChange}
                    onSubmitEditing={onSubmitEditing}
                    returnKeyType="search"
                    autoFocus={editable}
                    editable={editable}
                    onPressIn={!editable ? onSearchPress : undefined}
                />

                <View className="flex-row items-center gap-x-2">
                    {editable && query.length > 0 && onQueryChange && (
                        <TouchableOpacity onPress={() => onQueryChange('')} className="p-1">
                            <Icon name="close-circle" size={18} color={placeholderColor} />
                        </TouchableOpacity>
                    )}

                    {finalOnCameraPress && (
                        <TouchableOpacity
                            onPress={finalOnCameraPress}
                            className="p-1 -mr-1"
                            activeOpacity={0.7}
                        >
                            <Icon name="camera-outline" size={22} color={textColor} />
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>

            {onFilterPress && (
                <TouchableOpacity
                    onPress={onFilterPress}
                    className="p-2 ml-1 -mr-1 rounded-full relative"
                    activeOpacity={0.7}
                >
                    <Icon name="options-outline" size={24} color={textColor} />
                    {activeFilterCount > 0 && (
                        <View className="absolute top-1 right-1 bg-red-500 w-4 h-4 rounded-full justify-center items-center border border-white dark:border-gray-900">
                            <Text className="text-[10px] text-white font-bold">
                                {activeFilterCount}
                            </Text>
                        </View>
                    )}
                </TouchableOpacity>
            )}
        </View>
    );
};

// ============================================================================
// UNIFIED SEARCH SKELETON COMPONENT
// ============================================================================

export const UnifiedSearchSkeleton: React.FC = () => {
    const { isDark } = useThemePalette();

    return (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Search Bar Skeleton */}
            <View
                className="flex-row items-center px-4 py-3 pb-4"
                style={{ marginBottom: 4 }}
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

// ============================================================================
// SEARCH COMPOSITE COMPONENT
// ============================================================================

interface SearchCompositeProps {
    query: string;
    onQueryChange: (text: string) => void;
    onSubmitEditing: () => void;
    onBackPress: () => void;
    suggestions: any[];
    isSuggestionsLoading: boolean;
    onSuggestionPress: (item: any) => void;
    popularTerms: any[];
    onPopularTermPress: (term: string) => void;
    isPageLoading: boolean;
    renderRecent?: () => React.ReactNode;
    renderTrending?: () => React.ReactNode;
    onCameraPress?: () => void;
    showResults?: boolean;
    renderSearchResults?: () => React.ReactNode;
    onFilterPress?: () => void;
    showCamera?: boolean;
    onScroll?: (event: any) => void;
}

export const SearchComposite: React.FC<SearchCompositeProps> = ({
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
                    {renderRecent && renderRecent()}
                    {renderPopular()}
                    {renderTrending && renderTrending()}
                </Animated.ScrollView>
            )}
        </View>
    );
};

export default SearchComposite;
