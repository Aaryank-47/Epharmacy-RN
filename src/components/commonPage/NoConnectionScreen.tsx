import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useThemePalette } from '../../hooks/useThemePalette';

interface NoConnectionScreenProps {
    onRetry: () => void;
}

const NoConnectionScreen: React.FC<NoConnectionScreenProps> = ({ onRetry }) => {
    const { isDark, statusBarStyle } = useThemePalette();

    return (
        <LinearGradient
            colors={isDark ? ['#020202ff', '#2A2A2A'] : ['#FFFFFF', '#F8F9FA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.container}
        >
            <StatusBar
                backgroundColor={isDark ? '#1A1A1A' : '#FFFFFF'}
                barStyle={statusBarStyle}
            />
            {/* Illustration */}
            <View style={styles.illustrationContainer}>
                {/* Yellow Cloud */}
                <View style={styles.cloudContainer}>
                    <View style={[styles.cloud, styles.cloudLeft]} />
                    <View style={[styles.cloud, styles.cloudRight]} />
                    <View style={styles.thunderbolt} />
                </View>

                {/* Phone with No Signal */}
                <View style={styles.phoneContainer}>
                    <View style={[styles.phone, { backgroundColor: isDark ? '#2A2A2A' : '#FFFFFF' }]}>
                        <View style={styles.phoneScreen}>
                            {/* Signal bars - weak/no signal */}
                            <View style={styles.signalBars}>
                                <View style={[styles.bar, styles.barRed, { height: 8 }]} />
                                <View style={[styles.bar, styles.barGray, { height: 12 }]} />
                                <View style={[styles.bar, styles.barGray, { height: 16 }]} />
                            </View>
                        </View>
                    </View>
                </View>

                {/* Geometric shapes */}
                <View style={styles.shapesContainer}>
                    <View style={[styles.triangle, styles.triangleRed]} />
                    <View style={[styles.triangle, styles.triangleYellow]} />
                    <View style={[styles.triangle, styles.triangleBlue]} />
                </View>
            </View>

            {/* Text Content */}
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#1A1A1A' }]}>
                No connection
            </Text>
            <Text style={[styles.message, { color: isDark ? '#A0A0A0' : '#6B7280' }]}>
                Please check your internet connectivity{'\n'}and try again
            </Text>

            {/* Retry Button */}
            <TouchableOpacity
                style={styles.retryButton}
                onPress={onRetry}
                activeOpacity={0.8}
            >
                <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    illustrationContainer: {
        width: 280,
        height: 280,
        marginBottom: 32,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    cloudContainer: {
        position: 'absolute',
        top: 20,
        zIndex: 3,
    },
    cloud: {
        backgroundColor: '#FCD34D',
        borderRadius: 30,
    },
    cloudLeft: {
        width: 50,
        height: 40,
        position: 'absolute',
        left: 0,
    },
    cloudRight: {
        width: 60,
        height: 45,
        position: 'absolute',
        right: -20,
        top: -5,
    },
    thunderbolt: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 10,
        borderRightWidth: 10,
        borderTopWidth: 20,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#EF4444',
        position: 'absolute',
        top: 45,
        left: 30,
    },
    phoneContainer: {
        width: 140,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
    },
    phone: {
        width: 120,
        height: 180,
        borderRadius: 20,
        borderWidth: 8,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    phoneScreen: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    signalBars: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 4,
    },
    bar: {
        width: 12,
        borderRadius: 2,
    },
    barRed: {
        backgroundColor: '#EF4444',
    },
    barGray: {
        backgroundColor: '#D1D5DB',
    },
    shapesContainer: {
        position: 'absolute',
        bottom: 20,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        zIndex: 1,
    },
    triangle: {
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderStyle: 'solid',
        borderLeftWidth: 20,
        borderRightWidth: 20,
        borderBottomWidth: 35,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
    },
    triangleRed: {
        borderBottomColor: '#EF4444',
    },
    triangleYellow: {
        borderBottomColor: '#FCD34D',
    },
    triangleBlue: {
        borderBottomColor: '#3B82F6',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 32,
    },
    retryButton: {
        backgroundColor: '#3B82F6',
        paddingHorizontal: 48,
        paddingVertical: 14,
        borderRadius: 8,
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default NoConnectionScreen;
