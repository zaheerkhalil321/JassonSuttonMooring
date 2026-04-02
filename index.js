/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
// import messaging from '@react-native-firebase/messaging';

// Register background handler for when app is in background or killed state
// messaging().setBackgroundMessageHandler(async remoteMessage => {
//   try {
//     console.log('🔔 Background Message Handler - Message received:', {
//       title: remoteMessage.notification?.title,
//       body: remoteMessage.notification?.body,
//       data: remoteMessage.data,
//       sentTime: remoteMessage.sentTime,
//       messageId: remoteMessage.messageId,
//     });

//     // Process the message here
//     // This runs even when app is killed
//     // Note: Navigation is not available here, but we can log/store data

//     // Optional: You can store the message if needed for later processing
//     // when the app opens and is authenticated
//     console.log('✅ Background message processed successfully');
//   } catch (error) {
//     console.error('❌ Error handling background message:', error);
//   }
// });

// Set up additional Firebase configuration
// messaging().setAutoInitEnabled(true); // Auto-initialize messaging

AppRegistry.registerComponent(appName, () => App);
