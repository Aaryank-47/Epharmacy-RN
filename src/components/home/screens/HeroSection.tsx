import React, { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Dimensions, Easing, FlatList, Animated, ActivityIndicator, Platform, ToastAndroid } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import LocationService from '../../../services/LocationService';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useThemePalette } from '../../../hooks/useThemePalette';
import { trackAdvertisementClick, updateUserProfile, getFeaturedMedicines, getRunningAdvertisements } from '../../../api/medicinesApi';
import { getUserProfile } from '../../../api/authApi';

interface Medicine { _id: string; title: string; imageUrl: string; price?: number; originalPrice?: number; discount?: number }
interface Advertisement { _id: string; title: string; description: string; imageUrl: string; startDate: string; endDate: string; offerText?: string }
interface LocationData { latitude: number; longitude: number; address?: string; city?: string; state?: string }

const { width: screenWidth } = Dimensions.get('window');
const getResponsiveSize = (size: number) => (screenWidth / 375) * size;

// Module-level flag: resets on app kill/restart, persists during hot reload
let hasRequestedLocationInAppSession = false;

const SkeletonShimmer = memo<{ width: number | string; height: number; borderRadius?: number; isDark: boolean; style?: any }>(({ width, height, borderRadius = 8, isDark, style }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.sequence([Animated.timing(shimmerAnim, { toValue: 1, duration: 1200, useNativeDriver: true }), Animated.timing(shimmerAnim, { toValue: 0, duration: 1200, useNativeDriver: true })]));
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);
  return <Animated.View style={[{ width, height, borderRadius, backgroundColor: isDark ? '#3A3A3A' : '#E5E7EB', opacity: shimmerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] }) }, style]} />;
});

const HeroSectionSkeleton = memo<{ isDark: boolean }>(({ isDark }) => (
  <LinearGradient colors={isDark ? ['#181A20', '#2A2D35'] : ['#FFFFFF', '#F3F4F6']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }}>
    <ScrollView style={{ flex: 1, paddingHorizontal: getResponsiveSize(16) }} showsVerticalScrollIndicator={false}>
      <View style={{ marginVertical: 16 }}><SkeletonShimmer width={180} height={24} borderRadius={6} isDark={isDark} /></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>{Array.from({ length: 5 }).map((_, i) => <View key={i} style={{ marginRight: 15, alignItems: 'center' }}><SkeletonShimmer width={65} height={65} borderRadius={32} isDark={isDark} /><SkeletonShimmer width={55} height={14} borderRadius={6} isDark={isDark} style={{ marginTop: 8 }} /></View>)}</ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 12 }}>{Array.from({ length: 3 }).map((_, i) => <View key={i} style={{ width: screenWidth * 0.9, marginHorizontal: 8, marginVertical: 12, padding: 16, borderRadius: 16, backgroundColor: isDark ? '#2A2D35' : '#F3F4F6', flexDirection: 'row' }}><View style={{ flex: 1 }}><SkeletonShimmer width={150} height={22} borderRadius={6} isDark={isDark} /><SkeletonShimmer width={120} height={14} borderRadius={6} isDark={isDark} style={{ marginTop: 8 }} /><SkeletonShimmer width={100} height={13} borderRadius={6} isDark={isDark} style={{ marginTop: 6 }} /><SkeletonShimmer width={80} height={35} borderRadius={8} isDark={isDark} style={{ marginTop: 12 }} /></View><SkeletonShimmer width={120} height={110} borderRadius={15} isDark={isDark} /></View>)}</ScrollView>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 12, gap: 6 }}>{Array.from({ length: 3 }).map((_, i) => <SkeletonShimmer key={i} width={8} height={8} borderRadius={4} isDark={isDark} />)}</View>
    </ScrollView>
  </LinearGradient>
));

const AdvertisementCard = memo<{ ad: Advertisement; isDark: boolean; accentColor: string; onPress: (id: string, title: string) => void }>(({ ad, isDark, onPress }) => (
  <TouchableOpacity activeOpacity={0.9} onPress={() => onPress(ad._id, ad.title)}>
    <LinearGradient colors={isDark ? ['#1E2026', '#2A2D35'] : ['#FFFFFF', '#F9FAFB']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: '100%', borderRadius: 24, padding: getResponsiveSize(16), marginVertical: getResponsiveSize(6), flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0,0,0,0.05)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.4 : 0.1, shadowRadius: 12, elevation: isDark ? 4 : 1 }}>
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: '700', color: isDark ? '#9CA3AF' : '#6B7280', letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 6 }}>{ad.title}</Text>
        <Text style={{ fontSize: 28, fontWeight: '900', color: isDark ? '#FFFFFF' : '#111827', letterSpacing: -0.5, lineHeight: 34 }}>{ad.offerText || '50'}% OFF</Text>
        <Text style={{ marginTop: 6, fontSize: 14, color: isDark ? '#D1D5DB' : '#4B5563', opacity: 0.9, fontWeight: '500' }}>{new Date(ad.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
        <TouchableOpacity style={{ marginTop: 18, paddingVertical: 10, paddingHorizontal: 24, borderRadius: 30, backgroundColor: '#22C55E', alignSelf: 'flex-start', shadowColor: '#22C55E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 2 }} onPress={() => onPress(ad._id, ad.title)}><Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>Get Now</Text></TouchableOpacity>
      </View>
      <View style={{ width: 140, height: 130, borderRadius: 15, overflow: 'hidden', backgroundColor: isDark ? '#374151' : '#F3F4F6', borderWidth: 0.4, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }}><Image source={{ uri: ad.imageUrl }} style={{ width: '100%', height: '100%', resizeMode: 'cover' }} /></View>
    </LinearGradient>
  </TouchableOpacity>
));

const ProgressDot = memo<{ isActive: boolean; isDark: boolean; duration?: number }>(({ isActive, isDark, duration = 3000 }) => {
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (isActive) {
      progress.setValue(0);
      Animated.timing(progress, { toValue: 1, duration, useNativeDriver: false, easing: Easing.linear }).start();
    } else progress.setValue(0);
  }, [isActive, duration, progress]);
  return <View style={{ width: isActive ? 26 : 8, height: 4, borderRadius: 2, backgroundColor: isDark ? '#4B5563' : '#D1D5DB', marginHorizontal: 3, overflow: 'hidden' }}>{isActive && <Animated.View style={{ height: '100%', backgroundColor: '#22C55E', width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />}</View>;
});

const RotatingBorder = memo(({ isDark }: { isDark: boolean }) => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const animation = Animated.loop(Animated.timing(rotateAnim, { toValue: 1, duration: 9500, easing: Easing.linear, useNativeDriver: true }));
    animation.start();
    return () => animation.stop();
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={{ position: 'absolute', top: -4, left: -4, width: 73, height: 73, borderRadius: 36.5, borderWidth: 2, borderColor: isDark ? '#22C55E' : '#16A34A', borderStyle: 'dashed', transform: [{ rotate: spin }] }} />
  );
});

const HeroSection: React.FC<{ navigation?: any; onReady?: () => void; isRefreshing?: boolean }> = memo(({ navigation, onReady, isRefreshing }) => {
  const { isDark, accentColor } = useThemePalette();
  const flatListRef = useRef<FlatList>(null);
  const scrollIndexRef = useRef(0);
  const [currentOffer, setCurrentOffer] = useState(0);
  const [currentScrollIndex, setCurrentScrollIndex] = useState(0);
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const isPausedRef = useRef(false);

  const { data: medicinesData, isLoading: medicinesLoading, refetch: medicinesRefetch } = useQuery({
    queryKey: ['featured-medicines'],
    queryFn: async () => {
      const response = await getFeaturedMedicines();
      return response.data?.data || [];
    },
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 3,
    retryDelay: 2000,
  });

  const { data: adsData, isLoading: adsLoading, refetch: adsRefetch } = useQuery({
    queryKey: ['running-advertisements'],
    queryFn: async () => {
      const response = await getRunningAdvertisements();
      return response.data?.data || [];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 3,
    retryDelay: 2000,
    refetchInterval: (query) => (!query.state.data?.length ? 3000 : false),
  });

  // Force refetch when pulling to refresh
  useEffect(() => {
    if (isRefreshing) {
      medicinesRefetch();
      adsRefetch();
    }
  }, [isRefreshing]);

  // Sequential Rendering Trigger
  useEffect(() => {
    if (!medicinesLoading && !adsLoading) {
      // Small delay to ensure render passes
      const timer = setTimeout(() => {
        onReady?.();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [medicinesLoading, adsLoading, onReady]);

  const medicines: Medicine[] = useMemo(() => medicinesData || [], [medicinesData]);
  const advertisements: Advertisement[] = useMemo(() => adsData || [], [adsData]);
  const infiniteOffers = useMemo(() => advertisements.length === 0 ? [] : Array(100).fill(advertisements).flat(), [advertisements]);

  // Fetch user profile to get saved address
  const { data: profileData } = useQuery({
    queryKey: ['user-profile'],
    queryFn: async () => {
      try {
        const response = await getUserProfile();
        return response.data;
      } catch {
        return null;
      }
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Initialize location from saved profile address
  useEffect(() => {
    if (profileData?.address && !userLocation) {
      const addr = profileData.address;
      const lat = addr.location?.latitude;
      const lng = addr.location?.longitude;

      if (lat && lng) {
        // Build formatted address from saved profile data
        const addressParts = [
          addr.street,
          addr.city,
          addr.state,
          addr.zip
        ].filter(Boolean);

        setUserLocation({
          latitude: lat,
          longitude: lng,
          address: addressParts.join(', ') || 'Saved Address',
          city: addr.city || '',
          state: addr.state || ''
        });
      }
    }
  }, [profileData, userLocation]);

  // Auto-fetch location on app restart ONLY (not on hot reload)
  useEffect(() => {
    const autoFetchLocation = async () => {
      try {
        if (hasRequestedLocationInAppSession) return;
        hasRequestedLocationInAppSession = true;

        const { latitude, longitude } = await LocationService.getCurrentLocation();
        const addressDetails = await LocationService.getAddressDetails(latitude, longitude);

        const locationData: LocationData = {
          latitude,
          longitude,
          address: addressDetails.formattedAddress,
          city: addressDetails.city,
          state: addressDetails.state
        };

        setUserLocation(locationData);

        await updateUserProfile({
          address: {
            street: addressDetails.street,
            city: addressDetails.city,
            state: addressDetails.state,
            zip: addressDetails.zip,
            country: addressDetails.country,
            location: { latitude, longitude }
          }
        }, false);

      } catch (error) {
        // Silently fail - user can update location from profile
      }
    };

    autoFetchLocation();
  }, []);



  const handleMedicinePress = useCallback(async (medicine: Medicine) => navigation.navigate('ProductDetail', { productId: medicine._id }), [navigation]);
  const handleAdvertisementClick = useCallback(async (adId: string) => { try { await trackAdvertisementClick(adId); } catch { } }, []);

  useEffect(() => {
    if (advertisements.length === 0) return;
    const interval = setInterval(() => {
      if (isPausedRef.current) return; // Don't scroll if paused
      const nextIndex = scrollIndexRef.current + 1;
      const targetIndex = nextIndex > infiniteOffers.length - 1 ? 0 : nextIndex;
      if (flatListRef.current) flatListRef.current.scrollToIndex({ index: targetIndex, animated: true });
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
    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
    scrollIndexRef.current = index;
    setCurrentScrollIndex(index);
    setCurrentOffer(index % Math.max(advertisements.length, 1));
  }, [advertisements.length]);

  if ((medicinesLoading || adsLoading) && !medicines.length && !advertisements.length) return <HeroSectionSkeleton isDark={isDark} />;

  return (
    <LinearGradient colors={isDark ? ['#181A20', '#2A2D35'] : ['#FFFFFF', '#F3F4F6']} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1, paddingHorizontal: getResponsiveSize(16) }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }} scrollEventThrottle={16}>
        <View style={{ marginVertical: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: isDark ? '#FFFFFF' : '#1F2937', letterSpacing: 0.5 }} numberOfLines={1} ellipsizeMode="tail">
                {userLocation ? userLocation.address : 'Featured Medicines'}
              </Text>
              {userLocation && <Text style={{ fontSize: 12, color: isDark ? '#9CA3AF' : '#6B7280' }}>Current Location</Text>}
            </View>
          </View>
        </View>



        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }} contentContainerStyle={{ paddingHorizontal: 2 }}>
          {medicines.map((medicine) => (
            <TouchableOpacity key={medicine._id} style={{ alignItems: 'center', width: (screenWidth - 32) / 4 }} activeOpacity={0.7} onPress={() => handleMedicinePress(medicine)}>
              <View style={{ width: 65, height: 65, alignItems: 'center', justifyContent: 'center', marginTop: 4 }}>
                <RotatingBorder isDark={isDark} />
                <View style={{ width: 61, height: 61, borderRadius: 30.5, backgroundColor: isDark ? '#3A3A3A' : '#F0F0F0', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                  <Image source={{ uri: medicine.imageUrl }} style={{ width: 61, height: 61, borderRadius: 30.5 }} resizeMode="cover" />
                </View>
              </View>
              <Text style={{ marginTop: 8, fontSize: 11, fontWeight: '600', color: isDark ? '#E5E7EB' : '#4B5563', textAlign: 'center' }} numberOfLines={1}>{medicine.title.split(' ')[0]}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {advertisements.length > 0 ? (
          <View style={{ marginHorizontal: -getResponsiveSize(16) }}>
            <FlatList
              ref={flatListRef}
              data={infiniteOffers}
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              initialNumToRender={3}
              maxToRenderPerBatch={3}
              windowSize={5}
              decelerationRate="fast"
              snapToInterval={screenWidth}
              snapToAlignment="center"
              contentContainerStyle={{ paddingHorizontal: 0 }}
              renderItem={({ item: ad }) => <View style={{ width: screenWidth, alignItems: 'center', justifyContent: 'center' }}><View style={{ width: screenWidth - 32 }}><AdvertisementCard ad={ad} isDark={isDark} accentColor={accentColor} onPress={handleAdvertisementClick} /></View></View>}
              keyExtractor={(_, idx) => `ad-${idx}`}
              scrollEventThrottle={16}
              onScroll={handleScroll}
              getItemLayout={(data, index) => ({ length: screenWidth, offset: screenWidth * index, index })}
              onTouchStart={() => isPausedRef.current = true}
              onTouchEnd={() => isPausedRef.current = false}
              onScrollBeginDrag={() => { isPausedRef.current = true; }}
              onMomentumScrollEnd={() => { isPausedRef.current = false; }}
            />
            <View style={{ alignItems: 'center', marginTop: -20, marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: isDark ? '#2a2d35ff' : '#FFFFFF', paddingVertical: 6, marginTop: 5, paddingHorizontal: 12, borderRadius: 20, gap: 7, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 } }), borderTopWidth: isDark ? 0.5 : 0, borderColor: isDark ? '#4B5563' : 'transparent' }}>
                {advertisements.map((_, i) => <ProgressDot key={i} isActive={currentOffer === i} isDark={isDark} duration={3000} />)}
              </View>
            </View>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -8, marginVertical: 12 }}>{Array.from({ length: 3 }).map((_, i) => <View key={i} style={{ width: screenWidth * 0.9, marginHorizontal: 8, marginVertical: 12, padding: 16, borderRadius: 16, backgroundColor: isDark ? '#2A2D35' : '#F3F4F6', flexDirection: 'row', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}><View style={{ flex: 1 }}><SkeletonShimmer width={150} height={22} borderRadius={6} isDark={isDark} /><SkeletonShimmer width={120} height={14} borderRadius={6} isDark={isDark} style={{ marginTop: 8 }} /><SkeletonShimmer width={100} height={13} borderRadius={6} isDark={isDark} style={{ marginTop: 6 }} /><SkeletonShimmer width={80} height={35} borderRadius={8} isDark={isDark} style={{ marginTop: 12 }} /></View><SkeletonShimmer width={120} height={110} borderRadius={15} isDark={isDark} /></View>)}</ScrollView>
        )}
      </ScrollView>
    </LinearGradient>
  );
});

export default React.memo(HeroSection);
