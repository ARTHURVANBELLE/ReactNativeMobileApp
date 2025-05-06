import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export interface EventProps {
  title: string;
  description: string;
  date: string;
  hour: string;
  place: string;
  backgroundColor?: string;
}

export function Events(): JSX.Element {
  return (
    <View>
      <Text style={styles.title}>Upcoming Events</Text>
    </View>
  );
}

export function Event({ 
  title, 
  description, 
  date, 
  hour, 
  place, 
  backgroundColor = '#f0f0f0' 
}: EventProps): JSX.Element {
  const textColor = useThemeColor({ light: '#000', dark: '#fff' }, 'text');

  return (
    <View style={[styles.eventContainer, { backgroundColor }]}>
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      <Text style={[styles.default, { color: textColor }]}>{description}</Text>
      <View style={styles.eventDetails}>
        <Text style={[styles.defaultSemiBold, { color: textColor }]}>
          📅 {date} at {hour}
        </Text>
        <Text style={[styles.defaultSemiBold, { color: textColor }]}>
          📍 {place}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
  eventContainer: {
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventDetails: {
    marginTop: 12,
    gap: 4,
  }
});