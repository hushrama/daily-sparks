import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { Sparkles, User, Check } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const AVATARS = [
  'Sparkles', 'Zap', 'Heart', 'Star', 'Smile', 'Sun',
  'Moon', 'Cloud', 'Coffee', 'Flame', 'Gem', 'Crown'
];

const AVATAR_ICONS: Record<string, any> = {
  Sparkles, User
};

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const fadeAnim = useState(new Animated.Value(0))[0];

  useState(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  });

  const handleContinue = () => {
    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      if (!username.trim()) {
        setError('Please enter a username');
        return;
      }
      if (username.trim().length < 3) {
        setError('Username must be at least 3 characters');
        return;
      }
      setError('');
      setStep(3);
      return;
    }

    if (step === 3) {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    if (!selectedAvatar) {
      setError('Please select an avatar');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: user?.id,
            username: username.trim(),
            avatar: selectedAvatar,
          },
        ]);

      if (profileError) {
        if (profileError.message.includes('duplicate') || profileError.message.includes('unique')) {
          setError('Username already taken. Please choose another.');
        } else {
          setError(profileError.message);
        }
        setLoading(false);
        return;
      }
    } catch (error: any) {
      setError(error.message || 'Failed to create profile');
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <Sparkles size={64} color="#2196F3" strokeWidth={2.5} />
      </View>
      <Text style={styles.welcomeTitle}>Welcome to Daily Sparks!</Text>
      <Text style={styles.welcomeSubtitle}>
        Share one inspiring thought each day with the community
      </Text>

      <View style={styles.featureList}>
        <View style={styles.featureItem}>
          <View style={styles.featureDot} />
          <Text style={styles.featureText}>Post one spark per day</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureDot} />
          <Text style={styles.featureText}>See today's sparks from everyone</Text>
        </View>
        <View style={styles.featureItem}>
          <View style={styles.featureDot} />
          <Text style={styles.featureText}>Build your collection of inspiration</Text>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <View style={styles.iconContainer}>
        <User size={64} color="#2196F3" strokeWidth={2.5} />
      </View>
      <Text style={styles.stepTitle}>Choose Your Username</Text>
      <Text style={styles.stepSubtitle}>
        This is how others will see you
      </Text>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Enter username"
          placeholderTextColor="#999"
          value={username}
          onChangeText={(text) => {
            setUsername(text);
            setError('');
          }}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={20}
          editable={!loading}
        />
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Pick Your Avatar</Text>
      <Text style={styles.stepSubtitle}>
        Choose an icon that represents you
      </Text>

      <ScrollView
        style={styles.avatarScroll}
        contentContainerStyle={styles.avatarGrid}
        showsVerticalScrollIndicator={false}
      >
        {AVATARS.map((avatar) => (
          <TouchableOpacity
            key={avatar}
            style={[
              styles.avatarOption,
              selectedAvatar === avatar && styles.avatarSelected,
            ]}
            onPress={() => {
              setSelectedAvatar(avatar);
              setError('');
            }}
            disabled={loading}
          >
            <Sparkles size={32} color={selectedAvatar === avatar ? '#fff' : '#2196F3'} />
            {selectedAvatar === avatar && (
              <View style={styles.checkBadge}>
                <Check size={16} color="#fff" strokeWidth={3} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </Animated.View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating...' : step === 3 ? 'Get Started' : 'Continue'}
          </Text>
        </TouchableOpacity>

        <View style={styles.stepIndicator}>
          {[1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.stepDot,
                i === step && styles.stepDotActive,
                i < step && styles.stepDotComplete,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  stepContainer: {
    flex: 1,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 32,
    borderWidth: 3,
    borderColor: '#2196F3',
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 17,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  featureList: {
    gap: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2196F3',
  },
  featureText: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    fontSize: 17,
    color: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#2196F3',
    textAlign: 'center',
  },
  avatarScroll: {
    flex: 1,
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    paddingBottom: 20,
  },
  avatarOption: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  avatarSelected: {
    backgroundColor: '#2196F3',
    borderColor: '#1976D2',
  },
  checkBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    color: '#c62828',
    textAlign: 'center',
    fontSize: 14,
  },
  footer: {
    padding: 24,
    paddingBottom: 32,
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#2196F3',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#B0BEC5',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
  },
  stepDotActive: {
    backgroundColor: '#2196F3',
    width: 24,
  },
  stepDotComplete: {
    backgroundColor: '#4CAF50',
  },
});
