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

export const lightTheme: Theme = {
  dark: false,
  colors: {
    // Modern gradient blue
    primary: '#0072FF',
    secondary: '#5C9CE5',
    background: '#F7F9FC',
    card: '#FFFFFF',
    text: '#223354',
    border: '#E2E8F0',
    notification: '#FF4757',
    placeholder: '#A0AEC0',
    error: '#E53E3E',
    success: '#38B2AC',
    warning: '#ED8936',
    info: '#3182CE',
  },
};

export const darkTheme: Theme = {
  dark: true,
  colors: {
    primary: '#60A5FA',
    secondary: '#3B82F6',
    background: '#1F2937',
    card: '#374151',
    text: '#F3F4F6',
    border: '#4B5563',
    notification: '#F87171',
    placeholder: '#9CA3AF',
    error: '#EF4444',
    success: '#10B981',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
};

export const oceanTheme: Theme = {
  dark: false,
  colors: {
    // Ocean-inspired theme for a mooring app
    primary: '#0891B2', // Cyan
    secondary: '#0E7490',
    background: '#ECFEFF',
    card: '#FFFFFF',
    text: '#164E63',
    border: '#CFFAFE',
    notification: '#E11D48',
    placeholder: '#67E8F9',
    error: '#DC2626',
    success: '#059669',
    warning: '#D97706',
    info: '#2563EB',
  },
};

export const defaultTheme = oceanTheme;
