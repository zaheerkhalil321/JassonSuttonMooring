import React, {createContext, useState, useContext, ReactNode} from 'react';

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

// Simplified modern color scheme
export const lightTheme: Theme = {
  dark: false,
  colors: {
    primary: '#3498db',
    secondary: '#2980b9',
    background: '#ffffff',
    card: '#f8f9fa',
    text: '#2c3e50',
    border: '#dfe6e9',
    notification: '#e74c3c',
    placeholder: '#95a5a6',
    error: '#c0392b',
    success: '#27ae60',
    warning: '#f39c12',
    info: '#2980b9',
  },
};

export const darkTheme: Theme = {
  dark: true,
  colors: {
    primary: '#3498db',
    secondary: '#2980b9',
    background: '#2c3e50',
    card: '#34495e',
    text: '#ecf0f1',
    border: '#7f8c8d',
    notification: '#e74c3c',
    placeholder: '#bdc3c7',
    error: '#e74c3c',
    success: '#2ecc71',
    warning: '#f1c40f',
    info: '#3498db',
  },
};

interface ThemeContextType {
  theme: Theme;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  toggleDarkMode: () => {},
});

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({children}) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const theme = isDarkMode ? darkTheme : lightTheme;

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  return (
    <ThemeContext.Provider value={{theme, toggleDarkMode}}>
      {children}
    </ThemeContext.Provider>
  );
};
