import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: screenWidth } = Dimensions.get('window');
const getResponsiveSize = (size) => (screenWidth / 375) * size;

const COLORS = {
  white: '#FFFFFF',
  black: '#1F2937',
  gray: '#6B7280',
  darkBg: '#2A2A2A',
};

const PrivacyTermsPage = ({ isDark }) => {
  const items = [
    { title: 'Privacy Policy', icon: 'shield-lock-outline' },
    { title: 'Terms of Service', icon: 'file-document-outline' },
    { title: 'About Us', icon: 'information-outline' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: isDark ? COLORS.darkBg : COLORS.white }]}>
      {items.map((item, index) => (
        <TouchableOpacity key={index} style={styles.itemContainer}>
          <MaterialCommunityIcons
            name={item.icon}
            size={getResponsiveSize(22)}
            color={isDark ? COLORS.white : COLORS.gray}
          />
          <Text style={[styles.itemText, { color: isDark ? COLORS.white : COLORS.black }]}>
            {item.title}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={getResponsiveSize(22)}
            color={isDark ? COLORS.white : COLORS.gray}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: screenWidth * 0.04,
    borderRadius: 16,
    padding: getResponsiveSize(10),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsiveSize(15),
  },
  itemText: {
    flex: 1,
    marginLeft: getResponsiveSize(15),
    fontSize: getResponsiveSize(16),
  },
});

export default PrivacyTermsPage;
