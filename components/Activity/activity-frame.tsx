import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { format, parseISO } from 'date-fns';
import {Activity, User} from '@/types/models'


interface ActivityFrameProps {
  activity: Activity;
  onPress?: (activity: Activity) => void;
}

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

/**
 * Formats a date string into a more readable format
 * @param dateString - ISO date string to format
 * @returns Formatted date string
 */
const formatDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, 'MMM dd, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Return original string if parsing fails
  }
};

const ActivityFrame: React.FC<ActivityFrameProps> = ({ activity, onPress }) => {
  // Format the date to be more readable
  const formattedDate = formatDate(activity.datetime);
  
  // Handle the press event
  const handlePress = () => {
    if (onPress) {
      onPress(activity);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={handlePress}
      activeOpacity={0.9}
    >
      {/* Activity Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{activity.title}</Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>
      
      {/* Activity Image */}
      {activity.imageUrl && activity.imageUrl.length > 0 ? (
        <Image 
          source={{ uri: activity.imageUrl[0] }} 
          style={styles.image}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.placeholderImage}>
          <Text style={styles.placeholderText}>No Image Available</Text>
        </View>
      )}
      
      {/* Activity Details */}
      <View style={styles.details}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{activity.distance.toFixed(2)} km</Text>
          <Text style={styles.statLabel}>Distance</Text>
        </View>
        
        <View style={styles.stat}>
          <Text style={styles.statValue}>{formatDuration(activity.movingTime)}</Text>
          <Text style={styles.statLabel}>Duration</Text>
        </View>
        
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {activity.movingTime > 0 ? 
              (activity.distance / (activity.movingTime / 60)).toFixed(1) : 
              '0'} km/h
          </Text>
          <Text style={styles.statLabel}>Avg Speed</Text>
        </View>
      </View>
      
      {/* Description */}
      {activity.description && (
        <View style={styles.description}>
          <Text style={styles.descriptionText}>{activity.description}</Text>
        </View>
      )}
      
      {/* Participants */}
      {activity.users && activity.users.length > 0 && (
        <View style={styles.participants}>
          <Text style={styles.participantsLabel}>
            Participants: {activity.users.length}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  image: {
    width: '100%',
    height: 200,
  },
  placeholderImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#999',
    fontSize: 16,
  },
  details: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  description: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  descriptionText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  participants: {
    padding: 16,
  },
  participantsLabel: {
    fontSize: 14,
    color: '#666',
  },
});

export default ActivityFrame;
