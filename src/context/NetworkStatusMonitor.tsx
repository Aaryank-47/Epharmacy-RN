/**
 * NetworkStatusMonitor
 * Global component that monitors network changes in real-time
 * and displays offline screen as overlay when connection is lost
 */

import React, { useEffect, useState } from 'react';
import { Modal } from 'react-native';
import NoConnectionScreen from '../components/commonPage/NoConnectionScreen';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

const NetworkStatusMonitor: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { isOffline, checkConnection } = useNetworkStatus();
    const [showOfflineScreen, setShowOfflineScreen] = useState(false);

    useEffect(() => {
        // Show offline screen when connection is lost
        if (isOffline) {
            setShowOfflineScreen(true);
        } else {
            setShowOfflineScreen(false);
        }
    }, [isOffline]);

    const handleRetry = async () => {
        await checkConnection();
    };

    return (
        <>
            {children}

            {/* Offline Modal - Full Screen Overlay */}
            <Modal
                visible={showOfflineScreen}
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => {
                    // Android back button - check connection
                    handleRetry();
                }}
            >
                <NoConnectionScreen onRetry={handleRetry} />
            </Modal>
        </>
    );
};

export default NetworkStatusMonitor;
