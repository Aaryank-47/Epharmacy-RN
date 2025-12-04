import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
  FlatList,
  Alert,
  Animated,
  Modal,
  ActivityIndicator,
  Platform,
  PermissionsAndroid,
  Linking,
  ToastAndroid,
} from 'react-native';
import LocationService from '../../../services/LocationService';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { useThemePalette } from '../../../hooks/useThemePalette';
import {
  getFeaturedMedicines,
  getRunningAdvertisements,
  trackAdvertisementClick,
  updateUserProfile,
} from '../../../api/medicinesApi';


// ============================================================================
// TYPES
// ============================================================================

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

    return (
      <Animated.View
        style={[
          {
            width,
            height,
            borderRadius,
            backgroundColor: isDark ? '#3A3A3A' : '#E5E7EB',
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

const AdvertisementCard = memo<AdvertisementCardProps>(({ ad, isDark, accentColor, onPress }) => {
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
        colors={isDark ? ['#1A1A1A', '#2A2D35'] : ['#FF6B6B', '#FF8A95']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: screenWidth * 0.9,
          borderRadius: 16,
          padding: 15,
          marginVertical: 10,
          marginHorizontal: 6.5,
          flexDirection: 'row',
          borderWidth: isDark ? 1 : 0,
          borderColor: isDark ? '#374151' : 'transparent',
        }}
      >
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '800',
              color: isDark ? accentColor : '#FFFFFF',
              letterSpacing: 0.5,
            }}
          >
            {ad.title}
            {ad.offerText ? ` ${ad.offerText}% OFF` : ''}
          </Text>
          <Text
            style={{
              marginTop: 6,
              fontSize: 14,
              color: isDark ? '#D1D5DB' : '#FFFFFF',
              opacity: 0.9,
            }}
          >
            {ad.description}
          </Text>
          <Text
            style={{
              marginTop: 8,
              fontSize: 11,
              color: isDark ? '#9CA3AF' : 'rgba(255,255,255,0.8)',
              fontStyle: 'italic',
            }}
          >
            {formatDate(ad.startDate)} - {formatDate(ad.endDate)}
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 10,
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 8,
              backgroundColor: isDark ? accentColor : '#FFFFFF',
              alignSelf: 'flex-start',
            }}
            onPress={() => onPress(ad._id, ad.title)}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '700',
                color: isDark ? '#FFFFFF' : accentColor,
              }}
            >
              Order Now →
            </Text>
          </TouchableOpacity>
        </View>
        <Image
          source={{ uri: ad.imageUrl }}
          style={{
            width: 120,
            height: 120,
            borderRadius: 15,
            backgroundColor: '#FFF',
            marginLeft: 8,
          }}
        />
      </LinearGradient>
    </TouchableOpacity>
  );
});

AdvertisementCard.displayName = 'AdvertisementCard';

// ============================================================================
// QR SCANNER COMPONENT
// ============================================================================

interface QRScannerProps {
  visible: boolean;
  onClose: () => void;
  scanned: boolean;
  onScan?: (data: string) => void;
}

const QRScanner = memo<QRScannerProps>(({ visible, onClose, scanned, onScan }) => {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: '#000000' }}>
        {/* Header */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingTop: Platform.OS === 'android' ? 40 : 50,
            paddingBottom: 20,
            backgroundColor: 'rgba(0,0,0,0.8)',
          }}
        >
          <TouchableOpacity onPress={onClose} style={{ padding: 10 }}>
            <Icon name="close" size={30} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', flex: 1, textAlign: 'center' }}>
            Scan QR Code
          </Text>
          <View style={{ width: 50 }} />
        </View>

        {/* Instructions */}
        <View style={{ position: 'absolute', top: Platform.OS === 'android' ? 140 : 150, left: 0, right: 0, zIndex: 1 }}>
          <Text
            style={{
              color: '#FFFFFF',
              fontSize: 16,
              textAlign: 'center',
              margin: 20,
              backgroundColor: 'rgba(0,0,0,0.7)',
              padding: 15,
              borderRadius: 10,
            }}
          >
            Use a third-party QR scanner app
          </Text>
        </View>

        {/* Content */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Icon name="qr-code" size={100} color="#FF6B6B" style={{ marginBottom: 20 }} />
          <Text style={{ color: '#FFFFFF', fontSize: 16, marginTop: 16, textAlign: 'center', paddingHorizontal: 20 }}>
            QR Code scanner requires external app. Please use built-in camera app or Google Lens.
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (Platform.OS === 'android') {
                Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.googlequicksearchbox');
              } else {
                Linking.openURL('https://apps.apple.com/app/google-lens/id1098986816');
              }
            }}
            style={{
              marginTop: 30,
              backgroundColor: '#FF6B6B',
              paddingHorizontal: 30,
              paddingVertical: 15,
              borderRadius: 25,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>Get Scanner App</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Actions */}
        <View
          style={{
            position: 'absolute',
            bottom: 50,
            left: 0,
            right: 0,
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: 'rgba(255, 107, 107, 0.8)',
              paddingHorizontal: 30,
              paddingVertical: 15,
              borderRadius: 25,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
});

QRScanner.displayName = 'QRScanner';

// ============================================================================
// MAIN HERO SECTION - PRODUCTION OPTIMIZED & HIGH PERFORMANCE
// ============================================================================

interface HeroSectionProps {
  navigation?: any;
}

const HeroSection: React.FC<HeroSectionProps> = memo(({ navigation }) => {
  const { isDark, accentColor } = useThemePalette();
  const flatListRef = useRef<FlatList>(null);

  const [currentOffer, setCurrentOffer] = useState(0);
  const [currentScrollIndex, setCurrentScrollIndex] = useState(0);
  const [locationLoading, setLocationLoading] = useState(false);
  const [qrScannerVisible, setQrScannerVisible] = useState(false);
  const [scanned, setScanned] = useState(false);
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
  });

  // Memoized data extraction - only recalculate when data changes
  const medicines: Medicine[] = useMemo(() => medicinesData || MOCK_MEDICINES, [medicinesData]);
  const advertisements: Advertisement[] = useMemo(() => adsData || MOCK_ADS, [adsData]);

  // Infinite scroll optimization - only if we have ads
  const infiniteOffers = useMemo(() => {
    if (advertisements.length === 0) return [];
    return [...advertisements, ...advertisements, ...advertisements];
  }, [advertisements]);

  // Safe start index calculation
  const startIndex = useMemo(() => {
    if (advertisements.length === 0) return 0;
    return advertisements.length;
  }, [advertisements.length]);

  // ========== LOCATION HANDLER ==========
  const handleLocationPress = useCallback(async () => {
    setLocationLoading(true);

    try {
      const location = await LocationService.getCurrentLocation();
      
      // Fetch Address (Reverse Geocoding)
      const addressString = await LocationService.getAddressFromCoordinates(
        location.latitude,
        location.longitude
      );

      // Store location data
      const locationData: LocationData = {
        latitude: location.latitude,
        longitude: location.longitude,
        address: addressString,
        city: addressString.split(',')[0], // Simple approximation
        state: 'India',
      };

      setUserLocation(locationData);

      // Update profile with location (Wrapped in try-catch to prevent crash)
      try {
        const addressData = {
          address: {
            street: addressString,
            city: locationData.city || 'Current City',
            state: 'Current State',
            zip: 'PIN',
            country: 'India',
            location: { latitude: location.latitude, longitude: location.longitude },
          },
        };
        await updateUserProfile(addressData, false);
      } catch (profileError) {
        console.warn('[HeroSection] Profile update failed (non-fatal):', profileError);
        // Continue execution - don't crash the app
      }

      // Show success toast
      ToastAndroid.show(
        `✓ Location Updated: ${addressString}`,
        ToastAndroid.LONG
      );

      setLocationLoading(false);
    } catch (error: any) {
      console.error('[HeroSection] Location Error:', error.message);
      setLocationLoading(false);

      if (error.message === 'PERMISSION_DENIED') {
        ToastAndroid.show('Location permission denied', ToastAndroid.SHORT);
      } else if (error.message === 'GPS_DISABLED') {
        ToastAndroid.show('Location is required to proceed', ToastAndroid.SHORT);
      } else {
        ToastAndroid.show('Error getting location', ToastAndroid.SHORT);
      }
    }
  }, []);

  const handleQRScannerToggle = useCallback(() => {
    setQrScannerVisible(true);
    setScanned(false);
  }, []);

  const handleQRScan = useCallback((data: string) => {
    setScanned(true);
    Alert.alert('QR Code Data', `Data: ${data}`, [
      { text: 'OK', onPress: () => setQrScannerVisible(false) },
    ]);
  }, []);

  const handleMedicinePress = useCallback((medicine: Medicine) => {
    console.log('Medicine selected:', medicine.title);
  }, []);

  const handleAdvertisementClick = useCallback(async (adId: string, adTitle: string) => {
    try {
      await trackAdvertisementClick(adId);
      Alert.alert('Advertisement Clicked', `You clicked on: ${adTitle}`);
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  }, []);

  // ========== AUTO-SCROLL EFFECT ==========
  useEffect(() => {
    if (advertisements.length === 0 || infiniteOffers.length === 0) return;

    const interval = setInterval(() => {
      setCurrentScrollIndex((prev) => {
        const next = prev + 1;
        
        // Only scroll if the index is valid
        if (next < infiniteOffers.length && flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index: next,
            animated: true,
          });
        }
        
        // Update offer indicator
        setCurrentOffer((next - startIndex) % Math.max(advertisements.length, 1));
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [advertisements.length, infiniteOffers.length, startIndex]);

  // Initialize scroll position - only if we have data
  useEffect(() => {
    if (advertisements.length === 0 || infiniteOffers.length === 0) return;
    
    if (flatListRef.current && startIndex > 0 && startIndex < infiniteOffers.length) {
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({
            index: startIndex,
            animated: false,
          });
          setCurrentScrollIndex(startIndex);
        } catch (error) {
          console.error('[HeroSection] Scroll initialization error:', error);
        }
      }, 100);
    }
  }, [advertisements.length, infiniteOffers.length, startIndex]);

  // Show skeleton only on first load
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
      <View
        style={{ width: '100%', paddingHorizontal: getResponsiveSize(16) }}
      >
        {/* Featured Title */}
        <View style={{ marginVertical: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: isDark ? '#FFFFFF' : '#1F2937',
                letterSpacing: 0.5,
              }}
            >
              {userLocation ? `📍 ${userLocation.address}` : 'Featured Medicines'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {/* QR Button */}
              <TouchableOpacity
                onPress={handleQRScannerToggle}
                disabled={qrScannerVisible}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: isDark ? '#3A3A3A' : '#E5E7EB',
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: qrScannerVisible ? 0.5 : 1,
                }}
              >
                <Icon name="qr-code-outline" size={25} color={isDark ? '#FFFFFF' : '#1F2937'} />
              </TouchableOpacity>

              {/* Location Button */}
              <TouchableOpacity
                onPress={handleLocationPress}
                disabled={locationLoading}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: isDark ? '#3A3A3A' : '#E5E7EB',
                  justifyContent: 'center',
                  alignItems: 'center',
                  opacity: locationLoading ? 0.5 : 1,
                }}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#1F2937'} />
                ) : (
                  <Icon name="location-outline" size={25} color={isDark ? '#FFFFFF' : '#1F2937'} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Beautiful Location Display Card */}
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

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
          {medicines.slice(0, 5).map((medicine) => (
            <TouchableOpacity
              key={medicine._id}
              style={{
                marginRight: 15,
                alignItems: 'center',
              }}
              activeOpacity={0.8}
              onPress={() => handleMedicinePress(medicine)}
            >
              <View
                style={{
                  width: 65,
                  height: 65,
                  borderRadius: 32,
                  backgroundColor: isDark ? '#3A3A3A' : '#F0F0F0',
                  borderWidth: 1,
                  borderColor: isDark ? '#374151' : '#E5E7EB',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden',
                }}
              >
                <Image
                  source={{ uri: medicine.imageUrl }}
                  style={{ width: 60, height: 60, borderRadius: 30 }}
                />
              </View>
              <Text
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: isDark ? '#FFFFFF' : '#1F2937',
                  textAlign: 'center',
                  width: 65,
                }}
                numberOfLines={1}
              >
                {medicine.title.substring(0, 10)}...
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Advertisements */}
        {advertisements.length > 0 ? (
          <FlatList
            ref={flatListRef}
            data={infiniteOffers}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled={false}
            decelerationRate="fast"
            snapToInterval={screenWidth * 0.9 + 16}
            snapToAlignment="start"
            contentContainerStyle={{ paddingHorizontal: 5 }}
            renderItem={({ item: ad }) => (
              <AdvertisementCard
                ad={ad}
                isDark={isDark}
                accentColor={accentColor}
                onPress={handleAdvertisementClick}
              />
            )}
            keyExtractor={(_, idx) => `ad-${idx}`}
            scrollEventThrottle={16}
            getItemLayout={(data, index) => ({
              length: screenWidth * 0.9 + 16,
              offset: (screenWidth * 0.9 + 16) * index,
              index,
            })}
          />
        ) : (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Icon name="megaphone-outline" size={50} color={isDark ? '#9CA3AF' : '#D1D5DB'} />
            <Text
              style={{
                marginTop: 10,
                fontSize: 16,
                color: isDark ? '#9CA3AF' : '#D1D5DB',
                textAlign: 'center',
              }}
            >
              No advertisements available
            </Text>
          </View>
        )}

        {/* Indicator Dots */}
        {advertisements.length > 0 && (
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 12, gap: 6 }}>
            {advertisements.map((_, i) => (
              <View
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: currentOffer === i ? accentColor : isDark ? '#9CA3AF' : '#D1D5DB',
                }}
              />
            ))}
          </View>
        )}
      </View>

      {/* QR Scanner Modal */}
      <QRScanner
        visible={qrScannerVisible}
        onClose={() => {
          setQrScannerVisible(false);
          setScanned(false);
        }}
        scanned={scanned}
        onScan={handleQRScan}
      />
    </LinearGradient>
  );
});

HeroSection.displayName = 'HeroSection';

export default HeroSection;
