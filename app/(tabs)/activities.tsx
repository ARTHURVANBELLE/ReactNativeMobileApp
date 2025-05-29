import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

// Mock data for activities
const mockActivities = [
  { id: '1', type: 'Run', name: 'Morning Run', date: '2023-05-25', distance: '5.2 km', duration: '28:35' },
  { id: '2', type: 'Ride', name: 'Evening Cycle', date: '2023-05-23', distance: '15.7 km', duration: '45:12' },
  { id: '3', type: 'Swim', name: 'Pool Session', date: '2023-05-21', distance: '1.5 km', duration: '35:45' },
  { id: '4', type: 'Run', name: 'Park Run', date: '2023-05-18', distance: '7.3 km', duration: '38:22' },
];

export default function ActivitiesScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activities</Text>
      </View>

      <FlatList
        data={mockActivities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <Text style={styles.activityType}>{item.type}</Text>
              <Text style={styles.activityDate}>{item.date}</Text>
            </View>
            <Text style={styles.activityName}>{item.name}</Text>
            <View style={styles.activityStats}>
              <Text style={styles.activityStat}>Distance: {item.distance}</Text>
              <Text style={styles.activityStat}>Duration: {item.duration}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#FC4C02',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  list: {
    padding: 16,
  },
  activityCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  activityType: {
    fontWeight: 'bold',
    color: '#FC4C02',
  },
  activityDate: {
    color: '#888',
  },
  activityName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  activityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  activityStat: {
    color: '#666',
  },
});
