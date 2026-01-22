import React, { useEffect, useRef } from "react";
import { StatusBar, useColorScheme, AppState, AppStateStatus } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { enableScreens } from "react-native-screens";

import { Provider as ReduxProvider } from "react-redux";
import { AuthProvider } from "./src/context/AuthContext";
import { CartProvider } from "./src/context/CartContext";
import QueryProvider from "./src/providers/QueryProvider";
import { store } from "./src/store";
import { WishlistProvider } from "./src/context/WishlistContext";
import { SocketProvider } from "./src/context/SocketContext";

import AppNavigator from "./AppNavigator";
import loadIconFonts from "./src/utils/loadIconFonts";
import NotificationSetup from "./src/config/notificationSetup";
import NetworkStatusMonitor from "./src/context/NetworkStatusMonitor";
import socketService from "./src/services/socketService";

enableScreens(true);

export default function App() {
  const colorScheme = useColorScheme();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    loadIconFonts();
    console.log('[App] Startup - Bundle Loaded & Fonts Loading');
  }, []);

  // Handle app going to background/foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        
        if (!socketService.isConnected()) {
          socketService.connect();
        }
      }

      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SafeAreaView
          style={{
            flex: 1,
            backgroundColor: colorScheme === "dark" ? "#000000" : "#FFFFFF",
          }}
        >
          {/* TOP STATUS BAR */}
          <StatusBar
            translucent={false}
            backgroundColor={colorScheme === "dark" ? "#000000" : "#FFFFFF"}
            barStyle={colorScheme === "dark" ? "light-content" : "dark-content"}
          />

          {/* CONTEXT PROVIDERS */}
          <ReduxProvider store={store}>
            <QueryProvider>
              <CartProvider>
                <AuthProvider>
                  <NotificationSetup />

                  <WishlistProvider>
                    <SocketProvider>
                      <NetworkStatusMonitor>
                        <NavigationContainer
                          linking={{
                            prefixes: ['epharmacy://', 'https://epharmacy.app'],
                            config: {
                              screens: {
                                ProductDetail: 'product/:productId',
                              },
                            },
                          }}
                        >
                          <AppNavigator />
                        </NavigationContainer>
                      </NetworkStatusMonitor>
                    </SocketProvider>
                  </WishlistProvider>
                </AuthProvider>
              </CartProvider>
            </QueryProvider>
          </ReduxProvider>
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
