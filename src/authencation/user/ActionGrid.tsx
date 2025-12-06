import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useThemePalette } from '../../hooks/useThemePalette';

const { width: screenWidth } = Dimensions.get('window');
const getResponsiveSize = (size: number): number => (screenWidth / 375) * size;

const ActionGrid = memo(() => {
  const navigation = useNavigation();
  const { isDark, accentColor, surfaceColor } = useThemePalette();

  const menuItems = [
    { id: 1, title: 'Orders', icon: 'shopping-outline', route: 'Orders', color: '#EF4444' },
    { id: 2, title: 'Wishlist', icon: 'heart-outline', route: 'Wishlist', color: '#EC4899' },
    { id: 3, title: 'Notify', icon: 'bell-outline', route: 'Notifications', color: '#8B5CF6', badge: 3 },
    { id: 4, title: 'Settings', icon: 'cog-outline', route: 'Settings', color: '#10B981' },
  ];

  return (
    <View style={{
      paddingHorizontal: screenWidth * 0.04,
      paddingVertical: getResponsiveSize(12),
    }}>
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: getResponsiveSize(4),
      }}>
        <Text style={{
          fontSize: getResponsiveSize(18),
          fontWeight: '600',
          color: isDark ? '#FFFFFF' : '#1F2937',
        }}>
          Quick Actions
        </Text>
        <TouchableOpacity>
          <Text style={{
            fontSize: getResponsiveSize(14),
            color: isDark ? '#FFFFFF' : '#000000',
            fontWeight: '500',
          }}>
            View All
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: getResponsiveSize(16),
      }}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={{ alignItems: 'center' }}
            activeOpacity={0.8}
            onPress={() => navigation.navigate(item.route as never)}
          >
            {/* Circular Icon */}
            <View style={{ position: 'relative' }}>
              <View 
                style={{ 
                  width: getResponsiveSize(56),
                  height: getResponsiveSize(56),
                  borderRadius: getResponsiveSize(28),
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: isDark ? '#2D3748' : '#F3F4F6',
                  borderWidth: 1,
                  borderColor: isDark ? '#4A5568' : '#E5E7EB',
                }}
              >
                <Icon name={item.icon} size={getResponsiveSize(24)} color={item.color} />
                
                {item.badge && (
                  <LinearGradient
                    colors={['#EF4444', '#DC2626']}
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      width: getResponsiveSize(20),
                      height: getResponsiveSize(20),
                      borderRadius: getResponsiveSize(10),
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text style={{
                      fontSize: getResponsiveSize(10),
                      fontWeight: 'bold',
                      color: '#FFFFFF',
                    }}>
                      {item.badge}
                    </Text>
                  </LinearGradient>
                )}
              </View>
            </View>
            
            {/* Title */}
            <Text style={{
              fontSize: getResponsiveSize(14),
              fontWeight: '500',
              color: isDark ? '#D1D5DB' : '#4B5563',
              marginTop: getResponsiveSize(8),
            }}>
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
});

export default ActionGrid;