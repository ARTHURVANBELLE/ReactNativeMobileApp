import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { loginWithStrava, isAuthenticated } from '../utils/session';

export default function LoginScreen() {
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const router = useRouter();

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
        // Navigate to main app on successful authentication
        router.replace('/(tabs)');
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
    <View>
      <View>
        <Image 
          source={require('../assets/images/app-logo.png')}
          resizeMode="contain"
        />
        <Text>Your App Name</Text>
      </View>
      
      <Text>
        Connect with your Strava account to track your activities and analyze your performance
      </Text>
      
      <TouchableOpacity 
        onPress={startStravaAuth}
        disabled={isAuthenticating}
      >
        <Image 
          source={require('../assets/images/strava-logo.png')}
          resizeMode="contain"
        />
        <Text>
          {isAuthenticating ? 'Connecting...' : 'Connect with Strava'}
        </Text>
      </TouchableOpacity>
      
      <Text>
        By signing in, you agree to our Terms of Service and Privacy Policy
      </Text>
    </View>
  );
}
