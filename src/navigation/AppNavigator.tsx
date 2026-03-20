import React from 'react';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createDrawerNavigator} from '@react-navigation/drawer';
import {TouchableOpacity} from 'react-native';
import {useTheme} from '../theme/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import MooringLogForm from '../screens/MooringLogForm';
import ManageDataScreen from '../screens/ManageDataScreen';
import JobHistoryScreen from '../screens/JobHistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';
import OperationsScreen from '../screens/OperationsScreen';
import ManageOperationsScreen from '../screens/ManageOperationsScreen';
import JobDetailScreen from '../screens/JobDetailScreen';
import JobEditScreen from '../screens/JobEditScreen';
import ApplyLeaveScreen from '../screens/ApplyLeaveScreen';
import MyLeavesScreen from '../screens/MyLeavesScreen';
import TeamOnLeaveScreen from '../screens/TeamOnLeaveScreen';
import Sidebar from '../components/Sidebar';
import {apiClient} from '../services/ApiClient';

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Drawer Navigator for main app screens
function DrawerNavigator() {
  const {theme} = useTheme();

  const handleLogout = async () => {
    try {
      await apiClient.clearToken();
      // Navigate to login screen or restart app
      console.log('User logged out');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <Drawer.Navigator
      drawerContent={(props) => <Sidebar {...props} onLogout={handleLogout} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: theme.colors.card,
          width: 280,
        },
        drawerType: 'front',
        swipeEdgeWidth: 20,
      }}>
      <Drawer.Screen
        name="Home"
        component={HomeScreen}
        options={{
          drawerLabel: 'Home',
        }}
      />
      <Drawer.Screen
        name="Operations"
        component={OperationsScreen}
        options={{
          drawerLabel: 'Create Operation',
        }}
      />
      <Drawer.Screen
        name="ManageOperations"
        component={ManageOperationsScreen}
        options={{
          drawerLabel: 'Manage Operations',
        }}
      />
       <Stack.Screen
          name="ApplyLeave"
          component={ApplyLeaveScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MyLeaves"
          component={MyLeavesScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="TeamOnLeave"
          component={TeamOnLeaveScreen}
          options={{
            headerShown: false,
          }}
        />
    </Drawer.Navigator>
  );
}

const AppNavigator = () => {
  const {theme} = useTheme();

  // No need for splash screen hide since we're using native splash

  // Use React Navigation's built-in themes as base to avoid font issues
  const navigationTheme = theme.dark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.card,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.notification,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: theme.colors.primary,
          background: theme.colors.background,
          card: theme.colors.card,
          text: theme.colors.text,
          border: theme.colors.border,
          notification: theme.colors.notification,
        },
      };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="DrawerNav"
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="DrawerNav" component={DrawerNavigator} />
        <Stack.Screen 
          name="JobDetail" 
          component={JobDetailScreen}
          options={{
            headerShown: true,
            title: 'Job Details',
            headerStyle: {
              backgroundColor: theme.colors.card,
            },
            headerTintColor: theme.colors.text,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen 
          name="JobEdit" 
          component={JobEditScreen}
          options={{
            headerShown: true,
            title: 'Edit Job',
            headerStyle: {
              backgroundColor: theme.colors.card,
            },
            headerTintColor: theme.colors.text,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
       
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
