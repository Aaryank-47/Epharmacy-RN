import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { useThemePalette } from '../../hooks/useThemePalette';
import { usePrescriptionOCR } from '../../hooks/usePrescriptionOCR';
import { StoresView } from './find-medicines/StoresView';
import { MedicinesView } from './find-medicines/MedicinesView';
import { BucketView } from './find-medicines/BucketView';
import { FiltersSheet } from './find-medicines/FiltersSheet';
import type { FilterState } from './find-medicines/FiltersSheet';
import type { FindTab } from '../../hooks/usePrescriptionOCR';

interface Props {
  navigation: any;
  route?: any;
}

interface TabConfig {
  key: FindTab;
  label: string;
  icon: string;
  activeIcon: string;
}

const TABS: TabConfig[] = [
  { key: 'stores', label: 'Stores', icon: 'storefront-outline', activeIcon: 'storefront' },
  { key: 'medicines', label: 'Medicines', icon: 'link-variant', activeIcon: 'link-variant' },
];

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

  // Shared upload handler used by both the top-right icon and MedicinesView's onUpload prop
  const handleUploadPress = () => {
    Alert.alert(
      'Upload Prescription',
      'Choose a method to upload your prescription',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Camera',
          onPress: async () => {
            const result = await launchCamera({ mediaType: 'photo', quality: 0.8, saveToPhotos: false });
            if (result.didCancel || !result.assets?.length) return;
            const asset = result.assets[0];
            if (!asset.uri) return;
            const file = { uri: asset.uri, name: asset.fileName || 'prescription.jpg', type: asset.type || 'image/jpeg' };
            navigation.navigate('OCRProcessingScreen', { file });
          },
        },
        {
          text: 'Gallery',
          onPress: async () => {
            const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 0.8 });
            if (result.didCancel || !result.assets?.length) return;
            const asset = result.assets[0];
            if (!asset.uri) return;
            const file = { uri: asset.uri, name: asset.fileName || 'prescription.jpg', type: asset.type || 'image/jpeg' };
            navigation.navigate('OCRProcessingScreen', { file });
          },
        },
      ],
    );
  };

  const textColor = isDark ? '#FFFFFF' : '#1F2937';
  const subText = isDark ? '#9CA3AF' : '#6B7280';
  const headerBg = surfaceColor;
  const borderColor = isDark ? '#2A2D35' : '#E5E7EB';
  const inputBg = isDark ? '#2A2D35' : '#F3F4F6';

  const handleProceedToOrder = () => {
    Alert.alert(
      'Order Placed',
      `Your order for ₹${bucketTotal} has been placed!\n${selectedDelivery === 'pickup' ? 'Ready for pickup' : 'Will be delivered in 45 min'}.`,
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'stores':
        return <StoresView onFilterPress={() => setShowFilters(true)} />;
      case 'medicines':
        return (
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
          />
        );
      case 'bucket':
        return (
          <BucketView
            bucketItems={bucketItems}
            selectedDelivery={selectedDelivery}
            setSelectedDelivery={setSelectedDelivery}
            onUpdateQuantity={updateQuantity}
            onRemove={removeFromBucket}
            onProceed={handleProceedToOrder}
            bucketTotal={bucketTotal}
          />
        );
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#181A20' : '#F5F6FA' }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={headerBg}
      />

      {/* Safe area top + Header */}
      <View
        style={{
          backgroundColor: headerBg,
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0,
          borderBottomWidth: 1,
          borderBottomColor: borderColor,
        }}
      >
        <SafeAreaView>
          {/* Header row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 10,
              gap: 12,
            }}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                backgroundColor: isDark ? '#2A2D35' : '#F3F4F6',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="arrow-left" size={20} color={textColor} />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: accentColor,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                }}
              >
                MEDICARE
              </Text>
              <Text style={{ fontSize: 18, fontWeight: '800', color: textColor }}>
                Find Medicines & Stores
              </Text>
            </View>

            {/* Bucket badge */}
            <TouchableOpacity
              onPress={() => setActiveTab('bucket')}
              style={{ position: 'relative', padding: 4 }}
            >
              <Icon
                name={activeTab === 'bucket' ? 'basket' : 'basket-outline'}
                size={26}
                color={activeTab === 'bucket' ? accentColor : textColor}
              />
              {bucketCount > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: accentColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: headerBg,
                  }}
                >
                  <Text
                    style={{ fontSize: 10, fontWeight: '800', color: '#FFF' }}
                  >
                    {bucketCount > 9 ? '9+' : bucketCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Search bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginHorizontal: 16,
              marginBottom: 12,
              gap: 10,
            }}
          >
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: inputBg,
                borderRadius: 14,
                paddingHorizontal: 12,
                paddingVertical: Platform.OS === 'ios' ? 10 : 2,
                gap: 8,
              }}
            >
              <Icon name="magnify" size={18} color={subText} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search medicines, stores..."
                placeholderTextColor={subText}
                style={{
                  flex: 1,
                  fontSize: 14,
                  color: textColor,
                  paddingVertical: 0,
                }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon name="close-circle" size={16} color={subText} />
                </TouchableOpacity>
              )}
              <TouchableOpacity>
                <Icon name="microphone-outline" size={18} color={subText} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() => setShowFilters(true)}
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: appliedFilters.brands.length > 0 || appliedFilters.sortBy !== 'nearest'
                  ? accentColor
                  : inputBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon
                name="tune-variant"
                size={20}
                color={
                  appliedFilters.brands.length > 0 || appliedFilters.sortBy !== 'nearest'
                    ? '#FFF'
                    : subText
                }
              />
            </TouchableOpacity>
          </View>

          {/* Tab bar */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingBottom: 10,
            }}
          >
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {TABS.map(tab => {
                const isActive = activeTab === tab.key;

                return (
                  <TouchableOpacity
                    key={tab.key}
                    onPress={() => {
                      setActiveTab(tab.key);
                      if (tab.key === 'ocr') {
                        reset();
                      }
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 22,
                      backgroundColor: isActive ? accentColor : (isDark ? '#2A2D35' : '#F3F4F6'),
                    }}
                  >
                    <Icon
                      name={isActive ? tab.activeIcon : tab.icon}
                      size={15}
                      color={isActive ? '#FFF' : subText}
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '600',
                        color: isActive ? '#FFF' : textColor,
                      }}
                    >
                      {tab.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={handleUploadPress}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: isDark ? '#2A2D35' : '#F3F4F6',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="upload-outline" size={18} color={textColor} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Tab content */}
      <View style={{ flex: 1 }}>{renderTabContent()}</View>

      {/* Filters sheet */}
      <FiltersSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={setAppliedFilters}
        initialFilters={appliedFilters}
      />
    </View>
  );
};

export default FindMedicinesScreen;
