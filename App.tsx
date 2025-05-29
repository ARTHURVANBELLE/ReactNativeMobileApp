import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ExpoRoot } from 'expo-router';


export default function App() {
  return (
    <SafeAreaProvider>
      <ExpoRoot context={require.arguments('./app')} />
    </SafeAreaProvider>
  );
}

