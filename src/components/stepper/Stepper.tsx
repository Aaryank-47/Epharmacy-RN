import React, { useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import StepItem, { StepStatus } from './StepItem';
import { useThemePalette } from '../../hooks/useThemePalette';

export interface StepData {
  label: string;
  status: StepStatus;
}

interface StepLoaderProps {
  steps: StepData[];
}

const TRACK_TOP = 24;
const TRACK_BOTTOM = 24;
const NODE_SIZE = 32;
const LINE_WIDTH = 2.5;
const GLOW_HEIGHT = 48;
const MIN_ROW_HEIGHT = 120;
const STEP_PADDING = 16;

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));
const hexToRgba = (hex: string, alpha: number) => {
  const sanitized = hex.replace('#', '');
  const value = sanitized.length === 3
    ? sanitized.split('').map(char => char + char).join('')
    : sanitized;

  const int = parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const StepLoader: React.FC<StepLoaderProps> = ({ steps }) => {
  const { isDark, success, primary } = useThemePalette();
  const [containerHeight, setContainerHeight] = useState(0);
  const completionColor = success;
  const processingColor = primary;
  const pendingColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)';
  
  // Calculate dynamic ROW_HEIGHT to span full viewport
  const dynamicRowHeight = useMemo(() => {
    if (containerHeight <= 0 || steps.length === 0) return MIN_ROW_HEIGHT;
    const availableHeight = containerHeight - TRACK_TOP - TRACK_BOTTOM;
    const calculated = availableHeight / Math.max(steps.length, 1);
    return Math.max(calculated, MIN_ROW_HEIGHT);
  }, [containerHeight, steps.length]);

  const fillHeight = useSharedValue(0);
  const glowOffset = useSharedValue(0);
  const glowOpacity = useSharedValue(0);

  const activeIndex = useMemo(
    () => steps.findIndex(step => step.status === 'processing' || step.status === 'loading'),
    [steps]
  );

  const completedCount = useMemo(
    () => steps.filter(step => step.status === 'completed').length,
    [steps]
  );

  useEffect(() => {
    if (containerHeight <= 0 || steps.length === 0) {
      return;
    }

    const trackHeight = Math.max(containerHeight - TRACK_TOP - TRACK_BOTTOM, 0);
    const denominator = Math.max(steps.length - 1, 1);
    const progressUnits = activeIndex >= 0 ? completedCount + 0.5 : completedCount;
    const targetRatio = clamp(progressUnits / denominator, 0, 1);
    const targetHeight = trackHeight * targetRatio;
    
    // Smooth fill animation with better easing
    const easing = Easing.bezier(0.33, 0.66, 0.66, 1);

    fillHeight.value = withTiming(targetHeight, {
      duration: 800,
      easing: easing,
    });

    if (activeIndex >= 0) {
      glowOpacity.value = withTiming(1, { duration: 240 });
      glowOffset.value = 0;
      glowOffset.value = withRepeat(
        withTiming(Math.max(targetHeight - GLOW_HEIGHT, 0), {
          duration: 1800,
          easing: Easing.linear,
        }),
        -1,
        false
      );
    } else {
      glowOpacity.value = withTiming(0, { duration: 220 });
    }
  }, [activeIndex, completedCount, containerHeight, fillHeight, glowOffset, glowOpacity, steps.length]);

  const fillStyle = useAnimatedStyle(() => ({
    height: fillHeight.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: glowOffset.value }],
    opacity: glowOpacity.value,
  }));

  const isComplete = completedCount === steps.length && steps.length > 0;

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height);
  };

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <View style={styles.lineTrack} pointerEvents="none">
        <View
          style={[
            styles.lineBase,
            {
              backgroundColor: pendingColor,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.lineFill,
            { backgroundColor: isComplete ? completionColor : processingColor },
            fillStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.lineGlow,
            glowStyle,
            {
              backgroundColor: hexToRgba(processingColor, isDark ? 0.5 : 0.4),
              shadowColor: processingColor,
            },
          ]}
        />
      </View>

      <View style={styles.stepsContainer}>
        {steps.map((step, index) => (
          <StepItem
            key={`${step.label}-${index}`}
            label={step.label}
            status={step.status}
            isLast={index === steps.length - 1}
            rowHeight={dynamicRowHeight}
            nodeSize={NODE_SIZE}
            index={index}
            totalSteps={steps.length}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    width: '100%',
    position: 'relative',
    paddingVertical: 8,
  },
  lineTrack: {
    position: 'absolute',
    top: TRACK_TOP,
    bottom: TRACK_BOTTOM,
    left: NODE_SIZE / 2 - LINE_WIDTH / 2,
    width: LINE_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
  },
  lineBase: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: LINE_WIDTH,
    borderRadius: 999,
  },
  lineFill: {
    position: 'absolute',
    top: 0,
    width: LINE_WIDTH,
    borderRadius: 999,
  },
  lineGlow: {
    position: 'absolute',
    top: 0,
    width: LINE_WIDTH + 2,
    height: GLOW_HEIGHT,
    borderRadius: 999,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 1,
    opacity: 0.52,
  },
  stepsContainer: {
    flex: 1,
    paddingLeft: NODE_SIZE + 24,
    paddingRight: STEP_PADDING,
  },
});

export { StepLoader };
export default StepLoader;