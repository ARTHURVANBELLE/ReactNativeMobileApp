import { StyleSheet } from 'react-native';

// Colors
export const colors = {
  primary: '#FC4C02',
  secondary: '#1A3A59',
  background: '#FFFFFF',
  text: '#333333',
  error: '#FF3B30',
  success: '#4CD964',
  // Add more colors as needed
};

// Spacing
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Typography
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  body: {
    fontSize: 16,
  },
  caption: {
    fontSize: 12,
  },
};

// Create a style factory function
export const createStyles = <T extends StyleSheet.NamedStyles<T>>(
  styles: T | StyleSheet.NamedStyles<T>
) => StyleSheet.create(styles);
