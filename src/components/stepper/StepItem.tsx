import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import LottieView from 'lottie-react-native';
import { useThemePalette } from '../../hooks/useThemePalette';

export type StepStatus = 'completed' | 'loading' | 'pending';

interface StepItemProps {
  label: string;
  status: StepStatus;
  isLast?: boolean;
}

const StepItem: React.FC<StepItemProps> = ({ label, status }) => {
  const { isDark } = useThemePalette();
  const checkScale = useSharedValue(status === 'completed' ? 1 : 0.7);
  const checkOpacity = useSharedValue(status === 'completed' ? 1 : 0);

  useEffect(() => {
    if (status === 'completed') {
      checkScale.value = withSpring(1, {
        damping: 10,
        stiffness: 160,
        mass: 0.7,
      });
      checkOpacity.value = withTiming(1, { duration: 220 });
      return;
    }

    if (status === 'loading') {
      checkScale.value = withTiming(1, { duration: 120 });
      checkOpacity.value = withTiming(0, { duration: 120 });
      return;
    }

    checkScale.value = withTiming(0.7, { duration: 160 });
    checkOpacity.value = withTiming(0, { duration: 160 });
  }, [checkOpacity, checkScale, status]);

  const completedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  const renderNode = () => {
    if (status === 'completed') {
      return (
        <Animated.View style={[styles.nodeInner, styles.completedNode, completedStyle]}>
          <Text style={styles.checkMark}>✔</Text>
        </Animated.View>
      );
    }

    if (status === 'loading') {
      return (
        <View style={[styles.nodeInner, styles.loadingNode]}>
          <LottieView
            source={require('../../assets/animations/loader.json')}
            autoPlay
            loop
            style={styles.lottie}
          />
        </View>
      );
    }

    return <View style={[styles.nodeInner, styles.pendingNode, { borderColor: isDark ? '#6B7280' : '#CBD5E1' }]} />;
  };

  const statusLabel =
    status === 'completed' ? 'Completed' : status === 'loading' ? 'In Progress' : 'Pending';

  return (
    <View style={styles.row}>
      <View style={styles.leftCol}>
        <View style={styles.nodeWrap}>{renderNode()}</View>
      </View>

      <View style={styles.rightCol}>
        <Text style={[styles.label, { color: isDark ? '#F9FAFB' : '#111827' }]}>{label}</Text>
        <Text
          style={[
            styles.status,
            {
              color:
                status === 'completed'
                  ? '#16A34A'
                  : status === 'loading'
                    ? '#2563EB'
                    : isDark
                      ? '#9CA3AF'
                      : '#6B7280',
            },
          ]}
        >
          {statusLabel}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingRight: 16,
  },
  leftCol: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedNode: {
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  loadingNode: {
    backgroundColor: '#DBEAFE',
    overflow: 'hidden',
  },
  pendingNode: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
  },
  lottie: {
    width: 42,
    height: 42,
    marginTop: -7,
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  rightCol: {
    flex: 1,
    paddingLeft: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  status: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default StepItem;
