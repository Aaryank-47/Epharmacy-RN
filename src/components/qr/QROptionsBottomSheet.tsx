import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useThemePalette } from '../../hooks/useThemePalette';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface QROptionsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onScanQR: () => void;
  onTakePhoto: () => void;
  onUploadGallery: () => void;
}

const QROptionsBottomSheet: React.FC<QROptionsBottomSheetProps> = ({
  visible,
  onClose,
  onScanQR,
  onTakePhoto,
  onUploadGallery,
}) => {
  const { isDark } = useThemePalette();

  // Animation Values
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Pan Responder for Drag Gestures
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only trigger if moving vertically significantly
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.8) {
          closeSheet();
        } else {
          // Spring back up
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 60,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      openSheet();
    } else {
      closeSheet();
    }
  }, [visible]);

  const openSheet = () => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 70,
        friction: 9,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeSheet = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (visible) onClose();
    });
  };

  if (!visible) return null;

  const OptionItem = ({
    title,
    icon,
    colors,
    onPress
  }: {
    title: string;
    icon: string;
    colors: string[];
    onPress: () => void
  }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        closeSheet();
        setTimeout(onPress, 300);
      }}
      style={{
        flex: 1,
        alignItems: 'center',
      }}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: 72,
          height: 72,
          borderRadius: 30,
          marginBottom: 10,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: colors[0],
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 6,
        }}
      >
        <Icon name={icon} size={32} color="#FFF" />
      </LinearGradient>
      <Text style={{
        fontSize: 13,
        fontWeight: '600',
        color: isDark ? '#E5E7EB' : '#374151',
        textAlign: 'center',
      }}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={closeSheet}
    >
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={closeSheet}
      >
        <Animated.View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            opacity: backdropAnim,
          }}
        />
      </TouchableOpacity>

      <Animated.View
        {...panResponder.panHandlers}
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          transform: [{ translateY: slideAnim }],
        }}
      >
        <View style={{
          backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          paddingBottom: 30, // Reduced padding to lift it up slightly from extreme bottom
          paddingTop: 12,
          marginHorizontal: 10,
          marginBottom: 2, // Lifted up from bottom edge
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 10,
        }}>
          {/* Drag Handle */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: isDark ? '#4B5563' : '#E5E7EB',
            }} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 10 }}>
            <OptionItem
              title="Scan QR"
              icon="qrcode-scan"
              colors={['#8B5CF6', '#7C3AED']} // Violet
              onPress={onScanQR}
            />
            <OptionItem
              title="Camera"
              icon="camera"
              colors={['#3B82F6', '#2563EB']} // Blue
              onPress={onTakePhoto}
            />
            <OptionItem
              title="Gallery"
              icon="image"
              colors={['#10B981', '#059669']} // Emerald
              onPress={onUploadGallery}
            />
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

export default QROptionsBottomSheet;
