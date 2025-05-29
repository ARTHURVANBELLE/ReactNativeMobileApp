import React, { Suspense, useState } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import ActivityFrame from "@/components/Activity/activity-frame";
import { fetchWithCors } from '@/utils/corsHandler';

const API_URL = Constants.expoConfig?.extra?.REACT_APP_HOST;

// A loading component for Suspense
const LoadingActivities = () => (
  <View style={styles.centerContent}>
    <ActivityIndicator size="large" color="#FC4C02" />
    <Text style={styles.loadingText}>Loading activities...</Text>
  </View>
);

// The main activities list component
const ActivitiesList = () => {
  const queryClient = useQueryClient();
  const activityNumber = 5;
  const [refreshing, setRefreshing] = useState(false);

  const { data: activities, isLoading, error, refetch } = useQuery({
    queryKey: ["getActivities"],
    queryFn: async () => {
      try {
        console.log("Fetching from:", `${API_URL}/api/activities/get-activities?activityNumber=${activityNumber}`);
        
        const response = await fetchWithCors(
          `${API_URL}/api/activities/get-activities?activityNumber=${activityNumber}`
        );
        
        const data = await response.json();
        console.log("Data received:", JSON.stringify(data).substring(0, 200) + "...");
        
        // Check what we're getting - if data is an array directly, return it
        // If data has a results property, return that
        if (Array.isArray(data)) {
          return data;
        } else if (data && data.results && Array.isArray(data.results)) {
          return data.results;
        } else {
          // Handle case where we get an object with the data directly
          return [data]; 
        }
      } catch (err) {
        console.error("Fetch error:", err);
        throw err;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) {
    return <LoadingActivities />;
  }

  if (error) {
    return (
      <View style={styles.centerContent}>
        <Text style={styles.errorText}>Error loading activities</Text>
        <Text style={styles.errorMessage}>{error.message}</Text>
      </View>
    );
  }

  // Add logging to debug the data
  console.log("Activity data from query:", activities);

  // Use the API data, making sure we handle all possible formats
  const activityData = activities || [];

  return (
    <FlatList
      data={activityData}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => {
        console.log("Rendering item:", item); // Debug individual items
        return (
          <ActivityFrame
            activity={{
              id: item.id,
              title: item.title || item.name || "",
              description: item.description || null,
              datetime: item.datetime || item.date || "",
              distance: typeof item.distance === 'number' ? item.distance : parseFloat(item.distance) || 0,
              movingTime: typeof item.movingTime === 'number' ? item.movingTime : parseInt(item.movingTime) || 0,
              imageUrl: item.imageUrl || null,
              gpxUrl: item.gpxUrl || null,
              delegueId: item.delegueId || 0,
              users: item.users || [],
            }}
            onPress={(activity) => console.log('Selected activity:', activity.id)}
          />
        );
      }}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#FC4C02"]}
          tintColor="#FC4C02"
        />
      }
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No activities found</Text>
        </View>
      }
    />
  );
};

export default function ActivitiesScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Activities</Text>
      </View>
      
      <Suspense fallback={<LoadingActivities />}>
        <ActivitiesList />
      </Suspense>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    backgroundColor: "#FC4C02",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  list: {
    padding: 16,
  },
  activityCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  activityType: {
    fontWeight: "bold",
    color: "#FC4C02",
  },
  activityDate: {
    color: "#888",
  },
  activityName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  activityStats: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  activityStat: {
    color: "#666",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#e74c3c",
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
