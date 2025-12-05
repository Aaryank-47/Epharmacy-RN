import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width: screenWidth } = Dimensions.get('window');
const getResponsiveSize = (size : any) => (screenWidth / 375) * size;

const COLORS = {
  primary: '#e16c61f1',
  primaryDark: '#d77b7bff',
  white: '#FFFFFF',
  black: '#1F2937',
  darkBg: '#2A2A2A',
  darkBgLight: '#3A3A3A',
};

const ActionGrid = ({ isDark, navigation }) => {
  const menuItems = [
    { title: 'My Orders', icon: 'package-variant-closed', screen: 'MyOrders' },
    { title: 'Wishlist', icon: 'heart-outline', screen: 'Wishlist' },
    { title: 'Notifications', icon: 'bell-outline', screen: 'Notifications' },
    { title: 'Settings', icon: 'cog-outline', screen: 'Settings' },
  ];

  return (
    <View style={[styles.gridContainer, { backgroundColor: isDark ? COLORS.darkBg : COLORS.white }]}>
      {menuItems.map((item, index) => (
        <TouchableOpacity
          key={index}
          style={styles.gridItem}
          onPress={() => navigation.navigate(item.screen)}
        >
          <View style={[styles.iconContainer, { backgroundColor: isDark ? COLORS.darkBgLight : COLORS.primarySculpture }]}>
            <MaterialCommunityIcons
              name={item.icon}
              size={getResponsiveSize(24)}
              color={isDark ? COLORS.primaryDark : COLORS.primary}
            />
          </View>
          <Text style={[styles.gridText, { color: isDark ? COLORS.white : COLORS.black }]}>
            {item.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginHorizontal: screenWidth * 0.04,
    marginBottom: 20,
    padding: screenWidth * 0.02,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  gridItem: {
    width: '45%',
    alignItems: 'center',
    padding: getResponsiveSize(10),
    marginBottom: getResponsiveSize(10),
  },
  iconContainer: {
    width: getResponsiveSize(50),
    height: getResponsiveSize(50),
    borderRadius: getResponsiveSize(25),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getResponsiveSize(8),
  },
  gridText: {
    fontSize: getResponsiveSize(14),
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default ActionGrid;
