import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { Sparkles, CreditCard as Edit3, Plus, Bookmark, BookmarkCheck } from 'lucide-react-native';
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
  is_saved?: boolean;
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

      const [sparksResult, savedResult] = await Promise.all([
        supabase
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
          .order('created_at', { ascending: false }),
        supabase
          .from('saved_sparks')
          .select('spark_id')
          .eq('user_id', user?.id || ''),
      ]);

      if (sparksResult.error) throw sparksResult.error;

      const savedSparkIds = new Set(savedResult.data?.map((s) => s.spark_id) || []);
      const sparksWithSaved = (sparksResult.data || []).map((spark) => ({
        ...spark,
        is_saved: savedSparkIds.has(spark.id),
      }));

      setSparks(sparksWithSaved);

      const mySparkToday = sparksWithSaved.find((s) => s.user_id === user?.id);
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

  const toggleSaveSpark = async (spark: Spark) => {
    const isSaved = spark.is_saved;

    setSparks((prev) =>
      prev.map((s) =>
        s.id === spark.id ? { ...s, is_saved: !isSaved } : s
      )
    );

    try {
      if (isSaved) {
        const { error } = await supabase
          .from('saved_sparks')
          .delete()
          .eq('user_id', user?.id)
          .eq('spark_id', spark.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('saved_sparks')
          .insert([{ user_id: user?.id, spark_id: spark.id }]);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      setSparks((prev) =>
        prev.map((s) =>
          s.id === spark.id ? { ...s, is_saved: isSaved } : s
        )
      );
    }
  };

  const SparkCard = ({ item }: { item: Spark }) => {
    const isOwnSpark = item.user_id === user?.id;
    const sparkDate = new Date(item.created_at);
    const timeString = sparkDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    const scaleAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    const handleSavePress = () => {
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 0.95,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          useNativeDriver: true,
        }),
      ]).start();
      toggleSaveSpark(item);
    };

    return (
      <Animated.View
        style={[
          styles.sparkCard,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
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
          {!isOwnSpark && (
            <TouchableOpacity
              onPress={handleSavePress}
              style={styles.saveButton}
              activeOpacity={0.7}
            >
              {item.is_saved ? (
                <BookmarkCheck size={22} color="#2196F3" strokeWidth={2} />
              ) : (
                <Bookmark size={22} color="#999" strokeWidth={2} />
              )}
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.sparkContent}>{item.content}</Text>
      </Animated.View>
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
        <View style={styles.headerContent}>
          <Sparkles size={32} color="#2196F3" strokeWidth={2.5} />
          <View style={styles.headerText}>
            <Text style={styles.title}>Daily Sparks</Text>
            <Text style={styles.subtitle}>{sparks.length} sparks today</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={sparks}
        renderItem={({ item }) => <SparkCard item={item} />}
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
            <View style={styles.emptyIconContainer}>
              <Sparkles size={64} color="#2196F3" strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyText}>No sparks yet today</Text>
            <Text style={styles.emptySubtext}>Be the first to share your inspiration!</Text>
          </View>
        }
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.9}
      >
        <View style={styles.fabGlow} />
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
    backgroundColor: '#f8f9fa',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerText: {
    flex: 1,
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
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
  saveButton: {
    padding: 8,
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
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 20,
    color: '#1a1a1a',
    marginBottom: 8,
    fontWeight: '700',
  },
  emptySubtext: {
    fontSize: 15,
    color: '#999',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGlow: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2196F3',
    opacity: 0.3,
  },
});
