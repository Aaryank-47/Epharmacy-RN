import React, { memo, useEffect, useRef } from 'react';
import { View, Animated, ScrollView, Platform, StatusBar, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useThemePalette } from '../../hooks/useThemePalette';

const { width: screenWidth } = Dimensions.get('window');
const getResponsiveSize = (size: number): number => (screenWidth / 375) * size;

const SkeletonItem = memo(({ width, height, borderRadius = 8, style, shimmerOpacity, isDark }: any) => (
    <Animated.View
        style={[
            {
                width,
                height,
                borderRadius,
                backgroundColor: isDark ? '#3A3A3A' : '#E5E7EB',
                opacity: shimmerOpacity,
            },
            style,
        ]}
    />
));

const ProfileSkeleton = () => {
    const { isDark, statusBarStyle } = useThemePalette();
    const shimmerAnimatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(shimmerAnimatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmerAnimatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [shimmerAnimatedValue]);

    const shimmerOpacity = shimmerAnimatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0.3, 0.7],
    });

    return (
        <LinearGradient
            colors={isDark ? ['#1A1A1A', '#2A2A2A'] : ['#FFFFFF', '#F8F9FA']}
            style={{ flex: 1 }}
        >
            <StatusBar
                backgroundColor={isDark ? '#1A1A1A' : '#FFFFFF'}
                barStyle={statusBarStyle}
            />

            {/* Header Skeleton */}
            <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: screenWidth * 0.04,
                paddingBottom: 15,
                paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + (-25) : 45,
                borderBottomWidth: 1,
                borderBottomColor: isDark ? '#3A3A3A' : '#E5E7EB',
            }}>
                <SkeletonItem width={getResponsiveSize(40)} height={getResponsiveSize(40)} borderRadius={getResponsiveSize(20)} shimmerOpacity={shimmerOpacity} isDark={isDark} />
                <SkeletonItem width={getResponsiveSize(100)} height={getResponsiveSize(20)} borderRadius={6} shimmerOpacity={shimmerOpacity} isDark={isDark} />
                <SkeletonItem width={getResponsiveSize(40)} height={getResponsiveSize(40)} borderRadius={getResponsiveSize(20)} shimmerOpacity={shimmerOpacity} isDark={isDark} />
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
                {/* Profile Card Skeleton */}
                <View style={{
                    margin: screenWidth * 0.04,
                    height: getResponsiveSize(280),
                    borderRadius: 32,
                    padding: 3,
                    backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.25,
                    shadowRadius: 8,
                    elevation: 5,
                }}>
                    <SkeletonItem
                        width={getResponsiveSize(100)}
                        height={getResponsiveSize(100)}
                        borderRadius={50}
                        style={{ position: 'absolute', top: 10, left: 10, zIndex: 3 }}
                        shimmerOpacity={shimmerOpacity} isDark={isDark}
                    />
                    <View style={{
                        position: 'absolute',
                        left: 3,
                        right: 3,
                        bottom: 3,
                        height: getResponsiveSize(160),
                        borderRadius: 29,
                        borderTopLeftRadius: 70,
                        borderTopRightRadius: 30,
                        padding: getResponsiveSize(20),
                        backgroundColor: isDark ? '#3A3A3A' : '#E5E7EB',
                    }}>
                        <View style={{ marginBottom: getResponsiveSize(20), marginTop: 10 }}>
                            <SkeletonItem width={getResponsiveSize(150)} height={getResponsiveSize(25)} borderRadius={6} style={{ marginBottom: 8 }} shimmerOpacity={shimmerOpacity} isDark={isDark} />
                            <SkeletonItem width={getResponsiveSize(200)} height={getResponsiveSize(14)} borderRadius={4} shimmerOpacity={shimmerOpacity} isDark={isDark} />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <View style={{ flexDirection: 'row', gap: getResponsiveSize(15) }}>
                                {[1, 2, 3].map((i) => (
                                    <SkeletonItem key={i} width={getResponsiveSize(30)} height={getResponsiveSize(30)} borderRadius={15} shimmerOpacity={shimmerOpacity} isDark={isDark} />
                                ))}
                            </View>
                            <SkeletonItem width={getResponsiveSize(80)} height={getResponsiveSize(24)} borderRadius={12} shimmerOpacity={shimmerOpacity} isDark={isDark} />
                        </View>
                    </View>
                </View>

                {/* Action Grid Skeleton */}
                <View style={{
                    paddingHorizontal: screenWidth * 0.04,
                    paddingVertical: getResponsiveSize(12),
                    marginBottom: 10
                }}>
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: getResponsiveSize(16)
                    }}>
                        <SkeletonItem width={getResponsiveSize(120)} height={getResponsiveSize(18)} borderRadius={4} shimmerOpacity={shimmerOpacity} isDark={isDark} />
                        <SkeletonItem width={getResponsiveSize(60)} height={getResponsiveSize(14)} borderRadius={4} shimmerOpacity={shimmerOpacity} isDark={isDark} />
                    </View>

                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        marginTop: getResponsiveSize(16)
                    }}>
                        {[1, 2, 3, 4].map((i) => (
                            <View key={i} style={{ alignItems: 'center' }}>
                                <SkeletonItem
                                    width={getResponsiveSize(56)}
                                    height={getResponsiveSize(56)}
                                    borderRadius={getResponsiveSize(28)}
                                    style={{ marginBottom: getResponsiveSize(8) }}
                                    shimmerOpacity={shimmerOpacity} isDark={isDark}
                                />
                                <SkeletonItem
                                    width={getResponsiveSize(50)}
                                    height={getResponsiveSize(14)}
                                    borderRadius={4}
                                    shimmerOpacity={shimmerOpacity} isDark={isDark}
                                />
                            </View>
                        ))}
                    </View>
                </View>

                {/* Personal Details Skeleton */}
                <View style={{
                    marginHorizontal: screenWidth * 0.04,
                    marginBottom: 20,
                    padding: screenWidth * 0.05,
                    borderRadius: 16,
                    backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 5,
                }}>
                    <SkeletonItem width={getResponsiveSize(120)} height={getResponsiveSize(18)} borderRadius={6} style={{ marginBottom: 15 }} shimmerOpacity={shimmerOpacity} isDark={isDark} />
                    {[1, 2, 3, 4, 5].map((i) => (
                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
                            <SkeletonItem width={getResponsiveSize(20)} height={getResponsiveSize(20)} borderRadius={10} style={{ marginRight: 15 }} shimmerOpacity={shimmerOpacity} isDark={isDark} />
                            <SkeletonItem width={getResponsiveSize(180)} height={getResponsiveSize(14)} borderRadius={4} shimmerOpacity={shimmerOpacity} isDark={isDark} />
                        </View>
                    ))}
                </View>

                {/* Logout Button Skeleton */}
                <SkeletonItem
                    width={getResponsiveSize(50)}
                    height={getResponsiveSize(50)}
                    borderRadius={getResponsiveSize(25)}
                    style={{ marginLeft: screenWidth * 0.8, marginBottom: 20 }}
                    shimmerOpacity={shimmerOpacity} isDark={isDark}
                />
                <View style={{ height: 20 }} />
            </ScrollView>
        </LinearGradient>
    );
};

export default memo(ProfileSkeleton);
