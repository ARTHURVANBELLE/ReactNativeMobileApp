import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { StravaActivity } from "@/types/models";
import { useThemeColor } from "@/hooks/useThemeColor";
import Constants from "expo-constants";
import { fetchWithCors } from "@/utils/corsHandler";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loadAuthState } from "@/utils/session";

const API_URL = Constants.expoConfig?.extra?.REACT_APP_HOST;
interface ActivitySelectProps {
  formData: {
    stravaActivity: StravaActivity | null;
  };
  updateFormData: (
    data: Partial<{ stravaActivity: StravaActivity | null }>
  ) => void;
  currentUser: any;
}

const ActivitySelect: React.FC<ActivitySelectProps> = ({
  formData,
  updateFormData,
  currentUser,
}) => {
  const queryClient = useQueryClient();
  const [activities, setActivities] = useState<StravaActivity[]>([]);
  const [authState, setAuthState] = useState<{
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
    user: any | null;
  } | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  // Load auth state to get Strava token
  useEffect(() => {
    const getAuthState = async () => {
      setIsLoadingAuth(true);
      try {
        const state = await loadAuthState();
        console.log(
          "Auth state loaded:",
          state ? "Available" : "Not available"
        );
        console.log("Access token available:", Boolean(state?.accessToken));

        setAuthState(state);
      } catch (error) {
        console.error("Error loading auth state:", error);
      } finally {
        setIsLoadingAuth(false);
      }
    };

    getAuthState();
  }, []);

  const stravaActivitiesQuery = useQuery({
    queryKey: ["getStravaActivities", authState?.accessToken],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    enabled: Boolean(authState?.accessToken) && !isLoadingAuth,

    queryFn: async () => {
      if (!authState?.accessToken) {
        throw new Error(
          "Authentication required: No Strava access token available"
        );
      }

      // Use fetchWithCors with the correct endpoint
      const apiEndpoint = "http://localhost:3000/api/strava/activities/get-lasts?count=9";
      
      console.log("Fetching Strava activities from:", apiEndpoint);
      console.log("With auth token:", Boolean(authState?.accessToken) ? "Present (hidden for security)" : "Missing");

      try {
        // Use fetchWithCors for the API request
        const response = await fetchWithCors(apiEndpoint, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": `Bearer ${authState.accessToken}`,
          },
        }) as Response;

        console.log("Response status:", response.status);

        // Check if response is OK
        if (!response.ok) {
          const contentType = response.headers.get("content-type") || "";
          
          // For HTML responses (like error pages), get the text
          if (contentType.includes("text/html")) {
            const text = await response.text();
            console.error("Server returned HTML instead of JSON:", text.substring(0, 200) + "...");
            throw new Error(`Server error: ${response.status} - HTML response received instead of JSON`);
          } 
          
          // For JSON error responses
          if (contentType.includes("application/json")) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Server error: ${response.status}`);
          }
          
          // For other error types
          throw new Error(`API request failed with status ${response.status}`);
        }

        // Check content type
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          const text = await response.text();
          console.error("Expected JSON but got:", contentType);
          console.error("Response preview:", text.substring(0, 200) + "...");
          throw new Error("Server did not return JSON data");
        }

        // Parse response as JSON
        const responseText = await response.text();
        console.log("Raw response text:", responseText.substring(0, 200) + (responseText.length > 200 ? "..." : ""));
        
        let activities;
        try {
          activities = JSON.parse(responseText);
        } catch (parseError) {
          console.error("JSON parse error:", parseError);
          console.error("Invalid JSON:", responseText.substring(0, 200) + "...");
          throw new Error("Failed to parse server response as JSON");
        }

        // Log success
        console.log("Successfully parsed response as JSON");
        
        // Detailed logging of the returned data
        if (Array.isArray(activities)) {
          console.log(`Received ${activities.length} activities`);
          if (activities.length > 0) {
            console.log("First activity example:", JSON.stringify(activities[0], null, 2));
          }
        } else {
          console.log("Response is not an array:", typeof activities);
        }

        return Array.isArray(activities) ? activities : [];
      } catch (error) {
        console.error("Error fetching activities:", error);
        
        // Try a different endpoint as fallback, also with fetchWithCors
        try {
          console.log("Trying alternative endpoint...");
          
          
          // Use a different endpoint structure
          const fallbackEndpoint = "http://localhost:3000/api/strava/get-activities?limit=5";
          console.log("Fallback endpoint:", fallbackEndpoint);
          
          const fallbackResponse = await fetchWithCors(fallbackEndpoint, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
              "Authorization": `Bearer ${authState.accessToken}`,
              "Cache-Control": "no-cache", // Prevent caching
            },
          }) as Response;
          
          console.log("Fallback response status:", fallbackResponse.status);
          
          if (!fallbackResponse.ok) {
            throw new Error(`Fallback API request failed: ${fallbackResponse.status}`);
          }
          
          const fallbackText = await fallbackResponse.text();
          console.log("Fallback response text:", fallbackText.substring(0, 200));
          
          try {
            const activities = JSON.parse(fallbackText);
            return Array.isArray(activities) ? activities : [];
          } catch (parseError) {
            console.error("Fallback JSON parse error:", parseError);
            throw new Error("Failed to parse fallback response as JSON");
          }
        } catch (fallbackError) {
          console.error("Fallback request also failed:", fallbackError);
          throw error; // Throw the original error
        }
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
    return (
      formData.stravaActivity && formData.stravaActivity.id === activity.id
    );
  };

  const selectActivity = (activity: StravaActivity) => {
    updateFormData({ stravaActivity: activity });
  };

  // If still loading auth state
  if (isLoadingAuth) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FC4C02" />
        <Text style={styles.loadingText}>
          Checking Strava authentication...
        </Text>
      </View>
    );
  }

  // If the user isn't connected to Strava, show connection UI
  if (!authState?.accessToken) {
    return (
      <View style={styles.centered}>
        <Text style={styles.title}>Connect with Strava</Text>
        <Text style={styles.subtitle}>
          To select a Strava activity, you need to connect your Strava account.
        </Text>

        <TouchableOpacity
          style={styles.stravaButton}
          onPress={() => {
            // Implement Strava connection using loginWithStrava from session.ts
            import("@/utils/session").then(({ loginWithStrava }) => {
              loginWithStrava().then((success) => {
                if (success) {
                  // Reload auth state after successful login
                  loadAuthState().then((newState) => {
                    setAuthState(newState);
                    console.log("Strava connected successfully");
                  });
                } else {
                  console.log("Strava connection failed");
                }
              });
            });
          }}
        >
          <View style={styles.stravaButtonContent}>
            <Image
              source={require("@/assets/images/strava-logo.png")}
              style={styles.stravaIcon}
              resizeMode="contain"
            />
            <Text style={styles.stravaButtonText}>Connect with Strava</Text>
          </View>
        </TouchableOpacity>
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
              source={{ uri: item.thumbnail }}
              style={styles.activityImage}
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
});

export default ActivitySelect;
