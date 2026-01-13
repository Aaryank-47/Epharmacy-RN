import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  Easing,
  FlatList,
  Alert,
  Animated,
  ActivityIndicator,
  Platform,
  Linking,
  ToastAndroid,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import LocationService from '../../../services/LocationService';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useFeaturedMedicines } from '../../../hooks/useFeaturedMedicines';
import { useRunningAdvertisements } from '../../../hooks/useRunningAdvertisements';
import { useThemePalette } from '../../../hooks/useThemePalette';
import {
  trackAdvertisementClick,
  updateUserProfile,
  getFeaturedMedicines,
  getRunningAdvertisements,
} from '../../../api/medicinesApi';
import QROptionsBottomSheet from '../../qr/QROptionsBottomSheet';


interface Medicine {
  _id: string;
  title: string;
  imageUrl: string;
  price?: number;
  originalPrice?: number;
  discount?: number;
}

interface Advertisement {
  _id: string;
  title: string;
  description: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  offerText?: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  state?: string;
}

// ============================================================================
// MOCK DATA - Fallback for production
// ============================================================================

const MOCK_MEDICINES: Medicine[] = [
  {
    _id: '1',
    title: 'Aspirin 500mg',
    imageUrl: 'https://via.placeholder.com/150?text=Aspirin',
    price: 50,
    originalPrice: 75,
    discount: 33,
  },
  {
    _id: '2',
    title: 'Ibuprofen 400mg',
    imageUrl: 'https://via.placeholder.com/150?text=Ibuprofen',
    price: 45,
    originalPrice: 60,
    discount: 25,
  },
  {
    _id: '3',
    title: 'Paracetamol 650mg',
    imageUrl: 'https://via.placeholder.com/150?text=Paracetamol',
    price: 35,
    originalPrice: 50,
    discount: 30,
  },
  {
    _id: '4',
    title: 'Cough Syrup',
    imageUrl: 'https://via.placeholder.com/150?text=Cough',
    price: 120,
    originalPrice: 150,
    discount: 20,
  },
];

const MOCK_ADS: Advertisement[] = [
  {
    _id: 'ad1',
    title: 'Summer Sale',
    description: 'Get up to 50% off on all medicines',
    imageUrl: 'https://via.placeholder.com/200?text=Summer+Sale',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    offerText: '50',
  },
  {
    _id: 'ad2',
    title: 'Wellness Pack',
    description: 'Complete health supplement kit',
    imageUrl: 'https://via.placeholder.com/200?text=Wellness',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    offerText: '30',
  },
];

// ============================================================================
// CONSTANTS
// ============================================================================

const { width: screenWidth } = Dimensions.get('window');

const getResponsiveSize = (size: number): number => {
  const baseWidth = 375;
  return (screenWidth / baseWidth) * size;
};

// ============================================================================
// SKELETON SHIMMER COMPONENT
// ============================================================================

interface SkeletonShimmerProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  isDark: boolean;
  style?: any;
}

const SkeletonShimmer = memo<SkeletonShimmerProps>(
  ({ width, height, borderRadius = 8, isDark, style }) => {
    const shimmerAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      const animation = Animated.loop(
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
      );
      animation.start();
      return () => animation.stop();
    }, [shimmerAnim]);

    const opacity = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.3, 0.8],
    });

    const backgroundColor = isDark ? '#3A3A3A' : '#E5E7EB';

    return (
      <Animated.View
        style={[
          {
            width,
            height,
            borderRadius,
            backgroundColor,
            opacity,
          },
          style,
        ]}
      />
    );
  }
);

SkeletonShimmer.displayName = 'SkeletonShimmer';

// ============================================================================
// FULL PAGE SKELETON
// ============================================================================

interface HeroSectionSkeletonProps {
  isDark: boolean;
}

const HeroSectionSkeleton = memo<HeroSectionSkeletonProps>(({ isDark }) => {
  const skeletonBg = isDark ? '#2A2D35' : '#F3F4F6';

  return (
    <LinearGradient
      colors={isDark ? ['#181A20', '#2A2D35'] : ['#FFFFFF', '#F3F4F6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1, paddingHorizontal: getResponsiveSize(16) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Featured Row Skeleton */}
        <View style={{ marginVertical: 16 }}>
          <SkeletonShimmer width={180} height={24} borderRadius={6} isDark={isDark} />
        </View>

        {/* Categories Skeleton */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={{ marginRight: 15, alignItems: 'center' }}>
              <SkeletonShimmer width={65} height={65} borderRadius={32} isDark={isDark} />
              <SkeletonShimmer width={55} height={14} borderRadius={6} isDark={isDark} style={{ marginTop: 8 }} />
            </View>
          ))}
        </ScrollView>

        {/* Advertisements Skeleton */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View
              key={i}
              style={{
                width: screenWidth * 0.9,
                marginHorizontal: 8,
                marginVertical: 12,
                padding: 16,
                borderRadius: 16,
                backgroundColor: skeletonBg,
                flexDirection: 'row',
              }}
            >
              <View style={{ flex: 1 }}>
                <SkeletonShimmer width={150} height={22} borderRadius={6} isDark={isDark} />
                <SkeletonShimmer width={120} height={14} borderRadius={6} isDark={isDark} style={{ marginTop: 8 }} />
                <SkeletonShimmer width={100} height={13} borderRadius={6} isDark={isDark} style={{ marginTop: 6 }} />
                <SkeletonShimmer width={80} height={35} borderRadius={8} isDark={isDark} style={{ marginTop: 12 }} />
              </View>
              <SkeletonShimmer width={120} height={110} borderRadius={15} isDark={isDark} />
            </View>
          ))}
        </ScrollView>

        {/* Indicator Dots Skeleton */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 12, gap: 6 }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonShimmer key={i} width={8} height={8} borderRadius={4} isDark={isDark} />
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
});

HeroSectionSkeleton.displayName = 'HeroSectionSkeleton';

// ============================================================================
// FEATURED MEDICINES CARD
// ============================================================================

interface MedicineCardProps {
  medicine: Medicine;
  isDark: boolean;
  accentColor: string;
  onPress?: (medicine: Medicine) => void;
}

const MedicineCard = memo<MedicineCardProps>(
  ({ medicine, isDark, accentColor, onPress }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress?.(medicine)}
      style={{
        width: screenWidth * 0.44,
        backgroundColor: isDark ? '#2A2D35' : '#F9FAFB',
        borderRadius: 12,
        padding: 12,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: isDark ? '#374151' : '#E5E7EB',
      }}
    >
      <Image
        source={{ uri: medicine.imageUrl }}
        style={{
          width: '100%',
          height: 120,
          borderRadius: 8,
          backgroundColor: isDark ? '#3A3A3A' : '#E5E7EB',
        }}
      />
      <Text
        style={{
          marginTop: 10,
          fontSize: 14,
          fontWeight: '600',
          color: isDark ? '#FFFFFF' : '#1F2937',
        }}
        numberOfLines={2}
      >
        {medicine.title}
      </Text>
      {medicine.price && (
        <Text
          style={{
            marginTop: 8,
            fontSize: 16,
            fontWeight: '700',
            color: accentColor,
          }}
        >
          ₹{medicine.price}
        </Text>
      )}
    </TouchableOpacity>
  )
);

MedicineCard.displayName = 'MedicineCard';

// ============================================================================
// ADVERTISEMENT CARD
// ============================================================================

interface AdvertisementCardProps {
  ad: Advertisement;
  isDark: boolean;
  accentColor: string;
  onPress: (id: string, title: string) => void;
}

const AdvertisementCard = memo<AdvertisementCardProps>(({ ad, isDark, onPress }) => {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={() => onPress(ad._id, ad.title)}>
      <LinearGradient
        colors={isDark ? ['#1E2026', '#2A2D35'] : ['#FFFFFF', '#F9FAFB']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: '100%',
          borderRadius: 24,
          padding: getResponsiveSize(16),
          marginVertical: getResponsiveSize(6),
          // marginHorizontal removed, handled by wrapper
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0,0,0,0.05)',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: isDark ? 0.4 : 0.1,
          shadowRadius: 12,
          elevation: isDark ? 4 : 2,
        }}
      >
        {/* Left Content */}
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              color: isDark ? '#9CA3AF' : '#6B7280',
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              marginBottom: 6,
            }}
          >
            {ad.title}
          </Text>
          <Text
            style={{
              fontSize: 28,
              fontWeight: '900',
              color: isDark ? '#FFFFFF' : '#111827',
              letterSpacing: -0.5,
              lineHeight: 34,
            }}
          >
            {ad.offerText || '50'}% OFF
          </Text>
          <Text
            style={{
              marginTop: 6,
              fontSize: 14,
              color: isDark ? '#D1D5DB' : '#4B5563',
              opacity: 0.9,
              fontWeight: '500',
            }}
          >
            {formatDate(ad.endDate)}
          </Text>

          <TouchableOpacity
            style={{
              marginTop: 18,
              paddingVertical: 10,
              paddingHorizontal: 24,
              borderRadius: 30,
              backgroundColor: '#22C55E',
              alignSelf: 'flex-start',
              shadowColor: '#22C55E',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 2,
            }}
            onPress={() => onPress(ad._id, ad.title)}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: '#FFFFFF',
              }}
            >
              Get Now
            </Text>
          </TouchableOpacity>
        </View>

        {/* Right Image */}
        <View
          style={{
            width: 140,
            height: 130,
            borderRadius: 15,
            overflow: 'hidden',
            backgroundColor: isDark ? '#374151' : '#F3F4F6',
            borderWidth: 0.4,
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          }}
        >
          <Image
            source={{ uri: ad.imageUrl }}
            style={{
              width: '100%',
              height: '100%',
              resizeMode: 'cover',
            }}
          />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
});

AdvertisementCard.displayName = 'AdvertisementCard';

const ProgressDot = memo(({ isActive, isDark, duration = 3000 }: { isActive: boolean; isDark: boolean; duration?: number }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      progress.setValue(0);
      Animated.timing(progress, {
        toValue: 1,
        duration: duration,
        useNativeDriver: false,
        easing: Easing.linear,
      }).start();
    } else {
      progress.setValue(0);
    }
  }, [isActive, duration, progress]);

  return (
    <View
      style={{
        width: isActive ? 26 : 8,
        height: 4,
        borderRadius: 2,
        backgroundColor: isDark ? '#4B5563' : '#D1D5DB',
        marginHorizontal: 3,
        overflow: 'hidden',
      }}
    >
      {isActive && (
        <Animated.View
          style={{
            height: '100%',
            backgroundColor: '#22C55E',
            width: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      )}
    </View>
  );
});

ProgressDot.displayName = 'ProgressDot';

// ============================================================================
// MAIN HERO SECTION - PRODUCTION OPTIMIZED & HIGH PERFORMANCE
// ============================================================================

interface HeroSectionProps {
  navigation?: any;
}

const HeroSection: React.FC<HeroSectionProps> = memo(({ navigation }) => {
  const { isDark, accentColor } = useThemePalette();
  const flatListRef = useRef<FlatList>(null);
  const scrollIndexRef = useRef(0); // Ref to track index for auto-scroll loop

  const [currentOffer, setCurrentOffer] = useState(0);
  const [currentScrollIndex, setCurrentScrollIndex] = useState(0);
  const [locationLoading, setLocationLoading] = useState(false);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);

  // ========== REACT QUERY - AGGRESSIVE CACHING FOR PERFORMANCE ==========
  // Featured Medicines - Heavy cache since data doesn't change frequently
  const { data: medicinesData, isLoading: medicinesLoading } = useQuery({
    queryKey: ['featured-medicines'],
    queryFn: async () => {
      try {
        const response = await getFeaturedMedicines();
        console.log('[HeroSection] Medicines fetched:', response.data?.data?.length || 0);
        return response.data?.data || MOCK_MEDICINES;
      } catch (error) {
        console.error('[HeroSection] Medicines error:', error);
        return MOCK_MEDICINES;
      }
    },
    staleTime: 15 * 60 * 1000, // 15 minutes - heavy cache
    gcTime: 60 * 60 * 1000, // 60 minutes garbage collection
    retry: 1,
    retryDelay: 1000,
    enabled: true,
  });

  // Advertisements - Moderate cache for freshness
  const { data: adsData, isLoading: adsLoading } = useQuery({
    queryKey: ['running-advertisements'],
    queryFn: async () => {
      try {
        const response = await getRunningAdvertisements();
        console.log('[HeroSection] Ads fetched:', response.data?.data?.length || 0);
        return response.data?.data || MOCK_ADS;
      } catch (error) {
        console.error('[HeroSection] Ads error:', error);
        return MOCK_ADS;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - more frequent updates
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
    retry: 1,
    retryDelay: 1000,
    enabled: true,
    // Auto-poll if no ads found, as requested by user ("har kuch time interval me api call hota rhna cahiye")
    refetchInterval: (query) => (!query.state.data?.length ? 3000 : false),
  });

  // Memoized data extraction - only recalculate when data changes
  const medicines: Medicine[] = useMemo(() => medicinesData || MOCK_MEDICINES, [medicinesData]);
  const advertisements: Advertisement[] = useMemo(() => adsData || MOCK_ADS, [adsData]);

  const infiniteOffers = useMemo(() => {
    if (advertisements.length === 0) return [];
    return Array(100).fill(advertisements).flat();
  }, [advertisements]);

  // ========== LOCATION HANDLER ==========
  const handleLocationPress = useCallback(async () => {
    setLocationLoading(true);

    try {
      const { latitude, longitude } = await LocationService.getCurrentLocation();
      const addressString = await LocationService.getAddressFromCoordinates(latitude, longitude);

      const locationData: LocationData = {
        latitude,
        longitude,
        address: addressString,
        city: 'Current City',
        state: 'India',
      };

      setUserLocation(locationData);

      const addressData = {
        address: {
          street: addressString,
          city: 'Current City',
          state: 'India',
          zip: 'PIN',
          country: 'India',
          location: { latitude, longitude },
        },
      };

      await updateUserProfile(addressData, false);

      // Show success toast
      ToastAndroid.show(
        `✓ Location Updated: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        ToastAndroid.LONG
      );

      setLocationLoading(false);
    } catch (error: any) {
      setLocationLoading(false);

      let message = 'Error updating location';
      if (error.message === 'PERMISSION_DENIED') {
        message = 'Location permission denied';
      } else if (error.message === 'GPS_DISABLED') {
        Alert.alert(
          'Location Required',
          'GPS is disabled. Please enable it in Settings to detect your location.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: () => {
                // Open Location Settings (Android)
                if (Platform.OS === 'android') {
                  Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
                } else {
                  Linking.openSettings();
                }
              }
            },
          ]
        );
        setLocationLoading(false);
        return;
      } else {
        message = error.message || 'Unknown error';
      }

      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
  }, []);

  // const handleQRScannerToggle = useCallback(() => {
  //   setBottomSheetVisible(true);
  // }, []);

  const handleScanQR = useCallback(() => {
    navigation.navigate('QRScannerScreen');
  }, [navigation]);

  const handleUploadPDF = useCallback(() => {
    navigation.navigate('PDFUploadScreen');
  }, [navigation]);

  const handleMedicinePress = useCallback(async (medicine: Medicine) => {
    navigation.navigate('ProductDetail', { productId: medicine._id });
  }, [navigation]);

  const handleAdvertisementClick = useCallback(async (adId: string) => {
    try {
      await trackAdvertisementClick(adId);
    } catch (error) {
      error;
    }
  }, []);

  // ========== AUTO-SCROLL EFFECT ==========
  useEffect(() => {
    if (advertisements.length === 0) return;

    const interval = setInterval(() => {
      // Allow scrolling up to the very end of our "infinite" list
      const maxIndex = infiniteOffers.length - 1;
      const nextIndex = scrollIndexRef.current + 1;

      const targetIndex = nextIndex > maxIndex ? 0 : nextIndex;

      if (flatListRef.current) {
        flatListRef.current.scrollToIndex({
          index: targetIndex,
          animated: true,
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [advertisements.length, infiniteOffers.length]);

  useEffect(() => {
    if (advertisements.length === 0) return;
    scrollIndexRef.current = 0;
    setCurrentScrollIndex(0);
    setCurrentOffer(0);
  }, [advertisements.length]);

  const handleScroll = useCallback((event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const itemWidth = screenWidth; // Full width
    const index = Math.round(offsetX / itemWidth);

    scrollIndexRef.current = index;

    setCurrentScrollIndex(index);
    setCurrentOffer(index % Math.max(advertisements.length, 1));
  }, [advertisements.length]);

  if (medicinesLoading && adsLoading && medicinesData === undefined && adsData === undefined) {
    return <HeroSectionSkeleton isDark={isDark} />;
  }

  return (
    <LinearGradient
      colors={isDark ? ['#181A20', '#2A2D35'] : ['#FFFFFF', '#F3F4F6']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={{ flex: 1 }}
    >
      <ScrollView
        style={{ flex: 1, paddingHorizontal: getResponsiveSize(16) }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        scrollEventThrottle={16}
      >
        {/* Featured Title */}
        <View style={{ marginVertical: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: '700',
                  color: isDark ? '#FFFFFF' : '#1F2937',
                  letterSpacing: 0.5,
                }}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {userLocation ? userLocation.address : 'Featured Medicines'}
              </Text>
              {userLocation && (
                <Text style={{ fontSize: 12, color: isDark ? '#9CA3AF' : '#6B7280' }}>
                  Current Location
                </Text>
              )}
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {/* QR Button Removed */}


              {/* Location Button */}
              <TouchableOpacity
                onPress={handleLocationPress}
                disabled={locationLoading}
                style={{
                  shadowColor: isDark ? '' : '#1F2937',
                  borderRadius: 24,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                }}
              >
                <LinearGradient
                  colors={isDark ? ['#3A3A3A', '#2A2D35'] : ['#ffffff', '#f8fafc']}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 24,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                  }}
                >
                  {locationLoading ? (
                    <ActivityIndicator size="small" color={accentColor} />
                  ) : (
                    <Icon name="location-outline" size={24} color={isDark ? '#FFF' : '#333'} />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>


        {userLocation && (
          <LinearGradient
            colors={isDark ? ['#1F4788', '#0D47A1'] : ['#E3F2FD', '#BBDEFB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
              borderWidth: 1,
              borderColor: isDark ? '#1976D2' : '#90CAF9',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: isDark ? '#0D47A1' : '#FFFFFF',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 12,
                }}
              >
                <Icon name="location" size={28} color={isDark ? '#90CAF9' : '#1976D2'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: '700',
                    color: isDark ? '#E3F2FD' : '#0D47A1',
                    marginBottom: 4,
                  }}
                >
                  {userLocation.address}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: isDark ? '#BBDEFB' : '#1565C0',
                    fontWeight: '600',
                    marginBottom: 2,
                  }}
                >
                  {userLocation.city}, {userLocation.state}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: isDark ? '#90CAF9' : '#1976D2',
                  }}
                >
                  ✓ Location updated successfully
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setUserLocation(null)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <Icon name="close" size={18} color={isDark ? '#E3F2FD' : '#0D47A1'} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginVertical: 8 }}
          contentContainerStyle={{ paddingHorizontal: 2 }}
        >
          {medicines.map((medicine) => (
            <TouchableOpacity
              key={medicine._id}
              style={{
                alignItems: 'center',
                width: (screenWidth - 32) / 4, // Exact width to fit 4 visible items
              }}
              activeOpacity={0.7}
              onPress={() => handleMedicinePress(medicine)}
            >
              <View
                style={{
                  width: 65,
                  height: 65,
                  borderRadius: 32.5,
                  backgroundColor: isDark ? '#3A3A3A' : '#F0F0F0',
                  borderWidth: 1,
                  borderColor: isDark ? '#374151' : '#E5E7EB',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                }}
              >
                <Image
                  source={{ uri: medicine.imageUrl }}
                  style={{ width: 65, height: 65, borderRadius: 32.5 }}
                  resizeMode="cover"
                />
              </View>
              <Text
                style={{
                  marginTop: 6,
                  fontSize: 11,
                  fontWeight: '600',
                  color: isDark ? '#E5E7EB' : '#4B5563',
                  textAlign: 'center',
                }}
                numberOfLines={1}
              >
                {medicine.title.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Advertisements */}
        {advertisements.length > 0 ? (
          <View style={{ marginHorizontal: -getResponsiveSize(16) }}>
            <FlatList
              ref={flatListRef}
              data={infiniteOffers}
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled={true}
              initialNumToRender={3} // Optimization
              maxToRenderPerBatch={3} // Optimization
              windowSize={5} // Optimization
              decelerationRate="fast"
              snapToInterval={screenWidth}
              snapToAlignment="center"
              contentContainerStyle={{ paddingHorizontal: 0 }}
              renderItem={({ item: ad }) => (
                <View style={{ width: screenWidth, alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: screenWidth - 32 }}>
                    <AdvertisementCard
                      ad={ad}
                      isDark={isDark}
                      accentColor={accentColor}
                      onPress={handleAdvertisementClick}
                    />
                  </View>
                </View>
              )}
              keyExtractor={(_, idx) => `ad-${idx}`}
              scrollEventThrottle={16}
              onScroll={handleScroll}
              getItemLayout={(data, index) => ({
                length: screenWidth,
                offset: screenWidth * index,
                index,
              })}
            />
            {/* Premium Indicator Pill */}
            <View style={{ alignItems: 'center', marginTop: -20, marginBottom: 10 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: isDark ? '#2a2d35ff' : '#FFFFFF',
                  paddingVertical: 6,
                  marginTop: 5,
                  paddingHorizontal: 12,
                  borderRadius: 20,
                  gap: 7,
                  ...Platform.select({
                    ios: {
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                    },
                  }),
                  borderTopWidth: isDark ? 0.5 : 0,
                  borderColor: isDark ? '#4B5563' : 'transparent',
                }}
              >
                {advertisements.map((_, i) => (
                  <ProgressDot
                    key={i}
                    isActive={currentOffer === i}
                    isDark={isDark}
                    duration={3000}
                  />
                ))}
              </View>
            </View>
          </View>
        ) : (
          /* Show Loading Skeleton */
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -8, marginVertical: 12 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <View
                key={i}
                style={{
                  width: screenWidth * 0.9,
                  marginHorizontal: 8,
                  marginVertical: 12,
                  padding: 16,
                  borderRadius: 16,
                  backgroundColor: isDark ? '#2A2D35' : '#F3F4F6',
                  flexDirection: 'row',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                }}
              >
                <View style={{ flex: 1 }}>
                  <SkeletonShimmer width={150} height={22} borderRadius={6} isDark={isDark} />
                  <SkeletonShimmer width={120} height={14} borderRadius={6} isDark={isDark} style={{ marginTop: 8 }} />
                  <SkeletonShimmer width={100} height={13} borderRadius={6} isDark={isDark} style={{ marginTop: 6 }} />
                  <SkeletonShimmer width={80} height={35} borderRadius={8} isDark={isDark} style={{ marginTop: 12 }} />
                </View>
                <SkeletonShimmer width={120} height={110} borderRadius={15} isDark={isDark} />
              </View>
            ))}
          </ScrollView>
        )}
      </ScrollView>

      {/* QR Options Bottom Sheet */}
      <QROptionsBottomSheet
        visible={bottomSheetVisible}
        onClose={() => setBottomSheetVisible(false)}
        onScanQR={handleScanQR}
        onUploadPDF={handleUploadPDF}
      />
    </LinearGradient >
  );
});

HeroSection.displayName = 'HeroSection';

export default HeroSection;
