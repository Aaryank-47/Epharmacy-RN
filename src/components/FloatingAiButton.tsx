import React from 'react';
import {
    TouchableOpacity,
    Linking,
    Platform,
    View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useThemePalette } from '../hooks/useThemePalette';

const FloatingAiButton: React.FC = () => {
    const { accentColor, isDark } = useThemePalette();

    const handlePress = async () => {
        const url = 'https://patientdoctorin-theloop-kfk7fpohavxhxgriy9lxhq.streamlit.app/';
        try {
            await Linking.openURL(url);
        } catch (error) {
            console.error("Failed to open URL:", error);
            // Fallback (optional, maybe alert user)
        }
    };

    return (
        <View
            style={{
                position: 'absolute',
                bottom: 90, // Positioned above the bottom
                right: 20,
                zIndex: 9999,
                borderRadius: 30, // Make it circular
                elevation: 8, // Shadow for Android
                shadowColor: '#000', // Shadow for iOS
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.30,
                shadowRadius: 4.65,
            }}
            pointerEvents="box-none"
        >
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={0.8}
                style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: accentColor,
                    justifyContent: 'center',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: isDark ? '#ffffff30' : '#00000010'
                }}
            >
                <Icon name="robot" size={28} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );
};

export default FloatingAiButton;
