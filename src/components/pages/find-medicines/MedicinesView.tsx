import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useThemePalette } from '../../../hooks/useThemePalette';
import PermissionService from '../../../services/PermissionService';
import { MedicineCard } from './MedicineCard';
import type { OCRStatus } from '../../../hooks/usePrescriptionOCR';
import type { PrescriptionMedicine } from '../../../api/types';

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
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero */}
      <View style={{ alignItems: 'center', marginBottom: 28, marginTop: 8 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            backgroundColor: accentColor + '18',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
          }}
        >
          <Icon
            name="file-document-scan-outline"
            size={36}
            color={accentColor}
          />
        </View>
        <Text
          style={{
            fontSize: 22,
            fontWeight: '800',
            color: textColor,
            marginBottom: 6,
          }}
        >
          Upload Prescription
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: subText,
            textAlign: 'center',
            lineHeight: 19,
            paddingHorizontal: 20,
          }}
        >
          Capture or upload your prescription — we'll extract all medicines
          instantly
        </Text>
      </View>

      {/* Gallery card */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPickGallery}
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          marginBottom: 14,
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.28,
          shadowRadius: 14,
          elevation: 7,
        }}
      >
        <LinearGradient
          colors={[accentColor, isDark ? '#9B4E6A' : '#b85c7a']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 20, alignItems: 'center' }}
        >
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Icon name="image-multiple-outline" size={26} color="#FFF" />
          </View>
          <Text
            style={{
              fontSize: 17,
              fontWeight: '800',
              color: '#FFF',
              marginBottom: 4,
            }}
          >
            Choose from Gallery
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.8)',
              marginBottom: 14,
            }}
          >
            Select a saved prescription photo
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.22)',
              paddingHorizontal: 20,
              paddingVertical: 9,
              borderRadius: 22,
              gap: 6,
            }}
          >
            <Icon name="folder-open-outline" size={15} color="#FFF" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFF' }}>
              Browse Files
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Camera card */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onTakeCamera}
        style={{
          borderRadius: 20,
          overflow: 'hidden',
          shadowColor: '#2563EB',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.22,
          shadowRadius: 14,
          elevation: 7,
        }}
      >
        <LinearGradient
          colors={isDark ? ['#2563EB', '#1D4ED8'] : ['#3B82F6', '#2563EB']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 20, alignItems: 'center' }}
        >
          <View
            style={{
              width: 54,
              height: 54,
              borderRadius: 16,
              backgroundColor: 'rgba(255,255,255,0.2)',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12,
            }}
          >
            <Icon name="camera-outline" size={26} color="#FFF" />
          </View>
          <Text
            style={{
              fontSize: 17,
              fontWeight: '800',
              color: '#FFF',
              marginBottom: 4,
            }}
          >
            Take a Photo
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: 'rgba(255,255,255,0.8)',
              marginBottom: 14,
            }}
          >
            Capture prescription directly with camera
          </Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.22)',
              paddingHorizontal: 20,
              paddingVertical: 9,
              borderRadius: 22,
              gap: 6,
            }}
          >
            <Icon name="camera" size={15} color="#FFF" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFF' }}>
              Open Camera
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Tip */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          marginTop: 22,
          padding: 14,
          backgroundColor: isDark ? '#1C1F28' : '#F9FAFB',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: isDark ? '#2A2D35' : '#E5E7EB',
        }}
      >
        <Icon
          name="lightbulb-outline"
          size={16}
          color="#FBBF24"
          style={{ marginTop: 1 }}
        />
        <Text style={{ flex: 1, fontSize: 12, color: subText, lineHeight: 18 }}>
          <Text
            style={{ fontWeight: '700', color: isDark ? '#E5E7EB' : '#374151' }}
          >
            Tip:{' '}
          </Text>
          Ensure the prescription is well-lit, flat, and all text is clearly
          visible. Max 6MB (JPEG/PNG).
        </Text>
      </View>
    </ScrollView>
  );
};

// ─── Processing: scan animation + streaming medicines ───────────────────────

const ProcessingView: React.FC<{
  streamingMedicines: PrescriptionMedicine[];
  detectedCount: number;
  isDark: boolean;
  accentColor: string;
}> = ({ streamingMedicines, detectedCount, isDark, accentColor }) => {
  const textColor = isDark ? '#FFFFFF' : '#1F2937';
  const subText = isDark ? '#9CA3AF' : '#6B7280';

  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const scanLine = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const makeRing = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );

    const scanAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLine, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(scanLine, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ]),
    );

    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(iconScale, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    const r1 = makeRing(ring1, 0);
    const r2 = makeRing(ring2, 650);
    const r3 = makeRing(ring3, 1300);
    r1.start();
    r2.start();
    r3.start();
    scanAnim.start();
    pulseAnim.start();

    return () => {
      r1.stop();
      r2.stop();
      r3.stop();
      scanAnim.stop();
      pulseAnim.stop();
    };
  }, []);

  const ringStyle = (val: Animated.Value) => ({
    transform: [
      { scale: val.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] }) },
    ],
    opacity: val.interpolate({
      inputRange: [0, 0.3, 1],
      outputRange: [0.5, 0.2, 0],
    }),
  });

  const scanTranslate = scanLine.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 88],
  });

  return (
    <ScrollView
      contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 28 }}>
        <View
          style={{
            width: 120,
            height: 120,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 18,
          }}
        >
          {[ring1, ring2, ring3].map((r, i) => (
            <Animated.View
              key={i}
              style={[
                {
                  position: 'absolute',
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  borderWidth: 2,
                  borderColor: accentColor,
                },
                ringStyle(r),
              ]}
            />
          ))}
          <Animated.View
            style={{
              transform: [{ scale: iconScale }],
              width: 64,
              height: 80,
              borderRadius: 10,
              backgroundColor: accentColor + '18',
              borderWidth: 2,
              borderColor: accentColor + '55',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            <Icon name="file-document-outline" size={30} color={accentColor} />
            <Animated.View
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                height: 2,
                backgroundColor: accentColor,
                top: 0,
                transform: [{ translateY: scanTranslate }],
                shadowColor: accentColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.9,
                shadowRadius: 5,
                elevation: 2,
              }}
            />
          </Animated.View>
        </View>

        <Text
          style={{
            fontSize: 20,
            fontWeight: '800',
            color: textColor,
            marginBottom: 5,
          }}
        >
          Analyzing Prescription
        </Text>
        <Text style={{ fontSize: 13, color: subText, textAlign: 'center' }}>
          {detectedCount > 0
            ? `${detectedCount} medicine${
                detectedCount > 1 ? 's' : ''
              } detected so far...`
            : 'Reading prescription text...'}
        </Text>
      </View>

      {streamingMedicines.length > 0 && (
        <View>
          <Text
            style={{
              fontSize: 11,
              fontWeight: '800',
              color: subText,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 10,
            }}
          >
            Detected Medicines
          </Text>
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
              gap: 8,
              paddingVertical: 10,
            }}
          >
            <View
              style={{
                width: 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: accentColor,
              }}
            />
            <Text style={{ fontSize: 12, color: subText, fontStyle: 'italic' }}>
              Looking for more...
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
  const translateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const textColor = isDark ? '#FFFFFF' : '#1F2937';
  const subText = isDark ? '#9CA3AF' : '#6B7280';
  const cardBg = isDark ? '#1C1F28' : '#FFFFFF';
  const borderColor = isDark ? '#2A2D35' : '#F0F0F0';

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        backgroundColor: cardBg,
        borderRadius: 12,
        borderWidth: 1,
        borderColor,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: '#10B98120',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="check-circle" size={18} color="#10B981" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>
          {medicine.drugName}
        </Text>
        {medicine.dosage && medicine.dosage !== 'Not specified' && (
          <Text style={{ fontSize: 11, color: subText }}>
            {medicine.dosage}
          </Text>
        )}
      </View>
      <Text style={{ fontSize: 14, fontWeight: '800', color: accentColor }}>
        ₹{medicine.price}
      </Text>
    </Animated.View>
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

// ─── Done: medicine list ──────────────────────────────────────────────────────

const MedicineListView: React.FC<{
  medicines: PrescriptionMedicine[];
  onAddToBucket: (medicines: PrescriptionMedicine[]) => void;
  onCompareStores: () => void;
  onReset: () => void;
  isDark: boolean;
  accentColor: string;
}> = ({
  medicines,
  onAddToBucket,
  onCompareStores,
  onReset,
  isDark,
  accentColor,
}) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const textColor = isDark ? '#FFFFFF' : '#1F2937';
  const subText = isDark ? '#9CA3AF' : '#6B7280';
  const footerBg = isDark ? '#1C1F28' : '#FFFFFF';
  const borderColor = isDark ? '#2A2D35' : '#E5E7EB';
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
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#2A2D35' : '#F0F0F0',
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
              borderWidth: 1,
              borderColor: allAvailable ? '#10B98130' : '#F59E0B30',
              paddingHorizontal: 8,
              paddingVertical: 4,
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
          <TouchableOpacity
            onPress={onReset}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: isDark ? '#252830' : '#F3F4F6',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="refresh" size={16} color={subText} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
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
      </ScrollView>
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
