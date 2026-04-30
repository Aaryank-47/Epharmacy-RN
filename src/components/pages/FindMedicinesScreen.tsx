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
  ScrollView,
  Animated,
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

interface Props {
  navigation: any;
  route?: any;
}

// ─── OCR Insights Tab View ─────────────────────────────────────────────────
const OCRInsightsView: React.FC<{
  isDark: boolean;
  accentColor: string;
  onScan: () => void;
  onRescan: () => void;
}> = ({ isDark, accentColor, onScan, onRescan }) => {
  const textColor = isDark ? '#FFFFFF' : '#1F2937';
  const subText = isDark ? '#9CA3AF' : '#6B7280';
  const cardBg = isDark ? '#1C1F28' : '#FFFFFF';
  const borderColor = isDark ? '#2A2D35' : '#EBEBEB';
  const warnBg = isDark ? '#2A1A0A' : '#FFF7ED';
  const warnBorder = isDark ? '#92400E40' : '#FED7AA';

  // Mock OCR data to match HTML design
  const mockData = {
    doctor: 'Dr. R. Kumar',
    date: '28 Apr 2026',
    rx: 'Recent visit',
    confidence: 94,
    medicines: [
      {
        name: 'Amoxicillin 500mg',
        detail: 'Tablet · 10 tabs · 1 tab • 3 × 2 days',
        status: 'PRESCRIBED',
        statusColor: '#8B5CF6',
        statusBg: '#8B5CF618',
        hasWarning: false,
      },
      {
        name: 'Paracetamol 500mg',
        detail: 'Tablet · 10 tabs · 2 tab • 3×/ Fan Fever',
        status: 'PRESCRIBED',
        statusColor: '#8B5CF6',
        statusBg: '#8B5CF618',
        hasWarning: false,
      },
      {
        name: 'Cetrizine 10mg',
        detail: 'Tablet · Low · Cough',
        status: 'PRESCRIBED',
        statusColor: '#8B5CF6',
        statusBg: '#8B5CF618',
        hasWarning: true,
        warningText: 'Verify Cetrizine dosage – This dose, our dosage may need confirmation from your doctor.',
      },
    ],
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 14, paddingBottom: 32 }}
    >
      {/* OCR Header Card */}
      <View
        style={{
          backgroundColor: cardBg,
          borderRadius: 18,
          borderWidth: 1,
          borderColor,
          padding: 14,
          marginBottom: 12,
          shadowColor: isDark ? '#000' : '#9CA3AF',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isDark ? 0.25 : 0.08,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
          {/* OCR Icon */}
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 13,
              backgroundColor: accentColor + '20',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: accentColor + '40',
            }}
          >
            <Icon name="file-document-scan-outline" size={22} color={accentColor} />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, marginBottom: 2 }}>
              OCR Insights
            </Text>
            <Text style={{ fontSize: 11, color: subText }}>Prescription auto-extracted · AI</Text>
          </View>

          {/* Re-scan button */}
          <TouchableOpacity
            onPress={onRescan}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: accentColor + '18',
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <Icon name="refresh" size={13} color={accentColor} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: accentColor }}>
              Re-scan
            </Text>
          </TouchableOpacity>
        </View>

        {/* Doctor info row */}
        <View
          style={{
            flexDirection: 'row',
            gap: 14,
            borderTopWidth: 1,
            borderTopColor: isDark ? '#2A2D35' : '#F0F0F0',
            paddingTop: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: subText, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3 }}>
              Dr. Doctor
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>{mockData.doctor}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: subText, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3 }}>
              Date
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>{mockData.date}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 9, fontWeight: '700', color: subText, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3 }}>
              Visit
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>{mockData.rx}</Text>
          </View>
        </View>
      </View>

      {/* Medicine rows */}
      {mockData.medicines.map((med, idx) => (
        <View key={idx}>
          <View
            style={{
              backgroundColor: cardBg,
              borderRadius: 14,
              borderWidth: 1,
              borderColor,
              padding: 13,
              marginBottom: med.hasWarning ? 0 : 8,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 11,
              borderBottomLeftRadius: med.hasWarning ? 0 : 14,
              borderBottomRightRadius: med.hasWarning ? 0 : 14,
            }}
          >
            <View
              style={{
                width: 38,
                height: 38,
                borderRadius: 11,
                backgroundColor: '#8B5CF620',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="pill" size={18} color="#8B5CF6" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, marginBottom: 3 }}>
                {med.name}
              </Text>
              <Text style={{ fontSize: 11, color: subText }}>{med.detail}</Text>
            </View>

            <View
              style={{
                backgroundColor: med.statusBg,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
              }}
            >
              <Text style={{ fontSize: 9, fontWeight: '800', color: med.statusColor, letterSpacing: 0.5 }}>
                {med.status}
              </Text>
            </View>
          </View>

          {/* Warning banner */}
          {med.hasWarning && (
            <View
              style={{
                backgroundColor: warnBg,
                borderWidth: 1,
                borderTopWidth: 0,
                borderColor: warnBorder,
                borderBottomLeftRadius: 14,
                borderBottomRightRadius: 14,
                padding: 11,
                marginBottom: 8,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 8,
              }}
            >
              <Icon name="alert-outline" size={14} color="#F59E0B" style={{ marginTop: 1 }} />
              <Text style={{ flex: 1, fontSize: 11, color: isDark ? '#FCD34D' : '#92400E', lineHeight: 16 }}>
                {med.warningText}
              </Text>
            </View>
          )}
        </View>
      ))}

      {/* Confidence bar */}
      <View
        style={{
          backgroundColor: cardBg,
          borderRadius: 14,
          borderWidth: 1,
          borderColor,
          padding: 13,
          marginBottom: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '700', color: subText, flex: 1 }}>
          OCR Confidence
        </Text>
        <View style={{ flex: 2, height: 6, backgroundColor: isDark ? '#2A2D35' : '#F0F0F0', borderRadius: 3, overflow: 'hidden' }}>
          <View
            style={{
              width: `${mockData.confidence}%`,
              height: '100%',
              backgroundColor: '#10B981',
              borderRadius: 3,
            }}
          />
        </View>
        <Text style={{ fontSize: 14, fontWeight: '800', color: '#10B981' }}>
          {mockData.confidence}%
        </Text>
      </View>

      {/* Scan new prescription CTA */}
      <TouchableOpacity
        onPress={onScan}
        style={{
          backgroundColor: accentColor,
          borderRadius: 16,
          paddingVertical: 15,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        <Icon name="camera-outline" size={18} color="#FFF" />
        <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFF' }}>
          Scan New Prescription
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

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
            const result = await launchCamera({
              mediaType: 'photo',
              quality: 0.8,
              saveToPhotos: false,
            });
            if (result.didCancel || !result.assets?.length) return;
            const asset = result.assets[0];
            if (!asset.uri) return;
            const file = {
              uri: asset.uri,
              name: asset.fileName || 'prescription.jpg',
              type: asset.type || 'image/jpeg',
            };
            navigation.navigate('OCRProcessingScreen', { file });
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
            const file = {
              uri: asset.uri,
              name: asset.fileName || 'prescription.jpg',
              type: asset.type || 'image/jpeg',
            };
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
  const tabInactiveBg = isDark ? '#2A2D35' : '#F3F4F6';
  const filtersActive =
    appliedFilters.brands.length > 0 || appliedFilters.sortBy !== 'nearest';

  const handleProceedToOrder = () => {
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
      case 'ocr':
        return (
          <OCRInsightsView
            isDark={isDark}
            accentColor={accentColor}
            onScan={handleUploadPress}
            onRescan={handleUploadPress}
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
          paddingTop: Platform.OS === 'android' ? 10 : 0,
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
              paddingTop: 2,
              paddingBottom: 10,
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
                  fontSize: 10,
                  fontWeight: '600',
                  color: accentColor,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                }}
              >
                MEDICARE
              </Text>
              <Text
                style={{ fontSize: 18, fontWeight: '800', color: textColor }}
              >
                Find Medicines
              </Text>
            </View>

            {/* Header basket badge */}
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
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFF' }}>
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
                borderRadius: 24,
                paddingHorizontal: 12,
                paddingVertical: Platform.OS === 'ios' ? 10 : 15,
                gap: 8,
              }}
            >
              <Icon name="magnify" size={18} color={subText} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Amoxicillin, paracetamol..."
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
                backgroundColor: filtersActive ? accentColor : inputBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon
                name="tune-variant"
                size={20}
                color={filtersActive ? '#FFF' : subText}
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
            {/* Left: Stores, Medicines, OCR */}
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {/* Stores tab */}
              <TouchableOpacity
                onPress={() => setActiveTab('stores')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 22,
                  backgroundColor: activeTab === 'stores' ? accentColor : tabInactiveBg,
                }}
              >
                <Icon
                  name={activeTab === 'stores' ? 'storefront' : 'storefront-outline'}
                  size={14}
                  color={activeTab === 'stores' ? '#FFF' : subText}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: activeTab === 'stores' ? '#FFF' : textColor,
                  }}
                >
                  Medical Stores
                </Text>
              </TouchableOpacity>

              {/* Medicines tab */}
              <TouchableOpacity
                onPress={() => setActiveTab('medicines')}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 22,
                  backgroundColor: activeTab === 'medicines' ? accentColor : tabInactiveBg,
                }}
              >
                <Icon
                  name="pill"
                  size={14}
                  color={activeTab === 'medicines' ? '#FFF' : subText}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: activeTab === 'medicines' ? '#FFF' : textColor,
                  }}
                >
                  Medicines
                </Text>
              </TouchableOpacity>

              {/* OCR Insights tab */}
              <TouchableOpacity
                onPress={() => setActiveTab('ocr' as any)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: 22,
                  backgroundColor: activeTab === 'ocr' ? accentColor : tabInactiveBg,
                }}
              >
                <Icon
                  name="auto-fix"
                  size={14}
                  color={activeTab === 'ocr' ? '#FFF' : subText}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: activeTab === 'ocr' ? '#FFF' : textColor,
                  }}
                >
                  OCR
                </Text>
              </TouchableOpacity>
            </View>

            {/* Right: basket tab */}
            <TouchableOpacity
              onPress={() => setActiveTab('bucket')}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor:
                  activeTab === 'bucket' ? accentColor : tabInactiveBg,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon
                name={activeTab === 'bucket' ? 'basket' : 'basket-outline'}
                size={18}
                color={activeTab === 'bucket' ? '#FFF' : textColor}
              />
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
