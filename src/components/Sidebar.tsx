import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {DrawerContentComponentProps} from '@react-navigation/drawer';
import {useTheme} from '../theme/ThemeContext';
import {User} from '../types';
import {apiClient} from '../services/ApiClient';

interface SidebarProps extends DrawerContentComponentProps {
  onLogout: () => Promise<void>;
}

const Sidebar: React.FC<SidebarProps> = ({navigation, onLogout}) => {
  const {theme, isDarkMode, setThemeMode} = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await apiClient.getSavedUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            navigation.closeDrawer();
            await onLogout();
          },
        },
      ]
    );
  };

  const handleThemeToggle = (value: boolean) => {
    setThemeMode(value ? 'dark' : 'light');
  };

  const menuItems = [
    {title: 'Home', onPress: () => navigation.navigate('Home')},
    {title: 'Job History', onPress: () => navigation.navigate('JobHistory')},
    {title: 'Settings', onPress: () => navigation.navigate('Settings')},
    {title: 'Manage Data', onPress: () => navigation.navigate('ManageData')},
  ];

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.card,
    },
    header: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 20,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    userSection: {
      alignItems: 'center',
      marginBottom: 10,
    },
    userName: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
      marginBottom: 4,
    },
    userEmail: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.8)',
    },
    menuContainer: {
      flex: 1,
      paddingTop: 20,
    },
    menuItem: {
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    menuText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    settingsSection: {
      paddingHorizontal: 20,
      paddingVertical: 15,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    themeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    themeText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    logoutButton: {
      backgroundColor: theme.colors.error || '#FF4444',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 8,
      alignItems: 'center',
    },
    logoutText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
  });

  return (
    <SafeAreaView style={dynamicStyles.container}>
      {/* Header with user info */}
      <View style={dynamicStyles.header}>
        <View style={dynamicStyles.userSection}>
          <Text style={dynamicStyles.userName}>
            {currentUser?.name || 'User'}
          </Text>
          <Text style={dynamicStyles.userEmail}>
            {currentUser?.email || 'user@jsm.com'}
          </Text>
        </View>
      </View>

      {/* Menu Items */}
      <ScrollView style={dynamicStyles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={dynamicStyles.menuItem}
            onPress={item.onPress}>
            <Text style={dynamicStyles.menuText}>{item.title}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Settings Section */}
      <View style={dynamicStyles.settingsSection}>
        {/* Theme Toggle */}
        <View style={dynamicStyles.themeContainer}>
          <Text style={dynamicStyles.themeText}>
            {isDarkMode ? 'Dark Mode' : 'Light Mode'}
          </Text>
          <Switch
            value={isDarkMode}
            onValueChange={handleThemeToggle}
            trackColor={{false: '#767577', true: theme.colors.primary}}
            thumbColor={isDarkMode ? '#f5dd4b' : '#f4f3f4'}
          />
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={dynamicStyles.logoutButton}
          onPress={handleLogout}>
          <Text style={dynamicStyles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default Sidebar;
