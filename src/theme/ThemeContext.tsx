import React, {createContext, useState, useContext, ReactNode, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Appearance} from 'react-native';

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
  placeholder: string;
  error: string;
  success: string;
  warning: string;
  info: string;
}

export interface Theme {
  dark: boolean;
  colors: ThemeColors;
}

// Modern JSM color scheme
export const lightTheme: Theme = {
  dark: false,
  colors: {
    primary: '#45BBA5',
    secondary: '#2D9CDB',
    background: '#F8FAFC',
    card: '#FFFFFF',
    text: '#1F2937',
    border: '#E5E7EB',
    notification: '#EF4444',
    placeholder: '#9CA3AF',
    error: '#DC2626',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
};

export const darkTheme: Theme = {
  dark: true,
  colors: {
    primary: '#45BBA5',
    secondary: '#2D9CDB',
    background: '#1F2937',
    card: '#374151',
    text: '#F9FAFB',
    border: '#4B5563',
    notification: '#EF4444',
    placeholder: '#6B7280',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
};

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDarkMode: false,
  toggleDarkMode: () => {},
  setThemeMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({children}) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [themeMode, setThemeModeState] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    loadThemePreference();
  }, []);

  useEffect(() => {
    // Listen to system theme changes when in system mode
    if (themeMode === 'system') {
      const subscription = Appearance.addChangeListener(({colorScheme}) => {
        setIsDarkMode(colorScheme === 'dark');
      });
      return () => subscription?.remove();
    }
  }, [themeMode]);

  const loadThemePreference = async () => {
    try {
      const savedMode = await AsyncStorage.getItem('theme_mode');
      const mode = (savedMode as 'light' | 'dark' | 'system') || 'system';
      setThemeModeState(mode);
      
      if (mode === 'system') {
        const systemScheme = Appearance.getColorScheme();
        setIsDarkMode(systemScheme === 'dark');
      } else {
        setIsDarkMode(mode === 'dark');
      }
    } catch (error) {
      console.log('Error loading theme preference:', error);
    }
  };

  const setThemeMode = async (mode: 'light' | 'dark' | 'system') => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem('theme_mode', mode);
      
      if (mode === 'system') {
        const systemScheme = Appearance.getColorScheme();
        setIsDarkMode(systemScheme === 'dark');
      } else {
        setIsDarkMode(mode === 'dark');
      }
    } catch (error) {
      console.log('Error saving theme preference:', error);
    }
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  const toggleDarkMode = () => {
    const newMode = isDarkMode ? 'light' : 'dark';
    setThemeMode(newMode);
  };

  return (
    <ThemeContext.Provider value={{theme, isDarkMode, toggleDarkMode, setThemeMode}}>
      {children}
    </ThemeContext.Provider>
  );
};
