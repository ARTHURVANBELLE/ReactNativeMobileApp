import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert, useColorScheme, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { loginWithStrava, isAuthenticated } from '../utils/session';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Check if user is already logged in
  useEffect(() => {
    checkExistingAuth();
  }, []);

  const checkExistingAuth = async () => {
    try {
      const authenticated = await isAuthenticated();
      
      if (authenticated) {
        // Already authenticated, navigate to main app
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
    }
  };

  const startStravaAuth = async () => {
    setIsAuthenticating(true);
    try {
      // Use the loginWithStrava utility
      const success = await loginWithStrava();
      
      if (success) {
        // No need to navigate - the root layout will detect the auth change
        // and automatically show the tabs
      } else {
        Alert.alert('Authentication failed', 'Could not authenticate with Strava');
      }
    } catch (error) {
      console.error('Auth error:', error);
      Alert.alert('Authentication Error', 'An error occurred during authentication');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
      {/* App branding */}
      <View style={styles.brandingContainer}>
        <Image 
          source={require('../assets/images/app-logo.png')}
          resizeMode="contain"
          style={styles.logo}
        />
        <Text style={[styles.appTitle, isDark ? styles.textLight : styles.textDark]}>
          Cyclo Track
        </Text>
        <Text style={[styles.appSubtitle, isDark ? styles.subtitleDark : styles.subtitleLight]}>
          Track your cycling journey
        </Text>
      </View>
      
      {/* Description */}
      <View style={styles.descriptionContainer}>
        <Text style={[styles.descriptionText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
          Connect with your Strava account to track your activities and analyze your performance
        </Text>
      </View>
      
      {/* Login button */}
      <TouchableOpacity 
        onPress={startStravaAuth}
        disabled={isAuthenticating}
        style={[
          styles.loginButton,
          isAuthenticating ? 
            (isDark ? styles.buttonDisabledDark : styles.buttonDisabledLight) : 
            styles.buttonStrava
        ]}
        activeOpacity={0.8}
      >
        {isAuthenticating ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Image 
              source={require('../assets/images/strava-logo.png')}
              resizeMode="contain"
              style={styles.stravaIcon}
            />
            <Text style={styles.buttonText}>
              {isAuthenticating ? 'Connecting...' : 'Connect with Strava'}
            </Text>
          </>
        )}
      </TouchableOpacity>
      
      {/* Footer text */}
      <View style={styles.footerContainer}>
        <Text style={[styles.footerText, isDark ? styles.footerTextDark : styles.footerTextLight]}>
          By signing in, you agree to our{' '}
          <Text style={styles.footerLink}>Terms of Service</Text>
          {' '}and{' '}
          <Text style={styles.footerLink}>Privacy Policy</Text>
        </Text>
      </View>
      
      {/* Version number */}
      <Text style={[styles.versionText, isDark ? styles.versionTextDark : styles.versionTextLight]}>
        Version 1.0.0
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  containerLight: {
    backgroundColor: '#ffffff',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  brandingContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  textDark: {
    color: '#1a1a1a',
  },
  textLight: {
    color: '#ffffff',
  },
  appSubtitle: {
    fontSize: 18,
    marginTop: 4,
  },
  subtitleLight: {
    color: '#666666',
  },
  subtitleDark: {
    color: '#b0b0b0',
  },
  descriptionContainer: {
    width: '100%',
    maxWidth: 320,
    marginBottom: 32,
  },
  descriptionText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  textMutedLight: {
    color: '#555555',
  },
  textMutedDark: {
    color: '#a0a0a0',
  },
  loginButton: {
    width: '100%',
    maxWidth: 320,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  buttonStrava: {
    backgroundColor: '#fc4c02', // Strava orange
  },
  buttonDisabledLight: {
    backgroundColor: '#cccccc',
  },
  buttonDisabledDark: {
    backgroundColor: '#454545',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  stravaIcon: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  footerContainer: {
    marginTop: 32,
    maxWidth: 280,
  },
  footerText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerTextLight: {
    color: '#777777',
  },
  footerTextDark: {
    color: '#888888',
  },
  footerLink: {
    color: '#fc4c02',
    fontWeight: '500',
  },
  versionText: {
    position: 'absolute',
    bottom: 20,
    fontSize: 12,
  },
  versionTextLight: {
    color: '#bbbbbb',
  },
  versionTextDark: {
    color: '#666666',
  },
});
