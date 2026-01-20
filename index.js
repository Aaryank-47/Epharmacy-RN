import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';

// Polyfill for Socket.IO
global.Buffer = global.Buffer || require('buffer').Buffer;

import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import { notificationService } from './src/services/notificationService';
import App from './App';
import { name as appName } from './app.json';
import './global.css';

// Background message handler
messaging().setBackgroundMessageHandler(notificationService.handleBackgroundMessage);

// Background event handler for Notifee
notifee.onBackgroundEvent(async ({ type, detail }) => {
  // Handle notification events in background
});

AppRegistry.registerComponent(appName, () => App);