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
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute, RouteProp, NavigationProp } from '@react-navigation/native';
import { launchImageLibrary, ImageLibraryOptions, Asset } from 'react-native-image-picker';
import Geolocation from '@react-native-community/geolocation';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import type { RootStackParamList } from '../../../AppNavigator';
import { updateUserProfile } from '../../api/authApi';

// TODO: For image upload to work, install: npm install react-native-image-picker
// TODO: For location to work, install: npm install @react-native-community/geolocation react-native-permissions
// TODO: Add permissions to AndroidManifest.xml: ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, CAMERA, READ_EXTERNAL_STORAGE
// TODO: Add permissions to Info.plist: NSLocationWhenInUseUsageDescription, NSPhotoLibraryUsageDescription, NSCameraUsageDescription

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
const COLORS = {
  primary: '#e16c61f1',
  primaryDark: '#d77b7bff',
  white: '#FFFFFF',
  black: '#1F2937',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  darkBg: '#2A2A2A',
  darkBgLight: '#3A3A3A',
};

const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<{ params: RouteParams }, 'params'>>();
  const isDark = useColorScheme() === 'dark';
  const { userData: initialUserData, refreshProfile } = route.params || {};

  const [loading, setLoading] = useState<boolean>(false);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
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

  const pickImage = async (): Promise<void> => {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.PHOTO_LIBRARY 
        : PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE;

      const result = await check(permission);
      
      if (result !== RESULTS.GRANTED) {
        const requestResult = await request(permission);
        if (requestResult !== RESULTS.GRANTED) {
          Alert.alert('Permission Required', 'Permission to access photo library is required!');
          return;
        }
      }

      const options: ImageLibraryOptions = {
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 1,
      };

      launchImageLibrary(options, (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          console.error('ImagePicker Error: ', response.errorMessage);
          Alert.alert('Error', 'Failed to pick image');
        } else if (response.assets && response.assets[0]) {
          const asset: Asset = response.assets[0];
          setProfileImageUri(asset.uri || null);
          setFormData(prev => ({
            ...prev,
            profileImage: {
              uri: asset.uri || '',
              type: asset.type || 'image/jpeg',
              name: asset.fileName || 'profile.jpg',
            }
          }));
        }
      });
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
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
      
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE 
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;

      const result = await check(permission);
      
      if (result !== RESULTS.GRANTED) {
        const requestResult = await request(permission);
        if (requestResult !== RESULTS.GRANTED) {
          Alert.alert(
            'Location Permission Required',
            'Please grant location permission to get your current location.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      Geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            address: {
              ...prev.address,
              location: {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              },
            },
          }));

          Alert.alert(
            'Location Updated',
            `Latitude: ${position.coords.latitude.toFixed(6)}\nLongitude: ${position.coords.longitude.toFixed(6)}`,
            [{ text: 'OK' }]
          );
          setLocationLoading(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          Alert.alert('Error', 'Failed to get current location. Please try again.');
          setLocationLoading(false);
        },
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location. Please try again.');
      setLocationLoading(false);
    }
  };

  const handleSubmit = async (): Promise<void> => {
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

      const hasImage = formData.profileImage !== null;
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
          submitFormData.append('age', parseInt(formData.age));
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
        
        submitFormData.append('profileImage', imageFile);
        
        response = await updateUserProfile(submitFormData, true);
      } else {
        // Use JSON for no image upload
        const jsonData: any = {
          name: formData.name.trim(),
          email: formData.email.trim(),
        };

        if (formData.phone.trim()) jsonData.phone = formData.phone.trim();
        if (formData.age) jsonData.age = parseInt(formData.age);
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
      const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred';
      Alert.alert('Update Failed', errorMessage, [{ text: 'OK' }]);
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
          <View className="items-center">
            <TouchableOpacity onPress={pickImage} className="relative">
              {profileImageUri ? (
                <Image source={{ uri: profileImageUri }} style={styles.profileImage} />
              ) : (
                <View 
                  className="items-center justify-center"
                  style={[
                    styles.placeholderImage,
                    { backgroundColor: isDark ? COLORS.primaryDark : COLORS.primary }
                  ]}
                >
                  <MaterialCommunityIcons 
                    name="camera-plus" 
                    size={getResponsiveSize(40)} 
                    color={COLORS.white} 
                  />
                </View>
              )}
              <View 
                className="absolute bottom-0 left-0 right-0 items-center justify-center"
                style={[
                  styles.imageOverlay,
                  { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)' }
                ]}
              >
                <MaterialCommunityIcons 
                  name="camera" 
                  size={getResponsiveSize(20)} 
                  color={COLORS.white} 
                />
              </View>
            </TouchableOpacity>
          </View>
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
            }))
            }
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

            <View className="flex-row items-start">
              <View className="flex-1 mr-2.5">
                <InputField
                  label="Latitude"
                  value={formData.address.location.latitude?.toString() || ''}
                  onChangeText={(text) => setFormData(prev => ({ 
                    ...prev, 
                    address: { 
                      ...prev.address, 
                      location: { ...prev.address.location, latitude: parseFloat(text) || null }
                    }
                  }))}
                  placeholder="Latitude"
                  keyboardType="numeric"
                />
              </View>
              <View className="flex-1 ml-2.5">
                <InputField
                  label="Longitude"
                  value={formData.address.location.longitude?.toString() || ''}
                  onChangeText={(text) => setFormData(prev => ({ 
                    ...prev, 
                    address: { 
                      ...prev.address, 
                      location: { ...prev.address.location, longitude: parseFloat(text) || null }
                    }
                  }))}
                  placeholder="Longitude"
                  keyboardType="numeric"
                />
              </View>
            </View>
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
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  header: {
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 45,
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
    width: getResponsiveSize(120),
    height: getResponsiveSize(120),
    borderRadius: getResponsiveSize(60),
  },
  placeholderImage: {
    width: getResponsiveSize(120),
    height: getResponsiveSize(120),
    borderRadius: getResponsiveSize(60),
  },
  imageOverlay: {
    height: '35%',
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
});

export default EditProfileScreen;
