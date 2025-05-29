import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { processStravaAuthResponse, extractAuthData, isAuthenticated } from '../utils/session';

type RootStackParamList = {
  StravaAuth: { authData?: string };
};

export default function StravaAuthHandler() {
  // Define the route type for StravaAuth
  const route = useRoute<RouteProp<RootStackParamList, 'StravaAuth'>>();
  const navigation = useNavigation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // First check if we're already authenticated (window was closed successfully)
        const alreadyAuthenticated = await isAuthenticated();
        
        if (alreadyAuthenticated) {
          setStatus('success');
          setMessage('Already authenticated! Redirecting to home...');
          
          // Navigate to index screen
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'index' as never }]
            });
          }, 500);
          return;
        }
        
        // Extract auth data from route params or URL
        let authData;
        
        if (route.params?.authData) {
          // Try to get from route params
          authData = route.params.authData;
        }

        if (!authData && typeof window !== 'undefined' && window.location) {
          // Try to parse from URL if we're on web
          authData = extractAuthData(window.location.href);
        }

        if (!authData) {
          throw new Error('No authentication data found');
        }

        // Process the authentication data
        const success = await processStravaAuthResponse(authData);
        
        if (success) {
          setStatus('success');
          setMessage('Authentication successful! Redirecting to home...');
          
          // Navigate to index screen
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'index' as never }]
            });
          }, 1000);
        } else {
          throw new Error('Failed to process authentication data');
        }
      } catch (error) {
        setStatus('error');
        setMessage(`Authentication error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Navigate back to login after a delay
        setTimeout(() => {
          navigation.navigate('Login' as never);
        }, 2000);
      }
    };

    handleAuth();
  }, [navigation, route]);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={[
          styles.title, 
          status === 'success' ? styles.successText : 
          status === 'error' ? styles.errorText : {}
        ]}>
          {status === 'loading' ? 'Processing Authentication' : 
           status === 'success' ? 'Authentication Successful' : 
           'Authentication Failed'}
        </Text>
        
        {status === 'loading' && (
          <ActivityIndicator size="large" color="#FC4C02" style={styles.loader} />
        )}
        
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    marginTop: 10,
  },
  loader: {
    marginVertical: 20,
  },
  successText: {
    color: '#2ecc71',
  },
  errorText: {
    color: '#e74c3c',
  },
});