import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, Dimensions, StatusBar } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useThemePalette } from '../../hooks/useThemePalette';
import LinearGradient from 'react-native-linear-gradient';
import { useWishlist } from '../../context/WishlistContext';

const { width } = Dimensions.get('window');

const WishlistScreen = () => {
    const navigation = useNavigation<any>();
    const { isDark, accentColor } = useThemePalette();
    const { wishlistItems, removeFromWishlist } = useWishlist(); // Use the wishlist hook

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity
            style={[styles.itemCard, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}
            onPress={() => navigation.navigate('ProductDetail', { productId: item._id })}
            activeOpacity={0.7}
        >
            <View style={styles.imageContainer}>
                {item.image ? (
                    <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
                ) : (
                    <Icon name="image-outline" size={40} color={isDark ? '#555' : '#E5E7EB'} />
                )}
            </View>
            <View style={styles.itemInfo}>
                <Text style={[styles.itemName, { color: isDark ? '#FFF' : '#1F2937' }]} numberOfLines={2}>
                    {item.itemName}
                </Text>
                <View style={styles.priceContainer}>
                    <Text style={[styles.itemPrice, { color: isDark ? '#FFF' : '#111827' }]}>
                        ₹{item.itemFinalPrice}
                    </Text>
                    {item.itemInitialPrice > item.itemFinalPrice && (
                        <Text style={styles.originalPrice}>₹{item.itemInitialPrice}</Text>
                    )}
                </View>
                <View style={styles.ratingContainer}>
                    <Icon name="star" size={12} color="#FBBF24" />
                    <Text style={[styles.ratingText, { color: isDark ? '#D1D5DB' : '#4B5563' }]}>
                        {item.itemRatings || 0}
                    </Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFromWishlist(item._id)}
            >
                <Icon name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
        </TouchableOpacity>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={[styles.iconContainer, { backgroundColor: isDark ? '#2A2A2A' : '#F3F4F6' }]}>
                <Icon name="heart-outline" size={64} color={isDark ? '#555' : '#CBD5E1'} />
            </View>
            <Text style={[styles.emptyTitle, { color: isDark ? '#FFF' : '#1F2937' }]}>
                Your Wishlist is Empty
            </Text>
            <Text style={[styles.emptySubtitle, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
                Tap the heart button on any product to save it for later.
            </Text>
            <TouchableOpacity
                style={[styles.shopButton, { backgroundColor: accentColor }]}
                onPress={() => navigation.navigate('HomeTabs')}
                activeOpacity={0.8}
            >
                <Text style={styles.shopButtonText}>Start Shopping</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: isDark ? '#121212' : '#F9FAFB' }]}>
            <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#121212' : '#F9FAFB'} />

            {/* Header */}
            <View style={[styles.header, { borderBottomColor: isDark ? '#2A2A2A' : '#E5E7EB' }]}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backButton, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}
                >
                    <Icon name="arrow-back" size={24} color={isDark ? '#FFF' : '#1F2937'} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: isDark ? '#FFF' : '#1F2937' }]}>My Wishlist</Text>
                <View style={{ width: 40 }} />
            </View>

            {wishlistItems.length > 0 ? (
                <FlatList
                    data={wishlistItems}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                renderEmptyState()
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
    },
    // Item Card Styles
    itemCard: {
        flexDirection: 'row',
        borderRadius: 12,
        marginBottom: 16,
        padding: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        alignItems: 'center',
    },
    imageContainer: {
        width: 80,
        height: 80,
        borderRadius: 8,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    itemImage: {
        width: '100%',
        height: '100%',
    },
    itemInfo: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'center',
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
        lineHeight: 20,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    originalPrice: {
        fontSize: 12,
        color: '#9CA3AF',
        textDecorationLine: 'line-through',
        marginLeft: 6,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 4,
    },
    removeButton: {
        padding: 8,
    },
    // Empty State Styles
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    shopButton: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    shopButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    }
});

export default WishlistScreen;
