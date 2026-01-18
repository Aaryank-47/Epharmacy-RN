import { Platform, PermissionsAndroid, ToastAndroid, Linking } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { promptForEnableLocationIfNeeded } from 'react-native-android-location-enabler';

export interface LocationData {
  latitude: number;
  longitude: number;
}

export interface AddressDetails {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  formattedAddress: string;
}

/**
 * LocationService - Production-Ready GPS & Geocoding Service
 * Optimized with efficient fallback strategy pattern
 */
class LocationService {

  private readonly TIMEOUT_MS = 30000;
  private readonly OSM_USER_AGENT = 'EPharmacyNative/1.0';

  constructor() {
    Geolocation.setRNConfiguration({
      skipPermissionRequests: false,
      authorizationLevel: 'whenInUse',
    });
  }

  /**
   * Request Android location permission
   * @returns Promise<boolean> - true if granted
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;

    try {
      const isGranted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      if (isGranted) return true;

      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      if (result === PermissionsAndroid.RESULTS.GRANTED) return true;

      ToastAndroid.show('Please Allow Location Permission in Settings', ToastAndroid.LONG);
      setTimeout(() => Linking.openSettings(), 1000);
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get current GPS location with high accuracy
   * Shows system dialog if GPS is disabled
   * @returns Promise<LocationData>
   */
  async getCurrentLocation(): Promise<LocationData> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) throw new Error('Permission denied');

    if (Platform.OS === 'android') {
      try {
        await promptForEnableLocationIfNeeded({ interval: 10000 });
      } catch {
        throw new Error('Location services required. Please enable GPS.');
      }
    }

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => reject(new Error('GPS Required for precise location')),
        {
          enableHighAccuracy: true,
          timeout: this.TIMEOUT_MS,
          maximumAge: 0,
        }
      );
    });
  }

  /**
   * Get complete address details from coordinates
   * Uses Google Maps API (primary) with OSM fallback
   * @param latitude 
   * @param longitude 
   * @returns Promise<AddressDetails>
   */
  async getAddressDetails(latitude: number, longitude: number): Promise<AddressDetails> {
    try {
      return await this.getGoogleGeocode(latitude, longitude);
    } catch {
      return await this.getOSMGeocode(latitude, longitude);
    }
  }

  /**
   * Google Maps Geocoding (Primary)
   * Provides detailed Indian locality data
   */
  private async getGoogleGeocode(lat: number, lng: number): Promise<AddressDetails> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&result_type=street_address|route|sublocality|postal_code&language=en`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results?.length) {
      throw new Error('Google geocoding failed');
    }

    const result = data.results[0];
    const components = result.address_components || [];

    // DSA: Hash Map pattern for O(1) lookup
    const addressMap: Record<string, string> = {};

    components.forEach((comp: any) => {
      const types = comp.types;
      if (types.includes('street_number')) addressMap.houseNumber = comp.long_name;
      if (types.includes('route')) addressMap.route = comp.long_name;
      if (types.includes('sublocality_level_1')) addressMap.sublocality1 = comp.long_name;
      if (types.includes('sublocality_level_2')) addressMap.sublocality2 = comp.long_name;
      if (types.includes('locality')) addressMap.locality = comp.long_name;
      if (types.includes('administrative_area_level_2')) addressMap.city = comp.long_name;
      if (types.includes('administrative_area_level_1')) addressMap.state = comp.long_name;
      if (types.includes('postal_code')) addressMap.zip = comp.long_name;
      if (types.includes('country')) addressMap.country = comp.long_name;
    });

    const streetParts = [
      addressMap.houseNumber,
      addressMap.route,
      addressMap.sublocality2,
      addressMap.sublocality1
    ].filter(Boolean);

    return {
      street: streetParts.join(', '),
      city: addressMap.locality || addressMap.city || '',
      state: addressMap.state || '',
      zip: addressMap.zip || '',
      country: addressMap.country || '',
      formattedAddress: result.formatted_address || ''
    };
  }

  /**
   * OpenStreetMap Geocoding (Fallback)
   */
  private async getOSMGeocode(lat: number, lng: number): Promise<AddressDetails> {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': this.OSM_USER_AGENT }
    });
    const data = await response.json();
    const addr = data?.address || {};

    const streetParts = [
      addr.house_number,
      addr.road,
      addr.locality,
      addr.suburb,
      addr.neighbourhood
    ].filter(Boolean);

    return {
      street: streetParts.join(', '),
      city: addr.city || addr.town || addr.village || '',
      state: addr.state || '',
      zip: addr.postcode || '',
      country: addr.country || '',
      formattedAddress: data.display_name || ''
    };
  }

  /**
   * Legacy method for simple address string
   * @deprecated Use getAddressDetails() for complete data
   */
  async getAddressFromCoordinates(lat: number, lng: number): Promise<string> {
    const details = await this.getAddressDetails(lat, lng);
    return details.formattedAddress || 'Unknown Location';
  }
}

export default new LocationService();
