
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
import { uploadPrescription } from '../../api/prescriptionApi';
import type { UploadedFilePayload, MedicineDetails, OcrResponse } from '../../api/types';
import ShopAvailabilityModal from '../modals/ShopAvailabilityModal';
import PermissionService from '../../services/PermissionService';

interface PDFUploadScreenProps {
  navigation: any;
  route?: any;
}

interface EditableMedicine extends MedicineDetails {
  id: string; // Unique identifier for tracking edits
}

const PDFUploadScreen: React.FC<PDFUploadScreenProps> = ({ navigation, route }) => {
  const { isDark, accentColor, surfaceColor } = useThemePalette();

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFilePayload[]>([]);

  // OCR extraction state
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedMedicines, setExtractedMedicines] = useState<EditableMedicine[]>([]);
  const [allRawData, setAllRawData] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Debug state
  const [showDebugBlock, setShowDebugBlock] = useState(false);
  const debugExpand = useRef(new Animated.Value(0)).current;

  // Handle auto-trigger from navigation params
  React.useEffect(() => {
    if (route.params?.mode === 'camera') {
      setTimeout(() => handleTakePhoto(), 300);
    } else if (route.params?.mode === 'gallery') {
      setTimeout(() => handlePickDocument(), 300);
    }
  }, [route.params?.mode]);

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
  const validateFile = (file: UploadedFilePayload): { valid: boolean; error?: string } => {
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
    async (file: UploadedFilePayload) => {
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
        const responseData = await uploadPrescription(file);

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
    if (route.params?.mode) {
      navigation.setParams({ mode: undefined });
    }
  }, [navigation, route.params?.mode]);


  /**
   * Handle Proceed to Checkout / Cart
   */
  const handleProceed = useCallback(() => {
    // Logic to add to cart or navigate to checkout
    // For now, navigating to ShoppingBagScreen
    Alert.alert(
      "Success",
      "Medicines added to list. Proceeding to review.",
      [
        { text: "OK", onPress: () => navigation.navigate('ShoppingBagScreen') }
      ]
    );
  }, [navigation]);


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
        return;
      }

      if (result.errorCode) {
        Alert.alert('Error', result.errorMessage || 'Failed to pick document');
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newFile: UploadedFilePayload = {
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
    }
  }, [handleOcrExtraction]);

  const handleTakePhoto = useCallback(async () => {
    try {
      // Request Permission First
      const hasPermission = await PermissionService.requestCameraPermission();

      if (!hasPermission) {
        Alert.alert(
          'Permission Denied',
          'Camera permission is required to take photos. Please enable it in app settings.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: true,
      });

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        // Only show error if it's not a permission related 'standard' error that we already caught
        if (result.errorCode !== 'permission') {
          Alert.alert('Error', result.errorMessage || 'Failed to take photo');
        }
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const newFile: UploadedFilePayload = {
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
      console.error(err);
      // Removed generic Alert to avoid duplicate/confusing error messages
    }
  }, [handleOcrExtraction]);

  const isAutoMode = route.params?.mode;
  const showOptions = !extractedMedicines.length && !isProcessing && !isAutoMode;

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
          {extractedMedicines.length > 0 ? 'Review Medicines' : 'Upload Prescription'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Helper State during auto launch */}
        {isAutoMode && !extractedMedicines.length && !isProcessing && (
          <View style={{ alignItems: 'center', marginTop: 100 }}>
            <ActivityIndicator size="large" color={accentColor} />
            <Text style={{ marginTop: 20, color: isDark ? '#AAA' : '#555' }}>
              Initializing {route.params?.mode === 'camera' ? 'Camera' : 'Gallery'}...
            </Text>
          </View>
        )}

        {/* Upload Options Cards - HIDDEN if results exist or isAutoMode */}
        {showOptions && (
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
        )}

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

                  {/* Shop Availability Button */}
                  <TouchableOpacity
                    onPress={() => handleShowShopAvailability(medicine.drugName)}
                    style={{
                      marginTop: 8,
                      padding: 12,
                      backgroundColor: isDark ? '#374151' : '#EEF2FF',
                      borderRadius: 8,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: isDark ? '#4B5563' : '#C7D2FE',
                    }}
                  >
                    <Text style={{
                      color: '#4F46E5',
                      fontWeight: '600',
                      fontSize: 14
                    }}>
                      Check Shop Availability
                    </Text>
                  </TouchableOpacity>

                </View>
              </View>
            ))}

            {/* PROCEED BUTTON */}
            <View style={{ paddingBottom: 50 }}>
              <TouchableOpacity
                onPress={handleProceed}
                style={{
                  backgroundColor: accentColor,
                  paddingVertical: 16,
                  borderRadius: 12,
                  shadowColor: accentColor,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 10,
                  elevation: 6,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <Text style={{
                  color: 'white',
                  fontSize: 18,
                  fontWeight: 'bold'
                }}>
                  Proceed to Checkout
                </Text>
                <Icon name="arrow-right" size={20} color="white" />
              </TouchableOpacity>
            </View>

          </View>
        )}
      </ScrollView>

      {/* Shop Availability Modal */}
      <ShopAvailabilityModal
        visible={showShopModal}
        onClose={() => setShowShopModal(false)}
        medicineName={selectedMedicineName}
      />
    </LinearGradient>
  );
};

export default PDFUploadScreen;
