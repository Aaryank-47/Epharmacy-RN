import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import StepItem, { StepStatus } from './StepItem';

export interface StepData {
  label: string;
  status: StepStatus;
}

interface StepperProps {
  steps: StepData[];
  width?: number;
}

const Stepper: React.FC<StepperProps> = ({ steps, width }) => {
  const [containerHeight, setContainerHeight] = useState(0);
  const fillHeight = useSharedValue(0);

  const activeIndex = useMemo(
    () => steps.findIndex(step => step.status === 'loading'),
    [steps]
  );

  useEffect(() => {
    if (containerHeight <= 0) {
      return;
    }

    const stepCount = Math.max(steps.length, 1);
    const stepHeight = containerHeight / stepCount;

    if (activeIndex < 0) {
      const completedCount = steps.filter(step => step.status === 'completed').length;
      fillHeight.value = withTiming((containerHeight / stepCount) * completedCount, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      });
      return;
    }

    const targetHeight = stepHeight * (activeIndex + 0.5);
    fillHeight.value = withTiming(targetHeight, {
      duration: 700,
      easing: Easing.out(Easing.cubic),
    });
  }, [activeIndex, containerHeight, steps]);

  const fillStyle = useAnimatedStyle(() => ({
    height: fillHeight.value,
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerHeight(event.nativeEvent.layout.height);
  };

  return (
    <View style={[styles.container, width ? { width } : undefined]} onLayout={handleLayout}>
      <View style={styles.trackWrap} pointerEvents="none">
        <View style={styles.track} />
        <Animated.View style={[styles.trackFill, fillStyle]} />
      </View>

      <View style={styles.itemsWrap}>
        {steps.map((step, index) => (
          <StepItem
            key={`${step.label}-${index}`}
            label={step.label}
            status={step.status}
            isLast={index === steps.length - 1}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    paddingVertical: 8,
  },
  trackWrap: {
    position: 'absolute',
    top: 16,
    bottom: 16,
    left: 18,
    width: 4,
    zIndex: 1,
  },
  track: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderRadius: 999,
    backgroundColor: '#E5E7EB',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 4,
    borderRadius: 999,
    backgroundColor: '#22C55E',
  },
  itemsWrap: {
    zIndex: 2,
  },
});

export default Stepper;
