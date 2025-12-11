import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Alert,
  Vibration,
  Animated,
  Platform,
} from 'react-native';
import { Camera, useCameraDevices, useCodeScanner } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useThemePalette } from '../../hooks/useThemePalette';

interface QRScannerScreenProps {
  navigation: any;
  route?: any;
}

const QRScannerScreen: React.FC<QRScannerScreenProps> = ({ navigation }) => {
  const { isDark, accentColor } = useThemePalette();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [scannedData, setScannedData] = useState<string | null>(null);
  
  const devices = useCameraDevices();
  const device = devices.find(d => d.position === 'back');

  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Request camera permission
  useEffect(() => {
    (async () => {
      const status = await Camera.requestCameraPermission();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Animated scanning line
  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isScanning]);

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13', 'code-128', 'code-39'],
    onCodeScanned: (codes) => {
      if (!isScanning || codes.length === 0) return;

      const code = codes[0];
      if (code.value && code.value !== scannedData) {
        setIsScanning(false);
        setScannedData(code.value);
        Vibration.vibrate(200);

        // Success animation
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();

        // Show result
        setTimeout(() => {
          Alert.alert(
            'QR Code Scanned',
            `Data: ${code.value}`,
            [
              {
                text: 'Scan Again',
                onPress: () => {
                  setScannedData(null);
                  setIsScanning(true);
                },
              },
              {
                text: 'Close',
                onPress: () => navigation.goBack(),
                style: 'cancel',
              },
            ],
            { cancelable: false }
          );
        }, 300);
      }
    },
  });

  const handleClose = () => {
    navigation.goBack();
  };

  const handleFlashToggle = () => {
    // Implement flash toggle if needed
    Alert.alert('Flash', 'Flash toggle coming soon!');
  };

  if (hasPermission === null) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#000000',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 40,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: '#FFFFFF',
            marginTop: 20,
            textAlign: 'center',
          }}
        >
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#000000',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 40,
        }}
      >
        <Icon name="camera-off" size={72} color="#EF4444" />
        <Text
          style={{
            fontSize: 22,
            fontWeight: '800',
            color: '#FFFFFF',
            marginTop: 24,
            textAlign: 'center',
            letterSpacing: 0.2,
          }}
        >
          No access to camera
        </Text>
        <Text
          style={{
            fontSize: 15,
            color: '#9CA3AF',
            marginTop: 10,
            textAlign: 'center',
            fontWeight: '500',
          }}
        >
          Please grant camera permission to scan QR codes
        </Text>
        <TouchableOpacity
          onPress={() => Camera.requestCameraPermission()}
          style={{
            marginTop: 28,
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          <LinearGradient
            colors={[accentColor, isDark ? '#7C3AED' : '#9333EA']}
            style={{
              paddingHorizontal: 36,
              paddingVertical: 16,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: '800', color: '#FFFFFF' }}>
              Grant Permission
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#000000',
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 40,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: '700',
            color: '#FFFFFF',
            textAlign: 'center',
          }}
        >
          No camera device found
        </Text>
      </View>
    );
  }

  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 250],
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Camera View */}
      <Camera
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        device={device}
        isActive={true}
        codeScanner={codeScanner}
      />

      {/* Overlay */}
      <View style={{ flex: 1, backgroundColor: 'transparent' }}>
        {/* Header */}
        <LinearGradient
          colors={['rgba(0,0,0,0.85)', 'transparent']}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingTop: Platform.OS === 'android' ? 50 : 60,
            paddingBottom: 22,
          }}
        >
          <TouchableOpacity onPress={handleClose} style={{ padding: 8 }}>
            <Icon name="arrow-left" size={30} color="#FFFFFF" />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 20,
              fontWeight: '800',
              color: '#FFFFFF',
              letterSpacing: 0.3,
            }}
          >
            Scan QR Code
          </Text>
          <TouchableOpacity onPress={handleFlashToggle} style={{ padding: 8 }}>
            <Icon name="flash" size={30} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Scanning Frame */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            style={{
              width: 280,
              height: 280,
              position: 'relative',
              transform: [{ scale: scaleAnim }],
            }}
          >
            {/* Corner Borders */}
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: 50,
                height: 50,
                borderTopWidth: 5,
                borderLeftWidth: 5,
                borderColor: accentColor,
                borderTopLeftRadius: 10,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 50,
                height: 50,
                borderTopWidth: 5,
                borderRightWidth: 5,
                borderColor: accentColor,
                borderTopRightRadius: 10,
              }}
            />
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: 50,
                height: 50,
                borderBottomWidth: 5,
                borderLeftWidth: 5,
                borderColor: accentColor,
                borderBottomLeftRadius: 10,
              }}
            />
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 50,
                height: 50,
                borderBottomWidth: 5,
                borderRightWidth: 5,
                borderColor: accentColor,
                borderBottomRightRadius: 10,
              }}
            />

            {/* Scanning Line */}
            {isScanning && (
              <Animated.View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: 3,
                  transform: [{ translateY: scanLineTranslateY }],
                }}
              >
                <LinearGradient
                  colors={['transparent', accentColor, 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flex: 1 }}
                />
              </Animated.View>
            )}
          </Animated.View>

          {/* Instructions */}
          <Text
            style={{
              marginTop: 36,
              fontSize: 17,
              color: '#FFFFFF',
              textAlign: 'center',
              paddingHorizontal: 40,
              fontWeight: '600',
              letterSpacing: 0.2,
            }}
          >
            {isScanning ? 'Position QR code within the frame' : 'Processing...'}
          </Text>
        </View>

        {/* Bottom Info */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={{
            paddingHorizontal: 20,
            paddingBottom: 44,
            paddingTop: 24,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: `${accentColor}20`,
              borderRadius: 14,
              padding: 18,
              borderWidth: 1,
              borderColor: `${accentColor}40`,
            }}
          >
            <Icon name="information" size={26} color={accentColor} />
            <Text
              style={{
                flex: 1,
                marginLeft: 14,
                fontSize: 15,
                color: '#FFFFFF',
                fontWeight: '600',
                lineHeight: 21,
              }}
            >
              Make sure the QR code is clear and well-lit
            </Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

export default QRScannerScreen;
