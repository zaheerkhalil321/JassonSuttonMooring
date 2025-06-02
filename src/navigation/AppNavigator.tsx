import React, {useEffect} from 'react';
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {TouchableOpacity} from 'react-native';
import {useTheme} from '../theme/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import SplashScreen from 'react-native-splash-screen';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import MooringLogForm from '../screens/MooringLogForm';
import ManageDataScreen from '../screens/ManageDataScreen';
import JobHistoryScreen from '../screens/JobHistoryScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const {theme} = useTheme();

  useEffect(() => {
    SplashScreen.hide();
  }, []);

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
        initialRouteName="Home"
        screenOptions={({navigation}) => ({
          headerStyle: {
            backgroundColor: theme.colors.card,
          },
          headerTintColor: theme.colors.text,
          // Remove the empty header title so we can set individual titles
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          animation: 'slide_from_right',
          headerShadowVisible: false,
          // Custom back button (just the icon)
          headerLeft: ({canGoBack}) =>
            canGoBack ? (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{marginLeft: 10}}>
                <Ionicons
                  name="arrow-back"
                  size={24}
                  color={theme.colors.text}
                />
              </TouchableOpacity>
            ) : null,
        })}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="MooringLog"
          component={MooringLogForm}
          options={{
            title: 'Mooring Log',
          }}
        />
        <Stack.Screen
          name="ManageData"
          component={ManageDataScreen}
          options={{
            title: 'Manage Data',
          }}
        />
        <Stack.Screen
          name="JobHistory"
          component={JobHistoryScreen}
          options={{
            title: 'Job History',
          }}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            title: 'Settings',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
