import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemePalette } from '../../../hooks/useThemePalette';
import { useDealsOfTheDay } from '../../../hooks/useDealsOfTheDay';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width: screenWidth } = Dimensions.get('window');

interface SkeletonShimmerProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

const SkeletonShimmer: React.FC<SkeletonShimmerProps> = ({
  width,
  height,
  borderRadius = 8,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const { isDark } = useThemePalette();

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          opacity,
          backgroundColor: isDark ? '#374151' : '#E5E7EB',
        },
        style,
      ]}
    />
  );
};

const DealOfDaySection: React.FC = () => {
  const navigation = useNavigation<any>();
  const { isDark, accentColor } = useThemePalette();

  const { data, isLoading, error } = useDealsOfTheDay();
  const deals = data?.deals || [];
  const totalDeals = data?.totalDeals || 0;

  if (!isLoading && totalDeals < 3) {
    return null;
  }

  // Persistent shimmer logic
  const showShimmer = isLoading || error || deals.length === 0;

  const renderShimmerPlaceholders = () => (
    <FlatList
      horizontal
      showsHorizontalScrollIndicator={false}
      data={[1, 2, 3, 4]}
      keyExtractor={(_, i) => `shimmer-${i}`}
      contentContainerStyle={{ paddingHorizontal: 12 }}
      renderItem={() => (
        <View
          style={{
            width: screenWidth * 0.46,
            marginRight: 12,
            backgroundColor: isDark ? '#1A1C23' : '#FFFFFF',
            borderRadius: 12,
            padding: 8,
            borderWidth: 1,
            borderColor: isDark ? '#2D3038' : '#F3F4F6',
          }}
        >

          <SkeletonShimmer width="100%" height={120} borderRadius={8} />


          <SkeletonShimmer width="80%" height={14} borderRadius={4} style={{ marginTop: 12 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <View>
              <SkeletonShimmer width={60} height={16} borderRadius={4} />
              <SkeletonShimmer width={40} height={10} borderRadius={4} style={{ marginTop: 4 }} />
            </View>
            <SkeletonShimmer width={32} height={32} borderRadius={16} />
          </View>
        </View>
      )}
    />
  );

  const handleProductPress = (item: any) => {
    const itemId = item._id || item.id;

    if (itemId) {
      navigation.navigate('ProductDetail', { productId: itemId });
    }
  };

  return (
    <LinearGradient
      colors={isDark ? ['#181A20', '#2A2D35'] : ['#FFFFFF', '#F3F4F6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ marginTop: 0, paddingVertical: 24 }}
    >
      {/* Header */}
      <View style={{
        marginHorizontal: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{
            fontSize: 20,
            fontWeight: '700',
            color: isDark ? '#FFFFFF' : '#111827',
            fontStyle: 'italic',
            letterSpacing: -0.5,
          }}>
            DEAL OF THE DAY
          </Text>
          {/* Timer Badge */}
          <View style={{
            marginLeft: 12,
            paddingHorizontal: 8,
            paddingVertical: 2,
            backgroundColor: isDark ? 'rgba(127, 29, 29, 0.3)' : '#FEE2E2',
            borderRadius: 4,
            borderWidth: 1,
            borderColor: isDark ? '#991B1B' : '#FECACA',
          }}>
            <Text style={{
              fontSize: 12,
              fontWeight: '700',
              color: isDark ? '#FCA5A5' : '#DC2626',
            }}>
              Ends in 12:00:00
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => {}}>
          <Text style={{
            color: accentColor,
            fontSize: 14,
            fontWeight: '700',
          }}>
            View All
          </Text>
        </TouchableOpacity>
      </View>

      {showShimmer ? (
        renderShimmerPlaceholders()
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={deals}
          keyExtractor={(item) => item._id || item.itemName || String(Math.random())}
          contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 10 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => handleProductPress(item)}
              style={{
                width: screenWidth * 0.46,
                marginHorizontal: 6,
                backgroundColor: isDark ? '#1A1C23' : '#FFFFFF',
                borderRadius: 12,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
                borderWidth: 1,
                borderColor: isDark ? '#2D3038' : '#E5E7EB',
                overflow: 'hidden',
              }}
            >
              {/* Image Area - Compact & Clean */}
              <View style={{
                height: 128,
                width: '100%',
                backgroundColor: '#FFFFFF',
                padding: 8,
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                borderBottomWidth: 1,
                borderBottomColor: isDark ? '#2D3038' : '#F3F4F6',
              }}>
                <Image
                  source={{ uri: (item.itemImages && item.itemImages[0]) || '' }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />

                {/* Discount Badge - Minimalist */}
                {item.itemDiscount && (
                  <View style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                    backgroundColor: '#DC2626',
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                    alignItems: 'center',
                  }}>
                    <Text style={{
                      color: '#FFFFFF',
                      fontSize: 10,
                      fontWeight: '700',
                    }}>
                      -{item.itemDiscount}%
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ padding: 12 }}>
                <Text
                  numberOfLines={1}
                  style={{
                    fontSize: 14,
                    fontWeight: '600',
                    color: isDark ? '#F3F4F6' : '#1F2937',
                    marginBottom: 4,
                  }}
                >
                  {item.itemName}
                </Text>

                {/* Price & Action Row */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 4,
                }}>
                  <View>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: '700',
                      color: isDark ? '#FFFFFF' : '#111827',
                    }}>
                      ₹{item.itemFinalPrice || 0}
                    </Text>
                    {item.itemInitialPrice && (
                      <Text style={{
                        fontSize: 10,
                        color: '#9CA3AF',
                        textDecorationLine: 'line-through',
                      }}>
                        ₹{item.itemInitialPrice}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={{
                      backgroundColor: accentColor,
                      width: 40,
                      height: 40,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.1,
                      shadowRadius: 2,
                      elevation: 2,
                    }}
                    onPress={() => handleProductPress(item)}
                  >
                    <Ionicons name="cart-outline" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </LinearGradient>
  );
};

export default DealOfDaySection;
