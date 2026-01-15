import { useState, useCallback, useEffect } from 'react';
import { Platform, Linking, PermissionsAndroid, ToastAndroid } from 'react-native';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { launchImageLibrary, launchCamera, Asset } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import LocationService from '../services/LocationService';
import { updateUserProfile } from '../api/authApi';
import PermissionService from '../services/PermissionService';
import type { RootStackParamList } from '../../AppNavigator';

export interface EditProfileFormData {
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

export interface UserData {
    name: string;
    email: string;
    phone: string;
    age: number | null;
    dob: string | null;
    role: string;
    address: {
        street?: string;
        city?: string;
        state?: string;
        zip?: string;
        country?: string;
        location?: {
            latitude: number | null;
            longitude: number | null;
        };
    };
    profileImage: string[];
}

interface RouteParams {
    userData?: UserData;
    refreshProfile?: () => void;
}

export const useEditProfile = () => {
    const navigation = useNavigation<NavigationProp<RootStackParamList>>();
    const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
    const { userData: initialUserData, refreshProfile } = route.params || {};

    const [loading, setLoading] = useState<boolean>(false);
    const [locationLoading, setLocationLoading] = useState<boolean>(false);
    const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
    const [isPicking, setIsPicking] = useState<boolean>(false);
    const [showCameraPreview, setShowCameraPreview] = useState<boolean>(false);
    const [cameraPreviewUri, setCameraPreviewUri] = useState<string | null>(null);
    const [tempCameraAsset, setTempCameraAsset] = useState<Asset | null>(null);

    const [formData, setFormData] = useState<EditProfileFormData>({
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

    const showToast = (message: string) => {
        ToastAndroid.show(message, ToastAndroid.SHORT);
    };

    const openGallery = useCallback(async (): Promise<void> => {
        if (isPicking) return;
        try {
            setIsPicking(true);
            const result = await launchImageLibrary({
                mediaType: 'photo',
                quality: 0.8,
                maxWidth: 1024,
                maxHeight: 1024,
                selectionLimit: 1,
                includeBase64: false,
                presentationStyle: 'fullScreen',
            });

            if (result.didCancel) return;
            if (result.errorCode) {
                showToast(result.errorMessage || 'Failed to select image.');
                return;
            }

            if (result.assets && result.assets[0]?.uri) {
                const asset = result.assets[0];
                setProfileImageUri(asset.uri!);
                setFormData(prev => ({
                    ...prev,
                    profileImage: {
                        uri: asset.uri!,
                        type: asset.type || 'image/jpeg',
                        name: asset.fileName || `profile_${Date.now()}.jpg`,
                    }
                }));
            }
        } catch (error) {
            showToast('An unexpected error occurred.');
        } finally {
            setIsPicking(false);
        }
    }, [isPicking]);



    const openCamera = useCallback(async (): Promise<void> => {
        if (isPicking) return;
        try {
            setIsPicking(true);

            // Use global service for permission
            const hasPermission = await PermissionService.requestCameraPermission();
            if (!hasPermission) {
                setIsPicking(false);
                showToast('Camera permission denied');
                return;
            }

            const result = await launchCamera({
                mediaType: 'photo',
                quality: 0.8,
                maxWidth: 1024,
                maxHeight: 1024,
                saveToPhotos: true,
                includeBase64: false,
            });

            if (result.didCancel) return;
            if (result.errorCode) {
                showToast(result.errorMessage || 'Failed to capture photo.');
                return;
            }

            if (result.assets && result.assets[0]?.uri) {
                const asset = result.assets[0];
                setCameraPreviewUri(asset.uri!);
                setTempCameraAsset(asset);
                setShowCameraPreview(true);
            }
        } catch (error) {
            showToast('An unexpected error occurred.');
        } finally {
            setIsPicking(false);
        }
    }, [isPicking]);

    const handleRetakePhoto = useCallback((): void => {
        setShowCameraPreview(false);
        setCameraPreviewUri(null);
        setTempCameraAsset(null);
        setTimeout(() => openCamera(), 300);
    }, [openCamera]);

    const handleAcceptPhoto = useCallback((): void => {
        if (!tempCameraAsset || !cameraPreviewUri) return;

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
    }, [tempCameraAsset, cameraPreviewUri]);

    const handleDateChange = useCallback((event: DateTimePickerEvent, selectedDate?: Date): void => {
        setShowDatePicker(false);
        if (selectedDate) setFormData(prev => ({ ...prev, dob: selectedDate }));
    }, []);

    const getCurrentLocation = useCallback(async (): Promise<void> => {
        try {
            setLocationLoading(true);
            const locationData = await LocationService.getCurrentLocation();

            // Get detailed address parsing
            const addressDetails = await LocationService.getAddressDetails(
                locationData.latitude,
                locationData.longitude
            );

            setFormData(prev => ({
                ...prev,
                address: {
                    ...prev.address,
                    street: addressDetails.formattedAddress || addressDetails.street, // Use Full String as requested
                    city: addressDetails.city,
                    state: addressDetails.state,
                    zip: addressDetails.zip,
                    country: addressDetails.country, // Should now be correctly "India" etc, not in State field
                    location: {
                        latitude: locationData.latitude,
                        longitude: locationData.longitude,
                    },
                },
            }));
            setLocationLoading(false);
            showToast('Location updated successfully');
        } catch (error: any) {
            setLocationLoading(false);
            showToast(error.message || 'Failed to get location');
            // Keeping Settings link via toast is harder, just showing error toast for now as requested
        }
    }, []);

    const handleSubmit = useCallback(async (): Promise<void> => {
        try {
            setLoading(true);
            if (!formData.name.trim() || !formData.email.trim()) {
                showToast('Name and Email are required');
                setLoading(false);
                return;
            }

            let submitData: any;
            const hasFile = !!formData.profileImage;

            if (hasFile) {
                // Use FormData for image upload
                submitData = new FormData();
                submitData.append('name', formData.name.trim());
                submitData.append('email', formData.email.trim());
                if (formData.phone) submitData.append('phone', formData.phone.trim());
                if (formData.age) submitData.append('age', formData.age);
                if (formData.dob) submitData.append('dob', formData.dob.toISOString());

                // For FormData, address is often sent as a stringified JSON
                if (formData.address) {
                    submitData.append('address', JSON.stringify(formData.address));
                }

                if (formData.profileImage) {
                    submitData.append('profileImage', {
                        uri: formData.profileImage.uri,
                        type: formData.profileImage.type,
                        name: formData.profileImage.name,
                    } as any);
                }
            } else {
                // Use JSON for text-only updates (More reliable if no file)
                submitData = {
                    name: formData.name.trim(),
                    email: formData.email.trim(),
                    phone: formData.phone ? formData.phone.trim() : '',
                    age: formData.age || null,
                    dob: formData.dob ? formData.dob.toISOString() : null,
                    address: formData.address || {},
                };
            }

            const response = await updateUserProfile(submitData, hasFile);

            if (response.success) {
                showToast('Profile updated successfully!');
                if (refreshProfile) refreshProfile();
                navigation.goBack();
            } else {
                showToast(response.message || 'Update failed');
            }
        } catch (error: any) {
            showToast(error.message || 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    }, [formData, navigation, refreshProfile]);

    return {
        formData,
        setFormData,
        loading,
        locationLoading,
        showDatePicker,
        setShowDatePicker,
        isPicking,
        showCameraPreview,
        cameraPreviewUri,
        profileImageUri,
        openGallery,
        openCamera,
        handleRetakePhoto,
        handleAcceptPhoto,
        handleDateChange,
        getCurrentLocation,
        handleSubmit,
        navigation, // Exposed for header back button
        initialUserData
    };
};
