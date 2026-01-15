import { Platform, PermissionsAndroid, ToastAndroid, Alert, Linking } from 'react-native';
import Geolocation from 'react-native-geolocation-service';


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
        return false;
      }
    }
    return false;
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

      // Helper to get position with specific options
      const getPosition = (options: Geolocation.GeoOptions): Promise<LocationData> => {
        return new Promise((res, rej) => {
          Geolocation.getCurrentPosition(
            (position) => {
              res({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            (error) => {
              rej(error);
            },
            options
          );
        });
      };

      // 2. Try High Accuracy (GPS)
      try {
        const location = await getPosition({
          enableHighAccuracy: true,
          timeout: 10000, // 10s for GPS
          maximumAge: 10000,
          forceLocationManager: true, // Bypass Google Play Services
        });
        resolve(location);
      } catch (error: any) {
        // 3. Fallback to Low Accuracy (Network/WiFi)
        try {
          const location = await getPosition({
            enableHighAccuracy: false,
            timeout: 15000, // 15s for Network
            maximumAge: 10000,
            forceLocationManager: true,
          });
          resolve(location);
        } catch (finalError: any) {
          if (finalError.code === 1) reject(new Error('PERMISSION_DENIED'));
          else if (finalError.code === 2) reject(new Error('GPS_DISABLED'));
          else reject(new Error(finalError.message));
        }
      }
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
      return 'Location Updated';
    }
  }
  /**
   * Get detailed address from coordinates
   * Returns structured object for form population
   */
  async getAddressDetails(latitude: number, longitude: number): Promise<{
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    formattedAddress: string;
  }> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'EPharmacyNative/1.0',
          },
        }
      );

      const data = await response.json();

      if (data && data.address) {
        const addr = data.address;

        // 1. Build a Super-Granular Address List
        const parts = [];

        // Specific House/Building Info
        if (addr.house_number) parts.push(`House No ${addr.house_number}`);
        if (addr.apartment) parts.push(addr.apartment);
        if (addr.flat) parts.push(addr.flat);
        if (addr.building) parts.push(addr.building);
        if (addr.public_building) parts.push(addr.public_building);

        // Street/Road Info
        if (addr.road) parts.push(addr.road);
        if (addr.street) parts.push(addr.street);
        if (addr.pedestrian) parts.push(addr.pedestrian);

        // Area/Colony/Locality Info (The "LIG, Sagbhar" part)
        if (addr.residential) parts.push(addr.residential);
        if (addr.suburb) parts.push(addr.suburb);
        if (addr.neighbourhood) parts.push(addr.neighbourhood);
        if (addr.hamlet) parts.push(addr.hamlet);
        if (addr.locality) parts.push(addr.locality);
        if (addr.croft) parts.push(addr.croft);
        if (addr.district) parts.push(addr.district);
        if (addr.quarter) parts.push(addr.quarter);
        if (addr.block) parts.push(addr.block);

        // Village/Town/City Info
        if (addr.village) parts.push(addr.village);
        if (addr.town) parts.push(addr.town);
        if (addr.city_district) parts.push(addr.city_district);
        if (addr.city) parts.push(addr.city);
        if (addr.municipality) parts.push(addr.municipality);
        if (addr.county) parts.push(addr.county);

        // State/Region Info
        if (addr.state_district) parts.push(addr.state_district);
        if (addr.state) parts.push(addr.state);
        if (addr.region) parts.push(addr.region);

        // Country/Postal
        if (addr.postcode) parts.push(addr.postcode);
        if (addr.country) parts.push(addr.country);

        // Deduplicate
        const uniqueParts = [...new Set(parts)];
        const formattedAddress = uniqueParts.filter(Boolean).join(', ');

        // Basic fields for loose mapping (still useful for individual inputs if needed)
        const city = addr.city || addr.town || addr.village || addr.municipality || '';
        const state = addr.state || addr.province || '';
        const zip = addr.postcode || '';
        const country = addr.country || '';

        // Street variable (House + Area) for fallback logic if needed
        const street = uniqueParts
          .filter(p => !p.includes(city) && !p.includes(state) && !p.includes(country) && !p.includes(zip))
          .join(', ');

        return {
          street,
          city,
          state,
          zip,
          country,
          formattedAddress
        };
      }

      return { street: '', city: '', state: '', zip: '', country: '', formattedAddress: '' };
    } catch (error) {
      return { street: '', city: '', state: '', zip: '', country: '', formattedAddress: '' };
    }
  }
}

export default new LocationService();

