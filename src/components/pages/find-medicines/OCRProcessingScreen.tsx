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
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current; // For icon popping
  const [currentStep, setCurrentStep] = useState(0);

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

    // Timeline Progress Simulation
    const triggerPop = () => {
      scaleAnim.setValue(0.8);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }).start();
    };

    const t1 = setTimeout(() => {
      setCurrentStep(1);
      triggerPop();
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 3500, // Slower progress
        useNativeDriver: false,
      }).start();
    }, 1500); // Start moving after 1.5s

    const t2 = setTimeout(() => {
      setCurrentStep(2);
      triggerPop();
      Animated.timing(progressAnim, {
        toValue: 2,
        duration: 4000, // Slower progress
        useNativeDriver: false,
      }).start();
    }, 5000); // Final step begins around 5s mark

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
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [file]);

  const textColor = isDark ? '#FFF' : '#1F2937';
  const subText = isDark ? '#9CA3AF' : '#6B7280';
  const bgColor = isDark ? '#000' : '#F3F4F6';
  const borderColor = isDark ? '#374151' : '#E5E7EB';

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
                colors={['rgba(34, 197, 94, 0)', 'rgba(34, 197, 94, 0.4)', '#22C55E']}
                style={{ flex: 1 }}
              />
              <View
                style={{
                  height: 3,
                  backgroundColor: '#FFF',
                  shadowColor: '#22C55E',
                  shadowOpacity: 1,
                  shadowRadius: 15,
                  shadowOffset: { width: 0, height: 0 },
                  elevation: 10,
                }}
              />
            </Animated.View>

            {/* Corner Bracket Overlays for "Scanning" look */}
            <View style={[styles.corner, styles.topLeft, { borderColor: '#22C55E' }]} />
            <View style={[styles.corner, styles.topRight, { borderColor: '#22C55E' }]} />
            <View style={[styles.corner, styles.bottomLeft, { borderColor: '#22C55E' }]} />
            <View style={[styles.corner, styles.bottomRight, { borderColor: '#22C55E' }]} />
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

        {/* Processing Timeline */}
        {!error && (
          <View style={{ marginTop: 40, width: '100%', paddingHorizontal: 30 }}>
            <View style={{ position: 'relative' }}>
              {/* Background Line */}
              <View style={{ position: 'absolute', top: 14, left: 40, right: 40, height: 4, backgroundColor: isDark ? '#374151' : '#E5E7EB', borderRadius: 2 }} />
              
              {/* Active Animated Line */}
              <View style={{ position: 'absolute', top: 14, left: 40, right: 40, height: 4, borderRadius: 2, overflow: 'hidden' }}>
                <Animated.View style={{ 
                  height: '100%', 
                  backgroundColor: '#22C55E',
                  width: progressAnim.interpolate({
                    inputRange: [0, 1, 2],
                    outputRange: ['0%', '50%', '100%']
                  }),
                  shadowColor: '#22C55E',
                  shadowOpacity: 0.8,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 0 },
                }} />
              </View>

              {/* Circles */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                {['Uploading', 'Processing', 'OCR Output'].map((step, idx) => {
                  const isActive = currentStep >= idx;
                  const isCurrent = currentStep === idx;
                  const isCompleted = currentStep > idx;
                  let iconName = "cloud-upload";
                  if (idx === 1) iconName = "camera-outline";
                  if (idx === 2) iconName = "file-document-outline";
                  if (isCompleted) iconName = "check";

                  return (
                    <View key={idx} style={{ alignItems: 'center', width: 80 }}>
                      <Animated.View
                        style={[
                          styles.circle,
                          {
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: isActive
                              ? '#22C55E'
                              : isDark
                              ? '#1F222B'
                              : '#F3F4F6',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2,
                            transform: [{ scale: isCurrent ? scaleAnim : 1 }],
                            shadowColor: isActive ? '#22C55E' : 'transparent',
                            shadowOpacity: 0.8,
                            shadowRadius: 12,
                            elevation: isActive ? 8 : 0,
                            borderWidth: 2,
                            borderColor: isActive ? '#22C55E' : (isDark ? '#374151' : '#E5E7EB'),
                          },
                        ]}
                      >
                        <Icon
                          name={isActive ? (isCompleted ? 'check' : iconName) : iconName}
                          size={18}
                          color={isActive ? '#FFF' : '#9CA3AF'}
                        />
                      </Animated.View>
                      <Text
                        style={{
                          color: isActive ? (isDark ? '#FFF' : '#22C55E') : '#9CA3AF',
                          fontSize: 11,
                          fontWeight: isActive ? '700' : '500',
                          marginTop: 8,
                          textAlign: 'center',
                          opacity: isActive ? 1 : 0.6,
                        }}
                      >
                        {step}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
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
  circle: {
    // Basic circle styles, specific logic handled inline
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});
