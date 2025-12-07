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
import Geolocation from '@react-native-community/geolocation';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { launchImageLibrary, launchCamera, ImageLibraryOptions, CameraOptions, Asset } from 'react-native-image-picker';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { RootStackParamList } from '../../../AppNavigator';
import { updateUserProfile } from '../../api/authApi';

/**
 * ==================== PROFILE IMAGE SETUP (CAMERA + GALLERY) ====================
 * 
 * FEATURES:
 * - Gallery selection with single image limit (prevents multi-selection bug)
 * - Camera capture with preview modal (retake/accept flow)
 * - Lifetime "ask-only-once" permission behavior (persisted in AsyncStorage)
 * - Settings redirect for permanently denied permissions
 * - Robust error handling and loading states
 * 
 * LIFETIME BEHAVIOR:
 * Once permission is requested via OS dialog, the app NEVER asks again until user
 * manually changes permission in system Settings. This prevents permission spam.
 * The "asked" flag is persisted in AsyncStorage and survives app restarts.
 * 
 * REQUIRED CONSOLE LOGS (exact format):
 * - [Gallery] Checking permission...
 * - [Gallery] Android permission status: denied (or granted/blocked)
 * - [Camera] Checking permission...
 * - [Camera] Permission status: denied (or granted/blocked)
 * 
 * PERMISSIONS TO ADD:
 * 
 * ANDROID (android/app/src/main/AndroidManifest.xml):
 * <uses-permission android:name="android.permission.READ_MEDIA_IMAGES"/> <!-- API 33+ -->
 * <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/> <!-- API 32- -->
 * <uses-permission android:name="android.permission.CAMERA"/>
 * 
 * IOS (ios/YourApp/Info.plist):
 * <key>NSPhotoLibraryUsageDescription</key>
 * <string>We need access to your photos to let you select a profile picture.</string>
 * <key>NSCameraUsageDescription</key>
 * <string>We need access to your camera to let you take a profile photo.</string>
 * 
 * ASYNC STORAGE KEYS:
 * - @app/galleryPermissionAsked: boolean (true if OS prompt shown once)
 * - @app/cameraPermissionAsked: boolean (true if OS prompt shown once)
 * 
 * PACKAGES USED:
 * - react-native-image-picker (gallery & camera)
 * - react-native-permissions (permission management)
 * - @react-native-async-storage/async-storage (persist permission flags)
 * 
 * GRANT BEHAVIOR:
 * - If user grants permission (GRANTED / LIMITED / Allow access to all / Allow once),
 *   the app proceeds IMMEDIATELY to gallery/camera without showing "Permission needed" alert.
 * - Only shows Settings modal when permission is DENIED or BLOCKED.
 * 
 * =================================================================================
 */

// Types
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

// Constants
const { width: screenWidth } = Dimensions.get('window');
const getResponsiveSize = (size: number): number => (screenWidth / 375) * size;

// AsyncStorage keys for permission tracking
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
  
  // Camera preview modal state
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

  /**
   * ==================== HELPER FUNCTIONS ====================
   */

  /**
   * Shows a modal prompting user to open Settings when permission is blocked
   * @param permissionType - Type of permission ('Gallery' or 'Camera')
   */
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

  /**
   * Checks if permission has been asked before using AsyncStorage
   * @param storageKey - AsyncStorage key to check
   * @returns true if asked before, false otherwise
   */
  const hasPermissionBeenAsked = async (storageKey: string): Promise<boolean> => {
    try {
      const value = await AsyncStorage.getItem(storageKey);
      return value === 'true';
    } catch (error) {
      console.error(`[Permission] Error reading ${storageKey}:`, error);
      return false;
    }
  };

  /**
   * Marks permission as asked in AsyncStorage
   * @param storageKey - AsyncStorage key to set
   */
  const markPermissionAsAsked = async (storageKey: string): Promise<void> => {
    try {
      await AsyncStorage.setItem(storageKey, 'true');
    } catch (error) {
      console.error(`[Permission] Error writing ${storageKey}:`, error);
    }
  };

  /**
   * Checks and handles gallery permission with lifetime "ask-only-once" behavior
   * 
   * LIFETIME BEHAVIOR: Once permission is requested via OS dialog, the app never asks again
   * until user manually changes permission in system Settings. This prevents permission spam.
   * 
   * ANDROID MANIFEST PERMISSIONS (add to android/app/src/main/AndroidManifest.xml):
   * <uses-permission android:name="android.permission.READ_MEDIA_IMAGES"/> <!-- API 33+ -->
   * <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"/> <!-- API 32- -->
   * 
   * IOS INFO.PLIST PERMISSIONS (add to ios/YourApp/Info.plist):
   * <key>NSPhotoLibraryUsageDescription</key>
   * <string>We need access to your photos to let you select a profile picture.</string>
   * 
   * @returns true if permission granted (GRANTED or LIMITED), false otherwise
   */
  const checkAndHandleGalleryPermission = async (): Promise<boolean> => {
    try {
      // REQUIRED LOG: Must appear exactly as shown
      console.log('[Gallery] Checking permission...');
      
      const alreadyAsked = await hasPermissionBeenAsked(STORAGE_KEYS.GALLERY_PERMISSION_ASKED);
      
      if (Platform.OS === 'ios') {
        const permission = PERMISSIONS.IOS.PHOTO_LIBRARY;
        const result = await check(permission);
        
        // REQUIRED LOG: Must show exact status
        console.log('[Gallery] iOS permission status:', result);
        
        // GRANTED or LIMITED = proceed immediately (do NOT show "permission needed" alert)
        if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) {
          return true;
        }
        
        // BLOCKED = show Settings redirect (user previously denied permanently)
        if (result === RESULTS.BLOCKED) {
          showSettingsPromptIfBlocked('Gallery');
          return false;
        }
        
        // DENIED + first time = request permission
        if (result === RESULTS.DENIED && !alreadyAsked) {
          // Mark as asked BEFORE requesting to ensure lifetime behavior
          await markPermissionAsAsked(STORAGE_KEYS.GALLERY_PERMISSION_ASKED);
          
          // Request permission from OS
          const requestResult = await request(permission);
          console.log('[Gallery] iOS permission request result:', requestResult);
          
          // If user granted (GRANTED or LIMITED), return true to proceed
          if (requestResult === RESULTS.GRANTED || requestResult === RESULTS.LIMITED) {
            return true;
          }
          
          // If user denied, show Settings modal (not "Permission needed" alert)
          if (requestResult === RESULTS.DENIED || requestResult === RESULTS.BLOCKED) {
            showSettingsPromptIfBlocked('Gallery');
            return false;
          }
          
          return false;
        }
        
        // DENIED + already asked = show Settings modal (don't ask again)
        if (result === RESULTS.DENIED && alreadyAsked) {
          showSettingsPromptIfBlocked('Gallery');
          return false;
        }
        
        return false;
      } else {
        // Android
        const androidVersion = Platform.Version as number;
        
        // Choose permission based on Android version
        let permission;
        if (androidVersion >= 33) {
          // Android 13+ (API 33+): Use READ_MEDIA_IMAGES
          permission = PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
        } else {
          // Android 12- (API 32-): Use READ_EXTERNAL_STORAGE
          permission = PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;
        }
        
        const result = await check(permission);
        
        // REQUIRED LOG: Must match exact format (line 307 in original)
        console.log('[Gallery] Android permission status:', result);
        
        // GRANTED = proceed immediately
        if (result === RESULTS.GRANTED) {
          return true;
        }
        
        // BLOCKED / NEVER_ASK_AGAIN = show Settings redirect
        if (result === RESULTS.BLOCKED) {
          showSettingsPromptIfBlocked('Gallery');
          return false;
        }
        
        // DENIED + first time = request permission
        if (result === RESULTS.DENIED && !alreadyAsked) {
          // Mark as asked BEFORE requesting to ensure lifetime behavior
          await markPermissionAsAsked(STORAGE_KEYS.GALLERY_PERMISSION_ASKED);
          
          // Request permission from OS
          const requestResult = await request(permission);
          console.log('[Gallery] Android permission request result:', requestResult);
          
          // If user granted, return true to proceed (do NOT show alert)
          if (requestResult === RESULTS.GRANTED) {
            return true;
          }
          
          // If user denied or blocked, show Settings modal
          if (requestResult === RESULTS.DENIED || requestResult === RESULTS.BLOCKED) {
            showSettingsPromptIfBlocked('Gallery');
            return false;
          }
          
          return false;
        }
        
        // DENIED + already asked = show Settings modal (don't ask again)
        if (result === RESULTS.DENIED && alreadyAsked) {
          showSettingsPromptIfBlocked('Gallery');
          return false;
        }
        
        return false;
      }
    } catch (error) {
      console.error('[Gallery] Error checking permission:', error);
      return false;
    }
  };

  /**
   * Checks and handles camera permission with lifetime "ask-only-once" behavior
   * 
   * LIFETIME BEHAVIOR: Once permission is requested via OS dialog, the app never asks again
   * until user manually changes permission in system Settings. This prevents permission spam.
   * 
   * ANDROID MANIFEST PERMISSIONS (add to android/app/src/main/AndroidManifest.xml):
   * <uses-permission android:name="android.permission.CAMERA"/>
   * 
   * IOS INFO.PLIST PERMISSIONS (add to ios/YourApp/Info.plist):
   * <key>NSCameraUsageDescription</key>
   * <string>We need access to your camera to let you take a profile photo.</string>
   * 
   * @returns true if permission granted, false otherwise
   */
  const checkAndHandleCameraPermission = async (): Promise<boolean> => {
    try {
      // REQUIRED LOG: Must appear exactly as shown (line 373 in original)
      console.log('[Camera] Checking permission...');
      
      const alreadyAsked = await hasPermissionBeenAsked(STORAGE_KEYS.CAMERA_PERMISSION_ASKED);
      
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CAMERA 
        : PERMISSIONS.ANDROID.CAMERA;
      
      const result = await check(permission);
      
      // REQUIRED LOG: Must match exact format (line 382 in original)
      console.log('[Camera] Permission status:', result);
      
      // GRANTED = proceed immediately
      if (result === RESULTS.GRANTED) {
        return true;
      }
      
      // BLOCKED / NEVER_ASK_AGAIN = show Settings redirect
      if (result === RESULTS.BLOCKED) {
        showSettingsPromptIfBlocked('Camera');
        return false;
      }
      
      // DENIED + first time = request permission
      if (result === RESULTS.DENIED && !alreadyAsked) {
        // Mark as asked BEFORE requesting to ensure lifetime behavior
        await markPermissionAsAsked(STORAGE_KEYS.CAMERA_PERMISSION_ASKED);
        
        // Request permission from OS
        const requestResult = await request(permission);
        console.log('[Camera] Permission request result:', requestResult);
        
        // If user granted, return true to proceed (do NOT show alert)
        if (requestResult === RESULTS.GRANTED) {
          return true;
        }
        
        // If user denied or blocked, show Settings modal
        if (requestResult === RESULTS.DENIED || requestResult === RESULTS.BLOCKED) {
          showSettingsPromptIfBlocked('Camera');
          return false;
        }
        
        return false;
      }
      
      // DENIED + already asked = show Settings modal (don't ask again)
      if (result === RESULTS.DENIED && alreadyAsked) {
        showSettingsPromptIfBlocked('Camera');
        return false;
      }
      
      return false;
    } catch (error) {
      console.error('[Camera] Error checking permission:', error);
      return false;
    }
  };

  /**
   * Opens the gallery to select a single image
   * 
   * BEHAVIOR:
   * - Enforces single-selection (selectionLimit: 1)
   * - If permission is GRANTED or LIMITED, proceeds immediately to gallery
   * - Does NOT show "Permission needed" alert after user grants permission
   * - Sets image immediately after selection (no second step)
   * - Handles first asset only if multiple returned (unexpected)
   */
  const openGallery = async (): Promise<void> => {
    // Prevent duplicate picks
    if (isPicking) {
      console.log('[Gallery] Already picking, ignoring duplicate tap');
      return;
    }

    try {
      setIsPicking(true);

      // Check permission with lifetime behavior (will show Settings modal if needed)
      const hasPermission = await checkAndHandleGalleryPermission();
      
      if (!hasPermission) {
        // Permission not granted - checkAndHandleGalleryPermission already showed modal if needed
        setIsPicking(false);
        return;
      }

      // Permission granted - proceed to gallery immediately
      const options: ImageLibraryOptions = {
        mediaType: 'photo',
        quality: 0.5, // Reduced quality for better compression and faster upload
        maxWidth: 1024, // Limit width to reduce file size
        maxHeight: 1024, // Limit height to reduce file size
        selectionLimit: 1, // CRITICAL: Force single selection
        includeBase64: false,
      };

      console.log('[Gallery] Launching image picker...');
      const result = await launchImageLibrary(options);
      
      // Handle cancellation silently
      if (result.didCancel) {
        console.log('[Gallery] User cancelled');
        setIsPicking(false);
        return;
      }
      
      // Handle errors
      if (result.errorCode) {
        console.error('[Gallery] Picker error:', result.errorMessage);
        Alert.alert(
          'Error',
          result.errorMessage || 'Failed to select image. Please try again.',
          [{ text: 'OK' }]
        );
        setIsPicking(false);
        return;
      }
      
      // Handle successful selection - ALWAYS take first asset only
      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0]; // Force single asset (handle unexpected multiple)
        
        // Validate URI
        if (!asset.uri) {
          console.error('[Gallery] Invalid asset URI');
          Alert.alert('Error', 'Invalid image selected. Please try again.');
          setIsPicking(false);
          return;
        }
        
        // IMMEDIATE SET - no second selection step, no confirmation needed
        console.log('[Gallery] Setting image immediately:', asset.uri);
        setProfileImageUri(asset.uri);
        setFormData(prev => ({
          ...prev,
          profileImage: {
            uri: asset.uri || '',
            type: asset.type || 'image/jpeg',
            name: asset.fileName || `profile_${Date.now()}.jpg`,
          }
        }));
        
        console.log('[Gallery] Image set successfully');
      } else {
        console.warn('[Gallery] No assets returned');
      }
      
      setIsPicking(false);
    } catch (error) {
      console.error('[Gallery] Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      setIsPicking(false);
    }
  };

  /**
   * Opens the camera to take a photo
   * 
   * BEHAVIOR:
   * - Shows preview modal with retake/accept options after capture
   * - Does NOT immediately set image (user must tap "Use Photo" button)
   * - Retake button re-launches camera for another attempt
   * - Accept button sets the image and closes modal
   */
  const openCamera = async (): Promise<void> => {
    // Prevent duplicate launches
    if (isPicking) {
      console.log('[Camera] Already picking, ignoring duplicate tap');
      return;
    }

    try {
      setIsPicking(true);

      // Check permission with lifetime behavior (will show Settings modal if needed)
      const hasPermission = await checkAndHandleCameraPermission();
      
      if (!hasPermission) {
        // Permission not granted - checkAndHandleCameraPermission already showed modal if needed
        setIsPicking(false);
        return;
      }

      // Permission granted - proceed to camera immediately
      const options: CameraOptions = {
        mediaType: 'photo',
        quality: 0.5, // Reduced quality for better compression and faster upload
        maxWidth: 1024, // Limit width to reduce file size
        maxHeight: 1024, // Limit height to reduce file size
        saveToPhotos: false, // Don't save to gallery automatically
        includeBase64: false,
      };

      console.log('[Camera] Launching camera...');
      const result = await launchCamera(options);
      
      // Handle cancellation silently
      if (result.didCancel) {
        console.log('[Camera] User cancelled');
        setIsPicking(false);
        return;
      }
      
      // Handle errors
      if (result.errorCode) {
        console.error('[Camera] Camera error:', result.errorMessage);
        Alert.alert(
          'Error',
          result.errorMessage || 'Failed to capture photo. Please try again.',
          [{ text: 'OK' }]
        );
        setIsPicking(false);
        return;
      }
      
      // Handle successful capture - show preview modal (NOT immediate set)
      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        
        // Validate URI
        if (!asset.uri) {
          console.error('[Camera] Invalid asset URI');
          Alert.alert('Error', 'Invalid photo captured. Please try again.');
          setIsPicking(false);
          return;
        }
        
        // Show preview modal for user to retake or accept
        console.log('[Camera] Showing preview modal:', asset.uri);
        setCameraPreviewUri(asset.uri);
        setTempCameraAsset(asset);
        setShowCameraPreview(true);
      }
      
      setIsPicking(false);
    } catch (error) {
      console.error('[Camera] Unexpected error:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
      setIsPicking(false);
    }
  };

  /**
   * Handles retake action from camera preview modal
   * Re-launches camera for another attempt
   */
  const handleRetakePhoto = (): void => {
    console.log('[Camera] Retaking photo...');
    setShowCameraPreview(false);
    setCameraPreviewUri(null);
    setTempCameraAsset(null);
    
    // Re-launch camera after modal closes
    setTimeout(() => {
      openCamera();
    }, 300);
  };

  /**
   * Handles accept action from camera preview modal
   * Sets the captured image as profile picture
   */
  const handleAcceptPhoto = (): void => {
    if (!tempCameraAsset || !cameraPreviewUri) {
      console.error('[Camera] No asset to accept');
      return;
    }
    
    console.log('[Camera] Accepting photo:', cameraPreviewUri);
    
    // Set the image
    setProfileImageUri(cameraPreviewUri);
    setFormData(prev => ({
      ...prev,
      profileImage: {
        uri: cameraPreviewUri,
        type: tempCameraAsset.type || 'image/jpeg',
        name: tempCameraAsset.fileName || `profile_camera_${Date.now()}.jpg`,
      }
    }));
    
    // Close modal
    setShowCameraPreview(false);
    setCameraPreviewUri(null);
    setTempCameraAsset(null);
    
    console.log('[Camera] Photo accepted and set');
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

  /**
   * Requests location permission using react-native-permissions
   * More stable than using PermissionsAndroid or promptForEnableLocationIfNeeded
   * @returns true if permission granted, false otherwise
   */
  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      console.log('[Location] Starting permission request...');
      console.log('[Location] Platform:', Platform.OS);
      
      if (Platform.OS === 'ios') {
        const permission = PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
        console.log('[Location] Requesting iOS permission:', permission);
        
        const result = await check(permission);
        console.log('[Location] iOS permission check result:', result);
        
        if (result === RESULTS.GRANTED) {
          console.log('[Location] iOS permission already granted');
          return true;
        }
        
        if (result === RESULTS.DENIED) {
          const requestResult = await request(permission);
          console.log('[Location] iOS permission request result:', requestResult);
          return requestResult === RESULTS.GRANTED;
        }
        
        if (result === RESULTS.BLOCKED) {
          console.warn('[Location] iOS permission blocked');
          Alert.alert(
            'Permission Required',
            'Location permission is blocked. Please enable it in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          return false;
        }
        
        return false;
      } else {
        // Android
        const permission = PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
        console.log('[Location] Requesting Android permission:', permission);
        
        const result = await check(permission);
        console.log('[Location] Android permission check result:', result);
        
        if (result === RESULTS.GRANTED) {
          console.log('[Location] Android permission already granted');
          return true;
        }
        
        if (result === RESULTS.DENIED) {
          console.log('[Location] Permission denied, requesting...');
          const requestResult = await request(permission);
          console.log('[Location] Android permission request result:', requestResult);
          
          if (requestResult === RESULTS.GRANTED) {
            console.log('[Location] Permission granted after request');
            return true;
          } else {
            console.warn('[Location] Permission denied after request');
            Alert.alert(
              'Permission Denied',
              'Location permission is required to get your current location.',
              [{ text: 'OK' }]
            );
            return false;
          }
        }
        
        if (result === RESULTS.BLOCKED) {
          console.warn('[Location] Android permission blocked');
          Alert.alert(
            'Permission Required',
            'Location permission is blocked. Please enable it in Settings.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
          return false;
        }
        
        console.warn('[Location] Unexpected permission result:', result);
        return false;
      }
    } catch (error) {
      console.error('[Location] Error requesting permission:', error);
      Alert.alert(
        'Permission Error',
        `Failed to request location permission: ${error}`,
        [{ text: 'OK' }]
      );
      return false;
    }
  };

  /**
   * Gets the current GPS location using @react-native-community/geolocation
   * More stable than react-native-geolocation-service
   */
  const getCurrentLocation = async (): Promise<void> => {
    console.log('[Location] getCurrentLocation called');
    
    try {
      setLocationLoading(true);
      console.log('[Location] Checking permission...');

      // Step 1: Request permission
      const hasPermission = await requestLocationPermission();
      console.log('[Location] Permission result:', hasPermission);
      
      if (!hasPermission) {
        console.warn('[Location] Permission not granted');
        setLocationLoading(false);
        Alert.alert(
          'Permission Required',
          'Location permission is required to get your current location.',
          [{ text: 'OK' }]
        );
        return;
      }

      console.log('[Location] Getting current position...');
      
      // Step 2: Get current position using community geolocation
      Geolocation.getCurrentPosition(
        (position) => {
          console.log('[Location] Success! Position:', position);
          const { latitude, longitude } = position.coords;

          setFormData(prev => ({
            ...prev,
            address: {
              ...prev.address,
              location: {
                latitude,
                longitude,
              },
            },
          }));

          setLocationLoading(false);
          
          Alert.alert(
            'Success',
            `Location obtained successfully!\nLat: ${latitude.toFixed(6)}\nLon: ${longitude.toFixed(6)}`
          );
        },
        (error) => {
          console.error('[Location] Error:', error);
          setLocationLoading(false);

          let message = 'Failed to get current location.';
          let suggestion = '';
          
          switch (error.code) {
            case 1:
              message = 'Location permission was denied.';
              suggestion = 'Please grant location permission in Settings.';
              break;
            case 2:
              message = 'Location information is unavailable.';
              suggestion = 'Please ensure GPS/Location services are turned on.';
              break;
            case 3:
              message = 'Location request timed out.';
              suggestion = 'Please try again or check your GPS signal.';
              break;
            case 5:
              message = 'Location services are disabled.';
              suggestion = 'Please enable location services in Settings.';
              break;
            default:
              message = `Location error (code ${error.code})`;
              suggestion = error.message || 'Please try again.';
          }

          Alert.alert(
            'Location Error',
            `${message}\n\n${suggestion}`,
            [
              { text: 'Cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
            ]
          );
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    } catch (error) {
      console.error('[Location] Unexpected error:', error);
      setLocationLoading(false);
      Alert.alert(
        'Error',
        `An unexpected error occurred: ${error}`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleSubmit = async (): Promise<void> => {
    // Declare hasImage at the top so it's accessible in catch block
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
        // Use FormData for image upload
        const submitFormData = new FormData();
        
        // Add basic fields
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

        // Add address as JSON string
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

        // Add profile image file
        const imageFile: any = {
          uri: formData.profileImage.uri,
          type: formData.profileImage.type || 'image/jpeg',
          name: formData.profileImage.name || `profile_${Date.now()}.jpg`,
        };
        
        console.log('[Upload] Preparing image for upload:', {
          uri: imageFile.uri,
          type: imageFile.type,
          name: imageFile.name,
        });
        
        submitFormData.append('profileImage', imageFile);
        
        console.log('[Upload] Starting profile update with image...');
        response = await updateUserProfile(submitFormData, true);
        console.log('[Upload] Profile update successful');
      } else {
        // Use JSON for no image upload
        const jsonData: any = {
          name: formData.name.trim(),
          email: formData.email.trim(),
        };

        if (formData.phone.trim()) jsonData.phone = formData.phone.trim();
        if (formData.age) jsonData.age = parseInt(formData.age, 10);
        if (formData.dob) jsonData.dob = formData.dob.toISOString();

        // Add address object
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
      console.error('Error updating profile:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        code: error.code,
      });
      
      // Check error type
      const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
      const isNetworkError = error.message === 'Network Error' || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK';
      const isTimeoutError = error.code === 'ECONNABORTED' || errorMessage.toLowerCase().includes('timeout');
      const isImageUploadError = errorMessage.toLowerCase().includes('upload preset') || 
                                  errorMessage.toLowerCase().includes('cloudinary');
      
      // Handle network errors specifically
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
                  
                  // Retry without image
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
                  console.error('Retry without image failed:', retryError);
                  Alert.alert('Update Failed', 'Could not update profile. Please check your connection and try again.');
                } finally {
                  setLoading(false);
                }
              },
            },
          ]
        );
      } else if (isImageUploadError && hasImage) {
        // Handle Cloudinary-specific errors
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
                  
                  // Retry without image
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
                  console.error('Retry without image failed:', retryError);
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
      
      {/* Header */}
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
        {/* Profile Image Section */}
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
          
          {/* Circular Avatar */}
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
              
              {/* Camera Badge */}
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
          
          {/* Action Buttons Row */}
          <View className="flex-row gap-3 w-full">
            {/* Choose Photo Button */}
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
            
            {/* Take Photo Button */}
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
          
          {/* Helper Text */}
          <Text 
            className="text-xs text-center mt-3"
            style={{ color: isDark ? COLORS.gray : COLORS.gray }}
          >
            Choose from gallery or take a new photo
          </Text>
        </View>

        {/* Basic Information */}
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

          {/* Date of Birth */}
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

        {/* Address Information */}
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

          {/* Location Section */}
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

        {/* Submit Button */}
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

      {/* Camera Preview Modal */}
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
          
          {/* Header */}
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
          
          {/* Image Preview */}
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
          
          {/* Action Buttons */}
          <View 
            className="px-4 py-6 border-t"
            style={[
              styles.modalFooter,
              { borderTopColor: isDark ? COLORS.darkBgLight : '#E5E7EB' }
            ]}
          >
            <View className="flex-row gap-4">
              {/* Retake Button */}
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
              
              {/* Use Photo Button */}
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
            
            {/* Helper Text */}
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

  // Camera Preview Modal Styles
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
