import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Sparkles, CreditCard as Edit3, Plus } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import SparkModal from '@/components/SparkModal';

type Profile = {
  id: string;
  username: string;
  avatar: string;
};

type Spark = {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: Profile;
};

export default function FeedScreen() {
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [userSpark, setUserSpark] = useState<Spark | null>(null);
  const { user } = useAuth();

  const fetchTodaySparks = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('sparks')
        .select(`
          *,
          profiles (
            id,
            username,
            avatar
          )
        `)
        .gte('created_at', today.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSparks(data || []);

      const mySparkToday = data?.find((s) => s.user_id === user?.id);
      setUserSpark(mySparkToday || null);
    } catch (error) {
      console.error('Error fetching sparks:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTodaySparks();

    const channel = supabase
      .channel('sparks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sparks',
        },
        () => {
          fetchTodaySparks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTodaySparks();
  };

  const handleSubmitSpark = async (content: string) => {
    if (userSpark) {
      const { error } = await supabase
        .from('sparks')
        .update({ content })
        .eq('id', userSpark.id);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('sparks')
        .insert([{ user_id: user?.id, content }]);

      if (error) throw error;
    }

    await fetchTodaySparks();
  };

  const renderSpark = ({ item }: { item: Spark }) => {
    const isOwnSpark = item.user_id === user?.id;
    const sparkDate = new Date(item.created_at);
    const timeString = sparkDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    return (
      <View style={styles.sparkCard}>
        <View style={styles.sparkHeader}>
          <View style={styles.avatarContainer}>
            <Sparkles size={20} color="#2196F3" strokeWidth={2.5} />
          </View>
          <View style={styles.sparkMeta}>
            <Text style={styles.username}>
              {item.profiles?.username || 'Anonymous'}
              {isOwnSpark && <Text style={styles.youBadge}> (You)</Text>}
            </Text>
            <Text style={styles.timestamp}>{timeString}</Text>
          </View>
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
        <Text style={styles.title}>Daily Sparks</Text>
        <Text style={styles.subtitle}>{sparks.length} sparks today</Text>
      </View>

      <FlatList
        data={sparks}
        renderItem={renderSpark}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2196F3"
            colors={['#2196F3']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Sparkles size={64} color="#ccc" />
            <Text style={styles.emptyText}>No sparks yet today</Text>
            <Text style={styles.emptySubtext}>Be the first to share!</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.9}
      >
        {userSpark ? (
          <Edit3 size={24} color="#fff" strokeWidth={2.5} />
        ) : (
          <Plus size={28} color="#fff" strokeWidth={2.5} />
        )}
      </TouchableOpacity>

      <SparkModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleSubmitSpark}
        initialContent={userSpark?.content || ''}
        isEditing={!!userSpark}
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 100,
  },
  sparkCard: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sparkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sparkMeta: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  youBadge: {
    color: '#2196F3',
    fontWeight: '700',
  },
  timestamp: {
    fontSize: 13,
    color: '#999',
  },
  sparkContent: {
    fontSize: 15,
    color: '#1a1a1a',
    lineHeight: 22,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#999',
    marginTop: 6,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
});
