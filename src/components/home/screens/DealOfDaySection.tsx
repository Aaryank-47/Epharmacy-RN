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
      colors={isDark ? ['#181A20', '#2A2D35'] : ['#F9FAFB', '#F3F4F6']}
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
        marginBottom: 20,
      }}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name="flash" size={18} color={isDark ? '#FBBF24' : '#F59E0B'} style={{ marginRight: 6 }} />
            <Text style={{
              fontSize: 22,
              fontWeight: '800',
              color: isDark ? '#FFFFFF' : '#111827',
              letterSpacing: -0.5,
            }}>
              DEAL OF THE DAY
            </Text>
          </View>
          <Text style={{
            fontSize: 13,
            color: isDark ? '#9CA3AF' : '#6B7280',
            fontWeight: '500',
            marginLeft: 24
          }}>
            Prices slashed for 24 hours!
          </Text>
        </View>

        {/* Timer Badge */}
        <LinearGradient
          colors={isDark ? ['#7F1D1D', '#991B1B'] : ['#FEE2E2', '#FECACA']}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: isDark ? '#B91C1C' : '#FCA5A5',
          }}
        >
          <Text style={{
            fontSize: 12,
            fontWeight: '800',
            color: isDark ? '#FECACA' : '#DC2626',
            fontVariant: ['tabular-nums']
          }}>
            12:00:00 LEFT
          </Text>
        </LinearGradient>
      </View>

      {showShimmer ? (
        renderShimmerPlaceholders()
      ) : (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={deals}
          keyExtractor={(item) => item._id || item.itemName || String(Math.random())}
          contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 15 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.92}
              onPress={() => handleProductPress(item)}
              style={{
                width: screenWidth * 0.48,
                marginHorizontal: 8,
                backgroundColor: isDark ? '#1E2028' : '#FFFFFF',
                borderRadius: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: isDark ? 0.4 : 0.08,
                shadowRadius: 12,
                elevation: 6,
                borderWidth: isDark ? 1 : 0,
                borderColor: isDark ? '#2D3038' : 'transparent',
                overflow: 'hidden',
              }}
            >
              {/* Image Area - Classy & Modern */}
              <View style={{
                height: 160,
                width: '100%',
                backgroundColor: isDark ? '#2A2D35' : '#F8FAFC',
                padding: 12,
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
              }}>
                {/* Discount Tag */}
                {item.itemDiscount && (
                  <View style={{
                    position: 'absolute',
                    top: 12,
                    left: 12,
                    backgroundColor: '#EF4444',
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 8,
                    zIndex: 10,
                    shadowColor: '#EF4444',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 3,
                  }}>
                    <Text style={{
                      color: '#FFFFFF',
                      fontSize: 11,
                      fontWeight: '800',
                      letterSpacing: 0.5
                    }}>
                      -{item.itemDiscount}%
                    </Text>
                  </View>
                )}

                <Image
                  source={{ uri: (item.itemImages && item.itemImages[0]) || '' }}
                  style={{ width: '90%', height: '90%' }}
                  resizeMode="contain"
                />

                {/* Rating Badge */}
                <View style={{
                  position: 'absolute',
                  bottom: 12,
                  left: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)',
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 6,
                }}>
                  <Ionicons name="star" size={10} color="#FBBF24" />
                  <Text style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: isDark ? '#FFF' : '#1F2937',
                    marginLeft: 3
                  }}>
                    {item.itemRatings ? item.itemRatings.toFixed(1) : '4.5'}
                  </Text>
                </View>
              </View>

              <View style={{ padding: 14 }}>


                <Text
                  numberOfLines={2}
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: isDark ? '#F3F4F6' : '#111827',
                    marginBottom: 8,
                    lineHeight: 20
                  }}
                >
                  {item.itemName}
                </Text>

                {/* Price & Action Row */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'flex-end',
                  justifyContent: 'space-between',
                  marginTop: 4,
                }}>
                  <View>
                    {item.itemInitialPrice && (
                      <Text style={{
                        fontSize: 11,
                        color: isDark ? '#6B7280' : '#9CA3AF',
                        textDecorationLine: 'line-through',
                        marginBottom: 1,
                        fontWeight: '500'
                      }}>
                        ₹{item.itemInitialPrice}
                      </Text>
                    )}
                    <Text style={{
                      fontSize: 18,
                      fontWeight: '800',
                      color: isDark ? '#FFFFFF' : '#1F2937',
                      letterSpacing: -0.5
                    }}>
                      ₹{item.itemFinalPrice || 0}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 12,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: accentColor,
                      shadowColor: accentColor,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                    activeOpacity={0.8}
                    onPress={() => handleProductPress(item)}
                  >
                    <Ionicons name="add" size={24} color="#FFFFFF" />
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
