import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  FlatList, 
  Image, 
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWithCors } from "@/utils/corsHandler";
import { Ionicons } from '@expo/vector-icons';
import { TopUser } from '@/types/models';
import { Activity } from '@/types/models';

// Debug utility function for logging data operations
const debugRankingData = (label: string, data: any) => {
  console.log(`[DEBUG:RANKING] ${label}:`, JSON.stringify(data, null, 2));
};

// Function to normalize user data format
const normalizeTopUserData = (data: any[]): TopUser[] => {
  if (!Array.isArray(data)) {
    console.error('[DEBUG:RANKING] Invalid data format received:', data);
    return [];
  }
  
  debugRankingData('Normalizing data array of length', data.length);
  
  return data.map((user, index) => {
    // Ensure all required fields are present with appropriate defaults
    const normalizedUser: TopUser = {
      stravaId: user.stravaId || `unknown-${index}`,
      firstName: user.firstName || 'Unknown',
      lastName: user.lastName || 'User',
      teamId: user.teamId || null,
      imageUrl: user.imageUrl || null,
      _count: {
        activities: user._count?.activities || 0
      }
    };
    
    return normalizedUser;
  });
};

export default function RankingScreen() {
  const queryClient = useQueryClient();
  
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['topUsers'],
    queryFn: async () => {
      debugRankingData('Fetching top users', { timestamp: new Date().toISOString() });
      
      try {
        const response = await fetchWithCors('http://localhost:3000/api/user/top-users?limit=10');
        
        debugRankingData('Raw response received', { 
          type: typeof response,
          isResponse: response instanceof Response,
          status: (response as Response).status
        });
        
        // Check if response is a proper Response object
        if (response && typeof response === 'object' && 'ok' in response) {
          if (!response.ok) {
            const errorMsg = `Network error: ${(response as Response).status}`;
            debugRankingData('Error response', { status: (response as Response).status, message: errorMsg });
            throw new Error(errorMsg);
          }
          
          try {
            const rawData = await (response as Response).json();
            debugRankingData('Raw API data', rawData);
            
            // Normalize the data
            const normalizedData = normalizeTopUserData(Array.isArray(rawData) ? rawData : []);
            debugRankingData('Normalized top users data', normalizedData);
            
            return normalizedData;
          } catch (jsonError) {
            debugRankingData('JSON parsing error', { error: String(jsonError) });
            throw new Error(`Failed to parse response: ${jsonError}`);
          }
        } else {
          // Direct data response (not a Response object)
          if (response && typeof response === 'object') {
            debugRankingData('Direct data response', response);
            const normalizedData = normalizeTopUserData(Array.isArray(response) ? response : []);
            return normalizedData;
          }
          
          debugRankingData('Invalid response format', { response });
          throw new Error('Invalid response format from API');
        }
      } catch (fetchError) {
        debugRankingData('Fetch error', { error: String(fetchError) });
        throw fetchError;
      }
    }
  });

  // Add refresh mutation
  const refreshRankings = useMutation({
    mutationFn: async () => {
      debugRankingData('Manually refreshing rankings', { timestamp: new Date().toISOString() });
      // This function doesn't need to do anything except trigger the invalidation
      return Promise.resolve();
    },
    onSuccess: () => {
      debugRankingData('Refresh successful, invalidating queries', { queryKey: ['topUsers'] });
      // Invalidate and refetch the topUsers query
      queryClient.invalidateQueries({ queryKey: ['topUsers'] });
    }
  });

  // Function to render the refresh button with loading state
  const renderRefreshButton = () => {
    return (
      <TouchableOpacity 
        style={styles.refreshButton} 
        onPress={() => refreshRankings.mutate()}
        disabled={refreshRankings.isPending || isLoading}
      >
        {(refreshRankings.isPending || isLoading) ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Ionicons name="refresh" size={20} color="white" />
        )}
        <Text style={styles.refreshButtonText}>
          {(refreshRankings.isPending || isLoading) ? "Refreshing..." : "Refresh Rankings"}
        </Text>
      </TouchableOpacity>
    );
  };

  // Function to render medal icons based on position
  const renderMedal = (position: number) => {
    switch(position) {
      case 0:
        return <Ionicons name="trophy" size={24} color="#FFD700" />;
      case 1:
        return <Ionicons name="trophy" size={24} color="#C0C0C0" />;
      case 2:
        return <Ionicons name="trophy" size={24} color="#CD7F32" />;
      default:
        return <Text style={styles.position}>#{position + 1}</Text>;
    }
  };

  // Function to render each user in the list
  const renderItem = ({ item, index }: { item: TopUser; index: number }) => (
    <View style={styles.userCard}>
      <View style={styles.positionContainer}>
        {renderMedal(index)}
      </View>
      
      <Image 
        source={{ uri: item.imageUrl || 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y' }}
        style={styles.avatar}
      />
      
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.firstName} {item.lastName}</Text>
        <Text style={styles.teamId}>Team ID: {item.teamId}</Text>
      </View>
      
      <View style={styles.activityCount}>
        <Ionicons name="bicycle" size={20} color="#FC4C02" />
        <Text style={styles.countText}>{item._count?.activities ?? 0}</Text>
        <Text style={styles.activityLabel}>activities</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Top Athletes</Text>
        <Text style={styles.subtitle}>Most Active Users</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FC4C02" />
          <Text style={styles.loadingText}>Loading rankings...</Text>
        </View>
      ) : isError ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#E74C3C" />
          <Text style={styles.errorText}>
            {error instanceof Error ? error.message : 'An error occurred while loading rankings.'}
          </Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => refreshRankings.mutate()}
            disabled={refreshRankings.isPending}
          >
            <Text style={styles.retryText}>
              {refreshRankings.isPending ? "Refreshing..." : "Try Again"}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={(item) => item.stravaId.toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No rankings available</Text>
              </View>
            }
          />
          
          <View style={styles.footer}>
            {renderRefreshButton()}
          </View>
        </>
      )}
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
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  listContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  positionContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  position: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  teamId: {
    fontSize: 14,
    color: '#666',
  },
  activityCount: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  countText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FC4C02',
    marginVertical: 4,
  },
  activityLabel: {
    fontSize: 12,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#FC4C02',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  refreshButton: {
    backgroundColor: '#FC4C02',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});