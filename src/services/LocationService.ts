import { Platform, PermissionsAndroid, ToastAndroid, Alert, Linking } from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import { promptForEnableLocationIfNeeded } from 'react-native-android-location-enabler';

export interface LocationData {
  latitude: number;
  longitude: number;
}

class LocationService {
  /**
   * Request location permission (Android)
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'ios') {
      const auth = await Geolocation.requestAuthorization('whenInUse');
      return auth === 'granted';
    }

    if (Platform.OS === 'android') {
      try {
        // Android 12+ requires requesting both FINE and COARSE permissions
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
        ]);

        const fineLocation = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
        const coarseLocation = granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION];

        console.log('[LocationService] Permissions result:', granted);

        if (
          fineLocation === PermissionsAndroid.RESULTS.GRANTED ||
          coarseLocation === PermissionsAndroid.RESULTS.GRANTED
        ) {
          return true;
        }

        if (
          fineLocation === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ||
          coarseLocation === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
        ) {
          Alert.alert(
            'Permission Required',
            'Location permission is disabled. Please enable it in App Settings.',
            [
              { text: 'Open Settings', onPress: () => Linking.openSettings() },
              { text: 'Cancel', style: 'cancel' },
            ]
          );
          return false;
        }

        return false;
      } catch (err) {
        console.warn('[LocationService] Permission Error:', err);
        return false;
      }
    }
    return false;
  }

  /**
   * Enable GPS via system dialog (Android)
   */
  async enableLocationServices(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        await promptForEnableLocationIfNeeded({
          interval: 10000,
        });
        // Add a delay to allow the system to fully initialize the location provider
        await new Promise(resolve => setTimeout(() => resolve(true), 1000));
        return true;
      } catch (error: any) {
        console.log('Location enable error:', error);
        // ERR00 usually means user cancelled or resolution failed
        if (error.message && (error.message.includes('ERR00') || error.code === 'ERR00')) {
             return false;
        }
        return false;
      }
    }
    return true; // iOS usually handles this via Geolocation.getCurrentPosition error
  }

  /**
   * Get current location with retries and error handling
   */
  getCurrentLocation(): Promise<LocationData> {
    return new Promise(async (resolve, reject) => {
      // 1. Check/Request Permission
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        reject(new Error('PERMISSION_DENIED'));
        return;
      }

      // 2. Enable GPS
      const isEnabled = await this.enableLocationServices();
      if (!isEnabled) {
        reject(new Error('GPS_DISABLED'));
        return;
      }

      // 3. Get Position
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log(error.code, error.message);
          if (error.code === 1) {
             reject(new Error('PERMISSION_DENIED'));
          } else if (error.code === 2) {
             reject(new Error('GPS_DISABLED'));
          } else {
             reject(new Error(error.message));
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }

  /**
   * Reverse Geocoding to get address from coordinates
   * Uses OpenStreetMap Nominatim API (Free)
   */
  async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'EPharmacyNative/1.0', // Required by Nominatim
          },
        }
      );
      
      const data = await response.json();
      
      if (data && data.address) {
        const city = data.address.city || data.address.town || data.address.village || '';
        const state = data.address.state || '';
        const country = data.address.country || '';
        const suburb = data.address.suburb || data.address.neighbourhood || '';

        // Construct a readable address string
        // Priority: Suburb/Area, City, State
        const parts = [];
        if (suburb) parts.push(suburb);
        if (city) parts.push(city);
        if (state) parts.push(state);
        
        if (parts.length > 0) {
           return parts.join(', ');
        } else if (country) {
           return country;
        }
      }
      
      return 'Unknown Location';
    } catch (error) {
      console.warn('[LocationService] Reverse Geocoding Error:', error);
      return 'Location Updated';
    }
  }
}

export default new LocationService();
