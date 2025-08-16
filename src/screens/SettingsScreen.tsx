import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import {useTheme} from '../theme/ThemeContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

const SettingsScreen: React.FC = () => {
  const {theme} = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <Text style={[styles.header, {color: theme.colors.text}]}>Settings</Text>

      <View style={styles.settingsContainer}>
        <View
          style={[
            styles.settingItem,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}>
          {/* Removed Dark Mode Toggle - App now uses light mode only */}
        </View>

        <TouchableOpacity
          style={[
            styles.settingItem,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}>
          <View style={styles.settingTextBlock}>
            <Ionicons
              name="cloud-upload"
              size={22}
              color={theme.colors.primary}
            />
            <Text style={[styles.settingText, {color: theme.colors.text}]}>
              Backup Data
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.placeholder}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.settingItem,
            {
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            },
          ]}>
          <View style={styles.settingTextBlock}>
            <Ionicons
              name="information-circle"
              size={22}
              color={theme.colors.primary}
            />
            <Text style={[styles.settingText, {color: theme.colors.text}]}>
              About
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.placeholder}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  settingsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    marginBottom: 10,
    borderRadius: 8,
  },
  settingTextBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 15,
  },
});

export default SettingsScreen;
