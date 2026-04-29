import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Feather';
import { useThemePalette } from '../../hooks/useThemePalette';

export type StepStatus = 'completed' | 'processing' | 'loading' | 'pending';

interface StepItemProps {
  label: string;
  status: StepStatus;
  isLast?: boolean;
  rowHeight?: number;
  nodeSize?: number;
  index?: number;
  totalSteps?: number;
}

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

const StepItem: React.FC<StepItemProps> = ({ 
  label, 
  status, 
  isLast, 
  rowHeight = 120, 
  nodeSize = 32
}) => {
  const { isDark, success, primary } = useThemePalette();
  const isActive = status === 'processing' || status === 'loading';
  const isCompleted = status === 'completed';
  const completionColor = success;
  const processingColor = primary;
  const pendingColor = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.12)';

  const checkScale = useSharedValue(status === 'completed' ? 1 : 0.7);
  const checkOpacity = useSharedValue(status === 'completed' ? 1 : 0);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0);

  useEffect(() => {
    if (status === 'completed') {
      checkScale.value = withSpring(1, { damping: 11, stiffness: 160, mass: 0.7 });
      checkOpacity.value = withTiming(1, { duration: 180 });
      ringScale.value = withTiming(1);
      ringOpacity.value = withTiming(0, { duration: 140 });
      return;
    }

    if (isActive) {
      checkOpacity.value = withTiming(0, { duration: 120 });
      checkScale.value = withTiming(0.7, { duration: 120 });
      ringScale.value = withRepeat(
        withTiming(1.22, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
      ringOpacity.value = withRepeat(
        withTiming(0.18, { duration: 900, easing: Easing.inOut(Easing.quad) }),
        -1,
        true
      );
      return;
    }

    checkScale.value = withTiming(0.7, { duration: 120 });
    checkOpacity.value = withTiming(0, { duration: 120 });
    ringScale.value = withTiming(1, { duration: 120 });
    ringOpacity.value = withTiming(0, { duration: 120 });
  }, [checkOpacity, checkScale, isActive, ringOpacity, ringScale, status]);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  const badgeText = status === 'completed' ? 'Done' : isActive ? 'Active' : 'Pending';

  const badgeStyle = isCompleted
    ? {
        backgroundColor: hexToRgba(completionColor, isDark ? 0.14 : 0.10),
        color: completionColor,
      }
    : isActive
      ? {
          backgroundColor: hexToRgba(processingColor, isDark ? 0.14 : 0.09),
          color: processingColor,
        }
      : {
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)',
          color: isDark ? 'rgba(255,255,255,0.60)' : '#78716C',
        };

  return (
    <View style={[styles.row, { minHeight: rowHeight, paddingBottom: isLast ? 12 : 0 }]}> 
      <View style={styles.nodeCol}>
        <View style={[styles.nodeFrame, { width: nodeSize, height: nodeSize }]}>
          {isCompleted ? (
            <Animated.View
              style={[
                styles.completedNode,
                {
                  width: nodeSize,
                  height: nodeSize,
                  borderRadius: nodeSize / 2,
                  backgroundColor: completionColor,
                },
                checkStyle,
              ]}
            >
              <Icon name="check" size={16} color="#FFFFFF" strokeWidth={3} />
            </Animated.View>
          ) : isActive ? (
            <View style={{ width: nodeSize, height: nodeSize, alignItems: 'center', justifyContent: 'center' }}>
              <Animated.View
                style={[
                  styles.processingHalo,
                  {
                    width: nodeSize + 14,
                    height: nodeSize + 14,
                    borderRadius: (nodeSize + 14) / 2,
                    borderColor: processingColor,
                  },
                  ringStyle,
                ]}
              />
              <View
                style={[
                  styles.processingCore,
                  {
                    width: nodeSize,
                    height: nodeSize,
                    borderRadius: nodeSize / 2,
                    borderColor: processingColor,
                    backgroundColor: hexToRgba(processingColor, isDark ? 0.12 : 0.08),
                  },
                ]}
              />
            </View>
          ) : (
            <View
              style={[
                styles.pendingNode,
                {
                  width: nodeSize,
                  height: nodeSize,
                  borderRadius: nodeSize / 2,
                  borderColor: pendingColor,
                  opacity: isDark ? 0.85 : 0.75,
                },
              ]}
            />
          )}
        </View>
      </View>

      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.018)' : 'rgba(15,23,42,0.012)',
            shadowColor: isDark ? '#000000' : '#0F172A',
            borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(15,23,42,0.05)',
          },
        ]}
      >
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { color: isDark ? '#F1F5F9' : '#0F172A' }]} numberOfLines={2}>
            {label}
          </Text>
        </View>

        <View style={[styles.badge, { backgroundColor: badgeStyle.backgroundColor }]}>
          <Text style={[styles.badgeText, { color: badgeStyle.color }]}>{badgeText}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingRight: 8,
  },
  nodeCol: {
    width: 56,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 16,
  },
  nodeFrame: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedNode: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  processingHalo: {
    position: 'absolute',
    borderWidth: 1.2,
    shadowOpacity: 0.14,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  processingCore: {
    borderWidth: 1.5,
  },
  pendingNode: {
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  labelContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    flex: 1,
    minHeight: 64,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    shadowOpacity: 0.04,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
    marginTop: 8,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginRight: 12,
    lineHeight: 20,
  },
  badge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});

export default StepItem;