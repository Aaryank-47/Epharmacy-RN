import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemePalette } from '../../hooks/useThemePalette';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const HistoryPage = () => {
    const { isDark, surfaceColor } = useThemePalette();
    const navigation = useNavigation();

    return (
        <View style={[styles.container, { backgroundColor: surfaceColor }]}>
            <View style={styles.header}>
                <MaterialCommunityIcons
                    name="arrow-left"
                    size={24}
                    color={isDark ? '#fff' : '#000'}
                    onPress={() => navigation.goBack()}
                />
                <Text style={[styles.title, { color: isDark ? '#fff' : '#000' }]}>History</Text>
            </View>
            <View style={styles.content}>
                <Text style={[styles.text, { color: isDark ? '#fff' : '#000' }]}>No history available yet.</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 16,
    },
});

export default HistoryPage;
