import { Image, StyleSheet, Platform, Dimensions, View, Text } from 'react-native';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EventGallery } from '@/components/Index/event_gallery';
import { useThemeColor } from '@/hooks/useThemeColor';
import ContactSection from '@/components/Index/contact';


export default function HomeScreen() {
  const queryClient = useQueryClient();
  const textColor = useThemeColor({ light: '#000000', dark: '#FFFFFF' }, 'text');


  const pokemons = useQuery({
    queryKey: ['getPokemon'],
    queryFn: async () => {
      const response = await fetch('https://pokeapi.co/api/v2/pokemon');
      const data = await response.json();

      console.log('data', data);
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
});