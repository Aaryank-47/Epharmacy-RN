import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useThemePalette } from '../../hooks/useThemePalette';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface QROptionsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onScanQR: () => void;
  onUploadPDF: () => void;
}

const QROptionsBottomSheet: React.FC<QROptionsBottomSheetProps> = ({
  visible,
  onClose,
  onScanQR,
  onUploadPDF,
}) => {
  const { isDark, accentColor, surfaceColor } = useThemePalette();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            opacity: backdropAnim,
          }}
        />
      </TouchableWithoutFeedback>

      <Animated.View
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <LinearGradient
          colors={isDark ? ['#2A2D35', '#1E2128'] : ['#FFFFFF', '#F9FAFB']}
          style={{
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingBottom: 34,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -6 },
            shadowOpacity: isDark ? 0.3 : 0.15,
            shadowRadius: 16,
            elevation: 12,
          }}
        >
          {/* Handle Bar */}
          <View style={{ alignItems: 'center', paddingVertical: 14 }}>
            <View
              style={{
                width: 48,
                height: 5,
                borderRadius: 2.5,
                backgroundColor: isDark ? '#4B5563' : '#D1D5DB',
              }}
            />
          </View>

          {/* Title */}
          <Text
            style={{
              fontSize: 24,
              fontWeight: '800',
              textAlign: 'center',
              marginBottom: 28,
              marginTop: 4,
              color: isDark ? '#FFFFFF' : '#1F2937',
              letterSpacing: 0.3,
            }}
          >
            Choose Action
          </Text>

          {/* Options */}
          <View style={{ paddingHorizontal: 20, gap: 14 }}>
            {/* Scan QR Option */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                onClose();
                setTimeout(onScanQR, 300);
              }}
              style={{
                borderRadius: 18,
                overflow: 'hidden',
                shadowColor: accentColor,
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
                elevation: 6,
              }}
            >
              <LinearGradient
                colors={[accentColor, isDark ? '#7C3AED' : '#9333EA']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 20,
                }}
              >
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}
                >
                  <Icon name="qrcode-scan" size={36} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 19,
                      fontWeight: '800',
                      color: '#FFFFFF',
                      marginBottom: 5,
                      letterSpacing: 0.2,
                    }}
                  >
                    Scan QR Code
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '500',
                    }}
                  >
                    Open camera to scan QR code
                  </Text>
                </View>
                <Icon name="chevron-right" size={26} color="rgba(255,255,255,0.8)" />
              </LinearGradient>
            </TouchableOpacity>

            {/* Upload PDF Option */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                onClose();
                setTimeout(onUploadPDF, 300);
              }}
              style={{
                borderRadius: 18,
                overflow: 'hidden',
                shadowColor: '#EF4444',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
                elevation: 6,
              }}
            >
              <LinearGradient
                colors={['#22C55E', '#16A34A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 20,
                }}
              >
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: 'rgba(255, 255, 255, 0.25)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                  }}
                >
                  <Icon name="file-image" size={36} color="#FFFFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 19,
                      fontWeight: '800',
                      color: '#FFFFFF',
                      marginBottom: 5,
                      letterSpacing: 0.2,
                    }}
                  >
                    Upload Image
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      color: 'rgba(255, 255, 255, 0.9)',
                      fontWeight: '500',
                    }}
                  >
                    Upload prescription image
                  </Text>
                </View>
                <Icon name="chevron-right" size={26} color="rgba(255,255,255,0.8)" />
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Cancel Button */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={onClose}
            style={{
              marginHorizontal: 20,
              marginTop: 22,
              paddingVertical: 17,
              borderRadius: 14,
              alignItems: 'center',
              backgroundColor: isDark ? '#374151' : '#F3F4F6',
            }}
          >
            <Text
              style={{
                fontSize: 17,
                fontWeight: '700',
                color: isDark ? '#D1D5DB' : '#6B7280',
              }}
            >
              Cancel
            </Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
};

export default QROptionsBottomSheet;
