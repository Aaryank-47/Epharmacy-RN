/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { StatusBar, Text, View, useColorScheme } from 'react-native';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const bgClass = isDarkMode ? 'bg-slate-950' : 'bg-slate-100';
  const textClass = isDarkMode ? 'text-slate-100' : 'text-slate-900';

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View className={`flex-1 justify-center items-center ${bgClass}`}>
        <Text className={`text-3xl font-semibold ${textClass}`}>
          Hello, World!
        </Text>
      </View>
    </>
  );
}

export default App;
