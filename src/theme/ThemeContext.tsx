import React, {createContext, useContext, ReactNode} from 'react';

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

// Light theme only
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

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isDarkMode: false,
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({children}) => {
  // Always use light theme
  const theme = lightTheme;
  const isDarkMode = false;

  return (
    <ThemeContext.Provider value={{theme, isDarkMode}}>
      {children}
    </ThemeContext.Provider>
  );
};
