import React, { Suspense, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";
import { useFocusEffect } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import ActivityFrame from "@/components/Activity/activity-frame";
import { fetchWithCors } from "@/utils/corsHandler";
import { Activity, ApiResponse, ActivityUser } from "@/types/models";

const API_URL = Constants.expoConfig?.extra?.REACT_APP_HOST;

// Loading component
const LoadingActivities = () => (
  <View style={styles.centerContent}>
    <ActivityIndicator size="large" color="#FC4C02" />
    <Text style={styles.loadingText}>Loading activities...</Text>
  </View>
);

// The main activities list component
const ActivitiesList: React.FC = () => {
  const queryClient = useQueryClient();
  const activityNumber = 5;
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const {
    data: activities,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery<Activity[], Error>({
    queryKey: ["getActivities"],
    staleTime: 60000, // Set a reasonable stale time (1 minute)
    // refetchOnWindowFocus is for web browsers, not as relevant for mobile
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<Activity[]> => {
      try {
        const apiEndpoint = `${API_URL}/api/activities/get-activities?activityNumber=${activityNumber}`;

        const response = await fetchWithCors<ApiResponse<Activity[]>>(
          apiEndpoint
        );

        // Check if response is directly an array (already the activities data)
        if (Array.isArray(response)) {
          return response as Activity[];
        }
        
        // Check if response has data property (standard ApiResponse format)
        if (response && 'data' in response && Array.isArray(response.data)) {
          return response.data as Activity[];
        }
        
        // For other cases, try to intelligently find the activities data
        if (response && typeof response === 'object' && response !== null) {
          // Look for an array property that might contain activities
          for (const key in response) {
            const value = response[key as keyof typeof response];
            if (Array.isArray(value) && 
                value.length > 0 && 
                value[0] && 
                typeof value[0] === 'object' &&
                'title' in value[0]) {
              return value as Activity[];
            }
          }
        }
        
        return [];
      } catch (err) {
        console.error("Fetch error:", err);
        console.error("Error details:", JSON.stringify(err, Object.getOwnPropertyNames(err)));
        throw err as Error;
      }
    },
    retry: 1,
    retryDelay: 1000,
  });

  // This hook will run when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("Activities screen focused - refetching data");
      refetch();
      
      // Return a cleanup function (optional)
      return () => {
        console.log("Activities screen blurred");
      };
    }, [refetch])
  );

  const onRefresh = React.useCallback(async (): Promise<void> => {
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

  // Use the API data, making sure we handle all possible formats
  const activityData: Activity[] = activities || [];

  return (
    <View style={styles.container}>
      <View style={styles.refreshButtonContainer}>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing || isFetching}
        >
          {refreshing || isFetching ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <View style={styles.refreshButtonContent}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.refreshButtonText}>Refresh</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      <FlatList<Activity>
        data={activityData}
        keyExtractor={(item: Activity) => String(item.id)}
        renderItem={({ item }: { item: Activity }) => {
          try {
            return (
              <ActivityFrame
                activity={{
                  id: String(item.id),
                  title: item.title || "",
                  description: item.description || null,
                  datetime: item.datetime || "",
                  distance:
                    typeof item.distance === "number"
                      ? item.distance
                      : parseFloat(String(item.distance)) || 0,
                  movingTime:
                    typeof item.movingTime === "number"
                      ? item.movingTime
                      : parseInt(String(item.movingTime)) || 0,
                  imageUrl: item.imageUrl,
                  users: item.users?.map(
                    (user) =>
                      ({
                        stravaId:
                          typeof user === "object" && user !== null
                            ? String(user.stravaId)
                            : String(user),
                      })
                    ) || [],
                }}
                onPress={(activity: Activity): void =>
                  console.log("Selected activity:", activity.id)
                }
              />
            );
          } catch (e) {
            console.error("Error rendering activity item:", e);
            console.error("Problematic item:", JSON.stringify(item, null, 2));
            return (
              <View style={styles.errorCard}>
                <Text style={styles.errorText}>Failed to render activity</Text>
              </View>
            );
          }
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
    </View>
  );
};

const ActivitiesScreen: React.FC = () => {
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
};

export default ActivitiesScreen;

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
  errorCard: {
    backgroundColor: "#fde2e2",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderColor: "#e74c3c",
    borderWidth: 1,
  },
  refreshButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  refreshButton: {
    backgroundColor: '#FC4C02',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  refreshButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
  },
});
