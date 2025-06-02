import React from 'react';
import {View, Text, StyleSheet, SafeAreaView} from 'react-native';
import {useTheme} from '../theme/ThemeContext';

const ManageDataScreen: React.FC = () => {
  const {theme} = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <Text style={[styles.title, {color: theme.colors.text}]}>
        Manage Data
      </Text>
      <Text style={[styles.subtitle, {color: theme.colors.placeholder}]}>
        This screen will contain options to add or modify agents, vessels,
        materials, etc.
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

export default ManageDataScreen;
