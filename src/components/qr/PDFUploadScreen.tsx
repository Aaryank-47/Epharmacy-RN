import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useThemePalette } from '../../hooks/useThemePalette';

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

const PDFUploadScreen: React.FC<PDFUploadScreenProps> = ({ navigation }) => {
  const { isDark, accentColor, surfaceColor } = useThemePalette();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handlePickDocument = useCallback(async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        selectionLimit: 10,
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
        const newFiles: UploadedFile[] = result.assets.map((asset) => ({
          name: asset.fileName || 'Unknown',
          size: asset.fileSize || 0,
          type: asset.type || 'image/jpeg',
          uri: asset.uri || '',
        }));

        setUploadedFiles([...uploadedFiles, ...newFiles]);
        Alert.alert('Success', `${newFiles.length} file(s) selected successfully!`);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick document');
      console.error('Image picker error:', err);
    }
  }, [uploadedFiles]);

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
          name: result.assets[0].fileName || 'Photo',
          size: result.assets[0].fileSize || 0,
          type: result.assets[0].type || 'image/jpeg',
          uri: result.assets[0].uri || '',
        };

        setUploadedFiles([...uploadedFiles, newFile]);
        Alert.alert('Success', 'Photo captured successfully!');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to take photo');
      console.error('Camera error:', err);
    }
  }, [uploadedFiles]);

  const handleUpload = useCallback(async () => {
    if (uploadedFiles.length === 0) {
      Alert.alert('No Files', 'Please select at least one file to upload');
      return;
    }

    setIsUploading(true);

    // Simulate upload (replace with actual API call)
    setTimeout(() => {
      setIsUploading(false);
      Alert.alert(
        'Upload Successful',
        `${uploadedFiles.length} file(s) uploaded successfully!`,
        [
          {
            text: 'OK',
            onPress: () => {
              setUploadedFiles([]);
              navigation.goBack();
            },
          },
        ]
      );
    }, 2000);
  }, [uploadedFiles, navigation]);

  const handleRemoveFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
  };

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
            disabled={isUploading}
            style={{
              borderRadius: 20,
              overflow: 'hidden',
              shadowColor: accentColor,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <LinearGradient
              colors={[accentColor, isDark ? '#7C3AED' : '#9333EA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 28, alignItems: 'center' }}
            >
              <View style={{ marginBottom: 14 }}>
                <Icon name="image-multiple" size={72} color="#FFFFFF" />
              </View>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '800',
                  color: '#FFFFFF',
                  marginBottom: 8,
                  letterSpacing: 0.3,
                }}
              >
                Choose from Gallery
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: 20,
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
                  paddingHorizontal: 26,
                  paddingVertical: 13,
                  borderRadius: 30,
                  gap: 8,
                }}
              >
                <Icon name="plus-circle" size={24} color="#FFFFFF" />
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}>
                  Select Files
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Camera Card */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleTakePhoto}
            disabled={isUploading}
            style={{
              borderRadius: 20,
              overflow: 'hidden',
              shadowColor: '#22C55E',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 8,
            }}
          >
            <LinearGradient
              colors={['#22C55E', '#16A34A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ padding: 28, alignItems: 'center' }}
            >
              <View style={{ marginBottom: 14 }}>
                <Icon name="camera" size={72} color="#FFFFFF" />
              </View>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '800',
                  color: '#FFFFFF',
                  marginBottom: 8,
                  letterSpacing: 0.3,
                }}
              >
                Take Photo
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: 20,
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
                  paddingHorizontal: 26,
                  paddingVertical: 13,
                  borderRadius: 30,
                  gap: 8,
                }}
              >
                <Icon name="camera-outline" size={24} color="#FFFFFF" />
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#FFFFFF' }}>
                  Open Camera
                </Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <View style={{ marginTop: 28 }}>
            <Text
              style={{
                fontSize: 20,
                fontWeight: '800',
                marginBottom: 14,
                color: isDark ? '#FFFFFF' : '#1F2937',
                letterSpacing: 0.2,
              }}
            >
              Selected Files ({uploadedFiles.length})
            </Text>

            {uploadedFiles.map((file, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 18,
                  borderRadius: 16,
                  marginBottom: 12,
                  backgroundColor: isDark ? '#2A2D35' : '#FFFFFF',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: isDark ? 0.2 : 0.08,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <View style={{ marginRight: 14 }}>
                  <Icon name={getFileIcon(file.type)} size={36} color={accentColor} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '700',
                      marginBottom: 5,
                      color: isDark ? '#FFFFFF' : '#1F2937',
                    }}
                    numberOfLines={1}
                  >
                    {file.name}
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: isDark ? '#9CA3AF' : '#6B7280',
                      fontWeight: '500',
                    }}
                  >
                    {formatFileSize(file.size)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveFile(index)} style={{ padding: 6 }}>
                  <Icon name="close-circle" size={26} color="#EF4444" />
                </TouchableOpacity>
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

      {/* Bottom Action Button */}
      {uploadedFiles.length > 0 && (
        <View
          style={{
            padding: 20,
            paddingBottom: Platform.OS === 'android' ? 20 : 34,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleUpload}
            disabled={isUploading}
            style={{
              borderRadius: 18,
              overflow: 'hidden',
              shadowColor: '#22C55E',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
              elevation: 6,
            }}
          >
            <LinearGradient
              colors={isUploading ? ['#9CA3AF', '#6B7280'] : ['#22C55E', '#16A34A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                paddingVertical: 18,
                gap: 10,
              }}
            >
              {isUploading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Icon name="check-circle" size={26} color="#FFFFFF" />
              )}
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 }}>
                {isUploading ? 'Uploading...' : `Upload ${uploadedFiles.length} File(s)`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
};

export default PDFUploadScreen;
