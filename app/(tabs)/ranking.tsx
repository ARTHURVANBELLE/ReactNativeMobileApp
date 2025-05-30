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

interface Activity {
  activityId: number;
}

interface TopUser {
  stravaId: number;
  firstName: string;
  lastName: string;
  email: string;
  imageUrl: string;
  teamId: number;
  isAdmin: boolean;
  _count: {
    activities: number;
  };
  activities: Activity[];
}

export default function RankingScreen() {
  const queryClient = useQueryClient();
  
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['topUsers'],
    queryFn: async () => {
      const response = await fetchWithCors('http://localhost:3000/api/user/top-users?limit=10');
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      return data as TopUser[];
    }
  });

  // Add refresh mutation
  const refreshRankings = useMutation({
    mutationFn: async () => {
      // This function doesn't need to do anything except trigger the invalidation
      return Promise.resolve();
    },
    onSuccess: () => {
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
        <Text style={styles.countText}>{item._count.activities}</Text>
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