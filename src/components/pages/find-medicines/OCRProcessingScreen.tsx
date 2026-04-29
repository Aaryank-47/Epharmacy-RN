import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  Animated,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useThemePalette } from '../../../hooks/useThemePalette';
import { uploadPrescriptionStream } from '../../../api/prescriptionApi';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

interface Props {
  navigation: any;
  route: any;
}

export const OCRProcessingScreen: React.FC<Props> = ({ navigation, route }) => {
  const file = route.params?.file;
  const { isDark, accentColor, surfaceColor } = useThemePalette();
  const [error, setError] = useState<string | null>(null);

  // Animations
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!file) {
      setError('No image provided.');
      return;
    }

    // Start scanner animation
    const scannerLoop = Animated.loop(
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
    scannerLoop.start();

    // Pulse animation for the analyzing text
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    pulseLoop.start();

    // Call API
    const controller = new AbortController();
    
    const processImage = async () => {
      try {
        await uploadPrescriptionStream(
          file,
          {
            onMedicineFound: () => {
              // We could show a count here if we wanted
            },
            onComplete: (result) => {
              // Stop animations
              scannerLoop.stop();
              pulseLoop.stop();
              
              // Redirect to FindMedicinesScreen with data
              navigation.replace('FindMedicines', {
                initialMedicines: result.prescription.medicines,
                detectedCount: result.meta.detectedCount,
              });
            },
            onError: (err) => {
              scannerLoop.stop();
              pulseLoop.stop();
              setError(err);
            },
          },
          controller.signal
        );
      } catch (err) {
        // Handled by onError callback in most cases, but just in case
        scannerLoop.stop();
        pulseLoop.stop();
        setError('Failed to process image');
      }
    };

    processImage();

    return () => {
      controller.abort();
      scannerLoop.stop();
      pulseLoop.stop();
    };
  }, [file]);

  const textColor = isDark ? '#FFF' : '#1F2937';
  const bgColor = isDark ? '#000' : '#F3F4F6';

  const translateY = scanLineAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, height * 0.5], // Moves down halfway through the screen
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, zIndex: 10 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: 'rgba(0,0,0,0.5)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="close" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={{ flex: 1, textAlign: 'center', color: textColor, fontSize: 18, fontWeight: '700', marginRight: 40 }}>
          Analyzing...
        </Text>
      </View>

      {/* Main Content */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        {file && !error ? (
          <View style={{ width: width * 0.85, height: height * 0.55, borderRadius: 24, overflow: 'hidden', backgroundColor: surfaceColor }}>
            <Image
              source={{ uri: file.uri }}
              style={{ width: '100%', height: '100%', opacity: 0.7 }}
              resizeMode="cover"
            />
            
            {/* Scanner Line Overlay */}
            <Animated.View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 100,
                transform: [{ translateY }],
              }}
            >
              <LinearGradient
                colors={[
                  `${accentColor.substring(0, 7)}00`,
                  `${accentColor.substring(0, 7)}80`,
                  accentColor,
                ]}
                style={{ flex: 1 }}
              />
              <View style={{ height: 2, backgroundColor: '#FFF', shadowColor: accentColor, shadowOpacity: 1, shadowRadius: 10, shadowOffset: { width: 0, height: 0 } }} />
            </Animated.View>

            {/* Corner Bracket Overlays for "Scanning" look */}
            <View style={[styles.corner, styles.topLeft, { borderColor: accentColor }]} />
            <View style={[styles.corner, styles.topRight, { borderColor: accentColor }]} />
            <View style={[styles.corner, styles.bottomLeft, { borderColor: accentColor }]} />
            <View style={[styles.corner, styles.bottomRight, { borderColor: accentColor }]} />
          </View>
        ) : (
          <View style={{ alignItems: 'center' }}>
            <Icon name="alert-circle-outline" size={60} color="#EF4444" />
            <Text style={{ color: textColor, fontSize: 16, marginTop: 16, textAlign: 'center', paddingHorizontal: 20 }}>
              {error || 'Something went wrong'}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                marginTop: 24,
                paddingHorizontal: 24,
                paddingVertical: 12,
                backgroundColor: accentColor,
                borderRadius: 12,
              }}
            >
              <Text style={{ color: '#FFF', fontWeight: 'bold' }}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Processing Text */}
        {!error && (
          <Animated.View style={{ opacity: pulseAnim, marginTop: 40, alignItems: 'center' }}>
            <Icon name="brain" size={32} color={accentColor} />
            <Text style={{ color: textColor, fontSize: 16, fontWeight: '600', marginTop: 12 }}>
              Extracting medicines using AI...
            </Text>
            <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280', fontSize: 13, marginTop: 4 }}>
              This usually takes a few seconds
            </Text>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderWidth: 4,
  },
  topLeft: {
    top: 20,
    left: 20,
    borderBottomWidth: 0,
    borderRightWidth: 0,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 20,
    right: 20,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
    borderTopRightRadius: 16,
  },
  bottomLeft: {
    bottom: 20,
    left: 20,
    borderTopWidth: 0,
    borderRightWidth: 0,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 20,
    right: 20,
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderBottomRightRadius: 16,
  },
});
