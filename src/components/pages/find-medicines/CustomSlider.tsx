import React, { useRef, useState, useCallback } from 'react';
import { View, PanResponder } from 'react-native';

interface Props {
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
  accentColor: string;
  trackColor?: string;
  step?: number;
}

export const CustomSlider: React.FC<Props> = ({
  min,
  max,
  value,
  onChange,
  accentColor,
  trackColor = '#E5E7EB',
  step = 1,
}) => {
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);

  const snap = useCallback((v: number) => {
    const snapped = Math.round(v / step) * step;
    return Math.max(min, Math.min(max, snapped));
  }, [min, max, step]);

  const handleTouch = useCallback((locationX: number) => {
    if (widthRef.current === 0) return;
    const ratio = Math.max(0, Math.min(1, locationX / widthRef.current));
    onChange(snap(min + (max - min) * ratio));
  }, [min, max, snap, onChange]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: evt => handleTouch(evt.nativeEvent.locationX),
      onPanResponderMove: evt => handleTouch(evt.nativeEvent.locationX),
    })
  ).current;

  const ratio = width > 0 ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0;
  const thumbLeft = ratio * width - 10;

  return (
    <View
      onLayout={e => {
        widthRef.current = e.nativeEvent.layout.width;
        setWidth(e.nativeEvent.layout.width);
      }}
      style={{ height: 36, justifyContent: 'center' }}
      {...panResponder.panHandlers}
    >
      {/* Track */}
      <View style={{ height: 4, borderRadius: 2, backgroundColor: trackColor }}>
        <View
          style={{
            height: 4,
            borderRadius: 2,
            backgroundColor: accentColor,
            width: `${ratio * 100}%`,
          }}
        />
      </View>
      {/* Thumb */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: Math.max(0, Math.min(thumbLeft, width - 20)),
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: accentColor,
          elevation: 4,
          shadowColor: accentColor,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.45,
          shadowRadius: 4,
        }}
      />
    </View>
  );
};
