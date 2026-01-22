/**
 * Connection Indicator Component
 * Visual indicator for WebSocket connection status
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSocketContext } from '../context/SocketContext';
import { ConnectionStatus } from '../services/socketEvents.types';

interface ConnectionIndicatorProps {
    showLabel?: boolean;
    size?: 'small' | 'medium' | 'large';
    style?: object;
}

const STATUS_CONFIG: Record<ConnectionStatus, { color: string; label: string }> = {
    connected: { color: '#22C55E', label: 'Live' },
    disconnected: { color: '#EF4444', label: 'Offline' },
    connecting: { color: '#F59E0B', label: 'Connecting...' },
    error: { color: '#EF4444', label: 'Error' },
};

const SIZE_CONFIG = {
    small: { dot: 6, fontSize: 10 },
    medium: { dot: 8, fontSize: 12 },
    large: { dot: 10, fontSize: 14 },
};

function ConnectionIndicator({
    showLabel = false,
    size = 'small',
    style,
}: ConnectionIndicatorProps): React.ReactElement {
    const { connectionStatus } = useSocketContext();
    const { color, label } = STATUS_CONFIG[connectionStatus];
    const { dot, fontSize } = SIZE_CONFIG[size];

    return (
        <View style={[styles.container, style]}>
            <View
                style={[
                    styles.dot,
                    {
                        width: dot,
                        height: dot,
                        borderRadius: dot / 2,
                        backgroundColor: color,
                    },
                ]}
            />
            {showLabel && (
                <Text style={[styles.label, { fontSize, color }]}>{label}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dot: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    label: {
        fontWeight: '600',
    },
});

export default memo(ConnectionIndicator);