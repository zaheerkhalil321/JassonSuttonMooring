import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
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
  const {theme} = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await apiClient.getSavedUser();
      setCurrentUser(user?.user);
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

  const menuItems = [
    {title: 'Home', onPress: () => navigation.navigate('MainStack')},
  ];

  const dynamicStyles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.card,
      paddingBottom:20
    },
    header: {
      backgroundColor: theme.colors.primary,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      paddingBottom:20,
      marginTop:-10
    },
    userSection: {
      alignItems: 'center',
      marginBottom: 10,
    },
    userName: {
      fontSize: 24,
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
    <View style={[dynamicStyles.container, {backgroundColor: 'white'}]}>
    <SafeAreaView style={[ {backgroundColor: theme.colors.primary}]} />
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

      {/* Menu Items - with white background */}
      <View style={{flex: 1, backgroundColor: theme.colors.card}}>
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
          {/* Logout Button */}
          <TouchableOpacity
            style={dynamicStyles.logoutButton}
            onPress={handleLogout}>
            <Text style={dynamicStyles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default Sidebar;
