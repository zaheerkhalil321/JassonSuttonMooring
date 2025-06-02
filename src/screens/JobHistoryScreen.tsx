import React from 'react';
import {View, Text, StyleSheet, SafeAreaView} from 'react-native';
import {useTheme} from '../theme/ThemeContext';

const JobHistoryScreen: React.FC = () => {
  const {theme} = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <Text style={[styles.title, {color: theme.colors.text}]}>
        Job History
      </Text>
      <Text style={[styles.subtitle, {color: theme.colors.placeholder}]}>
        This screen will display the history of completed jobs and assignments.
      </Text>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
});

export default JobHistoryScreen;
