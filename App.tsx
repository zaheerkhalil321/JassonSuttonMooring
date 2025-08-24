/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
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

// Screens
import LoginScreen from "./src/screens/LoginScreen";
import HomeScreen from "./src/screens/HomeScreen";
import JobDetailScreen from "./src/screens/JobDetailScreen";
import Sidebar from "./src/components/Sidebar";
import JobEditScreen from "./src/screens/JobEditScreen";
import OperationsScreen from "./src/screens/OperationsScreen";
import ManageOperationsScreen from "./src/screens/ManageOperationsScreen";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Wrap app with theme context and providers
const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

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

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

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
        <NavigationContainer>
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
