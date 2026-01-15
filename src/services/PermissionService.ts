import { Platform, PermissionsAndroid, ToastAndroid } from 'react-native';

class PermissionService {
    /**
     * Request Camera Permission
     * Returns true if granted, false otherwise.
     * Handles Android specific requests.
     */
    async requestCameraPermission(): Promise<boolean> {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.CAMERA,
                    {
                        title: 'Camera Permission',
                        message: 'App needs access to your camera to take profile photos.',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    }
                );

                // Return true if granted, false otherwise
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
      
        return true;
    }

    /**
     * Request Gallery/Storage Permission
     * Adaptable for different Android versions (Validation logic)
     */
    async requestGalleryPermission(): Promise<boolean> {
        if (Platform.OS === 'android') {
            try {
                // For Android 13+ (SDK 33+)
                if (Platform.Version >= 33) {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
                    );
                    return granted === PermissionsAndroid.RESULTS.GRANTED;
                }

                // For Older Android Versions
                const granted = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
                );
                return granted === PermissionsAndroid.RESULTS.GRANTED;
            } catch (err) {
                console.warn(err);
                return false;
            }
        }
        return true;
    }
}

export default new PermissionService();
