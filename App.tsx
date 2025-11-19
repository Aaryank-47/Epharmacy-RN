/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StatusBar, StyleSheet, Text, useColorScheme } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent isDarkMode={isDarkMode} />
    </SafeAreaProvider>
  );
}

function AppContent({ isDarkMode }: { isDarkMode: boolean }) {
  return (
    <SafeAreaView
      style={[
        styles.container,
        isDarkMode ? styles.containerDark : styles.containerLight,
      ]}
      edges={['top', 'bottom', 'left', 'right']}
    >
      <Text
        style={[
          styles.message,
          isDarkMode ? styles.messageDark : styles.messageLight,
        ]}
      >
        Hello, World!
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  containerDark: {
    backgroundColor: '#030712',
  },
  containerLight: {
    backgroundColor: '#F9FAFB',
  },
  message: {
    fontSize: 28,
    fontWeight: '600',
  },
  messageDark: {
    color: '#F9FAFB',
  },
  messageLight: {
    color: '#030712',
  },
});

export default App;
