import React, { memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Image,
  Modal,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEditProfile } from '../../hooks/useEditProfile';
import { useThemePalette } from '../../hooks/useThemePalette';

const { width: screenWidth } = Dimensions.get('window');
const getResponsiveSize = (size: number): number => (screenWidth / 375) * size;

/**
 * Reusable Components
 */

const InputField = memo(({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  multiline = false,
  editable = true,
  theme,
  verified = false,
  note
}: any) => (
  <View className="mb-5">
    <View className="flex-row items-center justify-between mb-2">
      <Text className="text-sm font-semibold" style={{ color: theme.textColor }}>
        {label}
      </Text>
      {verified && (
        <View className="flex-row items-center px-2 py-0.5 rounded-full border"
          style={{
            backgroundColor: theme.isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7',
            borderColor: theme.isDark ? 'rgba(16, 185, 129, 0.4)' : '#86EFAC'
          }}>
          <MaterialCommunityIcons name="check-decagram" size={12} color={theme.isDark ? '#34D399' : '#15803d'} />
          <Text className="text-[10px] font-bold ml-1" style={{ color: theme.isDark ? '#34D399' : '#15803d' }}>VERIFIED</Text>
        </View>
      )}
    </View>

    <TextInput
      className="px-4 py-3 rounded-xl text-base"
      style={[
        multiline ? { height: 100, textAlignVertical: 'top' } : undefined,
        {
          backgroundColor: !editable
            ? (theme.isDark ? '#fefe' : '#F3F4F6')
            : (theme.isDark ? theme.darkBgLight : theme.lightGray),
          color: !editable ? theme.gray : theme.textColor,
          opacity: !editable ? 0.8 : 1,
          borderWidth: 1,
          borderColor: theme.isDark ? theme.darkBgLight : 'transparent'
        }
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.placeholderColor}
      keyboardType={keyboardType}
      multiline={multiline}
      editable={editable}
      autoCorrect={false}
      autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
    />

    {note && (
      <View className="flex-row items-center mt-1.5 ml-1 opacity-70">
        <MaterialCommunityIcons name="lock-outline" size={12} color={theme.gray} />
        <Text className="text-xs ml-1 italic" style={{ color: theme.textColor }}>{note}</Text>
      </View>
    )}
  </View>
));

const Header = memo(({ theme, loading, onBack, onSave }: any) => (
  <View className="flex-row items-center justify-between px-4 py-3 border-b"
    style={{ borderColor: theme.isDark ? theme.darkBgLight : '#E5E7EB' }}>
    <TouchableOpacity
      onPress={onBack}
      className="w-10 h-10 rounded-full items-center justify-center"
      style={{ backgroundColor: theme.isDark ? theme.darkBgLight : theme.lightGray }}
    >
      <MaterialCommunityIcons name="arrow-left" size={getResponsiveSize(24)} color={theme.textColor} />
    </TouchableOpacity>
    <Text className="text-xl font-bold" style={{ color: theme.textColor }}>
      Edit Profile
    </Text>
    <TouchableOpacity
      onPress={onSave}
      disabled={loading}
      className={`w-10 h-10 rounded-full items-center justify-center ${loading ? 'opacity-60' : 'opacity-100'}`}
      style={{ backgroundColor: theme.isDark ? theme.primaryDark : theme.primary }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={theme.white} />
      ) : (
        <MaterialCommunityIcons name="check" size={getResponsiveSize(18)} color={theme.white} />
      )}
    </TouchableOpacity>
  </View>
));

const ProfilePictureSection = memo(({ theme, profileImageUri, isPicking, openGallery, openCamera }: any) => (
  <View className="m-4 p-5 rounded-2xl items-center"
    style={{ backgroundColor: theme.isDark ? theme.darkBg : theme.white }}>
    <Text className="text-lg font-bold mb-5" style={{ color: theme.textColor }}>
      Profile Picture
    </Text>

    <View className="items-center mb-4">
      <View className="relative">
        {profileImageUri ? (
          <Image
            source={{ uri: profileImageUri }}
            className="rounded-full border-2 border-white"
            style={{ width: getResponsiveSize(100), height: getResponsiveSize(100) }}
            resizeMode="cover"
          />
        ) : (
          <View
            className="rounded-full items-center justify-center"
            style={{
              width: getResponsiveSize(100),
              height: getResponsiveSize(100),
              backgroundColor: theme.isDark ? theme.primaryDark : theme.primary
            }}
          >
            <MaterialCommunityIcons name="account" size={getResponsiveSize(60)} color={theme.white} />
          </View>
        )}
        <View
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full items-center justify-center border-2 border-white"
          style={{ backgroundColor: theme.isDark ? theme.primaryDark : theme.primary }}
        >
          <MaterialCommunityIcons name="camera" size={getResponsiveSize(18)} color={theme.white} />
        </View>
      </View>
    </View>

    <View className="flex-row gap-3 w-full">
      <TouchableOpacity
        className={`flex-1 flex-row items-center justify-center px-4 py-3 rounded-xl ${isPicking ? 'opacity-60' : 'opacity-100'}`}
        style={{ backgroundColor: theme.isDark ? theme.primaryDark : theme.primary }}
        onPress={openGallery}
        disabled={isPicking}
      >
        {isPicking ? <ActivityIndicator size="small" color={theme.white} /> : (
          <>
            <MaterialCommunityIcons name="image-outline" size={getResponsiveSize(20)} color={theme.white} />
            <Text className="font-semibold ml-2" style={{ color: theme.white }}>Choose Photo</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className={`flex-1 flex-row items-center justify-center px-4 py-3 rounded-xl ${isPicking ? 'opacity-60' : 'opacity-100'}`}
        style={{ backgroundColor: theme.success }}
        onPress={openCamera}
        disabled={isPicking}
      >
        <MaterialCommunityIcons name="camera" size={getResponsiveSize(20)} color={theme.white} />
        <Text className="font-semibold ml-2" style={{ color: theme.white }}>Take Photo</Text>
      </TouchableOpacity>
    </View>
  </View>
));

const PersonalDetailsSection = memo(({
  theme,
  formData,
  setFormData,
  showDatePicker,
  setShowDatePicker,
  handleDateChange
}: any) => (
  <>
    <Text className="text-lg font-bold mb-5" style={{ color: theme.textColor }}>
      Personal Details
    </Text>

    <InputField label="Full Name" value={formData.name} onChangeText={(t: string) => setFormData((p: any) => ({ ...p, name: t }))} placeholder="Enter your full name" theme={theme} />

    <InputField
      label="Email"
      value={formData.email}
      editable={false}
      verified={true}
      note="Verified details cannot be modified."
      placeholder="Enter your email"
      keyboardType="email-address"
      theme={theme}
    />

    <InputField
      label="Phone Number"
      value={formData.phone}
      editable={false}
      verified={true}
      note="Verified details cannot be modified."
      placeholder="Enter phone number"
      keyboardType="phone-pad"
      theme={theme}
    />

    <View className="flex-row gap-3">
      <View className="flex-1">
        <InputField label="Age" value={formData.age} onChangeText={(t: string) => setFormData((p: any) => ({ ...p, age: t }))} placeholder="Age" keyboardType="numeric" theme={theme} />
      </View>
      <View className="flex-1">
        <TouchableOpacity onPress={() => setShowDatePicker(true)} className="mb-5">
          <Text className="text-sm font-semibold mb-2" style={{ color: theme.textColor }}>Date of Birth</Text>
          <View className="px-4 py-3 rounded-xl justify-center"
            style={{ backgroundColor: theme.isDark ? theme.darkBgLight : theme.lightGray }}>
            <Text style={{ color: theme.textColor }}>
              {formData.dob ? formData.dob.toLocaleDateString() : 'Select Date'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>

    {showDatePicker && (
      <DateTimePicker value={formData.dob || new Date()} mode="date" display="default" onChange={handleDateChange} maximumDate={new Date()} />
    )}
  </>
));

const AddressSection = memo(({ theme, formData, setFormData, locationLoading, getCurrentLocation }: any) => (
  <>
    <Text className="text-lg font-bold mt-5 mb-5" style={{ color: theme.textColor }}>
      Address
    </Text>
    <TouchableOpacity
      className="flex-row items-center justify-center p-3 rounded-xl mb-5"
      style={{ backgroundColor: theme.isDark ? theme.darkBgLight : theme.lightGray }}
      onPress={getCurrentLocation}
      disabled={locationLoading}
    >
      {locationLoading ? <ActivityIndicator size="small" color={theme.primary} /> : (
        <>
          <MaterialCommunityIcons name="crosshairs-gps" size={getResponsiveSize(20)} color={theme.primary} />
          <Text className="font-semibold ml-2" style={{ color: theme.primary }}>Use Current Location</Text>
        </>
      )}
    </TouchableOpacity>

    <InputField label="Street Address" value={formData.address.street} onChangeText={(t: string) => setFormData((p: any) => ({ ...p, address: { ...p.address, street: t } }))} placeholder="Enter street address" multiline theme={theme} />

    <View className="flex-row gap-3">
      <View className="flex-1">
        <InputField label="City" value={formData.address.city} onChangeText={(t: string) => setFormData((p: any) => ({ ...p, address: { ...p.address, city: t } }))} placeholder="City" theme={theme} />
      </View>
      <View className="flex-1">
        <InputField label="State" value={formData.address.state} onChangeText={(t: string) => setFormData((p: any) => ({ ...p, address: { ...p.address, state: t } }))} placeholder="State" theme={theme} />
      </View>
    </View>
    <View className="flex-row gap-3">
      <View className="flex-1">
        <InputField label="ZIP Code" value={formData.address.zip} onChangeText={(t: string) => setFormData((p: any) => ({ ...p, address: { ...p.address, zip: t } }))} placeholder="ZIP" keyboardType="numeric" theme={theme} />
      </View>
      <View className="flex-1">
        <InputField label="Country" value={formData.address.country} onChangeText={(t: string) => setFormData((p: any) => ({ ...p, address: { ...p.address, country: t } }))} placeholder="Country" theme={theme} />
      </View>
    </View>
  </>
));

const CameraPreviewModal = memo(({ visible, cameraPreviewUri, onRetake, onAccept, theme }: any) => (
  <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onRetake}>
    <View className="flex-1 justify-center bg-black/90">
      <View className="flex-1 m-5 justify-center">
        <View className="flex-row justify-between mb-5 mt-10">
          <Text className="text-white text-xl font-bold">Preview Photo</Text>
          <TouchableOpacity onPress={onRetake}>
            <MaterialCommunityIcons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        {cameraPreviewUri && (
          <Image source={{ uri: cameraPreviewUri }} className="flex-1 rounded-xl mb-5" resizeMode="contain" />
        )}
        <View className="flex-row gap-4 mb-5">
          <TouchableOpacity className="flex-1 bg-[#333] p-4 rounded-xl items-center" onPress={onRetake}>
            <Text className="text-white font-bold">Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 p-4 rounded-xl items-center" style={{ backgroundColor: theme.primary }} onPress={onAccept}>
            <Text className="text-white font-bold">Use Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
));

/**
 * Main Screen Component
 */
const EditProfileScreen: React.FC = () => {
  const theme = useThemePalette();
  const {
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
    navigation,
  } = useEditProfile();

  return (
    <LinearGradient
      colors={theme.isDark ? ['#1A1A1A', theme.darkBg] : [theme.white, '#F8F9FA']}
      className="flex-1"
    >
      <StatusBar
        backgroundColor={theme.isDark ? '#1A1A1A' : theme.white}
        barStyle={theme.statusBarStyle}
      />

      <Header
        theme={theme}
        loading={loading}
        onBack={() => navigation.goBack()}
        onSave={() => handleSubmit()}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <ProfilePictureSection
          theme={theme}
          profileImageUri={profileImageUri}
          isPicking={isPicking}
          openGallery={openGallery}
          openCamera={openCamera}
        />

        <View className="m-4 p-5 rounded-2xl" style={{ backgroundColor: theme.isDark ? theme.darkBg : theme.white }}>
          <PersonalDetailsSection
            theme={theme}
            formData={formData}
            setFormData={setFormData}
            showDatePicker={showDatePicker}
            setShowDatePicker={setShowDatePicker}
            handleDateChange={handleDateChange}
          />
          <AddressSection
            theme={theme}
            formData={formData}
            setFormData={setFormData}
            locationLoading={locationLoading}
            getCurrentLocation={getCurrentLocation}
          />
        </View>
        <View className="h-10" />
      </ScrollView>

      <CameraPreviewModal
        visible={showCameraPreview}
        cameraPreviewUri={cameraPreviewUri}
        onRetake={handleRetakePhoto}
        onAccept={handleAcceptPhoto}
        theme={theme}
      />
    </LinearGradient>
  );
};

export default EditProfileScreen;
