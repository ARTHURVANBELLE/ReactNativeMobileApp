import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useColorScheme } from 'react-native';
import { Event, EventProps } from './event';
import { useThemeColor } from '@/hooks/useThemeColor';

interface EventGalleryProps {
  events: EventProps[];
  title?: string;
}

export function EventGallery({ events, title = "Upcoming Events" }: EventGalleryProps): JSX.Element {
  const [currentPage, setCurrentPage] = useState(0);
  const eventsPerPage = 3;
  
  // Get theme colors
  const backgroundColor = useThemeColor({ light: '#f8f8f8', dark: '#121212' }, 'background');
  const textColor = useThemeColor({ light: '#000000', dark: '#ffffff' }, 'text');
  const accentColor = useThemeColor({ light: '#0a7ea4', dark: '#3ca9cc' }, 'tint');
  const disabledColor = useThemeColor({ light: '#cccccc', dark: '#444444' }, 'tabIconDefault');
  
  // Calculate total pages
  const totalPages = Math.ceil(events.length / eventsPerPage);
  
  // Get current events
  const currentEvents = events.slice(
    currentPage * eventsPerPage, 
    (currentPage + 1) * eventsPerPage
  );

  // Pagination handlers
  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <Text style={[styles.galleryTitle, { color: textColor }]}>{title}</Text>
      
      <ScrollView style={styles.eventsContainer}>
        {currentEvents.map((event, index) => (
          <Event
            key={`event-${currentPage}-${index}`}
            title={event.title}
            description={event.description}
            date={event.date}
            hour={event.hour}
            place={event.place}
            backgroundColor={event.backgroundColor}
          />
        ))}
        
        {currentEvents.length === 0 && (
          <Text style={[styles.noEvents, { color: textColor }]}>No events available</Text>
        )}
      </ScrollView>
      
      {totalPages > 1 && (
        <View style={styles.paginationContainer}>
          <TouchableOpacity
            onPress={goToPrevPage}
            disabled={currentPage === 0}
            style={[
              styles.paginationButton, 
              { backgroundColor: currentPage === 0 ? disabledColor : accentColor }
            ]}
          >
            <Text style={styles.buttonText}>Previous</Text>
          </TouchableOpacity>
          
          <Text style={[styles.pageInfo, { color: textColor }]}>
            Page {currentPage + 1} of {totalPages}
          </Text>
          
          <TouchableOpacity
            onPress={goToNextPage}
            disabled={currentPage === totalPages - 1}
            style={[
              styles.paginationButton, 
              { backgroundColor: currentPage === totalPages - 1 ? disabledColor : accentColor }
            ]}
          >
            <Text style={styles.buttonText}>Next</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
  },
  galleryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  eventsContainer: {
    flex: 1,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  paginationButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  pageInfo: {
    fontSize: 14,
  },
  noEvents: {
    textAlign: 'center',
    fontSize: 16,
    marginTop: 40,
  },
});