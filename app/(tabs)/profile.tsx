import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { getCurrentUser, logout } from "@/utils/session";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchWithCors } from "@/utils/corsHandler";
import { updateUserProfile } from "@/utils/userApi";
import TeamSelect, { Team } from "@/components/Profile/TeamSelect";
import {User as UserSchema} from "@/types/models";

// Debug function to log user data changes
const debugUserData = (label: string, data: any) => {
  console.log(`[DEBUG:USER] ${label}:`, JSON.stringify(data, null, 2));
};

// Function to normalize user data format
const normalizeUserData = (data: any): UserSchema => {
  // Handle different response formats
  const userData = data.user || data;
  
  if (!userData) {
    throw new Error("Invalid user data format received");
  }
  
  // Ensure all expected fields have appropriate types
  return {
    stravaId: userData.stravaId || '',
    firstName: userData.firstName || '',
    lastName: userData.lastName || '',
    email: userData.email || '',
    password: userData.password || undefined,
    imageUrl: userData.imageUrl || '',
    teamId: userData.teamId || null,
    isAdmin: !!userData.isAdmin,
    accessToken: userData.accessToken || null,
    refreshToken: userData.refreshToken || null,
  };
};

export default function ProfileScreen() {
  const [userSession, setUserSession] = useState<any>(null);
  const [user, setUser] = useState<UserSchema | null>(null);
  const [editedUser, setEditedUser] = useState<Partial<UserSchema>>({});
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    const initUserSession = async () => {
      const session = await getCurrentUser();
      setUserSession(session);
    };

    initUserSession();
  }, []);

  const userQuery = useQuery({
    queryKey: ["getUser"],
    staleTime: 30000,
    refetchOnWindowFocus: true,
    enabled: !!userSession?.id, // Only run query when userSession is available

    queryFn: async () => {
      if (!userSession?.id) {
        throw new Error("User session not available");
      }

      debugUserData("Fetching user with ID", userSession.id);

      try {
        const response = await fetchWithCors(
          `http://localhost:3000/api/user/by-id?userId=${userSession.id}`
        );
        
        // Check if response is a proper Response object
        if (response && typeof response === 'object' && 'ok' in response) {
          if (!response.ok) {
            // Handle error response safely
            const typedResponse = response as Response;
            let errorMessage = `API error: ${typedResponse.status}`;
            try {
              const errorText = await typedResponse.text();
              console.error("API error response:", errorText);
              errorMessage += ` - ${errorText}`;
            } catch (textError) {
              console.error("Could not extract error text:", textError);
            }
            throw new Error(errorMessage);
          }
          
          try {
            const data = await response;
            debugUserData("Raw API response", data);
            
            // Normalize the user data
            const normalizedUser = normalizeUserData(data);
            debugUserData("Normalized user data", normalizedUser);
            
            // Update the local state with normalized user data
            setUser(normalizedUser);
            return normalizedUser;
          } catch (jsonError) {
            console.error("Error parsing JSON response:", jsonError);
            throw new Error("Invalid response format");
          }
        } else {
          // Handle case where response is not a proper Response object
          console.error("Invalid response object:", response);
          if (response && typeof response === 'object') {
            // If response is already parsed JSON
            debugUserData("Direct JSON response", response);
            const normalizedUser = normalizeUserData(response);
            setUser(normalizedUser);
            return normalizedUser;
          }
          throw new Error("Invalid response type from fetchWithCors");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        throw error;
      }
    },
  });

  // Fetch teams data
  const teamsQuery = useQuery({
    queryKey: ["teams"],
    staleTime: 300000, // 5 minutes
    enabled: !!userSession?.id,

    queryFn: async () => {
      const response = await fetchWithCors(
        `http://localhost:3000/api/team/get-teams`
      ) as Response;
      const data = await response.json();

      console.log("Teams data received:", data);

      if (data) {
        setTeams(data);
        return data;
      }

      throw new Error("Failed to fetch teams data");
    },
  });

  // Add a mutation for updating user data using the updateUserProfile function
  const updateUserMutation = useMutation({
    mutationFn: async (userData: Partial<UserSchema>) => {
      if (!userSession?.id) {
        throw new Error("User session not available");
      }

      // Prepare the data object for the API and convert null to undefined for tokens
      const updateData = {
        stravaId: userSession.id,
        ...userData,
        accessToken: userData.accessToken ?? undefined,
        refreshToken: userData.refreshToken ?? undefined,
      };
      
      debugUserData("Updating user with data", updateData);

      try {
        const updatedUser = await updateUserProfile(updateData);
        debugUserData("Update response", updatedUser);
        
        // Normalize the response data
        const normalizedUser = normalizeUserData(updatedUser);
        return { user: normalizedUser };
      } catch (error) {
        console.error("Error updating user profile:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Update local user data and reset editing state
      setUser(data.user);
      setIsEditing(false);
      setEditedUser({});

      // Invalidate and refetch user data
      queryClient.invalidateQueries({ queryKey: ["getUser"] });
      
      debugUserData("Profile updated successfully", data.user);
      Alert.alert("Success", "Profile updated successfully");
    },
    onError: (error) => {
      console.error("Profile update failed:", error);
      Alert.alert(
        "Update Failed",
        error instanceof Error ? error.message : "Unknown error occurred"
      );
    },
  });

  // Handle form field changes
  const handleChange = (field: keyof UserSchema, value: string) => {
    setEditedUser((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = () => {
    if (Object.keys(editedUser).length === 0) {
      setIsEditing(false);
      return;
    }

    updateUserMutation.mutate(editedUser);
  };

  // Update the loading state to also consider query errors
  useEffect(() => {
    if (userQuery.isLoading || !userSession) {
      setLoading(true);
    } else {
      setLoading(false);

      // If there's an error, show an alert
      if (userQuery.isError) {
        Alert.alert(
          "Error Loading Profile",
          "Unable to load profile information. Please try again later."
        );
      }
    }
  }, [userQuery.isLoading, userQuery.isError, userSession]);

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      Alert.alert("Logout failed", "There was a problem logging out.");
    }
  };

  // Handle team selection
  const handleTeamSelect = (teamId: number) => {
    setEditedUser((prev) => ({
      ...prev,
      teamId: teamId,
    }));
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.profileCard}>
        <Image
          source={
            user?.imageUrl
              ? { uri: user.imageUrl }
              : require("@/assets/images/strava-logo.png")
          }
          style={styles.profileImage}
        />
        <Text style={styles.formValue}>ID: {user?.stravaId || "N/A"}</Text>

        <View style={styles.formContainer}>
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>First Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.formInput}
                value={
                  editedUser.firstName !== undefined
                    ? editedUser.firstName
                    : user?.firstName || ""
                }
                onChangeText={(text) => handleChange("firstName", text)}
              />
            ) : (
              <Text style={styles.formValue}>{user?.firstName || "N/A"}</Text>
            )}
          </View>

          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Last Name</Text>
            {isEditing ? (
              <TextInput
                style={styles.formInput}
                value={
                  editedUser.lastName !== undefined
                    ? editedUser.lastName
                    : user?.lastName || ""
                }
                onChangeText={(text) => handleChange("lastName", text)}
              />
            ) : (
              <Text style={styles.formValue}>{user?.lastName || "N/A"}</Text>
            )}
          </View>

          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Email</Text>
            {isEditing ? (
              <TextInput
                style={styles.formInput}
                value={
                  editedUser.email !== undefined
                    ? editedUser.email
                    : user?.email || ""
                }
                onChangeText={(text) => handleChange("email", text)}
                keyboardType="email-address"
              />
            ) : (
              <Text style={styles.formValue}>{user?.email || "N/A"}</Text>
            )}
          </View>

          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Password</Text>
            {isEditing ? (
              <TextInput
                style={styles.formInput}
                value={
                  editedUser.password !== undefined
                    ? editedUser.password
                    : "" // Empty by default when editing
                }
                onChangeText={(text) => handleChange("password", text)}
                keyboardType="visible-password"
                secureTextEntry={true}
                placeholder="Enter new password"
              />
            ) : (
              <Text style={styles.formValue}>{user?.password ? "••••••••" : "N/A"}</Text>
            )}
          </View>

          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Team</Text>
            <TeamSelect
              teams={teams}
              selectedTeamId={
                editedUser.teamId !== undefined
                  ? editedUser.teamId
                  : user?.teamId
              }
              onSelectTeam={handleTeamSelect}
              isEditing={isEditing}
            />
          </View>

          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Profile Picture URL</Text>
            {isEditing ? (
              <TextInput
                style={styles.formInput}
                value={
                  editedUser.imageUrl !== undefined
                    ? editedUser.imageUrl
                    : user?.imageUrl || ""
                }
                onChangeText={(text) => handleChange("imageUrl", text)}
              />
            ) : (
              user?.imageUrl ? (
                <Text
                  style={styles.formValue}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  URL available
                </Text>
              ) : (
                <Text style={styles.formValue}>N/A</Text>
              )
            )}
          </View>

          {/* Admin status - read only */}
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Admin</Text>
            <Text style={[styles.formValue, user?.isAdmin && styles.highlight]}>
              {user?.isAdmin ? "Yes" : "No"}
            </Text>
          </View>

          {/* Edit/Submit buttons */}
          <View style={styles.buttonContainer}>
            {isEditing ? (
              <>
                <TouchableOpacity
                  style={[styles.button, styles.submitButton]}
                  onPress={handleSubmit}
                  disabled={updateUserMutation.isPending}
                >
                  <Text style={styles.buttonText}>
                    {updateUserMutation.isPending
                      ? "Saving..."
                      : "Save Changes"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setIsEditing(false);
                    setEditedUser({});
                  }}
                  disabled={updateUserMutation.isPending}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.editButton]}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.buttonText}>Edit Profile</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Status indicators */}
      {userQuery.isLoading && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>Refreshing profile data...</Text>
        </View>
      )}

      {userQuery.isError && (
        <View style={[styles.statusContainer, styles.errorContainer]}>
          <Text style={styles.errorText}>
            Error loading profile. Pull down to refresh.
          </Text>
        </View>
      )}

      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Settings</Text>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="settings-outline" size={22} color="#555" />
          <Text style={styles.menuItemText}>App Settings</Text>
          <Ionicons name="chevron-forward" size={18} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="notifications-outline" size={22} color="#555" />
          <Text style={styles.menuItemText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={18} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <Ionicons name="shield-checkmark-outline" size={22} color="#555" />
          <Text style={styles.menuItemText}>Privacy</Text>
          <Ionicons name="chevron-forward" size={18} color="#aaa" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#E74C3C" />
          <Text style={[styles.menuItemText, { color: "#E74C3C" }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
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
  profileCard: {
    backgroundColor: "white",
    alignItems: "center",
    padding: 20,
    marginHorizontal: 16,
    marginTop: -30,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
  },
  formContainer: {
    width: "100%",
    marginTop: 10,
  },
  formRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    width: "100%",
  },
  formLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  formValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "400",
    maxWidth: "60%",
    textAlign: "right",
  },
  highlight: {
    color: "#FC4C02",
    fontWeight: "600",
  },
  menuSection: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 20,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
  },
  statusContainer: {
    padding: 12,
    margin: 16,
    borderRadius: 8,
    backgroundColor: "#f0f9ff",
    alignItems: "center",
  },
  statusText: {
    color: "#0284c7",
    fontSize: 14,
  },
  errorContainer: {
    backgroundColor: "#fef2f2",
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
  },
  formInput: {
    fontSize: 14,
    color: "#333",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: "60%",
    textAlign: "right",
    backgroundColor: "#f9f9f9",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 15,
    gap: 10,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 120,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  editButton: {
    backgroundColor: "#4A90E2",
  },
  submitButton: {
    backgroundColor: "#4CAF50",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#999",
  },
  cancelButtonText: {
    color: "#333",
    fontWeight: "600",
    fontSize: 16,
  },
});
