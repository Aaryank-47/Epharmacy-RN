import React, { useMemo } from 'react';
import { View } from 'react-native';
import StepLoader, { StepData } from '../stepper/Stepper';

type TaskStatus = 'completed' | 'processing' | 'waiting';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
}

interface OCRProgressTimelineProps {
  isDark: boolean;
  tasks: Task[];
}
const OCRProgressTimeline: React.FC<OCRProgressTimelineProps> = ({ isDark: _isDark, tasks }) => {
  const stepData: StepData[] = useMemo(
    () =>
      tasks.map(task => ({
        label: task.title,
        status: task.status === 'waiting' ? 'pending' : task.status,
      })),
    [tasks]
  );

  return (
    <View style={{ marginTop: 22 }}>
      <StepLoader steps={stepData} />
    </View>
  );
};

export default OCRProgressTimeline;
