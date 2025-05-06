import { Image, StyleSheet, Platform, Dimensions } from 'react-native';

import ParallaxScrollView from '@/components/ParallaxScrollView';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export default function HomeScreen() {
  const queryClient = useQueryClient();
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
  return (
<ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/large_peloton.jpg')}
          style={styles.reactLogo}
          resizeMode="cover"
        />
      }>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    width: Dimensions.get('window').width,
    height: 178,
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: [{ translateY: -89 }], // Half the height to center vertically
  },
});
