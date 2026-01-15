import React, { memo, useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing, Image, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../AppNavigator';

import { UserProfilePayload } from '../../api/types';

const { width: screenWidth } = Dimensions.get('window');
const getResponsiveSize = (size: number): number => (screenWidth / 375) * size;

interface ProfileCardProps {
    userData: UserProfilePayload;
    isDark: boolean;
    refetch: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = memo(({ userData, isDark, refetch }) => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [cardExpanded, setCardExpanded] = useState<boolean>(false);
    const profilePicScale = useRef(new Animated.Value(1)).current;
    const contentTop = useRef(new Animated.Value(85)).current; // Adjusted initial top

    const animateCard = useCallback((expand: boolean): void => {
        const nativeAnimations = [
            Animated.timing(profilePicScale, {
                toValue: expand ? 0.6 : 1,
                duration: 500,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true
            }),
        ];

        const layoutAnimations = [
            Animated.timing(contentTop, {
                toValue: expand ? 60 : 85,
                duration: 500,
                easing: Easing.out(Easing.ease),
                useNativeDriver: false
            }),
        ];

        Animated.parallel([
            Animated.parallel(nativeAnimations),
            Animated.parallel(layoutAnimations)
        ]).start();
        setCardExpanded(expand);
    }, [profilePicScale, contentTop]);

    const profileImageUrl = useMemo(() =>
        userData.profileImage && userData.profileImage.length > 0 ? userData.profileImage[0] : null,
        [userData.profileImage]
    );

    const userBio = useMemo(() =>
        `${userData.role || 'User'} at MEDICARE+`,
        [userData.role]
    );

    const getInitials = useCallback((name: string): string => {
        if (!name) return '?';
        return name.split(' ')
            .map(word => word.charAt(0))
            .join('')
            .substring(0, 2)
            .toUpperCase();
    }, []);

    // Statistics Data
    const stats = useMemo(() => [
        { label: 'Orders', value: userData.itemsPurchasedCount || 0, icon: 'shopping-outline' },
        { label: 'Saved', value: '₹0', icon: 'wallet-giftcard' }, // Used wallet-giftcard for Saved
        { label: 'Returns', value: 0, icon: 'keyboard-return' },
        { label: 'Earned', value: '₹0', icon: 'currency-inr' }, // Fixed icon
    ], [userData.itemsPurchasedCount]);


    return (
        <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => animateCard(!cardExpanded)}
            style={{
                margin: screenWidth * 0.04,
                height: getResponsiveSize(250), // Slightly taller for stats
                borderRadius: 32,
                padding: 3,
                marginBottom: 20,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 6,
                backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF'
            }}
        >
            {/* Profile Picture Section */}
            <Animated.View
                style={{
                    position: 'absolute',
                    top: 10, // Moved down slightly
                    left: 20,
                    width: getResponsiveSize(90),
                    height: getResponsiveSize(90),
                    borderRadius: cardExpanded ? 20 : 45,
                    borderWidth: 4,
                    borderColor: isDark ? '#c56161ff' : '#fff',
                    zIndex: 3,
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: [{ scale: profilePicScale }],
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 10,
                }}
            >
                <View style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 45,
                    backgroundColor: '#d77b7bff',
                    overflow: 'hidden',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    {profileImageUrl ? (
                        <Image
                            source={{ uri: profileImageUrl }}
                            style={{
                                width: '100%',
                                height: '100%',
                            }}
                            resizeMode="cover"
                        />
                    ) : (
                        <Text style={{
                            color: '#FFFFFF',
                            fontSize: getResponsiveSize(28),
                            fontWeight: 'bold'
                        }}>{getInitials(userData.name)}</Text>
                    )}
                </View>
            </Animated.View>

            {/* Content Card */}
            <Animated.View
                style={{
                    position: 'absolute',
                    left: 3,
                    right: 3,
                    bottom: 3,
                    top: contentTop,
                    borderRadius: 29,
                    borderTopLeftRadius: 60,
                    borderTopRightRadius: 30,
                    backgroundColor: isDark ? '#d77b7bff' : '#e16c61f1',
                    padding: getResponsiveSize(20),
                    paddingTop: getResponsiveSize(25),
                    zIndex: 2,
                }}
            >
                {/* Header Row: Name & Edit Button */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 }}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                        {!cardExpanded && (
                            <Text
                                numberOfLines={1}
                                style={{
                                    color: '#FFFFFF',
                                    fontSize: getResponsiveSize(22),
                                    fontWeight: 'bold',
                                    marginBottom: 2,
                                    textShadowColor: 'rgba(0, 0, 0, 0.1)',
                                    textShadowOffset: { width: 0, height: 1 },
                                    textShadowRadius: 2,
                                    marginLeft: getResponsiveSize(50), // Offset for profile pic overlap when collapsed
                                }}
                            >
                                {userData.name || 'User'}
                            </Text>
                        )}
                        <Text
                            style={{
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontSize: getResponsiveSize(13),
                                fontWeight: '500',
                                marginLeft: !cardExpanded ? getResponsiveSize(50) : 0,
                            }}
                        >
                            {userBio}
                        </Text>
                    </View>

                    {/* Edit Button - Right Side */}
                    <TouchableOpacity
                        style={{
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.4)',
                        }}
                        onPress={(e) => {
                            e.stopPropagation(); // Prevent card expansion when clicking edit
                            navigation.navigate('EditProfile', { userData: userData as any, refreshProfile: refetch });
                        }}
                    >
                        <MaterialCommunityIcons name="pencil" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>

                {/* Divider */}
                <View style={{
                    height: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0.2)',
                    marginVertical: getResponsiveSize(15),
                    width: '100%'
                }} />

                {/* Statistics Row */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    {stats.map((stat, index) => (
                        <View key={index} style={{ alignItems: 'center', flex: 1 }}>
                            <Text style={{
                                color: '#FFFFFF',
                                fontSize: getResponsiveSize(18),
                                fontWeight: 'bold',
                                marginBottom: 2
                            }}>
                                {stat.value}
                            </Text>
                            <Text style={{
                                color: 'rgba(255, 255, 255, 0.8)',
                                fontSize: getResponsiveSize(11),
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                                fontWeight: '600'
                            }}>
                                {stat.label}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Brands Ticker (Visible at bottom) */}
                <View style={{ marginTop: getResponsiveSize(25) }}>
                    <Text style={{
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: getResponsiveSize(10),
                        fontWeight: '600',
                        marginBottom: 10,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        textAlign: 'center'
                    }}>
                        Trusted Partners
                    </Text>
                </View>

            </Animated.View>
        </TouchableOpacity>
    );
});

export default ProfileCard;
