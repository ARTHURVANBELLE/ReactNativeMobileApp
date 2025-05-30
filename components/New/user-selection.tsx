import React, { useEffect, useState, Suspense } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  SectionList,
} from "react-native";
import { fetchWithCors } from "@/utils/corsHandler";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useThemeColor } from "@/hooks/useThemeColor";
import Constants from "expo-constants";
import { AntDesign } from '@expo/vector-icons';
import { Team, User, ApiResponse } from "@/types/models";

const API_URL = Constants.expoConfig?.extra?.REACT_APP_HOST;

interface UserSelectProps {
  formData: {
    participants: User[];
  };
  updateFormData: (data: Partial<{ participants: User[] }>) => void;
  currentUser: User;
}

const TeamSkeleton = () => (
  <View style={styles.skeletonContainer}>
    <View style={styles.skeletonTeamHeader} />
    <View style={styles.skeletonUser} />
    <View style={styles.skeletonUser} />
  </View>
);

interface TeamListProps {
  formData: {
    participants: User[];
  };
  updateFormData: (data: Partial<{ participants: User[] }>) => void;
}

const TeamList: React.FC<TeamListProps> = ({ formData, updateFormData }) => {
  const [expandedTeams, setExpandedTeams] = useState<Record<number, boolean>>({});
  const themeColor = useThemeColor({}, "tint");

  const { data: teams, isLoading, error } = useQuery<Team[], Error>({
    queryKey: ["getTeams"],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    queryFn: async (): Promise<Team[]> => {
      try {
        const response = await fetchWithCors<ApiResponse<Team[]> | Team[]>(`${API_URL}/api/team/get-teams`);
        
        if (!response) {
          return [];
        }
        
        // Check if response is an array (direct data) or has a data property
        if (Array.isArray(response)) {
          return response;
        } else if (response.data) {
          return response.data;
        } else {
          return [];
        }
      } catch (error) {
        throw error as Error;
      }
    }
  });

  useEffect(() => {
    // Keep empty useEffect to avoid modifying component structure
  }, [teams]);

  useEffect(() => {
    // Keep empty useEffect to avoid modifying component structure
  }, [error]);

  const toggleTeamExpanded = (teamId: number): void => {
    setExpandedTeams(prev => ({
      ...prev,
      [teamId]: !prev[teamId]
    }));
  };

  const isSelected = (user: User): boolean => {
    if (!user || !user.stravaId) {
      return false;
    }
    
    return formData.participants.some(
      (participant) => participant.stravaId === user.stravaId
    );
  };

  const toggleUser = (user: User): void => {
    if (!user || !user.stravaId) {
      return;
    }
    
    if (isSelected(user)) {
      updateFormData({
        participants: formData.participants.filter((p) => p.stravaId !== user.stravaId),
      });
    } else {
      updateFormData({
        participants: [...formData.participants, user],
      });
    }
  };

  useEffect(() => {
    // Keep empty useEffect to avoid modifying component structure
  }, [teams]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={themeColor} />
        <Text>Loading teams...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error loading teams: {error.message}</Text>
        <Text style={styles.errorSubtext}>Please check your internet connection and try again.</Text>
      </View>
    );
  }

  if (!teams || teams.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyTeamText}>No teams available</Text>
      </View>
    );
  }
  
  return (
    <FlatList
      data={teams}
      keyExtractor={(team) => (team && team.id) ? team.id.toString() : `team-${Math.random()}`}
      renderItem={({ item: team }) => {
        if (!team || !team.id) {
          return null;
        }
        
        const teamUsers = team.users || [];
        
        return (
          <View style={styles.teamContainer}>
            <TouchableOpacity 
              style={styles.teamHeader}
              onPress={() => toggleTeamExpanded(team.id)}
            >
              <Text style={styles.teamName}>{team.name || "Unnamed Team"}</Text>
              <AntDesign 
                name={expandedTeams[team.id] ? "caretup" : "caretdown"} 
                size={16} 
                color="#666" 
              />
            </TouchableOpacity>

            {expandedTeams[team.id] && (
              <View style={styles.usersContainer}>
                {teamUsers.length > 0 ? (
                  teamUsers.map(user => {
                    if (!user || !user.stravaId) {
                      return null;
                    }
                    
                    return (
                      <TouchableOpacity
                        key={user.stravaId}
                        style={[
                          styles.userItem,
                          isSelected(user) && styles.selectedUserItem,
                        ]}
                        onPress={() => toggleUser(user)}
                      >
                        <Image
                          source={{ uri: user.imageUrl || "https://via.placeholder.com/50" }}
                          style={styles.userImage}
                        />
                        <Text style={styles.userName}>{`${user.firstName || ''} ${user.lastName || ''}`}</Text>
                        {isSelected(user) && (
                          <View style={styles.checkmark}>
                            <Text style={styles.checkmarkText}>✓</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <Text style={styles.emptyTeamText}>No users in this team</Text>
                )}
              </View>
            )}
          </View>
        );
      }}
      ListEmptyComponent={
        <Text style={styles.emptyTeamText}>No teams available</Text>
      }
    />
  );
};

const UserSelect: React.FC<UserSelectProps> = ({
  formData,
  updateFormData,
  currentUser,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Participants</Text>

      <Text style={styles.subtitle}>
        Who participated in this activity with you?
      </Text>

      <Suspense fallback={<TeamSkeleton />}>
        <TeamList formData={formData} updateFormData={updateFormData} />
      </Suspense>

      <Text style={styles.selectedCount}>
        {formData.participants.length} participants selected
      </Text>
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
  userItem: {
    flexDirection: "row",
    alignItems: "center",
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
  selectedUserItem: {
    backgroundColor: "#f0f8ff",
    borderColor: "#FC4C02",
    borderWidth: 1,
  },
  userImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  userName: {
    fontSize: 16,
    flex: 1,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FC4C02",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    color: "white",
    fontWeight: "bold",
  },
  selectedCount: {
    textAlign: "center",
    marginTop: 20,
    color: "#666",
    fontSize: 14,
  },
  teamContainer: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 12,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  teamName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  usersContainer: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  emptyTeamText: {
    padding: 12,
    textAlign: 'center',
    fontStyle: 'italic',
    color: '#888',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  skeletonContainer: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
  },
  skeletonTeamHeader: {
    height: 24,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonUser: {
    height: 50,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 8,
  },
});

export default UserSelect;
