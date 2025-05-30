import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';

interface StravaActivity {
  id: string;
  name: string;
  type: string;
  distance: number;
  moving_time: number;
  date: string;
  thumbnail?: string;
}

interface ActivitySelectProps {
  formData: {
    stravaActivity: StravaActivity | null;
  };
  updateFormData: (data: Partial<{ stravaActivity: StravaActivity | null }>) => void;
  currentUser: any;
}

const ActivitySelect: React.FC<ActivitySelectProps> = ({ formData, updateFormData, currentUser }) => {
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulated API call to fetch Strava activities
    const fetchActivities = async () => {
      try {
        // In a real app, you would fetch from Strava API
        // For demo purposes, using mock data
        setTimeout(() => {
          const mockActivities: StravaActivity[] = [
            {
              id: '1',
              name: 'Morning Run',
              type: 'Run',
              distance: 5200,
              moving_time: 1800,
              date: '2023-06-15',
              thumbnail: 'https://via.placeholder.com/100x70?text=Run'
            },
            {
              id: '2',
              name: 'Afternoon Ride',
              type: 'Ride',
              distance: 15000,
              moving_time: 3600,
              date: '2023-06-14',
              thumbnail: 'https://via.placeholder.com/100x70?text=Ride'
            },
            {
              id: '3',
              name: 'Trail Hike',
              type: 'Hike',
              distance: 8000,
              moving_time: 7200,
              date: '2023-06-12',
              thumbnail: 'https://via.placeholder.com/100x70?text=Hike'
            },
            {
              id: '4',
              name: 'Evening Swim',
              type: 'Swim',
              distance: 2000,
              moving_time: 2400,
              date: '2023-06-10',
              thumbnail: 'https://via.placeholder.com/100x70?text=Swim'
            },
            {
              id: '5',
              name: 'Weekend Ride',
              type: 'Ride',
              distance: 40000,
              moving_time: 7200,
              date: '2023-06-08',
              thumbnail: 'https://via.placeholder.com/100x70?text=Ride'
            },
          ];
          
          setActivities(mockActivities);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching Strava activities:', error);
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const formatDistance = (meters: number) => {
    const kilometers = meters / 1000;
    return `${kilometers.toFixed(2)} km`;
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else {
      return `${minutes}m ${secs}s`;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isSelected = (activity: StravaActivity) => {
    return formData.stravaActivity && formData.stravaActivity.id === activity.id;
  };

  const selectActivity = (activity: StravaActivity) => {
    updateFormData({ stravaActivity: activity });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FC4C02" />
        <Text style={styles.loadingText}>Loading Strava activities...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Strava Activity</Text>
      
      <Text style={styles.subtitle}>
        Choose the Strava activity related to this event
      </Text>
      
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            style={[styles.activityItem, isSelected(item) && styles.selectedActivityItem]} 
            onPress={() => selectActivity(item)}
          >
            <Image 
              source={{ uri: item.thumbnail }} 
              style={styles.activityImage} 
            />
            <View style={styles.activityDetails}>
              <Text style={styles.activityName}>{item.name}</Text>
              <Text style={styles.activityType}>{item.type}</Text>
              <View style={styles.activityStats}>
                <Text style={styles.activityStat}>{formatDistance(item.distance)}</Text>
                <Text style={styles.activityStat}>{formatTime(item.moving_time)}</Text>
                <Text style={styles.activityStat}>{formatDate(item.date)}</Text>
              </View>
            </View>
            {isSelected(item) && (
              <View style={styles.checkmark}>
                <Text style={styles.checkmarkText}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />
      
      {activities.length === 0 && (
        <View style={styles.noActivities}>
          <Text style={styles.noActivitiesText}>No recent Strava activities found</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  activityItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedActivityItem: {
    backgroundColor: '#f0f8ff',
    borderColor: '#FC4C02',
    borderWidth: 1,
  },
  activityImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  activityDetails: {
    flex: 1,
  },
  activityName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  activityType: {
    color: '#666',
    marginBottom: 8,
  },
  activityStats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  activityStat: {
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 6,
    fontSize: 12,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FC4C02',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontWeight: 'bold',
  },
  noActivities: {
    padding: 20,
    alignItems: 'center',
  },
  noActivitiesText: {
    color: '#666',
    textAlign: 'center',
  },
});

export default ActivitySelect;