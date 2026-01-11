import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee from '@notifee/react-native';
import App from './App';
import { name as appName } from './app.json';
import './global.css';

// Background message handler
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  
  // Display notification using Notifee
  await notifee.displayNotification({
    title: remoteMessage.notification?.title || 'Notification',
    body: remoteMessage.notification?.body || 'You have a new notification',
    data: remoteMessage.data,
    android: {
      channelId: 'default',
      importance: 4, // HIGH
      pressAction: {
        id: 'default',
      },
      smallIcon: 'ic_launcher',
    },
    ios: {
      sound: 'default',
    },
  });
});

// Background event handler for Notifee
notifee.onBackgroundEvent(async ({ type, detail }) => {
  // Handle notification events in background
});

AppRegistry.registerComponent(appName, () => App);