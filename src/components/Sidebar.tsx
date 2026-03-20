import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {DrawerContentComponentProps} from '@react-navigation/drawer';
import {useTheme} from '../theme/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {User} from '../types';
import {apiClient} from '../services/ApiClient';

interface SidebarProps extends DrawerContentComponentProps {
  onLogout: () => Promise<void>;
}

const Sidebar: React.FC<SidebarProps> = ({navigation, state, onLogout}) => {
  const {theme} = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Get the current route name
  const currentRouteName = state?.routes[state.index]?.name || 'Home';
  console.log("🚀 ~ Sidebar ~ currentRouteName:", currentRouteName)

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
    {
      title: 'Home',
      route: 'MainStack',
      icon: 'home-outline',
      onPress: () => navigation.navigate('MainStack'),
    },
    {
      title: 'Create Operation',
      route: 'OperationCreate',
      icon: 'add-circle-outline',
      onPress: () => navigation.navigate('OperationCreate'),
    },
    {
      title: 'Manage Operations',
      route: 'ManageOperation',
      icon: 'list-outline',
      onPress: () => navigation.navigate('ManageOperation'),
    },
    {
      title: 'Apply for Leave',
      route: 'ApplyLeave',
      icon: 'calendar-outline',
      onPress: () => {
        navigation.closeDrawer();
        navigation.navigate('ApplyLeave', { currentUser });
      },
    },
    {
      title: 'My Leaves',
      route: 'MyLeaves',
      icon: 'calendar-number-outline',
      onPress: () => {
        navigation.closeDrawer();
        navigation.navigate('MyLeaves', { currentUser });
      },
    },
    {
      title: 'Team on Leave',
      route: 'TeamOnLeave',
      icon: 'people-outline',
      onPress: () => {
        navigation.closeDrawer();
        navigation.navigate('TeamOnLeave');
      },
    },
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
      marginTop: -10,
      ...Platform.select({
        ios: {
          paddingTop: 0,
        },
        android: {
          paddingTop: 40,
        },
      }),
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
    menuItemActive: {
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: theme.colors.primary + '20', // Light background for active
    },
    menuText: {
      fontSize: 16,
      color: theme.colors.text,
    },
    menuTextActive: {
      fontSize: 16,
      color: theme.colors.primary,
      fontWeight: 'bold',
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
          {menuItems.map((item, index) => {
            const isActive = currentRouteName === item.route;
            // Separator before leave section
            const isLeaveSection = index === 3;
            return (
              <React.Fragment key={index}>
                {isLeaveSection && (
                  <View style={{paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4}}>
                    <Text style={{fontSize: 11, fontWeight: '700', color: theme.colors.placeholder, letterSpacing: 1, textTransform: 'uppercase'}}>
                      Leave Management
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={[
                    isActive ? dynamicStyles.menuItemActive : dynamicStyles.menuItem,
                    {flexDirection: 'row', alignItems: 'center', gap: 12},
                  ]}
                  onPress={item.onPress}>
                  <Ionicons
                    name={(item as any).icon || 'ellipse-outline'}
                    size={20}
                    color={isActive ? theme.colors.primary : theme.colors.placeholder}
                  />
                  <Text style={isActive ? dynamicStyles.menuTextActive : dynamicStyles.menuText}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              </React.Fragment>
            );
          })}
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
