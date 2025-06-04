import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import Constants from "expo-constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loadAuthState } from "@/utils/session";
import { useRouter } from "expo-router";

// Updated interface with only the required fields
export interface StravaActivity {
  id: string;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  start_date: string;
  average_speed: number;
  max_speed: number;
  thumbnail?: string; // Keep for UI display purposes
}

const API_URL = Constants.expoConfig?.extra?.REACT_APP_HOST;
interface ActivitySelectProps {
  formData: {
    // Replace nested stravaActivity with individual fields that might be null
    id?: string;
    movingTime?: number;
    distance?: number;
  };
  updateFormData: (data: Partial<ActivitySelectProps['formData']>) => void;
  currentUser: any;
}

const ActivitySelect: React.FC<ActivitySelectProps> = ({
  formData,
  updateFormData,
  currentUser,
}) => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [authState, setAuthState] = useState<{
    jwtToken: string | null;
    stravaId: number | null;
    user: any | null;
  } | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // Load auth state to get JWT token
  useEffect(() => {
    const getAuthState = async () => {
      setIsLoadingAuth(true);
      try {
        const state = await loadAuthState();
        console.log("Auth state loaded:", state);
        setAuthState(state);
        
        // Only redirect if we have neither a JWT token nor a Strava ID
        if (!state?.jwtToken && !state?.stravaId) {
          setShouldRedirect(true);
        }
      } catch (error) {
        console.error("Error loading auth state:", error);
        setShouldRedirect(true);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    getAuthState();
  }, []);
  
  // Handle redirect in a separate useEffect to avoid conditional hooks
  useEffect(() => {
    if (shouldRedirect && !isLoadingAuth) {
      router.replace("/");
    }
  }, [shouldRedirect, isLoadingAuth, router]);

  // Query Strava activities
  const stravaActivitiesQuery = useQuery({
    queryKey: ["getStravaActivities", authState?.jwtToken, authState?.stravaId],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    // Enable the query if either jwtToken or stravaId is available
    enabled: Boolean(authState?.stravaId || authState?.jwtToken) && !isLoadingAuth,

    queryFn: async () => {
      if (!authState?.jwtToken && !authState?.stravaId) {
        throw new Error(
          "Authentication required: No authentication credentials available"
        );
      }

      try {
        // Use the API endpoint with stravaId as a parameter
        let endpoint = `${API_URL}/api/strava/activities/get-lasts?count=5`;
        
        // Get the JWT token from the auth state
        let jwtToken = authState.jwtToken;
        
        // If no JWT token in authState, reload fresh auth state to ensure we have latest token
        if (!jwtToken) {
          console.log("No JWT token in current state, reloading fresh auth state");
          const freshAuthState = await loadAuthState();
          jwtToken = freshAuthState.jwtToken;
          
          if (jwtToken) {
            console.log("JWT token found after reloading auth state");
          }
        }
        
        const headers: HeadersInit = {
          "Content-Type": "application/json",
          "Accept": "application/json",
        };
        
        // Add JWT token to Authorization header if available
        if (jwtToken) {
          headers["Authorization"] = `Bearer ${jwtToken}`;
          console.log("Added JWT token to Authorization header");
        } else {
          console.warn("JWT token not available for API request");
        }
        
        console.log(`Fetching activities with endpoint: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: "GET",
          headers: headers,
        });
        
        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const activities = await response.json();
        return activities;
      } catch (error) {
        console.error("Error fetching from Strava API:", error);
        throw error;
      }
    },
  });
  
  // Update activities state when query data changes
  useEffect(() => {
    if (stravaActivitiesQuery.data) {
      setActivities(stravaActivitiesQuery.data);
    }
  }, [stravaActivitiesQuery.data]);

  const add = useMutation({
    mutationFn: async () => {
      // add pokemon
    },
    onSuccess: () => {
      // invalidate getPokemon query
      queryClient.invalidateQueries({ queryKey: ["getStravaActivities"] });
    },
  });

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
    // Check if this activity is selected by comparing IDs
    return formData.id === activity.id;
  };

  const selectActivity = (activity: any) => {
    // Update the form with the activity data directly at the top level
    updateFormData({
      id: activity.id,
      distance: parseInt(formatDistance(activity.distance)),
      movingTime: parseInt(formatTime(activity.moving_time)),
    });
  };

  // If still loading auth state
  if (isLoadingAuth) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FC4C02" />
        <Text style={styles.loadingText}>
          Checking authentication...
        </Text>
      </View>
    );
  }

  // If the user isn't authenticated and we're redirecting
  if (shouldRedirect) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FC4C02" />
        <Text style={styles.loadingText}>
          Redirecting to home page...
        </Text>
      </View>
    );
  }

  if (stravaActivitiesQuery.isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FC4C02" />
        <Text style={styles.loadingText}>Loading Strava activities...</Text>
      </View>
    );
  }

  // Add this additional UI state to show detailed errors
  if (stravaActivitiesQuery.isError) {
    return (
      <View style={styles.centered}>
        <Text style={[styles.title, { color: "#FC4C02" }]}>
          Error Loading Activities
        </Text>
        <Text style={[styles.loadingText, { color: "red", marginBottom: 20 }]}>
          {(stravaActivitiesQuery.error as Error)?.message || "Unknown error"}
        </Text>

        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => {
            stravaActivitiesQuery.refetch();
          }}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.stravaButton, { marginTop: 16 }]}
          onPress={() => {
            // Reload auth state and then retry
            loadAuthState().then((newState) => {
              setAuthState(newState);
              setTimeout(() => stravaActivitiesQuery.refetch(), 500);
            });
          }}
        >
          <View style={styles.stravaButtonContent}>
            <Image
              source={require("@/assets/images/strava-logo.png")}
              style={styles.stravaIcon}
              resizeMode="contain"
            />
            <Text style={styles.stravaButtonText}>Reconnect Strava</Text>
          </View>
        </TouchableOpacity>
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
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.activityItem,
              isSelected(item) && styles.selectedActivityItem,
            ]}
            onPress={() => selectActivity(item)}
          >
            <Image
              source={{ uri:"https://cyclotourisme-mag.com/wp-content/uploads/sites/2/2016/11/Cyclomontagnardes.jpg" }}
              style={styles.activityImage}
              resizeMode="cover"
            />
            <View style={styles.activityDetails}>
              <Text style={styles.activityName}>{item.name}</Text>
              <Text style={styles.activityType}>{item.type}</Text>
              <View style={styles.activityStats}>
                <Text style={styles.activityStat}>
                  {formatDistance(item.distance)}
                </Text>
                <Text style={styles.activityStat}>
                  {formatTime(item.moving_time)}
                </Text>
                <Text style={styles.activityStat}>
                  {formatDate(item.start_date)}
                </Text>
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
          <Text style={styles.noActivitiesText}>
            No recent Strava activities found
          </Text>
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
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    color: "#666",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    textAlign: "center",
  },
  activityItem: {
    flexDirection: "row",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  selectedActivityItem: {
    backgroundColor: "#f0f8ff",
    borderColor: "#FC4C02",
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
    fontWeight: "bold",
    marginBottom: 4,
  },
  activityType: {
    color: "#666",
    marginBottom: 8,
  },
  activityStats: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  activityStat: {
    backgroundColor: "#f1f1f1",
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
    backgroundColor: "#FC4C02",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  checkmarkText: {
    color: "white",
    fontWeight: "bold",
  },
  noActivities: {
    padding: 20,
    alignItems: "center",
  },
  noActivitiesText: {
    color: "#666",
    textAlign: "center",
  },
  stravaButton: {
    backgroundColor: "#FC4C02", // Strava orange
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 20,
  },
  stravaButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  stravaIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  stravaButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  helpText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: "#fff",
    borderColor: "#FC4C02",
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 10,
  },
  retryButtonText: {
    color: "#FC4C02",
    fontSize: 16,
    fontWeight: "bold",
  },
  continueButton: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
export default ActivitySelect;