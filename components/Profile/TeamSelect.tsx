import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchWithCors } from "@/utils/corsHandler";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Constants from "expo-constants";

interface UserSchema {
  firstName: string;
  lastName: string;
  email: string;
  teamId: number;
  imageUrl: string;
  stravaId: number;
  isAdmin: boolean;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  password: string;
}

export interface Team {
  id: number;
  name: string;
  users: UserSchema[];
}

interface TeamSelectProps {
  teams: Team[];
  selectedTeamId?: number;
  onSelectTeam: (teamId: number) => void;
  isEditing: boolean;
}

interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

/**
 * TeamSelect component for selecting teams from a dropdown list
 */
const TeamSelect: React.FC<TeamSelectProps> = ({
  teams: propTeams,
  selectedTeamId,
  onSelectTeam,
  isEditing,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const queryClient = useQueryClient();
  
  // API URL from environment or config
const API_URL = Constants.expoConfig?.extra?.REACT_APP_HOST;
  
  const { data: fetchedTeams, isLoading, error } = useQuery<Team[], Error>({
      queryKey: ["getTeams"],
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      queryFn: async (): Promise<Team[]> => {
        try {
          console.log('Fetching teams from:', `${API_URL}/api/team/get-teams`);
          
          const response = await fetchWithCors<ApiResponse<Team[]> | Team[]>(`${API_URL}/api/team/get-teams`);
          
          console.log('API response:', response);
          
          if (!response) {
            console.log('No response received');
            return [];
          }
          
          // Check if response is an array (direct data) or has a data property
          if (Array.isArray(response)) {
            console.log('Response is an array of teams:', response);
            return response;
          } else if (response.data) {
            console.log('Response contains data property with teams:', response.data);
            return response.data;
          } else {
            console.log('Response format not recognized:', response);
            return [];
          }
        } catch (error) {
          console.error('Error fetching teams:', error);
          throw error as Error;
        }
      }
    });

  // Use fetched teams if available, otherwise fallback to prop teams
  const teamsToDisplay = fetchedTeams || propTeams || [];
  
  // Find the selected team name
  const selectedTeam = teamsToDisplay.find((team) => team.id === selectedTeamId);

  if (!isEditing) {
    return (
      <Text style={styles.formValue}>
        {selectedTeam?.name || `Team ID: ${selectedTeamId}` || "N/A"}
      </Text>
    );
  }

  return (
    <View style={styles.teamSelectContainer}>
      <TouchableOpacity
        style={styles.teamSelectButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.teamSelectText}>
          {selectedTeam?.name || "Select Team"}
        </Text>
        <Ionicons name="chevron-down" size={16} color="#555" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Team</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#555" />
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <Text style={styles.loadingText}>Loading teams...</Text>
            ) : error ? (
              <Text style={styles.errorText}>Error loading teams: {error.message}</Text>
            ) : (
              <FlatList
                data={teamsToDisplay}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.teamOption,
                      item.id === selectedTeamId && styles.selectedTeamOption,
                    ]}
                    onPress={() => {
                      onSelectTeam(item.id);
                      setModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.teamOptionText,
                        item.id === selectedTeamId && styles.selectedTeamOptionText,
                      ]}
                    >
                      {item.name}
                    </Text>
                    {item.id === selectedTeamId && (
                      <Ionicons name="checkmark" size={20} color="#4CAF50" />
                    )}
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  formValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "400",
    maxWidth: "60%",
    textAlign: "right",
  },
  teamSelectContainer: {
    minWidth: "60%",
  },
  teamSelectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 8,
    minWidth: "60%",
  },
  teamSelectText: {
    fontSize: 14,
    color: "#333",
    marginRight: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  teamOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedTeamOption: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
  teamOptionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedTeamOptionText: {
    fontWeight: "600",
    color: "#4CAF50",
  },
  loadingText: {
    padding: 15,
    textAlign: 'center',
    color: '#666',
  },
  errorText: {
    padding: 15,
    textAlign: 'center',
    color: 'red',
  },
});

export default TeamSelect;
