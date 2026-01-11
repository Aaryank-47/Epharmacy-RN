import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  StatusBar,
  useColorScheme,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
  StyleSheet,
  Linking,
  Modal,
} from 'react-native';
import LocationService from '../../services/LocationService';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { launchImageLibrary, launchCamera, ImageLibraryOptions, CameraOptions, Asset } from 'react-native-image-picker';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { RootStackParamList } from '../../../AppNavigator';
import { updateUserProfile } from '../../api/authApi';

interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  location?: {
    latitude: number | null;
    longitude: number | null;
  };
}

interface UserData {
  name: string;
  email: string;
  phone: string;
  age: number | null;
  dob: string | null;
  role: string;
  address: Address;
  profileImage: string[];
  wishlistCount: number;
  viewedItemsCount: number;
  itemsPurchasedCount: number;
  lastLogin: string | null;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  age: string;
  dob: Date;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    location: {
      latitude: number | null;
      longitude: number | null;
    };
  };
  profileImage: {
    uri: string;
    type: string;
    name: string;
  } | null;
}

interface RouteParams {
  userData?: UserData;
  refreshProfile?: () => void;
}

interface InputFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  multiline?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const getResponsiveSize = (size: number): number => (screenWidth / 375) * size;

const STORAGE_KEYS = {
  GALLERY_PERMISSION_ASKED: '@app/galleryPermissionAsked',
  CAMERA_PERMISSION_ASKED: '@app/cameraPermissionAsked',
};

const COLORS = {
  primary: '#e16c61f1',
  primaryDark: '#d77b7bff',
  white: '#FFFFFF',
  black: '#1F2937',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  darkBg: '#2A2A2A',
  darkBgLight: '#3A3A3A',
  success: '#10B981',
  error: '#EF4444',
};

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const isDark = useColorScheme() === 'dark';
  const { userData: initialUserData, refreshProfile } = route.params || {};

  const [loading, setLoading] = useState<boolean>(false);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [isPicking, setIsPicking] = useState<boolean>(false);

  const [showCameraPreview, setShowCameraPreview] = useState<boolean>(false);
  const [cameraPreviewUri, setCameraPreviewUri] = useState<string | null>(null);
  const [tempCameraAsset, setTempCameraAsset] = useState<Asset | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: initialUserData?.name || '',
    email: initialUserData?.email || '',
    phone: initialUserData?.phone || '',
    age: initialUserData?.age?.toString() || '',
    dob: initialUserData?.dob ? new Date(initialUserData.dob) : new Date(),
    address: {
      street: initialUserData?.address?.street || '',
      city: initialUserData?.address?.city || '',
      state: initialUserData?.address?.state || '',
      zip: initialUserData?.address?.zip || '',
      country: initialUserData?.address?.country || '',
      location: {
        latitude: initialUserData?.address?.location?.latitude || null,
        longitude: initialUserData?.address?.location?.longitude || null,
      },
    },
    profileImage: null,
  });

  const [profileImageUri, setProfileImageUri] = useState<string | null>(
    initialUserData?.profileImage && initialUserData.profileImage.length > 0
      ? initialUserData.profileImage[0]
      : null
  );

  const showSettingsPromptIfBlocked = (permissionType: 'Gallery' | 'Camera'): void => {
    Alert.alert(
      'Permission Required',
      `${permissionType} access is blocked. Please enable it in Settings to ${permissionType === 'Gallery' ? 'select a profile picture' : 'take a photo'}.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open Settings',
          onPress: () => Linking.openSettings()
        },
      ]
    );
  };

  const hasPermissionBeenAsked = async (storageKey: string): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(storageKey);
      return value === 'true';
    } catch (error) {
      throw error;
    }
  };

  const markPermissionAsAsked = async (storageKey: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(storageKey, 'true');
    } catch (error) {
      throw error;
    }
  };

  const checkAndHandleGalleryPermission = async (): Promise<boolean> => {
    try {
      const alreadyAsked = await hasPermissionBeenAsked(STORAGE_KEYS.GALLERY_PERMISSION_ASKED);

      if (Platform.OS === 'ios') {
        const permission = PERMISSIONS.IOS.PHOTO_LIBRARY;
        const result = await check(permission);

        if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) {
          return true;
        }

        if (result === RESULTS.BLOCKED) {
          showSettingsPromptIfBlocked('Gallery');
          return false;
        }

        if (result === RESULTS.DENIED && !alreadyAsked) {
          await markPermissionAsAsked(STORAGE_KEYS.GALLERY_PERMISSION_ASKED);

          const requestResult = await request(permission);

          if (requestResult === RESULTS.GRANTED || requestResult === RESULTS.LIMITED) {
            return true;
          }

          if (requestResult === RESULTS.DENIED || requestResult === RESULTS.BLOCKED) {
            showSettingsPromptIfBlocked('Gallery');
            return false;
          }

          return false;
        }

        if (result === RESULTS.DENIED && alreadyAsked) {
          showSettingsPromptIfBlocked('Gallery');
          return false;
        }

        return false;
      } else {
        const androidVersion = Platform.Version as number;

        let permission;
        if (androidVersion >= 33) {
          permission = PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
        } else {
          permission = PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
        }

        const result = await check(permission);
        if (result === RESULTS.GRANTED) {
          return true;
        }

        if (result === RESULTS.BLOCKED) {
          showSettingsPromptIfBlocked('Gallery');
          return false;
        }

        if (result === RESULTS.DENIED && !alreadyAsked) {
          await markPermissionAsAsked(STORAGE_KEYS.GALLERY_PERMISSION_ASKED);

          const requestResult = await request(permission);
          if (requestResult === RESULTS.GRANTED) {
            return true;
          }

          if (requestResult === RESULTS.DENIED || requestResult === RESULTS.BLOCKED) {
            showSettingsPromptIfBlocked('Gallery');
            return false;
          }

          return false;
        }

        if (result === RESULTS.DENIED && alreadyAsked) {
          showSettingsPromptIfBlocked('Gallery');
          return false;
        }

        return false;
      }
    } catch (error) {
      throw error;
    }
  };

  const checkAndHandleCameraPermission = async (): Promise<boolean> => {
    try {
      const alreadyAsked = await hasPermissionBeenAsked(STORAGE_KEYS.CAMERA_PERMISSION_ASKED);

      const permission = Platform.OS === 'ios'
        ? PERMISSIONS.IOS.CAMERA
        : PERMISSIONS.ANDROID.CAMERA;

      const result = await check(permission);
      if (result === RESULTS.GRANTED) {
        return true;
      }

      if (result === RESULTS.BLOCKED) {
        showSettingsPromptIfBlocked('Camera');
        return false;
      }

      if (result === RESULTS.DENIED && !alreadyAsked) {
        await markPermissionAsAsked(STORAGE_KEYS.CAMERA_PERMISSION_ASKED);
        const requestResult = await request(permission);
        if (requestResult === RESULTS.GRANTED) {
          return true;
        }

        if (requestResult === RESULTS.DENIED || requestResult === RESULTS.BLOCKED) {
          showSettingsPromptIfBlocked('Camera');
          return false;
        }

        return false;
      }

      if (result === RESULTS.DENIED && alreadyAsked) {
        showSettingsPromptIfBlocked('Camera');
        return false;
      }

      return false;
    } catch (error) {
      throw error;
    }
  };


  const openGallery = async (): Promise<void> => {
    if (isPicking) {
      return;
    }

    try {
      setIsPicking(true);

      const hasPermission = await checkAndHandleGalleryPermission();

      if (!hasPermission) {
        return;
      }

      const options: ImageLibraryOptions = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        selectionLimit: 1,
        includeBase64: false,
        presentationStyle: 'fullScreen',
      };

      const result = await launchImageLibrary(options);

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert(
          'Error',
          result.errorMessage || 'Failed to select image. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        if (!asset.uri) {
          Alert.alert('Error', 'Invalid image selected. Please try again.');
          return;
        }

        setProfileImageUri(asset.uri);
        setFormData(prev => ({
          ...prev,
          profileImage: {
            uri: asset.uri || '',
            type: asset.type || 'image/jpeg',
            name: asset.fileName || `profile_${Date.now()}.jpg`,
          }
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsPicking(false);
    }
  };

  const openCamera = async (): Promise<void> => {
    if (isPicking) {
      return;
    }

    try {
      setIsPicking(true);

      const hasPermission = await checkAndHandleCameraPermission();

      if (!hasPermission) {
        return;
      }

      const options: CameraOptions = {
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 1024,
        maxHeight: 1024,
        saveToPhotos: true,
        includeBase64: false,
      };

      const result = await launchCamera(options);

      if (result.didCancel) {
        return;
      }

      if (result.errorCode) {
        Alert.alert(
          'Error',
          result.errorMessage || 'Failed to capture photo. Please try again.',
          [{ text: 'OK' }]
        );
        return;
      }

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        if (!asset.uri) {
          Alert.alert('Error', 'Invalid photo captured. Please try again.');
          return;
        }

        setCameraPreviewUri(asset.uri);
        setTempCameraAsset(asset);
        setShowCameraPreview(true);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsPicking(false);
    }
  };

  const handleRetakePhoto = (): void => {
    setShowCameraPreview(false);
    setCameraPreviewUri(null);
    setTempCameraAsset(null);

    setTimeout(() => {
      openCamera();
    }, 300);
  };

  const handleAcceptPhoto = (): void => {
    if (!tempCameraAsset || !cameraPreviewUri) {
      return;
    }

    setProfileImageUri(cameraPreviewUri);
    setFormData(prev => ({
      ...prev,
      profileImage: {
        uri: cameraPreviewUri,
        type: tempCameraAsset.type || 'image/jpeg',
        name: tempCameraAsset.fileName || `profile_camera_${Date.now()}.jpg`,
      }
    }));

    setShowCameraPreview(false);
    setCameraPreviewUri(null);
    setTempCameraAsset(null);

  };

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date): void => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        dob: selectedDate,
      }));
    }
  };

  const getCurrentLocation = async (): Promise<void> => {
    try {
      setLocationLoading(true);

      const locationData = await LocationService.getCurrentLocation();
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          location: {
            latitude: locationData.latitude,
            longitude: locationData.longitude,
          },
        },
      }));

      setLocationLoading(false);

      Alert.alert(
        'Success',
        `Location obtained successfully!\nLat: ${locationData.latitude.toFixed(6)}\nLon: ${locationData.longitude.toFixed(6)}`
      );

    } catch (error: any) {
      setLocationLoading(false);

      let message = 'Failed to get current location.';
      if (error.message === 'PERMISSION_DENIED') {
        message = 'Location permission was denied. Please enable it in Settings.';
      } else if (error.message === 'GPS_DISABLED') {
        message = 'Location services are disabled. Please enable GPS.';
      } else {
        message = error.message || 'An unexpected error occurred.';
      }

      Alert.alert(
        'Location Error',
        message,
        [
          { text: 'Cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    }
  };

  const handleSubmit = async (): Promise<void> => {
    let hasImage = false;

    try {
      setLoading(true);

      if (!formData.name.trim()) {
        Alert.alert('Validation Error', 'Name is required');
        setLoading(false);
        return;
      }

      if (!formData.email.trim()) {
        Alert.alert('Validation Error', 'Email is required');
        setLoading(false);
        return;
      }

      hasImage = formData.profileImage !== null;
      let response;

      if (hasImage && formData.profileImage) {
        const submitFormData = new FormData();

        submitFormData.append('name', formData.name.trim());
        submitFormData.append('email', formData.email.trim());

        if (formData.phone && formData.phone.trim()) {
          submitFormData.append('phone', formData.phone.trim());
        }
        if (formData.age && formData.age.toString().trim()) {
          submitFormData.append('age', parseInt(formData.age, 10));
        }
        if (formData.dob) {
          submitFormData.append('dob', formData.dob.toISOString());
        }

        const addressData: any = {};
        if (formData.address.street) addressData.street = formData.address.street;
        if (formData.address.city) addressData.city = formData.address.city;
        if (formData.address.state) addressData.state = formData.address.state;
        if (formData.address.zip) addressData.zip = formData.address.zip;
        if (formData.address.country) addressData.country = formData.address.country;

        if (formData.address.location.latitude && formData.address.location.longitude) {
          addressData.location = {
            latitude: parseFloat(formData.address.location.latitude.toString()),
            longitude: parseFloat(formData.address.location.longitude.toString()),
          };
        }

        if (Object.keys(addressData).length > 0) {
          submitFormData.append('address', JSON.stringify(addressData));
        }

        const imageFile: any = {
          uri: formData.profileImage.uri,
          type: formData.profileImage.type || 'image/jpeg',
          name: formData.profileImage.name || `profile_${Date.now()}.jpg`,
        };

        submitFormData.append('profileImage', imageFile);

        response = await updateUserProfile(submitFormData, true);
      } else {
        const jsonData: any = {
          name: formData.name.trim(),
          email: formData.email.trim(),
        };

        if (formData.phone.trim()) jsonData.phone = formData.phone.trim();
        if (formData.age) jsonData.age = parseInt(formData.age, 10);
        if (formData.dob) jsonData.dob = formData.dob.toISOString();

        const addressData: any = {};
        if (formData.address.street) addressData.street = formData.address.street;
        if (formData.address.city) addressData.city = formData.address.city;
        if (formData.address.state) addressData.state = formData.address.state;
        if (formData.address.zip) addressData.zip = formData.address.zip;
        if (formData.address.country) addressData.country = formData.address.country;

        if (formData.address.location.latitude && formData.address.location.longitude) {
          addressData.location = {
            latitude: parseFloat(formData.address.location.latitude.toString()),
            longitude: parseFloat(formData.address.location.longitude.toString()),
          };
        }

        if (Object.keys(addressData).length > 0) {
          jsonData.address = addressData;
        }

        response = await updateUserProfile(jsonData, false);
      }

      if (response.success) {
        Alert.alert(
          'Success',
          'Profile updated successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                if (refreshProfile) refreshProfile();
                navigation.goBack();
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Update Failed',
          response.message || 'Failed to update profile',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
      const isNetworkError = error.message === 'Network Error' || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK';
      const isImageUploadError = errorMessage.toLowerCase().includes('upload preset') ||
        errorMessage.toLowerCase().includes('cloudinary');

      if (isNetworkError && hasImage) {
        Alert.alert(
          'Network Error',
          'Unable to upload image. This usually happens with large files. Would you like to try updating without the image?',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Update Without Image',
              onPress: async () => {
                try {
                  setLoading(true);

                  const jsonData: any = {
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                  };

                  if (formData.phone.trim()) jsonData.phone = formData.phone.trim();
                  if (formData.age) jsonData.age = parseInt(formData.age, 10);
                  if (formData.dob) jsonData.dob = formData.dob.toISOString();

                  const addressData: any = {};
                  if (formData.address.street) addressData.street = formData.address.street;
                  if (formData.address.city) addressData.city = formData.address.city;
                  if (formData.address.state) addressData.state = formData.address.state;
                  if (formData.address.zip) addressData.zip = formData.address.zip;
                  if (formData.address.country) addressData.country = formData.address.country;

                  if (formData.address.location.latitude && formData.address.location.longitude) {
                    addressData.location = {
                      latitude: parseFloat(formData.address.location.latitude.toString()),
                      longitude: parseFloat(formData.address.location.longitude.toString()),
                    };
                  }

                  if (Object.keys(addressData).length > 0) {
                    jsonData.address = addressData;
                  }

                  const retryResponse = await updateUserProfile(jsonData, false);

                  if (retryResponse.success) {
                    Alert.alert(
                      'Success',
                      'Profile updated successfully (without image)!',
                      [
                        {
                          text: 'OK',
                          onPress: () => {
                            if (refreshProfile) refreshProfile();
                            navigation.goBack();
                          },
                        },
                      ]
                    );
                  } else {
                    Alert.alert('Update Failed', retryResponse.message || 'Failed to update profile');
                  }
                } catch (retryError: any) {
                  Alert.alert('Update Failed', 'Could not update profile. Please check your connection and try again.');
                } finally {
                  setLoading(false);
                }
              },
            },
          ]
        );
      } else if (isImageUploadError && hasImage) {
        Alert.alert(
          'Image Upload Failed',
          'The server is having trouble uploading images. Would you like to update your profile without changing the picture?',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Update Without Image',
              onPress: async () => {
                try {
                  setLoading(true);

                  const jsonData: any = {
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                  };

                  if (formData.phone.trim()) jsonData.phone = formData.phone.trim();
                  if (formData.age) jsonData.age = parseInt(formData.age, 10);
                  if (formData.dob) jsonData.dob = formData.dob.toISOString();

                  const addressData: any = {};
                  if (formData.address.street) addressData.street = formData.address.street;
                  if (formData.address.city) addressData.city = formData.address.city;
                  if (formData.address.state) addressData.state = formData.address.state;
                  if (formData.address.zip) addressData.zip = formData.address.zip;
                  if (formData.address.country) addressData.country = formData.address.country;

                  if (formData.address.location.latitude && formData.address.location.longitude) {
                    addressData.location = {
                      latitude: parseFloat(formData.address.location.latitude.toString()),
                      longitude: parseFloat(formData.address.location.longitude.toString()),
                    };
                  }

                  if (Object.keys(addressData).length > 0) {
                    jsonData.address = addressData;
                  }

                  const retryResponse = await updateUserProfile(jsonData, false);

                  if (retryResponse.success) {
                    Alert.alert(
                      'Success',
                      'Profile updated successfully (without image)!',
                      [
                        {
                          text: 'OK',
                          onPress: () => {
                            if (refreshProfile) refreshProfile();
                            navigation.goBack();
                          },
                        },
                      ]
                    );
                  } else {
                    Alert.alert('Update Failed', retryResponse.message || 'Failed to update profile');
                  }
                } catch (retryError: any) {
                  Alert.alert('Update Failed', 'Could not update profile. Please try again later.');
                } finally {
                  setLoading(false);
                }
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Update Failed',
          isImageUploadError
            ? 'Server image upload is temporarily unavailable. Please try again later or contact support.'
            : errorMessage,
          [{ text: 'OK' }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const InputField: React.FC<InputFieldProps> = useCallback(({
    label,
    value,
    onChangeText,
    placeholder,
    keyboardType = 'default',
    multiline = false
  }) => (
    <View className="mb-5">
      <Text
        className="text-sm font-semibold mb-2"
        style={{ color: isDark ? COLORS.white : COLORS.black }}
      >
        {label}
      </Text>
      <TextInput
        className="px-4 py-3 rounded-xl text-base"
        style={[
          multiline && styles.textInputMultiline,
          {
            backgroundColor: isDark ? COLORS.darkBgLight : COLORS.lightGray,
            color: isDark ? COLORS.white : COLORS.black,
          }
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#999' : '#666'}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCorrect={false}
        autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
      />
    </View>
  ), [isDark]);

  return (
    <LinearGradient
      colors={isDark ? ['#1A1A1A', COLORS.darkBg] : [COLORS.white, '#F8F9FA']}
      style={styles.container}
    >
      <StatusBar
        backgroundColor={isDark ? '#1A1A1A' : COLORS.white}
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      { }
      <View
        className="flex-row items-center justify-between px-4 border-b"
        style={[
          styles.header,
          { borderBottomColor: isDark ? COLORS.darkBgLight : '#E5E7EB' }
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: isDark ? COLORS.darkBgLight : COLORS.lightGray }}
        >
          <MaterialCommunityIcons name="arrow-left" size={getResponsiveSize(24)} color={isDark ? COLORS.white : COLORS.black} />
        </TouchableOpacity>
        <Text
          className="text-xl font-bold"
          style={{ color: isDark ? COLORS.white : COLORS.black }}
        >
          Edit Profile
        </Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{
            backgroundColor: isDark ? COLORS.primaryDark : COLORS.primary,
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <MaterialCommunityIcons name="check" size={getResponsiveSize(18)} color={COLORS.white} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        { }
        <View
          className="m-4 p-5 rounded-2xl items-center"
          style={[
            styles.section,
            { backgroundColor: isDark ? COLORS.darkBg : COLORS.white }
          ]}
        >
          <Text
            className="text-lg font-bold mb-5"
            style={{ color: isDark ? COLORS.white : COLORS.black }}
          >
            Profile Picture
          </Text>

          { }
          <View className="items-center mb-4">
            <View className="relative">
              {profileImageUri ? (
                <Image
                  source={{ uri: profileImageUri }}
                  style={styles.profileImage}
                  resizeMode="cover"
                />
              ) : (
                <View
                  className="items-center justify-center"
                  style={[
                    styles.placeholderImage,
                    { backgroundColor: isDark ? COLORS.primaryDark : COLORS.primary }
                  ]}
                >
                  <MaterialCommunityIcons
                    name="account"
                    size={getResponsiveSize(60)}
                    color={COLORS.white}
                  />
                </View>
              )}

              { }
              <View
                className="absolute items-center justify-center"
                style={[
                  styles.cameraBadge,
                  { backgroundColor: isDark ? COLORS.primaryDark : COLORS.primary }
                ]}
              >
                <MaterialCommunityIcons
                  name="camera"
                  size={getResponsiveSize(18)}
                  color={COLORS.white}
                />
              </View>
            </View>
          </View>

          { }
          <View className="flex-row gap-3 w-full">
            { }
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center px-4 py-3 rounded-xl"
              style={{
                backgroundColor: isDark ? COLORS.primaryDark : COLORS.primary,
                opacity: isPicking ? 0.6 : 1
              }}
              onPress={openGallery}
              disabled={isPicking}
              activeOpacity={0.7}
            >
              {isPicking ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name="image-outline"
                    size={getResponsiveSize(20)}
                    color={COLORS.white}
                  />
                  <Text className="text-white text-sm font-semibold ml-2">
                    Choose Photo
                  </Text>
                </>
              )}
            </TouchableOpacity>

            { }
            <TouchableOpacity
              className="flex-1 flex-row items-center justify-center px-4 py-3 rounded-xl"
              style={{
                backgroundColor: isDark ? COLORS.success : COLORS.success,
                opacity: isPicking ? 0.6 : 1
              }}
              onPress={openCamera}
              disabled={isPicking}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="camera"
                size={getResponsiveSize(20)}
                color={COLORS.white}
              />
              <Text className="text-white text-sm font-semibold ml-2">
                Take Photo
              </Text>
            </TouchableOpacity>
          </View>

          { }
          <Text
            className="text-xs text-center mt-3"
            style={{ color: isDark ? COLORS.gray : COLORS.gray }}
          >
            Choose from gallery or take a new photo
          </Text>
        </View>

        { }
        <View
          className="m-4 p-5 rounded-2xl"
          style={[
            styles.section,
            { backgroundColor: isDark ? COLORS.darkBg : COLORS.white }
          ]}
        >
          <Text
            className="text-lg font-bold mb-5"
            style={{ color: isDark ? COLORS.white : COLORS.black }}
          >
            Basic Information
          </Text>

          <InputField
            label="Full Name *"
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))
            }
            placeholder="Enter your full name"
          />

          <InputField
            label="Email Address *"
            value={formData.email}
            onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))
            }
            placeholder="Enter your email"
            keyboardType="email-address"
          />

          <InputField
            label="Phone Number"
            value={formData.phone}
            onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))
            }
            placeholder="Enter your phone number"
            keyboardType="phone-pad"
          />

          <InputField
            label="Age"
            value={formData.age}
            onChangeText={(text) => setFormData(prev => ({ ...prev, age: text }))
            }
            placeholder="Enter your age"
            keyboardType="numeric"
          />

          { }
          <View className="mb-5">
            <Text
              className="text-sm font-semibold mb-2"
              style={{ color: isDark ? COLORS.white : COLORS.black }}
            >
              Date of Birth
            </Text>
            <TouchableOpacity
              className="px-4 py-3 rounded-xl flex-row items-center justify-between"
              style={{ backgroundColor: isDark ? COLORS.darkBgLight : COLORS.lightGray }}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: isDark ? COLORS.white : COLORS.black }}>
                {formData.dob.toLocaleDateString()}
              </Text>
              <MaterialCommunityIcons
                name="calendar"
                size={getResponsiveSize(20)}
                color={isDark ? COLORS.white : COLORS.black}
              />
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={formData.dob}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}
        </View>

        { }
        <View
          className="m-4 p-5 rounded-2xl"
          style={[
            styles.section,
            { backgroundColor: isDark ? COLORS.darkBg : COLORS.white }
          ]}
        >
          <Text
            className="text-lg font-bold mb-5"
            style={{ color: isDark ? COLORS.white : COLORS.black }}
          >
            Address Information
          </Text>

          <InputField
            label="Street Address"
            value={formData.address.street}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              address: { ...prev.address, street: text }
            }))
            }
            placeholder="Enter street address"
            multiline
          />

          <InputField
            label="City"
            value={formData.address.city}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              address: { ...prev.address, city: text }
            }))}
            placeholder="Enter city"
          />

          <InputField
            label="State"
            value={formData.address.state}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              address: { ...prev.address, state: text }
            }))
            }
            placeholder="Enter state"
          />

          <InputField
            label="ZIP Code"
            value={formData.address.zip}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              address: { ...prev.address, zip: text }
            }))
            }
            placeholder="Enter ZIP code"
            keyboardType="numeric"
          />

          <InputField
            label="Country"
            value={formData.address.country}
            onChangeText={(text) => setFormData(prev => ({
              ...prev,
              address: { ...prev.address, country: text }
            }))
            }
            placeholder="Enter country"
          />

          { }
          <View className="mb-5">
            <View className="flex-row items-center justify-between mb-4">
              <Text
                className="text-sm font-semibold"
                style={{ color: isDark ? COLORS.white : COLORS.black }}
              >
                Location Coordinates
              </Text>
              <TouchableOpacity
                className="flex-row items-center px-3 py-2 rounded-lg"
                style={{ backgroundColor: isDark ? COLORS.primaryDark : COLORS.primary }}
                onPress={getCurrentLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator size="small" color={COLORS.white} />
                ) : (
                  <>
                    <MaterialCommunityIcons name="crosshairs-gps" size={16} color={COLORS.white} />
                    <Text className="text-white text-xs font-semibold ml-1.5">Get Current Location</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
            {formData.address.location.latitude != null && formData.address.location.longitude != null ? (
              <Text style={{ color: isDark ? COLORS.white : COLORS.black }}>
                {`Current: ${formData.address.location.latitude.toFixed(6)}, ${formData.address.location.longitude.toFixed(6)}`}
              </Text>
            ) : (
              <Text style={{ color: isDark ? COLORS.gray : COLORS.gray }}>
                Location not set yet.
              </Text>
            )}
          </View>
        </View>

        { }
        <TouchableOpacity
          className="m-4 rounded-2xl overflow-hidden"
          style={[
            styles.submitButton,
            { opacity: loading ? 0.6 : 1 }
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <LinearGradient
            colors={[isDark ? COLORS.primaryDark : COLORS.primary, isDark ? COLORS.primary : COLORS.primaryDark]}
            style={styles.submitButtonGradient}
          >
            {loading ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save" size={getResponsiveSize(20)} color={COLORS.white} />
                <Text className="text-white text-lg font-bold ml-2.5">Update Profile</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      { }
      <Modal
        visible={showCameraPreview}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowCameraPreview(false)}
      >
        <View
          className="flex-1"
          style={{ backgroundColor: isDark ? COLORS.black : COLORS.white }}
        >
          <StatusBar
            backgroundColor={isDark ? COLORS.black : COLORS.white}
            barStyle={isDark ? 'light-content' : 'dark-content'}
          />

          { }
          <View
            className="px-4 py-4 border-b"
            style={[
              styles.modalHeader,
              { borderBottomColor: isDark ? COLORS.darkBgLight : '#E5E7EB' }
            ]}
          >
            <Text
              className="text-xl font-bold text-center"
              style={{ color: isDark ? COLORS.white : COLORS.black }}
            >
              Preview Photo
            </Text>
          </View>

          { }
          <View className="flex-1 items-center justify-center p-4">
            {cameraPreviewUri ? (
              <Image
                source={{ uri: cameraPreviewUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            ) : (
              <View className="items-center justify-center">
                <MaterialCommunityIcons
                  name="image-off"
                  size={getResponsiveSize(80)}
                  color={isDark ? COLORS.gray : COLORS.gray}
                />
                <Text
                  className="text-base mt-4"
                  style={{ color: isDark ? COLORS.gray : COLORS.gray }}
                >
                  No preview available
                </Text>
              </View>
            )}
          </View>

          { }
          <View
            className="px-4 py-6 border-t"
            style={[
              styles.modalFooter,
              { borderTopColor: isDark ? COLORS.darkBgLight : '#E5E7EB' }
            ]}
          >
            <View className="flex-row gap-4">
              { }
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center py-4 rounded-2xl"
                style={{ backgroundColor: isDark ? COLORS.darkBgLight : COLORS.lightGray }}
                onPress={handleRetakePhoto}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={getResponsiveSize(24)}
                  color={isDark ? COLORS.white : COLORS.black}
                />
                <Text
                  className="text-lg font-bold ml-2"
                  style={{ color: isDark ? COLORS.white : COLORS.black }}
                >
                  Retake
                </Text>
              </TouchableOpacity>

              { }
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center py-4 rounded-2xl overflow-hidden"
                onPress={handleAcceptPhoto}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[COLORS.success, '#059669']}
                  style={styles.usePhotoGradient}
                >
                  <MaterialCommunityIcons
                    name="check"
                    size={getResponsiveSize(24)}
                    color={COLORS.white}
                  />
                  <Text className="text-white text-lg font-bold ml-2">
                    Use Photo
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>

            { }
            <Text
              className="text-xs text-center mt-4"
              style={{ color: isDark ? COLORS.gray : COLORS.gray }}
            >
              Retake to capture again or use this photo
            </Text>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + (-25) : 40,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },

  section: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

  profileImage: {
    width: getResponsiveSize(130),
    height: getResponsiveSize(130),
    borderRadius: getResponsiveSize(65),
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  placeholderImage: {
    width: getResponsiveSize(130),
    height: getResponsiveSize(130),
    borderRadius: getResponsiveSize(65),
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  cameraBadge: {
    width: getResponsiveSize(40),
    height: getResponsiveSize(40),
    borderRadius: getResponsiveSize(20),
    bottom: 0,
    right: 0,
    borderWidth: 3,
    borderColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },

  textInputMultiline: {
    minHeight: getResponsiveSize(80),
    textAlignVertical: 'top',
  },

  submitButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsiveSize(16),
    paddingHorizontal: getResponsiveSize(32),
  },

  modalHeader: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
    borderBottomWidth: 1,
  },
  modalFooter: {
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  usePhotoGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '100%',
  },
});

export default EditProfileScreen;
