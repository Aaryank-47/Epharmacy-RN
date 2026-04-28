import React, { useEffect, useRef } from 'react';
import { View, Text, Animated } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type TaskStatus = 'completed' | 'processing' | 'waiting';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  subtasks?: string[];
}

interface OCRProgressTimelineProps {
  isDark: boolean;
  tasks: Task[];
}

const getStatusIcon = (status: TaskStatus) => {
  switch (status) {
    case 'completed':
      return { icon: 'check-circle', color: '#10B981' };
    case 'processing':
      return { icon: 'circle', color: '#3B82F6' };
    case 'waiting':
      return { icon: 'circle-outline', color: '#D1D5DB' };
  }
};

const OCRProgressTimeline: React.FC<OCRProgressTimelineProps> = ({ isDark, tasks }) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 1],
  });

  return (
    <View style={{ marginTop: 22 }}>
      {/* Main Timeline Tasks */}
      {tasks && tasks.length > 0 ? tasks.map((task, index) => {
        const { icon, color } = getStatusIcon(task.status);
        const isProcessing = task.status === 'processing';

        return (
          <View key={task.id}>
            {/* Task Row */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <Animated.View
                style={[
                  {
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: 4,
                  },
                  isProcessing && { opacity },
                ]}
              >
                <Icon name={icon} size={20} color={color} />
              </Animated.View>

              <View style={{ flex: 1, paddingBottom: 6 }}>
                <View
                  style={{
                    backgroundColor: isDark ? '#1F2937' : '#F9FAFB',
                    borderRadius: 14,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderWidth: 1,
                    borderColor: isDark ? '#374151' : '#E5E7EB',
                    borderLeftWidth: 3,
                    borderLeftColor: color,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: isDark ? '#F9FAFB' : '#111827' }}>
                      {task.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 999,
                        backgroundColor:
                          task.status === 'completed'
                            ? '#ECFDF5'
                            : task.status === 'processing'
                              ? '#DBEAFE'
                              : isDark
                                ? '#374151'
                                : '#F3F4F6',
                        color:
                          task.status === 'completed'
                            ? '#065F46'
                            : task.status === 'processing'
                              ? '#0369A1'
                              : isDark
                                ? '#9CA3AF'
                                : '#6B7280',
                      }}
                    >
                      {task.status === 'completed'
                        ? '✔ Completed'
                        : task.status === 'processing'
                          ? '⏳ Processing'
                          : 'Waiting'}
                    </Text>
                  </View>

                  {/* Subtasks */}
                  {task.subtasks && task.subtasks.length > 0 && (
                    <View style={{ paddingLeft: 0 }}>
                      {task.subtasks.map((subtask, idx) => (
                        <Text
                          key={idx}
                          style={{
                            fontSize: 12,
                            color: isDark ? '#D1D5DB' : '#4B5563',
                            marginTop: 6,
                            lineHeight: 16,
                            fontWeight: '500',
                          }}
                        >
                          → {subtask}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Connector Line - Vertical separator */}
            {index < tasks.length - 1 && (
              <View
                style={{
                  marginLeft: 15,
                  marginVertical: 8,
                  width: 2,
                  height: 16,
                  backgroundColor: isDark ? '#4B5563' : '#D1D5DB',
                }}
              />
            )}
          </View>
        );
      }) : (
        <Text style={{ color: isDark ? '#9CA3AF' : '#6B7280', textAlign: 'center', padding: 20 }}>
          No tasks to display
        </Text>
      )}
    </View>
  );
};

export default OCRProgressTimeline;
