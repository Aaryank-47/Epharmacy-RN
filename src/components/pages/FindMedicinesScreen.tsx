import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  ScrollView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import { useThemePalette } from '../../hooks/useThemePalette';
import { usePrescriptionOCR } from '../../hooks/usePrescriptionOCR';
import { StoresView } from './find-medicines/StoresView';
import { MedicinesView } from './find-medicines/MedicinesView';
import { BucketView } from './find-medicines/BucketView';
import { FiltersSheet } from './find-medicines/FiltersSheet';
import type { FilterState } from './find-medicines/FiltersSheet';

interface Props {
  navigation: any;
  route?: any;
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

const FindMedicinesScreen: React.FC<Props> = ({ navigation, route }) => {
  const initialMedicines = route?.params?.initialMedicines;
  const initialCount = route?.params?.detectedCount;
  const { isDark, accentColor, surfaceColor } = useThemePalette();
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>({
    sortBy: 'nearest',
    maxPrice: 2000,
    brands: [],
    maxDistance: 25,
    availability: 'all',
  });

  const {
    activeTab,
    setActiveTab,
    ocrState,
    reset,
    bucketItems,
    addToBucket,
    updateQuantity,
    removeFromBucket,
    selectedDelivery,
    setSelectedDelivery,
    bucketCount,
    bucketTotal,
  } = usePrescriptionOCR(initialMedicines, initialCount);

  const textColor = isDark ? '#FFFFFF' : '#111827';
  const subText = isDark ? '#9CA3AF' : '#6B7280';
  const headerBg = surfaceColor;
  const borderColor = isDark ? '#2A2D35' : '#E5E7EB';
  const inputBg = isDark ? '#2A2D35' : '#F3F4F6';
  const tabInactiveBg = isDark ? '#2A2D35' : '#F3F4F6';
  const filtersActive =
    appliedFilters.brands.length > 0 || appliedFilters.sortBy !== 'nearest';

  const handleProceedToOrder = () => {
    if (bucketCount === 0) {
      Alert.alert(
        'Empty Bucket',
        'Please add some medicines to your bucket first.',
      );
      return;
    }
    Alert.alert(
      'Order Placed',
      `Your order for ₹${bucketTotal} has been placed!\n${
        selectedDelivery === 'pickup'
          ? 'Ready for pickup'
          : 'Will be delivered in 45 min'
      }.`,
      [
        {
          text: 'OK',
          onPress: () => {
            reset();
            setActiveTab('stores');
          },
        },
      ],
    );
  };

  const deviceWidth = Dimensions.get('window').width;
  const pagerRef = useRef<FlatList>(null);

  // Tab config — single source of truth for label, icons
  const TAB_CONFIG = [
    {
      id: 'stores',
      label: 'Stores',
      title: 'Pharmacies',
      subtitle: 'nearby stores',
      icon: 'storefront-outline',
      activeIcon: 'storefront',
    },
    {
      id: 'medicines',
      label: 'Medicines',
      title: 'Medicines',
      subtitle: 'from your prescription',
      icon: 'pill',
      activeIcon: 'pill',
    },
    {
      id: 'bucket',
      label: 'Bucket',
      title: 'My Bucket',
      subtitle:
        bucketCount > 0
          ? `${bucketCount} item${bucketCount > 1 ? 's' : ''}`
          : 'empty',
      icon: 'pail-outline',
      activeIcon: 'basket',
    },
  ] as const;

  const tabs = TAB_CONFIG.map(t => t.id);
  const activeTabConfig =
    TAB_CONFIG.find(t => t.id === activeTab) || TAB_CONFIG[0];

  const isManualScrolling = useRef(false);

  // Sync pager when activeTab changes (e.g. from button click)
  useEffect(() => {
    // If it was a swipe (isManualScrolling is true), don't scroll manually
    if (isManualScrolling.current) {
      isManualScrolling.current = false;
      return;
    }

    const index = tabs.indexOf(activeTab);
    if (index !== -1) {
      pagerRef.current?.scrollToIndex({ index, animated: true });
    }
  }, [activeTab]);

  const handleTabPress = (tab: string) => {
    isManualScrolling.current = false; // It's a click, so we want the effect to scroll
    setActiveTab(tab as any);
  };

  // Snappy direction-aware tab bar hide/show (state machine + spring, no jitter)
  const TAB_BAR_HEIGHT = 64;
  const tabAnim = useRef(new Animated.Value(0)).current; // 0 = visible, 1 = hidden
  const tabHiddenRef = useRef(false);
  const lastScrollY = useRef(0);

  const animateTabBar = useCallback(
    (toHidden: boolean) => {
      if (tabHiddenRef.current === toHidden) return;
      tabHiddenRef.current = toHidden;
      Animated.spring(tabAnim, {
        toValue: toHidden ? 1 : 0,
        useNativeDriver: true,
        friction: 9,
        tension: 80,
      }).start();
    },
    [tabAnim],
  );

  const scrollDiff = useRef(0);

  const handleScroll = useCallback(
    (e: any) => {
      const y = e.nativeEvent.contentOffset.y;
      const dy = y - lastScrollY.current;

      // Ignore momentum bounce at the very top or bottom
      if (y <= 0 || dy === 0) {
        lastScrollY.current = y;
        return;
      }

      lastScrollY.current = y;

      // At the top, always show
      if (y < 20) {
        animateTabBar(false);
        scrollDiff.current = 0;
        return;
      }

      // Accumulate scroll distance
      scrollDiff.current += dy;

      // Stability: If already hidden and scrolling down, don't accumulate more hide "force"
      if (tabHiddenRef.current && dy > 0) {
        scrollDiff.current = 0;
      }
      // Stability: If already visible and scrolling up, don't accumulate more show "force"
      if (!tabHiddenRef.current && dy < 0) {
        scrollDiff.current = 0;
      }

      if (scrollDiff.current > 50 && !tabHiddenRef.current && y > 100) {
        // Significant downward scroll to hide
        animateTabBar(true);
        scrollDiff.current = 0;
      } else if (scrollDiff.current < -35 && tabHiddenRef.current) {
        // Significant upward scroll to show
        animateTabBar(false);
        scrollDiff.current = 0;
      }

      // Safety cap for accumulated diff
      if (scrollDiff.current > 100) scrollDiff.current = 100;
      if (scrollDiff.current < -100) scrollDiff.current = -100;
    },
    [animateTabBar],
  );

  useEffect(() => {
    // Show tab bar when switching tabs
    animateTabBar(false);
    lastScrollY.current = 0;
  }, [activeTab, animateTabBar]);

  const tabTranslateY = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -TAB_BAR_HEIGHT],
  });
  const tabOpacity = tabAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  // Pager scroll → real-time tab change at 50% threshold (avoids late color update)
  const handlePagerMomentumEnd = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / deviceWidth);
    if (tabs[index] && activeTab !== tabs[index]) {
      isManualScrolling.current = true;
      setActiveTab(tabs[index] as any);
    }
  };

  // Shared upload handler used by both the top-right icon and MedicinesView's onUpload prop
  const handleUploadPress = (file?: {
    uri: string;
    name: string;
    type: string;
  }) => {
    if (file) {
      navigation.navigate('OCRProcessingScreen', { file });
      return;
    }

    Alert.alert(
      'Upload Prescription',
      'Choose a method to upload your prescription',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Camera',
          onPress: async () => {
            const result = await launchCamera({
              mediaType: 'photo',
              quality: 0.8,
              saveToPhotos: false,
            });
            if (result.didCancel || !result.assets?.length) return;
            const asset = result.assets[0];
            if (!asset.uri) return;
            const fileData = {
              uri: asset.uri,
              name: asset.fileName || 'prescription.jpg',
              type: asset.type || 'image/jpeg',
            };
            navigation.navigate('OCRProcessingScreen', { file: fileData });
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            const result = await launchImageLibrary({
              mediaType: 'photo',
              selectionLimit: 1,
              quality: 0.8,
            });
            if (result.didCancel || !result.assets?.length) return;
            const asset = result.assets[0];
            if (!asset.uri) return;
            const fileData = {
              uri: asset.uri,
              name: asset.fileName || 'prescription.jpg',
              type: asset.type || 'image/jpeg',
            };
            navigation.navigate('OCRProcessingScreen', { file: fileData });
          },
        },
      ],
    );
  };

  // Pager settings and scroll animations...
  // Swiping content logic handled by FlatList below

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#08090D' : '#FFF5F8' }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={headerBg}
      />

      {/* Safe area top + Header — zIndex 10 keeps it above the translating tab bar */}
      <LinearGradient
        colors={isDark ? ['#000000', '#08090D'] : ['#FFFFFF', '#FFF5F8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          paddingTop: Platform.OS === 'android' ? 10 : 0,
          zIndex: 10,
          elevation: 10,
        }}
      >
        <SafeAreaView>
          {/* Header row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingTop: 2,
              paddingBottom: 20,
              gap: 12,
            }}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 20,
                backgroundColor: tabInactiveBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="arrow-left" size={20} color={textColor} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 19,
                  fontWeight: '800',
                  color: textColor,
                  letterSpacing: -0.3,
                }}
                numberOfLines={1}
              >
                {activeTabConfig.title}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  color: subText,
                  marginTop: 1,
                }}
                numberOfLines={1}
              >
                {activeTabConfig.subtitle}
              </Text>
            </View>
          </View>

          {/* Search bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginHorizontal: 16,
              marginBottom: 7,
              gap: 10,
            }}
          >
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: isDark ? '#1A1D26' : '#FFFFFF',
                borderRadius: 16,
                paddingHorizontal: 14,
                height: 50,
                borderWidth: 1,
                borderColor: isDark ? '#2A2D35' : '#E5E7EB',
                shadowColor: isDark ? '#000' : '#94A3B8',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.32 : 0.1,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  backgroundColor: accentColor + '18',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Icon name="magnify" size={16} color={accentColor} />
              </View>
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={`Search ${activeTabConfig.label.toLowerCase()}...`}
                placeholderTextColor={subText}
                style={{
                  flex: 1,
                  fontSize: 14.5,
                  fontWeight: '500',
                  color: textColor,
                  marginLeft: 10,
                  paddingVertical: 0,
                }}
              />
              {searchQuery.length > 0 ? (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Icon name="close-circle" size={18} color={subText} />
                </TouchableOpacity>
              ) : (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <View
                    style={{
                      width: 1,
                      height: 18,
                      backgroundColor: isDark ? '#2A2D35' : '#E5E7EB',
                    }}
                  />
                  <TouchableOpacity
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  >
                    <Icon name="microphone" size={18} color={accentColor} />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setShowFilters(true)}
              activeOpacity={0.85}
              style={{
                width: 50,
                height: 50,
                borderRadius: 14,
                backgroundColor: filtersActive
                  ? accentColor
                  : isDark
                  ? accentColor
                  : '#FFFFFF',
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: filtersActive
                  ? accentColor
                  : isDark
                  ? '#2A2D35'
                  : '#E5E7EB',
                shadowColor: filtersActive
                  ? accentColor
                  : isDark
                  ? '#000'
                  : '#94A3B8',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: filtersActive ? 0.35 : isDark ? 0.32 : 0.1,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              <Icon
                name="tune-variant"
                size={20}
                color={filtersActive ? '#FFFFFF' : textColor}
              />
              {filtersActive && (
                <View
                  style={{
                    position: 'absolute',
                    top: 11,
                    right: 11,
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#FF4B4B',
                    borderWidth: 1.5,
                    borderColor: accentColor,
                  }}
                />
              )}
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Animated content container (Tab bar + Tab content) */}
      <View
        style={{
          flex: 1,
          zIndex: 1,
          backgroundColor: isDark ? '#08090D' : '#FFF5F8',
          overflow: 'hidden',
        }}
      >
        {/* Tab bar — flex-row, all 3 always fully visible, light-mode safe */}
        <Animated.View
          style={{
            height: TAB_BAR_HEIGHT,
            paddingHorizontal: 16,
            paddingTop: 10,
            opacity: tabOpacity,
            transform: [{ translateY: tabTranslateY }],
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 5,
            backgroundColor: isDark ? '#08090D' : '#FFF5F8',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              gap: 10,
              backgroundColor: 'transparent',
            }}
          >
            {TAB_CONFIG.map(tab => {
              const isActive = activeTab === tab.id;
              const showBadge = tab.id === 'bucket' && bucketCount > 0;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => handleTabPress(tab.id)}
                  activeOpacity={0.85}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 7,
                    paddingHorizontal: 8,
                    paddingVertical: 11,
                    borderRadius: 20,
                    backgroundColor: isActive
                      ? accentColor
                      : isDark
                      ? '#1C1F28'
                      : '#FFFFFF',
                    borderWidth: isActive ? 0 : 1,
                    borderColor: isDark ? '#2A2D35' : '#ECEEF2',
                    shadowColor: isActive
                      ? accentColor
                      : isDark
                      ? '#000'
                      : '#94A3B8',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: isActive ? 0.35 : isDark ? 0.3 : 0.08,
                    shadowRadius: 6,
                    elevation: isActive ? 4 : 2,
                  }}
                >
                  <Icon
                    name={isActive ? tab.activeIcon : tab.icon}
                    size={16}
                    color={
                      isActive ? '#FFFFFF' : isDark ? '#9CA3AF' : '#64748B'
                    }
                  />
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 13.5,
                      fontWeight: isActive ? '800' : '600',
                      color: isActive
                        ? '#FFFFFF'
                        : isDark
                        ? '#E5E7EB'
                        : '#0F172A',
                      letterSpacing: -0.1,
                    }}
                  >
                    {tab.label}
                  </Text>
                  {showBadge && (
                    <View
                      style={{
                        minWidth: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: isActive ? '#FFFFFF' : '#EF4444',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingHorizontal: 5,
                        marginLeft: 2,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          fontWeight: '800',
                          color: isActive ? accentColor : '#FFFFFF',
                        }}
                      >
                        {bucketCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Swipeable Tab content — Coordinated NATIVE animation for maximum smoothness */}
        <Animated.View
          style={{
            flex: 1,
            paddingTop: TAB_BAR_HEIGHT,
            transform: [{ translateY: tabTranslateY }],
            marginBottom: -TAB_BAR_HEIGHT, // Extends view to avoid gap at bottom
          }}
        >
          <FlatList
            ref={pagerRef}
            data={tabs}
            horizontal
            pagingEnabled
            decelerationRate="fast"
            disableIntervalMomentum
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item}
            onScroll={handlePagerMomentumEnd}
            onMomentumScrollEnd={handlePagerMomentumEnd}
            scrollEventThrottle={16}
            getItemLayout={(_, index) => ({
              length: deviceWidth,
              offset: deviceWidth * index,
              index,
            })}
            renderItem={({ item }) => (
              <View style={{ width: deviceWidth, flex: 1 }}>
                {item === 'stores' && (
                  <StoresView
                    onFilterPress={() => setShowFilters(true)}
                    onScroll={handleScroll}
                  />
                )}
                {item === 'medicines' && (
                  <MedicinesView
                    status={ocrState.status}
                    medicines={ocrState.streamingMedicines}
                    streamingMedicines={ocrState.streamingMedicines}
                    detectedCount={ocrState.detectedCount}
                    error={ocrState.error}
                    onUpload={handleUploadPress}
                    onReset={reset}
                    onAddToBucket={addToBucket}
                    onCompareStores={() => setActiveTab('stores')}
                    onScroll={handleScroll}
                  />
                )}
                {/* Removed OCR Insights Tab View */}
                {item === 'bucket' && (
                  <BucketView
                    bucketItems={bucketItems}
                    selectedDelivery={selectedDelivery}
                    setSelectedDelivery={setSelectedDelivery}
                    onUpdateQuantity={updateQuantity}
                    onRemove={removeFromBucket}
                    onProceed={handleProceedToOrder}
                    bucketTotal={bucketTotal}
                    onScroll={handleScroll}
                  />
                )}
              </View>
            )}
          />
        </Animated.View>
      </View>

      {/* Filters sheet */}
      <FiltersSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        initialFilters={appliedFilters}
        onApply={filters => {
          setAppliedFilters(filters);
          setShowFilters(false);
        }}
      />
    </View>
  );
};

export default FindMedicinesScreen;
