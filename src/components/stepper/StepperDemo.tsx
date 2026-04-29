import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView } from 'react-native';
import StepLoader, { StepData } from './Stepper';
import { useThemePalette } from '../../hooks/useThemePalette';

const INITIAL_STEPS: StepData[] = [
  { label: 'Image Processing', status: 'completed' },
  { label: 'OCR Extraction', status: 'completed' },
  { label: 'Structuring Data', status: 'processing' },
  { label: 'Final Output', status: 'pending' },
];

const StepperDemo: React.FC = () => {
  const { isDark } = useThemePalette();
  const [steps, setSteps] = useState<StepData[]>(INITIAL_STEPS);

  useEffect(() => {
    const timers: Array<ReturnType<typeof setTimeout>> = [];

    timers.push(
      setTimeout(() => {
        setSteps([
          { label: 'Image Processing', status: 'completed' },
          { label: 'OCR Extraction', status: 'completed' },
          { label: 'Structuring Data', status: 'completed' },
          { label: 'Final Output', status: 'processing' },
        ]);
      }, 1800)
    );

    timers.push(
      setTimeout(() => {
        setSteps([
          { label: 'Image Processing', status: 'completed' },
          { label: 'OCR Extraction', status: 'completed' },
          { label: 'Structuring Data', status: 'completed' },
          { label: 'Final Output', status: 'completed' },
        ]);
      }, 3600)
    );

    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: isDark ? '#0B1220' : '#F8FAFC' }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: isDark ? '#111827' : '#FFFFFF' }]}>
          <Text style={[styles.title, { color: isDark ? '#F9FAFB' : '#0F172A' }]}>OCR Processing</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Clean processing pipeline with live step transitions.</Text>

          <View style={styles.stepperWrap}>
            <StepLoader steps={steps} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  card: {
    borderRadius: 28,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  stepperWrap: {
    marginTop: 18,
  },
});

export default StepperDemo;
