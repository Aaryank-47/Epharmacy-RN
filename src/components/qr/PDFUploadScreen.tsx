/**
 * PDFUploadScreen / Prescription OCR Extraction Component
 *
 * ========== BACKEND ENDPOINT CONFIGURATION ==========
 * This component sends prescription images to:
 * POST {API_BASE_URL}/api/v1/prescriptions/upload
 * Field name: "prescription"
 *
 * Expected response format:
 * {
 *   text: string,
 *   medicines: [
 *     { drugName, dosage, frequency, duration, raw }
 *   ],
 *   meta: { detectedCount }
 * }
 *
 * Update API_BASE_URL in src/api/config.ts as needed (local/staging/prod).
 * ====================================================
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  TextInput,
  Animated,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useThemePalette } from '../../hooks/useThemePalette';
import { API_BASE_URL } from '../../api/config';
import ShopAvailabilityModal from '../modals/ShopAvailabilityModal';

/**
 * Medicine details extracted from OCR
 */
export interface MedicineDetails {
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  raw?: string; // Original line from OCR for reference
}

/**
 * OCR extraction response from backend
 */
interface OcrResponse {
  text: string;
  medicines: MedicineDetails[];
  meta: {
    detectedCount: number;
  };
}

interface PDFUploadScreenProps {
  navigation: any;
  route?: any;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  uri: string;
}

interface EditableMedicine extends MedicineDetails {
  id: string; // Unique identifier for tracking edits
}

const PDFUploadScreen: React.FC<PDFUploadScreenProps> = ({ navigation }) => {
  const { isDark, accentColor, surfaceColor } = useThemePalette();

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // OCR extraction state
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedMedicines, setExtractedMedicines] = useState<EditableMedicine[]>([]);
  const [allRawData, setAllRawData] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Debug state
  const [showDebugBlock, setShowDebugBlock] = useState(false);
  const debugExpand = useRef(new Animated.Value(0)).current;

  // Shop Availability Modal state
  const [showShopModal, setShowShopModal] = useState(false);
  const [selectedMedicineName, setSelectedMedicineName] = useState('');

  // Guard against double submission
  const isSubmittingRef = useRef(false);

  /**
   * Validate file before upload
   * - Only allow JPEG and PNG images
   * - Max file size: 6MB
   */
  const validateFile = (file: UploadedFile): { valid: boolean; error?: string } => {
    const allowedTypes = ['image/jpeg', 'image/png'];
    const maxSizeBytes = 6 * 1024 * 1024; // 6MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Only JPEG and PNG are supported. Got: ${file.type}`,
      };
    }

    if (file.size > maxSizeBytes) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `File size (${sizeMB}MB) exceeds maximum of 6MB`,
      };
    }

    return { valid: true };
  };

  /**
   * Main OCR extraction handler
   * Sends prescription image to backend for OCR processing
   */
  const handleOcrExtraction = useCallback(
    async (file: UploadedFile) => {
      // Guard against double submission
      if (isSubmittingRef.current || isProcessing) {
        Alert.alert('Processing', 'Please wait for the current operation to complete.');
        return;
      }

      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        setError(validation.error || 'File validation failed');
        Alert.alert('Validation Error', validation.error);
        return;
      }

      isSubmittingRef.current = true;
      setIsProcessing(true);
      setError(null);
      setExtractedMedicines([]);
      setAllRawData('');

      try {
        // Create FormData for multipart upload
        const formData = new FormData();
        formData.append('prescription', {
          uri: file.uri,
          name: file.name || 'prescription.jpg',
          type: file.type || 'image/jpeg',
        } as any);

        // Construct backend URL - adjust if using local backend
        const backendUrl = `${API_BASE_URL}/api/v1/prescriptions/upload`;

        console.log('[OCR] Sending to:', backendUrl);
        console.log('[OCR] File:', {
          name: file.name,
          size: file.size,
          type: file.type,
        });

        const response = await fetch(backendUrl, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json',
          },
        });

        console.log('[OCR] Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Server error (${response.status}): ${errorText || response.statusText}`
          );
        }

        const responseData: OcrResponse = await response.json();

        console.log('[OCR] Success:', {
          textLength: responseData.text?.length,
          medicinesCount: responseData.medicines?.length,
          detectedCount: responseData.meta?.detectedCount,
        });

        // Process and store extracted medicines with editable state
        const editableMedicines: EditableMedicine[] = (responseData.medicines || []).map(
          (med, idx) => ({
            ...med,
            id: `med_${idx}_${Date.now()}`, // Unique ID for each medicine
          })
        );

        setAllRawData(responseData.text || '');
        setExtractedMedicines(editableMedicines);

        // Results display will show automatically on page - no alert needed
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Unknown error during OCR extraction';

        console.error('[OCR] Error:', errorMessage);
        setError(errorMessage);

        // Provide detailed error feedback
        if (errorMessage.includes('Network')) {
          Alert.alert(
            'Network Error',
            'Unable to reach the server. Check your connection and backend URL in config.ts'
          );
        } else if (errorMessage.includes('Server error')) {
          Alert.alert('Server Error', errorMessage);
        } else {
          Alert.alert('Processing Error', errorMessage);
        }
      } finally {
        setIsProcessing(false);
        isSubmittingRef.current = false;
      }
    },
    [isProcessing]
  );

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  /**
   * Update a specific medicine field (for inline editing)
   */
  const handleUpdateMedicine = useCallback((id: string, field: keyof EditableMedicine, value: string) => {
    setExtractedMedicines((prev) =>
      prev.map((med) => (med.id === id ? { ...med, [field]: value } : med))
    );
  }, []);

  /**
   * Remove a medicine from the extracted list
   */
  const handleRemoveMedicine = useCallback((id: string) => {
    setExtractedMedicines((prev) => prev.filter((med) => med.id !== id));
  }, []);

  /**
   * Clear all extracted medicines and raw data
   */
  const handleClearResults = useCallback(() => {
    setExtractedMedicines([]);
    setAllRawData('');
    setError(null);
  }, []);

  /**
   * Toggle debug block visibility with animation
   */
  const toggleDebugBlock = useCallback(() => {
    const newState = !showDebugBlock;
    setShowDebugBlock(newState);

    Animated.timing(debugExpand, {
      toValue: newState ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [showDebugBlock, debugExpand]);

  /**
   * Open shop availability modal for a specific medicine
   */
  const handleShowShopAvailability = useCallback((medicineName: string) => {
    setSelectedMedicineName(medicineName);
    setShowShopModal(true);
  }, []);

  const handlePickDocument = useCallback(async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 1, // Only one for direct OCR processing
        quality: 0.8,
      });

      if (result.didCancel) {
        console.log('User cancelled image picker');
        return;
      }

      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Failed to pick document');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newFile: UploadedFile = {
          name: asset.fileName || 'prescription.jpg',
          size: asset.fileSize || 0,
          type: asset.type || 'image/jpeg',
          uri: asset.uri || '',
        };

        // Add to list
        setUploadedFiles([newFile]);

        // Automatically trigger OCR extraction
        handleOcrExtraction(newFile);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document');
      console.error('Image picker error:', err);
    }
  }, [handleOcrExtraction]);

  const handleTakePhoto = useCallback(async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: true,
      });

      if (result.didCancel) {
        console.log('User cancelled camera');
        return;
      }

      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Failed to take photo');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const newFile: UploadedFile = {
          name: result.assets[0].fileName || 'Photo.jpg',
          size: result.assets[0].fileSize || 0,
          type: result.assets[0].type || 'image/jpeg',
          uri: result.assets[0].uri || '',
        };

        // Add to list
        setUploadedFiles([newFile]);

        // Automatically trigger OCR extraction
        handleOcrExtraction(newFile);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to take photo');
      console.error('Camera error:', err);
    }
  }, [handleOcrExtraction]);

  const getFileIcon = (type: string): string => {
    if (type.includes('pdf')) return 'file-pdf-box';
    if (type.includes('image')) return 'file-image';
    return 'file-document';
  };

  return (
    <LinearGradient
      colors={isDark ? ['#181A20', '#2A2D35'] : ['#FFFFFF', '#F3F4F6']}
      style={{ flex: 1 }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: Platform.OS === 'android' ? 12 : 50,
          paddingBottom: 16,
          backgroundColor: surfaceColor,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8 }}>
          <Icon name="arrow-left" size={24} color={isDark ? '#FFFFFF' : '#1F2937'} />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 19,
            fontWeight: '800',
            color: isDark ? '#FFFFFF' : '#1F2937',
            letterSpacing: 0.2,
          }}
        >
          Upload Prescription
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Upload Options Cards */}
        <View style={{ gap: 14 }}>
          {/* Gallery Upload Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handlePickDocument}
            disabled={isProcessing}
            style={{
              borderRadius: 20,
              overflow: 'hidden',
              shadowColor: accentColor,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
              opacity: isProcessing ? 0.6 : 1,
            }}
          >
            <LinearGradient
              colors={[accentColor, isDark ? '#7C3AED' : '#9333EA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 16, alignItems: 'center' }}
            >
              <View style={{ marginBottom: 8 }}>
                <Icon name="image-multiple" size={48} color="#FFFFFF" />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '800',
                  color: '#FFFFFF',
                  marginBottom: 4,
                  letterSpacing: 0.3,
                }}
              >
                Choose from Gallery
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.85)',
                  marginBottom: 12,
                  fontWeight: '500',
                }}
              >
                Select prescription images
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  paddingHorizontal: 18,
                  paddingVertical: 8,
                  borderRadius: 20,
                  gap: 6,
                }}
              >
                <Icon name="plus-circle" size={18} color="#FFFFFF" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                  Select Files
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Camera Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleTakePhoto}
            disabled={isProcessing}
            style={{
              borderRadius: 20,
              overflow: 'hidden',
              shadowColor: '#2563EB',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
              opacity: isProcessing ? 0.6 : 1,
            }}
          >
            <LinearGradient
              colors={[isDark ? '#2563EB' : '#3B82F6', isDark ? '#1E40AF' : '#2563EB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 16, alignItems: 'center' }}
            >
              <View style={{ marginBottom: 8 }}>
                <Icon name="camera" size={48} color="#FFFFFF" />
              </View>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '800',
                  color: '#FFFFFF',
                  marginBottom: 4,
                  letterSpacing: 0.3,
                }}
              >
                Take Photo
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  color: 'rgba(255, 255, 255, 0.85)',
                  marginBottom: 12,
                  fontWeight: '500',
                }}
              >
                Capture prescription directly
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  paddingHorizontal: 18,
                  paddingVertical: 8,
                  borderRadius: 20,
                  gap: 6,
                }}
              >
                <Icon name="camera-outline" size={18} color="#FFFFFF" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>
                  Open Camera
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* OCR Processing Indicator */}
        {isProcessing && (
          <View
            style={{
              marginTop: 22,
              padding: 18,
              borderRadius: 16,
              backgroundColor: isDark ? '#2A2D35' : '#E0F2FE',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <ActivityIndicator size="large" color={accentColor} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: isDark ? '#FFFFFF' : '#1F2937',
                  marginBottom: 4,
                }}
              >
                Processing OCR...
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: isDark ? '#9CA3AF' : '#6B7280',
                  fontWeight: '500',
                }}
              >
                Extracting medicines from prescription
              </Text>
            </View>
          </View>
        )}

        {/* Error Display */}
        {error && (
          <View
            style={{
              marginTop: 22,
              padding: 16,
              borderRadius: 16,
              backgroundColor: '#FEE2E2',
              borderLeftWidth: 4,
              borderLeftColor: '#DC2626',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <Icon name="alert-circle" size={24} color="#DC2626" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: '700',
                    color: '#991B1B',
                    marginBottom: 4,
                  }}
                >
                  Error Processing
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: '#7F1D1D',
                    fontWeight: '500',
                    lineHeight: 18,
                  }}
                >
                  {error}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Extracted Medicines Results */}
        {extractedMedicines.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 14,
              }}
            >
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '800',
                  color: isDark ? '#FFFFFF' : '#1F2937',
                  letterSpacing: 0.2,
                }}
              >
                Extracted Medicines ({extractedMedicines.length})
              </Text>
              <TouchableOpacity
                onPress={handleClearResults}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 8,
                  backgroundColor: isDark ? '#374151' : '#E5E7EB',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '700',
                    color: isDark ? '#F3F4F6' : '#1F2937',
                  }}
                >
                  Clear
                </Text>
              </TouchableOpacity>
            </View>

            {extractedMedicines.map((medicine, index) => (
              <View
                key={medicine.id}
                style={{
                  marginBottom: 14,
                  borderRadius: 14,
                  backgroundColor: isDark ? '#2A2D35' : '#FFFFFF',
                  overflow: 'hidden',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.2 : 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                {/* Card Header with Index */}
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: isDark ? '#374151' : '#E5E7EB',
                  }}
                >
                  <View
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      backgroundColor: accentColor,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '800',
                        color: '#FFFFFF',
                      }}
                    >
                      {index + 1}
                    </Text>
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      fontSize: 16,
                      fontWeight: '700',
                      color: isDark ? '#FFFFFF' : '#1F2937',
                    }}
                  >
                    {medicine.drugName || 'Unknown Medicine'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveMedicine(medicine.id)}
                    style={{ padding: 4 }}
                  >
                    <Icon name="delete-outline" size={20} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                {/* Card Body with Editable Fields */}
                <View style={{ padding: 14, gap: 12 }}>
                  {/* Dosage */}
                  <View style={{ gap: 4 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: isDark ? '#9CA3AF' : '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      Dosage
                    </Text>
                    <TextInput
                      value={medicine.dosage}
                      onChangeText={(text) =>
                        handleUpdateMedicine(medicine.id, 'dosage', text)
                      }
                      placeholder="e.g., 500mg"
                      placeholderTextColor={isDark ? '#6B7280' : '#D1D5DB'}
                      style={{
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: isDark ? '#374151' : '#E5E7EB',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        fontSize: 14,
                        fontWeight: '500',
                        color: isDark ? '#FFFFFF' : '#1F2937',
                        backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                      }}
                    />
                  </View>

                  {/* Frequency */}
                  <View style={{ gap: 4 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: isDark ? '#9CA3AF' : '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      Frequency
                    </Text>
                    <TextInput
                      value={medicine.frequency}
                      onChangeText={(text) =>
                        handleUpdateMedicine(medicine.id, 'frequency', text)
                      }
                      placeholder="e.g., Twice daily"
                      placeholderTextColor={isDark ? '#6B7280' : '#D1D5DB'}
                      style={{
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: isDark ? '#374151' : '#E5E7EB',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        fontSize: 14,
                        fontWeight: '500',
                        color: isDark ? '#FFFFFF' : '#1F2937',
                        backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                      }}
                    />
                  </View>

                  {/* Duration */}
                  <View style={{ gap: 4 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: '600',
                        color: isDark ? '#9CA3AF' : '#6B7280',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      Duration
                    </Text>
                    <TextInput
                      value={medicine.duration}
                      onChangeText={(text) =>
                        handleUpdateMedicine(medicine.id, 'duration', text)
                      }
                      placeholder="e.g., 10 days"
                      placeholderTextColor={isDark ? '#6B7280' : '#D1D5DB'}
                      style={{
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: isDark ? '#374151' : '#E5E7EB',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        fontSize: 14,
                        fontWeight: '500',
                        color: isDark ? '#FFFFFF' : '#1F2937',
                        backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                      }}
                    />
                  </View>

                  {/* Raw line (if available) */}
                  {medicine.raw && (
                    <View
                      style={{
                        padding: 10,
                        borderRadius: 8,
                        backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
                        borderLeftWidth: 2,
                        borderLeftColor: accentColor,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: 'monospace',
                          color: isDark ? '#9CA3AF' : '#6B7280',
                          fontWeight: '500',
                        }}
                        numberOfLines={2}
                      >
                        {medicine.raw}
                      </Text>
                    </View>
                  )}

                  {/* Availability Button */}
                  <TouchableOpacity
                    onPress={() => handleShowShopAvailability(medicine.drugName)}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: 10,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                      backgroundColor: accentColor + '20',
                      borderWidth: 1,
                      borderColor: accentColor,
                      gap: 8,
                    }}
                  >
                    <Icon name="store-outline" size={16} color={accentColor} />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: '700',
                        color: accentColor,
                      }}
                    >
                      Check Availability in Shops
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Debug Block - Collapsible Raw OCR Text */}
        {allRawData && (
          <View style={{ marginTop: 22 }}>
            <TouchableOpacity
              onPress={toggleDebugBlock}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 14,
                borderRadius: 12,
                backgroundColor: isDark ? '#2A2D35' : '#F9FAFB',
                marginBottom: 8,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Icon
                  name={showDebugBlock ? 'chevron-down' : 'chevron-right'}
                  size={22}
                  color={isDark ? '#9CA3AF' : '#6B7280'}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '700',
                    color: isDark ? '#D1D5DB' : '#4B5563',
                  }}
                >
                  Extracted Raw Text (Debug)
                </Text>
              </View>
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: isDark ? '#374151' : '#E5E7EB',
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: isDark ? '#F3F4F6' : '#1F2937',
                  }}
                >
                  {allRawData.split('\n').length} lines
                </Text>
              </View>
            </TouchableOpacity>

            {showDebugBlock && (
              <View
                style={{
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
                  borderWidth: 1,
                  borderColor: isDark ? '#374151' : '#E5E7EB',
                }}
              >
                <ScrollView
                  nestedScrollEnabled
                  style={{ maxHeight: 200 }}
                  showsVerticalScrollIndicator
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                      color: isDark ? '#9CA3AF' : '#4B5563',
                      fontWeight: '500',
                      lineHeight: 16,
                      letterSpacing: 0.3,
                    }}
                  >
                    {allRawData}
                  </Text>
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* Uploaded Files List - Show file being processed */}
        {uploadedFiles.length > 0 && !extractedMedicines.length && (
          <View style={{ marginTop: 28 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '800',
                marginBottom: 14,
                color: isDark ? '#FFFFFF' : '#1F2937',
                letterSpacing: 0.2,
              }}
            >
              Selected File
            </Text>

            {uploadedFiles.map((file, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 14,
                  borderRadius: 12,
                  marginBottom: 12,
                  backgroundColor: isDark ? '#2A2D35' : '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: isDark ? 0.2 : 0.05,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <View style={{ marginRight: 12 }}>
                  <Icon name={getFileIcon(file.type)} size={32} color={accentColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                        fontWeight: '700',
                      marginBottom: 4,
                      color: isDark ? '#FFFFFF' : '#1F2937',
                    }}
                    numberOfLines={1}
                  >
                    {file.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: isDark ? '#9CA3AF' : '#6B7280',
                      fontWeight: '500',
                    }}
                  >
                    {formatFileSize(file.size)}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}


        {/* Instructions Card */}
        <View
          style={{
            flexDirection: 'row',
            padding: 18,
            borderRadius: 16,
            marginTop: 22,
            gap: 14,
            backgroundColor: isDark ? '#2A2D35' : '#FEF3C7',
          }}
        >
          <Icon name="information" size={26} color="#F59E0B" />
          <Text
            style={{
              flex: 1,
              fontSize: 14,
              lineHeight: 20,
              fontWeight: '600',
              color: isDark ? '#FCD34D' : '#92400E',
            }}
          >
            Please ensure your prescription is clear and readable. Valid prescriptions are
            required for prescription medicines.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      {extractedMedicines.length > 0 && (
        <View
          style={{
            padding: 16,
            paddingBottom: Platform.OS === 'android' ? 16 : 28,
            gap: 10,
            backgroundColor: surfaceColor,
            borderTopWidth: 1,
            borderTopColor: isDark ? '#374151' : '#E5E7EB',
          }}
        >
          {/* Confirm Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            style={{
              borderRadius: 14,
              overflow: 'hidden',
              shadowColor: '#22C55E',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 16,
                gap: 8,
              }}
            >
              <Icon name="check-circle" size={22} color="#FFFFFF" />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '800',
                  color: '#FFFFFF',
                  letterSpacing: 0.3,
                }}
              >
                Proceed to Order ({extractedMedicines.length})
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Cancel / Start Over Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleClearResults}
            style={{
              borderRadius: 14,
              paddingVertical: 16,
              borderWidth: 1.5,
              borderColor: isDark ? '#374151' : '#E5E7EB',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Icon
                name="refresh"
                size={20}
                color={isDark ? '#9CA3AF' : '#6B7280'}
              />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '700',
                  color: isDark ? '#9CA3AF' : '#6B7280',
                  letterSpacing: 0.3,
                }}
              >
                Start Over
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Shop Availability Modal */}
      <ShopAvailabilityModal
        visible={showShopModal}
        medicineName={selectedMedicineName}
        onClose={() => setShowShopModal(false)}
      />
    </LinearGradient>
  );
};

export default PDFUploadScreen;
