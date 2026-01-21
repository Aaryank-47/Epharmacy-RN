import React, { memo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { useThemePalette } from '../../hooks/useThemePalette';

const { width: screenWidth } = Dimensions.get('window');
const getResponsiveSize = (size: number): number => (screenWidth / 375) * size;

// Reusable Section Component
const PolicySection = memo(({ title, content, theme, icon }: any) => (
  <View className="mb-4 p-1"
    style={{
      backgroundColor: theme.isDark ? '#2A2A2A' : theme.white,
      borderColor: theme.isDark ? '#2A2A2A' : '#333',

    }}>
    <View className="flex-row items-center mb-3">
      <View className="w-8 h-8 rounded-full items-center justify-center mr-3"
        style={{ backgroundColor: theme.isDark ? theme.darkBg : '#F3F4F6' }}>
        <MaterialCommunityIcons name={icon} size={18} color={theme.primary} />
      </View>
      <Text className="text-lg font-bold" style={{ color: theme.textColor }}>
        {title}
      </Text>
    </View>
    {/* Using placeholderColor as safe fallback for gray text in dark mode */}
    <Text className="text-base leading-6" style={{ color: theme.placeholderColor }}>
      {content}
    </Text>
  </View>
));


const PrivacyTermsPage: React.FC = () => {
  const theme = useThemePalette();

  return (
    <ScrollView className="flex-1 pt-2" showsVerticalScrollIndicator={false}>
      <PolicySection
        title="Privacy Policy"
        theme={theme}
        icon="shield-lock-outline"
        content="We value your privacy and ensure that your personal data is handled securely. This section explains how your information is collected, stored, and used to provide you with a better experience."
      />

      <PolicySection
        title="Terms of Service"
        theme={theme}
        icon="file-document-outline"
        content="By using our app, you agree to follow our guidelines and usage terms. Please read these terms carefully before continuing to ensure a safe environment for all users."
      />

      <PolicySection
        title="About Us"
        theme={theme}
        icon="information-outline"
        content="We are committed to delivering the best healthcare experience. Our platform connects you with trusted pharmacies and provides seamless access to essential medicines."
      />

      <View className="items-center mt-4 mb-10 opacity-50">
        <Text className="text-xs" style={{ color: theme.placeholderColor }}>Version 11.0.0</Text>
        <Text className="text-xs" style={{ color: theme.placeholderColor }}>© 2025 Epharmacy. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
};

export default PrivacyTermsPage;
