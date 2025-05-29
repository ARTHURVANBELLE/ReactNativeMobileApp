/**
 * Main Application Home Screen
 * 
 * This file serves as the default route ('/) and is the first screen displayed when the app launches.
 * In Expo Router with the (tabs) directory structure, this home.tsx will be automatically mounted
 * as the initial page in the tab navigator.
 * 
 * @route / (default route)
 * @tab Home
 */
import { Image, StyleSheet, Platform, Dimensions, View, Text, ScrollView } from 'react-native';
import React, { useEffect, useState } from 'react';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EventGallery } from '@/components/Index/event_gallery';
import { useThemeColor } from '@/hooks/useThemeColor';
import ContactSection from '@/components/Index/contact';
import { getCurrentUser, loadAuthState } from '@/utils/session';
import { getStorageItem } from '@/utils/storage';

export default function HomeScreen() {
  const queryClient = useQueryClient();
  const textColor = useThemeColor({ light: '#000000', dark: '#FFFFFF' }, 'text');
  const [sessionData, setSessionData] = useState<{
    user: any | null;
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: string | null;
  }>({
    user: null,
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
  });

  // Fetch and display session data
  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        // Load user data
        const user = await getCurrentUser();
        
        // Load token data directly from storage for display
        const accessToken = await getStorageItem('strava_access_token');
        const refreshToken = await getStorageItem('strava_refresh_token');
        const expiresAt = await getStorageItem('strava_token_expiry');
        
        setSessionData({
          user,
          accessToken: accessToken ? `${accessToken.substring(0, 10)}...` : null,
          refreshToken: refreshToken ? `${refreshToken.substring(0, 10)}...` : null,
          expiresAt: expiresAt ? new Date(Number(expiresAt)).toLocaleString() : null,
        });
      } catch (error) {
        console.error('Error fetching session data:', error);
      }
    };
    
    fetchSessionData();
  }, []);

  // Access environment variables through Constants.expoConfig.extra
  
  const pokemons = useQuery({
    queryKey: ['getPokemon'],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    
    queryFn: async () => {
      const response = await fetch('https://pokeapi.co/api/v2/pokemon');
      const data = await response.json();

      console.log('data', data);
      console.log('NODE_ENV:', process.env.NODE_ENV);
      return data.results as {name: string; url: string}[];
    }
  });

  const add = useMutation({
    mutationFn: async () => {
      // add pokemon
    },
    onSuccess: () => {
      // invalidate getPokemon query
      queryClient.invalidateQueries({queryKey: ['getPokemon']});
    }
  });

  // Sample cycling events data
  const cyclingEvents = [
    {
      title: "Weekend Group Ride",
      description: "Join our casual 30km ride through scenic routes. All skill levels welcome!",
      date: "May 10, 2025",
      hour: "8:00 AM",
      place: "City Park Entrance",
      backgroundColor: "#fcba03"
    },
    {
      title: "Mountain Trail Challenge",
      description: "Test your skills on our challenging mountain bike course with elevation gains.",
      date: "May 17, 2025",
      hour: "7:30 AM",
      place: "Mountain View Trail",
      backgroundColor: "#73e6ac"
    },
    {
      title: "Cycling Workshop",
      description: "Learn bike maintenance and advanced riding techniques from our experts.",
      date: "May 24, 2025",
      hour: "2:00 PM",
      place: "Community Center",
      backgroundColor: "#8b55b5"
    }
  ];

  return (
    <ParallaxScrollView
    headerBackgroundColor={{ light: '#FFFFFF', dark: '#000000' }}
    headerImage={
        <View style={styles.headerContainer}>
          <Image
            source={require('@/assets/images/large_peloton.jpg')}
            style={styles.imageTop}
            resizeMode="cover"
          />
          <View style={styles.overlayContainer}>
            <Text style={[styles.heroTitle, { color: textColor }]}>Blanmont cyclo club</Text>
            <Text style={[styles.heroSubtitle, { color: textColor }]}>Club de vélo de route en Brabant wallon</Text>
          </View>
        </View>
      }>
      
      {/* Add EventGallery component at the bottom of the page */}
      <EventGallery 
        events={cyclingEvents} 
        title="Upcoming Cycling Events" 
      />
      <ContactSection></ContactSection>

    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingTop: 0, // Remove top padding
    borderTopWidth: 0, // Remove top border
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  headerContainer: {
    position: 'relative',
    height: 300,
    width: Dimensions.get('window').width,
  },
  imageTop: {
    width: Dimensions.get('window').width,
    height: 300,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Semi-transparent black background
    padding: 20,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  heroSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 2,
  },
  sessionDataContainer: {
    padding: 16,
    marginTop: 16,
    backgroundColor: 'rgb(238, 230, 230)',
    borderRadius: 8,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sessionDataRow: {
    flexDirection: 'row',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  sessionLabel: {
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 100,
  },
  sessionValue: {
    flex: 1,
    flexWrap: 'wrap',
  },
  userDataContainer: {
    marginTop: 8,
  },
});