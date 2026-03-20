/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect, useRef } from "react";
import { NavigationContainer, NavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { ThemeProvider } from "./src/theme/ThemeContext";
import { User } from "./src/types";
import { apiClient } from "./src/services/ApiClient";
// import messaging from '@react-native-firebase/messaging';

// Screens
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import JobDetailScreen from "./src/screens/JobDetailScreen";
import Sidebar from "./src/components/Sidebar";
import JobEditScreen from "./src/screens/JobEditScreen";
import OperationsScreen from "./src/screens/OperationsScreen";
import ManageOperationsScreen from "./src/screens/ManageOperationsScreen";
import ApplyLeaveScreen from "./src/screens/ApplyLeaveScreen";
import MyLeavesScreen from "./src/screens/MyLeavesScreen";
import TeamOnLeaveScreen from "./src/screens/TeamOnLeaveScreen";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Navigation ref for programmatic navigation from notifications
export const navigationRef = React.createRef<NavigationContainerRef<any>>();

// Store pending notification to handle after login
let pendingNotification: any = null;

// Wrap app with theme context and providers
const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
    // getAndSendFCMToken()

    // Register logout handler so ApiClient can notify the app when token is cleared (e.g., on 401)
    apiClient.setLogoutHandler(() => {
      // ensure state updates happen on main thread
      setCurrentUser(null);
      setIsAuthenticated(false);
    });

    // Set up Firebase messaging handlers and return cleanup
    // return setupNotificationHandlers();
  }, []);

  const initializeApp = async () => {
    // Check for initial notification first
    // await checkInitialNotification();
    // Then check auth status
    await checkAuthStatus();
  };

  // const checkInitialNotification = async () => {
  //   try {
  //     console.log('🔍 Checking for initial notification (app closed scenario)...');
  //     const remoteMessage = await messaging().getInitialNotification();
  //     if (remoteMessage) {
  //       console.log('📱 App launched from notification (was closed):', {
  //         title: remoteMessage.notification?.title,
  //         body: remoteMessage.notification?.body,
  //         data: remoteMessage.data,
  //       });
  //       pendingNotification = remoteMessage;
  //     } else {
  //       console.log('✓ No initial notification - app opened normally');
  //     }
  //   } catch (error) {
  //     console.error('Error checking initial notification:', error);
  //   }
  // };

  // Process pending notification after auth check and navigation ready
  // useEffect(() => {
  //   if (pendingNotification && isAuthenticated && navigationRef.current && !isLoading) {
  //     console.log('✅ Processing pending notification after authentication:', pendingNotification);
  //     setTimeout(() => {
  //       handleNotificationAction(pendingNotification);
  //     }, 500);
  //     pendingNotification = null;
  //   } else if (pendingNotification && !isAuthenticated && !isLoading) {
  //     console.log('⏳ Pending notification waiting for authentication...');
  //   }
  // }, [isAuthenticated, isLoading]);

  const checkAuthStatus = async () => {
    setIsLoading(true);
    try {
      const storage = await apiClient.getSavedUser();
      if (storage) {
        if (storage.accessToken) {
          setIsAuthenticated(true);
          setCurrentUser(storage);
        } else {
          await apiClient.clearToken();
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.log("🚀 ~ checkAuthStatus ~ error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // const setupNotificationHandlers = () => {
  //   // Handle messages when app is in foreground
  //   const unsubscribeOnMessage = messaging().onMessage(async remoteMessage => {
  //     console.log('🟢 FOREGROUND: Notification received while app is in foreground:', {
  //       title: remoteMessage.notification?.title,
  //       body: remoteMessage.notification?.body,
  //       data: remoteMessage.data,
  //     });
      
  //     // Show toast notification
  //     Toast.show({
  //       type: 'info',
  //       text1: remoteMessage.notification?.title || 'New Notification',
  //       text2: remoteMessage.notification?.body || '',
  //     });

  //     // Handle notification action if needed
  //     if (isAuthenticated) {
  //       handleNotificationAction(remoteMessage);
  //     } else {
  //       console.log('ℹ️ User not authenticated yet, storing notification');
  //       pendingNotification = remoteMessage;
  //     }
  //   });

  //   // Handle notification opened from background state
  //   const unsubscribeOnNotificationOpenedApp = messaging().onNotificationOpenedApp(remoteMessage => {
  //     console.log('🟡 BACKGROUND → FOREGROUND: User tapped notification from background:', {
  //       title: remoteMessage.notification?.title,
  //       body: remoteMessage.notification?.body,
  //       data: remoteMessage.data,
  //     });
  //     // Handle navigation or actions based on notification data
  //     handleNotificationAction(remoteMessage);
  //   });

  //   // Return cleanup function
  //   return () => {
  //     unsubscribeOnMessage();
  //     unsubscribeOnNotificationOpenedApp();
  //   };
  // };

  // const handleNotificationAction = (remoteMessage: any) => {
  //   // Handle different notification types
  //   const { data } = remoteMessage;

  //   console.log('📋 Handling notification action with data:', data);

  //   if (data?.type === 'job_update' && data?.jobId && isAuthenticated) {
  //     // Navigate to job detail
  //     if (navigationRef.current) {
  //       console.log('🔗 Navigating to JobDetail screen with jobId:', data.jobId);
  //       navigationRef.current.navigate('JobDetail', { jobId: data.jobId });
  //     } else {
  //       console.warn('⚠️ Navigation ref not ready');
  //     }
  //   } else if (data?.type === 'new_job') {
  //     // Refresh jobs list - could emit an event or call a refresh function
  //     console.log('🆕 New job notification - refresh jobs list');
  //     // You could trigger a refresh here if needed
  //   } else {
  //     console.log('❓ Unknown notification type:', data?.type);
  //   }
  //   // Add more notification types as needed
  // };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    // Get and send FCM token after login
    // getAndSendFCMToken();
  };

  // const getAndSendFCMToken = async () => {
  //   try {
  //     console.log('🔐 Starting FCM token setup process...');
      
  //     // Check current authorization status
  //     const authStatus = await messaging().hasPermission();
  //     console.log('📊 FCM Authorization status:', authStatus);

  //     let enabled = false;

  //     if (authStatus === messaging.AuthorizationStatus.AUTHORIZED) {
  //       console.log('✅ FCM: Already authorized');
  //       enabled = true;
  //     } else if (authStatus === messaging.AuthorizationStatus.NOT_DETERMINED) {
  //       console.log('❓ FCM: Requesting permission from user...');
  //       const newAuthStatus = await messaging().requestPermission();
  //       enabled = newAuthStatus === messaging.AuthorizationStatus.AUTHORIZED ||
  //                newAuthStatus === messaging.AuthorizationStatus.PROVISIONAL;
  //       console.log(`📱 FCM: Permission result - ${newAuthStatus} - ${enabled ? '✅ GRANTED' : '❌ DENIED'}`);
  //     } else {
  //       console.log('🚫 FCM: Permission denied or not available');
  //     }

  //     if (enabled) {
  //       // Get FCM token
  //       const fcmToken = await messaging().getToken();
  //       console.log('🎫 FCM Token obtained:', fcmToken );

  //       if (fcmToken) {
  //         // Send token to API
  //         console.log('📤 Sending FCM token to API endpoint...');
  //         const result = await apiClient.sendFCMToken(fcmToken);
  //         if (result.success) {
  //           console.log('✅ FCM token sent to API successfully');
  //         } else {
  //           console.error('❌ Failed to send FCM token to API:', result.message);
  //         }
  //       } else {
  //         console.error('❌ Failed to get FCM token');
  //       }
  //     } else {
  //       console.log('ℹ️ FCM: Notifications not enabled by user');
  //       // You might want to show a message to the user
  //     }
  //   } catch (error) {
  //     console.error('❌ Error setting up FCM:', error);
  //   }
  // };

  const handleLogout = async () => {
    try {
      await apiClient.setToken(null);
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
  };

  // Create wrapper components for consistent navigation
  const HomeScreenWrapper = (props: any) => (
    <HomeScreen {...props} onLogout={handleLogout} />
  );

  const JobDetailScreenWrapper = (props: any) => <JobDetailScreen {...props} />;

  const MainStackNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreenWrapper} />
      <Stack.Screen name="JobDetail" component={JobDetailScreenWrapper} />
       <Stack.Screen name="JobEdit" component={JobEditScreen} />
     
      {/* Add other screens as needed */}
      
    </Stack.Navigator>
  );

  const DrawerNavigator = () => (
    <Drawer.Navigator
      drawerContent={(props) => <Sidebar {...props} onLogout={handleLogout} />}
      screenOptions={{
        headerShown: false,
        drawerType: "slide",
        overlayColor: "rgba(0,0,0,0.5)",
        drawerStyle: {
          width: 280,
        },
      }}
    >
      <Drawer.Screen name="MainStack" component={MainStackNavigator} />
      <Stack.Screen name="OperationCreate" component={OperationsScreen} />
      <Stack.Screen name="ManageOperation" component={ManageOperationsScreen} />
      <Stack.Screen name="ApplyLeave" component={ApplyLeaveScreen} />
      <Stack.Screen name="MyLeaves" component={MyLeavesScreen} />
      <Stack.Screen name="TeamOnLeave" component={TeamOnLeaveScreen} />
    </Drawer.Navigator>
  );

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
          translucent={false}
        />
         <KeyboardProvider>
        <NavigationContainer ref={navigationRef}>
          {!isAuthenticated || !currentUser ? (
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Login">
                {(props) => (
                  <LoginScreen {...props} onLoginSuccess={handleLoginSuccess} />
                )}
              </Stack.Screen>
            </Stack.Navigator>
          ) : (
            <DrawerNavigator />
          )}
        </NavigationContainer>
        </KeyboardProvider>
        <Toast />
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
