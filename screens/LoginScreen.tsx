import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { loginWithStrava, isAuthenticated, checkAuthAfterRedirect } from '../utils/session';
import { getStorageItem } from '@/utils/storage';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation();
  const [isLoading, setIsLoading] = useState(false);

  // Check auth status when component mounts
  useEffect(() => {
    const checkAuthStatus = async () => {
      setIsLoading(true);
      
      // Check if we were in an auth process that might have completed
      const authInProgress = await getStorageItem('auth_in_progress');
      
      if (authInProgress) {
        console.log('Detected previous auth in progress, checking status');
        const isAuth = await checkAuthAfterRedirect();
        
        if (isAuth) {
          console.log('Authentication confirmed after redirect');
          navigation.reset({
            index: 0,
            routes: [{ name: 'index' as never }]
          });
          return;
        }
      } else {
        // Regular auth check
        const isAuth = await isAuthenticated();
        
        if (isAuth) {
          console.log('User is already authenticated');
          navigation.reset({
            index: 0,
            routes: [{ name: 'index' as never }]
          });
          return;
        }
      }
      
      setIsLoading(false);
    };
    
    checkAuthStatus();
  }, [navigation]);

  // Handle login button press
  const handleLoginPress = async () => {
    setIsLoading(true);
    
    try {
      const success = await loginWithStrava();
      
      if (success) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'index' as never }]
        });
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Your App</Text>
        <Text style={styles.subtitle}>Connect with your Strava account to get started</Text>
        
        {isLoading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#FC4C02" />
            <Text style={styles.loadingText}>Connecting to Strava...</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.stravaButton} 
            onPress={handleLoginPress}
            activeOpacity={0.8}
            disabled={isLoading}
          >
            <Text style={styles.stravaButtonText}>Connect with Strava</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  stravaButton: {
    backgroundColor: '#FC4C02',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  stravaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loaderContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
});

export default LoginScreen;
