import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { supabase } from '@/lib/supabase';

function RootLayoutNav() {
  const { session, loading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [checkingProfile, setCheckingProfile] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      if (loading || !session || !user) return;

      setCheckingProfile(true);

      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .maybeSingle();

        const inAuthGroup = segments[0] === '(tabs)';
        const inOnboarding = segments[0] === 'onboarding';

        if (!profile && !inOnboarding) {
          router.replace('/onboarding');
        } else if (profile && (inOnboarding || !inAuthGroup)) {
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error('Error checking profile:', error);
      } finally {
        setCheckingProfile(false);
      }
    };

    if (!loading) {
      const inAuthGroup = segments[0] === '(tabs)';
      const inOnboarding = segments[0] === 'onboarding';

      if (!session && (inAuthGroup || inOnboarding)) {
        router.replace('/auth');
      } else if (!session && segments.length === 0) {
        router.replace('/auth');
      } else if (session) {
        checkProfile();
      }
    }
  }, [session, segments, loading, user]);

  if (loading || checkingProfile) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="auth" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();

  return (
    <AuthProvider>
      <RootLayoutNav />
      <StatusBar style="light" />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});
