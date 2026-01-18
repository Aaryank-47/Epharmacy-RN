import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Alert,
  Vibration,
  Animated,
  Platform,
  Dimensions,
} from 'react-native';
import { Camera, useCameraDevices, useCodeScanner, Code } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useThemePalette } from '../../hooks/useThemePalette';

interface QRScannerScreenProps {
  navigation: any;
}

const { width } = Dimensions.get('window');
const SCAN_FRAME_SIZE = 280;

const QRScannerScreen: React.FC<QRScannerScreenProps> = ({ navigation }) => {
  const { isDark, accentColor } = useThemePalette();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  // Camera Setup
  const devices = useCameraDevices();
  const device = useMemo(() => devices.find(d => d.position === 'back'), [devices]);

  // Animations with Native Driver
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Request camera permission on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const status = await Camera.requestCameraPermission();
      if (isMounted) setHasPermission(status === 'granted');
    })();
    return () => { isMounted = false; };
  }, []);

  // Scanning Animation Loop
  useEffect(() => {
    if (!isScanning) {
      scanLineAnim.setValue(0);
      return;
    }

    const animation = Animated.loop(
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
    );
    animation.start();

    return () => animation.stop();
  }, [isScanning, scanLineAnim]);

  // Optimized Success Handler
  const handleScanSuccess = useCallback((value: string) => {
    setIsScanning(false);
    Vibration.vibrate(200);

    // Success Pulse Animation
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

    // Show Result Alert
    // Using InteractionManager or requestAnimationFrame could be even better, 
    // but setTimeout is sufficient for basic frame gap
    setTimeout(() => {
      Alert.alert(
        'QR Code Scanned',
        `Data: ${value}`,
        [
          {
            text: 'Scan Again',
            onPress: () => setIsScanning(true),
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
  }, [navigation, scaleAnim]);

  // Code Scanner Callback
  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13', 'code-128', 'code-39'],
    onCodeScanned: useCallback((codes: Code[]) => {
      if (!isScanning || codes.length === 0) return;

      const code = codes[0];
      if (code.value) {
        handleScanSuccess(code.value);
      }
    }, [isScanning, handleScanSuccess]),
  });

  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleFlashToggle = useCallback(() => {
    Alert.alert('Flash', 'Flash toggle coming soon!');
  }, []);

  const handleGrantPermission = useCallback(async () => {
    const status = await Camera.requestCameraPermission();
    setHasPermission(status === 'granted');
  }, []);

  // Memoized Interpolation
  const scanLineTranslateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 250],
  });

  // --- Render States ---

  if (hasPermission === null) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-10">
        <Text className="text-white text-lg font-bold mt-5 text-center">Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-10">
        <Icon name="camera-off" size={72} color="#EF4444" />
        <Text className="text-white text-2xl font-extrabold mt-6 text-center tracking-wide">No access to camera</Text>
        <Text className="text-gray-400 text-base mt-2.5 text-center font-medium">Please grant camera permission to scan QR codes</Text>

        <TouchableOpacity onPress={handleGrantPermission} className="mt-7 rounded-2xl overflow-hidden">
          <LinearGradient
            colors={[accentColor, isDark ? '#7C3AED' : '#9333EA']}
            className="px-9 py-4"
          >
            <Text className="text-white text-lg font-extrabold">Grant Permission</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View className="flex-1 bg-black items-center justify-center px-10">
        <Text className="text-white text-lg font-bold text-center">No camera device found</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Camera View */}
      <Camera
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        device={device}
        isActive={isScanning} // Only active when scanning to save battery
        codeScanner={codeScanner}
      />

      {/* Overlay */}
      <View className="flex-1 bg-transparent">
        {/* Header */}
        <LinearGradient
          colors={['rgba(0,0,0,0.85)', 'transparent']}
          className="flex-row items-center justify-between px-4 pt-[50px] pb-6"
          style={{ paddingTop: Platform.OS === 'android' ? 50 : 60 }}
        >
          <TouchableOpacity onPress={handleClose} className="p-2">
            <Icon name="arrow-left" size={30} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-extrabold tracking-wide">Scan QR Code</Text>
          <TouchableOpacity onPress={handleFlashToggle} className="p-2">
            <Icon name="flash" size={30} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>

        {/* Scanning Frame */}
        <View className="flex-1 items-center justify-center">
          <Animated.View
            style={{
              width: SCAN_FRAME_SIZE,
              height: SCAN_FRAME_SIZE,
              position: 'relative',
              transform: [{ scale: scaleAnim }],
            }}
          >
            {/* Corners */}
            <View className="absolute top-0 left-0 w-[50px] h-[50px] border-t-[5px] border-l-[5px] rounded-tl-[10px]" style={{ borderColor: accentColor }} />
            <View className="absolute top-0 right-0 w-[50px] h-[50px] border-t-[5px] border-r-[5px] rounded-tr-[10px]" style={{ borderColor: accentColor }} />
            <View className="absolute bottom-0 left-0 w-[50px] h-[50px] border-b-[5px] border-l-[5px] rounded-bl-[10px]" style={{ borderColor: accentColor }} />
            <View className="absolute bottom-0 right-0 w-[50px] h-[50px] border-b-[5px] border-r-[5px] rounded-br-[10px]" style={{ borderColor: accentColor }} />

            {/* Scanning Line */}
            {isScanning && (
              <Animated.View
                className="absolute left-0 right-0 h-[3px]"
                style={{ transform: [{ translateY: scanLineTranslateY }] }}
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
          <Text className="mt-9 text-white text-[17px] text-center px-10 font-semibold tracking-wide">
            {isScanning ? 'Position QR code within the frame' : 'Processing...'}
          </Text>
        </View>

        {/* Bottom Info */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          className="px-5 pb-11 pt-6"
        >
          <View
            className="flex-row items-center rounded-2xl p-[18px] border"
            style={{
              backgroundColor: `${accentColor}20`,
              borderColor: `${accentColor}40`
            }}
          >
            <Icon name="information" size={26} color={accentColor} />
            <Text className="flex-1 ml-3.5 text-white text-[15px] font-semibold leading-5">
              Make sure the QR code is clear and well-lit
            </Text>
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

export default QRScannerScreen;
