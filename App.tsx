/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useState, useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {StatusBar} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import {ThemeProvider} from './src/theme/ThemeContext';
import {User} from './src/types';
import {apiClient} from './src/services/ApiClient';

// Screens
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import JobDetailScreen from './src/screens/JobDetailScreen';
import Sidebar from './src/components/Sidebar';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Sample user data for testing
const sampleUser: User = {
  id: 'user1',
  name: 'John Smith',
  email: 'john@jsm.com',
  loginName: 'john.smith',
};

// Wrap app with theme context and providers
const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      console.log('Checking authentication status...');
      
      const isAuth = await apiClient.isAuthenticated();
      console.log('Authentication status:', isAuth);
      
      if (isAuth) {
        // Get saved user data from storage
        const savedUser = await apiClient.getSavedUser();
        if (savedUser) {
          console.log('User data loaded from storage');
          setCurrentUser(savedUser);
          setIsAuthenticated(true);
        } else {
          // No saved user, but token exists - use sample user
          console.log('No saved user data, using fallback');
          setCurrentUser(sampleUser);
          setIsAuthenticated(true);
        }
      } else {
        console.log('No valid token found, user needs to login');
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
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
  await apiClient.logout();
  await apiClient.setToken(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setCurrentUser(null);
      setIsAuthenticated(false);
    }
  };

  // Create wrapper components for consistent navigation
  const HomeScreenWrapper = (props: any) => (
    <HomeScreen {...props} onLogout={handleLogout} />
  );

  const JobDetailScreenWrapper = (props: any) => (
    <JobDetailScreen {...props} />
  );

  const MainStackNavigator = () => (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeScreenWrapper} />
      <Stack.Screen name="JobDetail" component={JobDetailScreenWrapper} />
    </Stack.Navigator>
  );

  const DrawerNavigator = () => (
    <Drawer.Navigator
      drawerContent={(props) => <Sidebar {...props} onLogout={handleLogout} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        overlayColor: 'rgba(0,0,0,0.5)',
        drawerStyle: {
          width: 280,
        },
      }}>
      <Drawer.Screen name="MainStack" component={MainStackNavigator} />
    </Drawer.Navigator>
  );

  if (isLoading) {
    return null; // You can add a loading screen here
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
          translucent={false}
        />
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
        <Toast />
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default App;
