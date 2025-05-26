import { View } from 'react-native';
import { Redirect } from 'expo-router';
import LoginScreen from '@/components/login';

// This is a special file that will automatically be rendered when the app loads.
// When using authentication in the root layout, this will only be shown when unauthenticated
export default function Index() {
  return <LoginScreen />;
}
