import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ExpoRoot } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './utils/queryClient';

// Add type declaration for require.context
declare const require: {
  context: (
    directory: string,
    useSubdirectories?: boolean,
    regExp?: RegExp
  ) => any;
};

export default function App() {
  const ctx = require.context('./app');
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ExpoRoot context={ctx} />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}

