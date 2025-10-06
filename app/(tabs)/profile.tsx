import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Sparkles, LogOut, Calendar, Edit2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import EditProfileModal from '@/components/EditProfileModal';

type Profile = {
  username: string;
  avatar: string;
};

type Spark = {
  id: string;
  content: string;
  created_at: string;
};

export default function ProfileScreen() {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const { user, signOut } = useAuth();

  const fetchUserData = async () => {
    if (!user) return;

    try {
      const [sparksResult, profileResult] = await Promise.all([
        supabase
          .from('sparks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('username, avatar')
          .eq('id', user.id)
          .maybeSingle(),
      ]);

      if (sparksResult.error) throw sparksResult.error;
      if (profileResult.error) throw profileResult.error;

      setSparks(sparksResult.data || []);
      setProfile(profileResult.data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth');
  };

  const renderSpark = ({ item }: { item: Spark }) => {
    const sparkDate = new Date(item.created_at);
    const dateString = sparkDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <View style={styles.sparkCard}>
        <View style={styles.sparkHeader}>
          <Calendar size={14} color="#2196F3" />
          <Text style={styles.sparkDate}>{dateString}</Text>
        </View>
        <Text style={styles.sparkContent}>{item.content}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Sparkles size={32} color="#2196F3" strokeWidth={2} />
          </View>
          <Text style={styles.username}>@{profile?.username || 'User'}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{sparks.length}</Text>
              <Text style={styles.statLabel}>Total Sparks</Text>
            </View>
          </View>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setEditModalVisible(true)}
          >
            <Edit2 size={18} color="#2196F3" />
            <Text style={styles.editText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <LogOut size={18} color="#FF5252" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sparksSection}>
        <Text style={styles.sectionTitle}>Your Sparks</Text>

        <FlatList
          data={sparks}
          renderItem={renderSpark}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Sparkles size={48} color="#ccc" />
              <Text style={styles.emptyText}>No sparks yet</Text>
              <Text style={styles.emptySubtext}>Start sharing your inspirations!</Text>
            </View>
          }
        />
      </View>

      <EditProfileModal
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        currentUsername={profile?.username || ''}
        currentAvatar={profile?.avatar || 'Sparkles'}
        onUpdate={fetchUserData}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  username: {
    fontSize: 20,
    color: '#1a1a1a',
    marginBottom: 16,
    fontWeight: '700',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  statBox: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  buttonGroup: {
    gap: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E3F2FD',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBDEFB',
  },
  editText: {
    color: '#2196F3',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFEBEE',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  signOutText: {
    color: '#FF5252',
    fontSize: 16,
    fontWeight: '600',
  },
  sparksSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  list: {
    paddingBottom: 24,
  },
  sparkCard: {
    marginBottom: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sparkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sparkDate: {
    fontSize: 11,
    color: '#2196F3',
    fontWeight: '600',
  },
  sparkContent: {
    fontSize: 14,
    color: '#1a1a1a',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 17,
    color: '#666',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 6,
  },
});
