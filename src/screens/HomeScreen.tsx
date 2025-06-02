import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useTheme} from '../theme/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface NavigationContainerProps {
  title: string;
  description: string;
  iconName: string;
  onPress: () => void;
  color: string;
}

const NavigationContainer: React.FC<NavigationContainerProps> = ({
  title,
  description,
  iconName,
  onPress,
  color,
}) => {
  const {theme} = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.navContainer,
        {
          backgroundColor: theme.colors.card,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.text,
        },
      ]}
      onPress={onPress}>
      <View style={[styles.iconContainer, {backgroundColor: color + '20'}]}>
        <Ionicons name={iconName} size={30} color={color} />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, {color: theme.colors.text}]}>{title}</Text>
        <Text style={[styles.description, {color: theme.colors.placeholder}]}>
          {description}
        </Text>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={theme.colors.placeholder}
      />
    </TouchableOpacity>
  );
};

const HomeScreen: React.FC<{navigation: any}> = ({navigation}) => {
  const {theme, toggleDarkMode} = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, {color: theme.colors.text}]}>
          Mooring Management
        </Text>
        <TouchableOpacity
          onPress={toggleDarkMode}
          style={[
            styles.themeToggle,
            {
              backgroundColor: theme.dark
                ? theme.colors.primary + '20'
                : theme.colors.card,
            },
          ]}></TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
          Main Activities
        </Text>

        <NavigationContainer
          title="Mooring Log"
          description="Record and manage mooring operations"
          iconName="boat"
          color={theme.colors.primary}
          onPress={() => navigation.navigate('MooringLog')}
        />

        <NavigationContainer
          title="Manage Data"
          description="Add or modify agents, vessels, materials"
          iconName="list"
          color="#2ecc71"
          onPress={() => navigation.navigate('ManageData')}
        />

        <NavigationContainer
          title="Job History"
          description="View completed jobs and assignments"
          iconName="time"
          color="#e74c3c"
          onPress={() => navigation.navigate('JobHistory')}
        />

        <NavigationContainer
          title="Settings"
          description="Application preferences and configuration"
          iconName="settings-outline"
          color="#9b59b6"
          onPress={() => navigation.navigate('Settings')}
        />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  themeToggle: {
    padding: 10,
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  navContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
  },
});

export default HomeScreen;
