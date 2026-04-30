import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
  Image,
  Dimensions,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useThemePalette } from '../../../hooks/useThemePalette';
import PermissionService from '../../../services/PermissionService';
import { MedicineCard } from './MedicineCard';
import type { OCRStatus } from '../../../hooks/usePrescriptionOCR';
import type { PrescriptionMedicine } from '../../../api/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Use the same image logic for consistency
const DEFAULT_MED_IMAGE =
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop';
const SYRUP_IMAGE =
  'https://images.unsplash.com/photo-1550572017-ed2002b42d7e?w=200&h=200&fit=crop';
const PILL_IMAGE =
  'https://images.unsplash.com/photo-1471864190281-ad5f9f33d70e?w=200&h=200&fit=crop';

const getMedImage = (name: string, type?: string) => {
  if (type?.toLowerCase().includes('syrup')) return SYRUP_IMAGE;
  if (name.toLowerCase().includes('paracetamol')) return DEFAULT_MED_IMAGE;
  return PILL_IMAGE;
};

interface Props {
  status: OCRStatus;
  medicines: PrescriptionMedicine[];
  streamingMedicines: PrescriptionMedicine[];
  detectedCount: number;
  error: string | null;
  onUpload: (file: { uri: string; name: string; type: string }) => void;
  onReset: () => void;
  onAddToBucket: (medicines: PrescriptionMedicine[]) => void;
  onCompareStores: () => void;
  onScroll?: (event: any) => void;
}

// ─── Idle: upload prescription prompt ───────────────────────────────────────

const UploadPrompt: React.FC<{
  onPickGallery: () => void;
  onTakeCamera: () => void;
  isDark: boolean;
  accentColor: string;
}> = ({ onPickGallery, onTakeCamera, isDark, accentColor }) => {
  const textColor = isDark ? '#FFFFFF' : '#1F2937';
  const subText = isDark ? '#9CA3AF' : '#6B7280';

  return (
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        padding: 20,
        justifyContent: 'center',
      }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ alignItems: 'center', marginBottom: 32 }}>
        <View
          style={{
            width: 76,
            height: 76,
            borderRadius: 24,
            backgroundColor: accentColor + '15',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
          }}
        >
          <Icon name="file-document-outline" size={36} color={accentColor} />
        </View>
        <Text
          style={{
            fontSize: 19,
            fontWeight: '800',
            color: textColor,
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          Upload Prescription
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: subText,
            textAlign: 'center',
            lineHeight: 22,
            paddingHorizontal: 20,
          }}
        >
          Take a photo or upload from gallery to automatically extract and find
          your medicines
        </Text>
      </View>

      <View style={{ gap: 12, paddingHorizontal: 10 }}>
        <TouchableOpacity
          onPress={onTakeCamera}
          style={{
            backgroundColor: accentColor,
            borderRadius: 16,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <Icon name="camera-outline" size={24} color="#FFF" />
          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>
            Take Photo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onPickGallery}
          style={{
            backgroundColor: isDark ? '#2A2D35' : '#F1F5F9',
            borderRadius: 16,
            paddingVertical: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            borderWidth: 1,
            borderColor: isDark ? '#374151' : '#E2E8F0',
          }}
        >
          <Icon name="image-outline" size={24} color={textColor} />
          <Text style={{ color: textColor, fontSize: 16, fontWeight: '700' }}>
            Choose from Gallery
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// ─── Error state ─────────────────────────────────────────────────────────────

const ErrorView: React.FC<{
  error: string;
  onRetry: () => void;
  isDark: boolean;
  accentColor: string;
}> = ({ error, onRetry, isDark, accentColor }) => (
  <View
    style={{
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 30,
    }}
  >
    <View
      style={{
        width: 72,
        height: 72,
        borderRadius: 22,
        backgroundColor: '#EF444420',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
      }}
    >
      <Icon name="alert-circle-outline" size={36} color="#EF4444" />
    </View>
    <Text
      style={{
        fontSize: 18,
        fontWeight: '800',
        color: isDark ? '#FFF' : '#1F2937',
        marginBottom: 8,
      }}
    >
      Processing Failed
    </Text>
    <Text
      style={{
        fontSize: 13,
        color: isDark ? '#9CA3AF' : '#6B7280',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 24,
      }}
    >
      {error}
    </Text>
    <TouchableOpacity
      onPress={onRetry}
      style={{
        backgroundColor: accentColor,
        paddingHorizontal: 28,
        paddingVertical: 13,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <Icon name="refresh" size={18} color="#FFF" />
      <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15 }}>
        Try Again
      </Text>
    </TouchableOpacity>
  </View>
);

// ─── Processing: scan animation + streaming medicines ───────────────────────

const ProcessingView: React.FC<{
  streamingMedicines: PrescriptionMedicine[];
  detectedCount: number;
  isDark: boolean;
  accentColor: string;
}> = ({ streamingMedicines, detectedCount, isDark, accentColor }) => {
  const textColor = isDark ? '#FFFFFF' : '#111827';
  const subText = isDark ? '#9CA3AF' : '#6B7280';

  const scanLine = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(scanLine, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.5,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const scanTranslate = scanLine.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 160],
  });

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
      showsVerticalScrollIndicator={false}
    >
      {/* High-fidelity Scan Visualizer */}
      <View style={{ alignItems: 'center', marginTop: 10, marginBottom: 32 }}>
        <View
          style={{
            width: SCREEN_WIDTH - 80,
            height: 180,
            borderRadius: 30,
            backgroundColor: isDark ? '#1C1F28' : '#FFFFFF',
            borderWidth: 2,
            borderColor: isDark ? '#2A2D35' : '#E2E8F0',
            overflow: 'hidden',
            padding: 10,
            shadowColor: accentColor,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.15,
            shadowRadius: 20,
            elevation: 10,
          }}
        >
          {/* Mock Prescription Grid */}
          <View style={{ flex: 1, opacity: 0.15 }}>
            {[...Array(6)].map((_, i) => (
              <View
                key={i}
                style={{
                  height: 2,
                  backgroundColor: subText,
                  width: '80%',
                  marginBottom: 15,
                  borderRadius: 1,
                }}
              />
            ))}
          </View>

          {/* Scanning Laser Line */}
          <Animated.View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 10,
              height: 3,
              backgroundColor: accentColor,
              transform: [{ translateY: scanTranslate }],
              zIndex: 10,
              shadowColor: accentColor,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 1,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <LinearGradient
              colors={['transparent', accentColor, 'transparent']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </Animated.View>

          {/* Glowing Overlay */}
          <Animated.View
            style={{
            
              backgroundColor: accentColor,
              opacity: glowAnim.interpolate({
                inputRange: [0.5, 1],
                outputRange: [0.02, 0.08],
              }),
            }}
          />
        </View>

        <View style={{ marginTop: 24, alignItems: 'center' }}>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '900',
              color: textColor,
              letterSpacing: -0.5,
            }}
          >
            Analyzing Rx...
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              marginTop: 4,
            }}
          >
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#10B981',
              }}
            />
            <Text style={{ fontSize: 13, color: subText, fontWeight: '600' }}>
              {detectedCount > 0
                ? `${detectedCount} items found`
                : 'Deep scanning prescription...'}
            </Text>
          </View>
        </View>
      </View>

      {/* Streaming feed */}
      {streamingMedicines.length > 0 && (
        <View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: '800',
                color: subText,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              LIVE DETECTIONS
            </Text>
            <Animated.View style={{ opacity: glowAnim }}>
              <Text
                style={{ fontSize: 10, color: accentColor, fontWeight: '800' }}
              >
                STREAMING
              </Text>
            </Animated.View>
          </View>

          {streamingMedicines.map((med, i) => (
            <StreamingRow
              key={`${med.drugName}_${i}`}
              medicine={med}
              isDark={isDark}
              accentColor={accentColor}
            />
          ))}

          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingVertical: 16,
              justifyContent: 'center',
            }}
          >
            <Icon name="loading" size={16} color={accentColor} />
            <Text
              style={{
                fontSize: 13,
                color: subText,
                fontStyle: 'italic',
                fontWeight: '500',
              }}
            >
              Parsing more medicines...
            </Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const StreamingRow: React.FC<{
  medicine: PrescriptionMedicine;
  isDark: boolean;
  accentColor: string;
}> = ({ medicine, isDark, accentColor }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const textColor = isDark ? '#FFFFFF' : '#111827';
  const subText = isDark ? '#9CA3AF' : '#6B7280';
  const cardBg = isDark ? '#1C1F28' : '#FFFFFF';

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ scale }],
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 12,
        backgroundColor: cardBg,
        borderRadius: 18,
        borderWidth: 1,
        borderColor: isDark ? '#2A2D35' : '#F3F4F6',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <Image
        source={{ uri: getMedImage(medicine.drugName, medicine.dosage) }}
        style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          backgroundColor: isDark ? '#2A2D35' : '#F9FAFB',
        }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: textColor }}>
          {medicine.drugName}
        </Text>
        <Text style={{ fontSize: 11, color: subText, fontWeight: '500' }}>
          {medicine.dosage !== 'Not specified' ? medicine.dosage : 'Detected'}
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: accentColor }}>
          ₹{medicine.price}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <Icon name="check-decagram" size={10} color="#10B981" />
          <Text style={{ fontSize: 9, fontWeight: '800', color: '#10B981' }}>
            VERIFIED
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

// ─── Done: medicine list ──────────────────────────────────────────────────────

const MedicineListView: React.FC<{
  medicines: PrescriptionMedicine[];
  onAddToBucket: (medicines: PrescriptionMedicine[]) => void;
  onCompareStores: () => void;
  onReset: () => void;
  isDark: boolean;
  accentColor: string;
  onScroll?: (event: any) => void;
}> = ({
  medicines,
  onAddToBucket,
  onCompareStores,
  onReset,
  isDark,
  accentColor,
  onScroll,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const textColor = isDark ? '#FFFFFF' : '#1F2937';
  const subText = isDark ? '#9CA3AF' : '#6B7280';
  const allAvailable = medicines.every(m => m.availability);

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}
      >
        <Text style={{ fontSize: 11, color: subText }}>
          <Text style={{ color: textColor, fontWeight: '700' }}>
            {medicines.length} medicines
          </Text>{' '}
          · from your Rx
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: allAvailable ? '#10B98115' : '#F59E0B15',
              paddingHorizontal: 10,
              paddingVertical: 9,
              borderRadius: 12,
            }}
          >
            <Icon
              name={allAvailable ? 'check' : 'alert-outline'}
              size={11}
              color={allAvailable ? '#10B981' : '#F59E0B'}
            />
            <Text
              style={{
                fontSize: 9,
                fontWeight: '800',
                color: allAvailable ? '#10B981' : '#F59E0B',
                letterSpacing: 0.5,
              }}
            >
              {allAvailable ? 'ALL FOUND' : 'PARTIAL'}
            </Text>
          </View>
          
        </View>
      </View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        onScroll={onScroll}
        scrollEventThrottle={1}
        contentContainerStyle={{
          paddingHorizontal: 14,
          paddingTop: 12,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {medicines.map((medicine, index) => (
          <MedicineCard
            key={`${medicine.drugName}_${index}`}
            medicine={medicine}
            index={index}
            isExpanded={expandedIndex === index}
            onToggle={() =>
              setExpandedIndex(expandedIndex === index ? null : index)
            }
            onCompareStores={onCompareStores}
            onAddToBucket={() => onAddToBucket([medicine])}
          />
        ))}
      </Animated.ScrollView>
    </View>
  );
};

// ─── Main MedicinesView ───────────────────────────────────────────────────────

export const MedicinesView: React.FC<Props> = ({
  status,
  medicines,
  streamingMedicines,
  detectedCount,
  error,
  onUpload,
  onReset,
  onAddToBucket,
  onCompareStores,
  onScroll,
}) => {
  const { isDark, accentColor } = useThemePalette();

  const handlePickGallery = useCallback(async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1,
        quality: 0.8,
      });
      if (result.didCancel || !result.assets?.length) return;
      const asset = result.assets[0];
      if (!asset.uri) return;
      onUpload({
        uri: asset.uri,
        name: asset.fileName || 'prescription.jpg',
        type: asset.type || 'image/jpeg',
      });
    } catch {
      Alert.alert('Error', 'Failed to open gallery');
    }
  }, [onUpload]);

  const handleTakeCamera = useCallback(async () => {
    try {
      const hasPermission = await PermissionService.requestCameraPermission();
      if (!hasPermission) {
        Alert.alert(
          'Camera Permission Required',
          'Please enable camera access in device settings.',
        );
        return;
      }
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
      });
      if (result.didCancel || !result.assets?.length) return;
      const asset = result.assets[0];
      if (!asset.uri) return;
      onUpload({
        uri: asset.uri,
        name: asset.fileName || 'prescription.jpg',
        type: asset.type || 'image/jpeg',
      });
    } catch {
      Alert.alert('Error', 'Failed to open camera');
    }
  }, [onUpload]);

  if (status === 'error' && error) {
    return (
      <ErrorView
        error={error}
        onRetry={onReset}
        isDark={isDark}
        accentColor={accentColor}
      />
    );
  }

  if (status === 'processing') {
    return (
      <ProcessingView
        streamingMedicines={streamingMedicines}
        detectedCount={detectedCount}
        isDark={isDark}
        accentColor={accentColor}
      />
    );
  }

  if (status === 'done' && medicines.length > 0) {
    return (
      <MedicineListView
        medicines={medicines}
        onAddToBucket={onAddToBucket}
        onCompareStores={onCompareStores}
        onReset={onReset}
        isDark={isDark}
        accentColor={accentColor}
        onScroll={onScroll}
      />
    );
  }

  return (
    <UploadPrompt
      onPickGallery={handlePickGallery}
      onTakeCamera={handleTakeCamera}
      isDark={isDark}
      accentColor={accentColor}
    />
  );
};
