import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { getSignEmoji, type ZodiacType } from '../constants/Zodiacs';
import { signOut } from '../services/auth';
import { getHoroscope, refreshHoroscope, type HoroscopeResult } from '../services/horoscope';
import { supabase } from '../services/supabase';
import { StyledCard } from '../components/StyledCard';

interface Profile {
  id: string;
  full_name: string;
  zodiac_type: ZodiacType;
  zodiac_sign: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [horoscope, setHoroscope] = useState<HoroscopeResult | null>(null);
  const [showingOriginal, setShowingOriginal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/');
        return;
      }

      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('id, full_name, zodiac_type, zodiac_sign')
        .eq('id', user.id)
        .limit(1)
        .single();

      if (profileErr) throw profileErr;
      if (!mounted.current) return;

      setProfile(profileData as Profile);

      const result = await getHoroscope(user.id, profileData.zodiac_type, profileData.zodiac_sign);
      if (!mounted.current) return;

      setHoroscope(result);
    } catch (err) {
      if (!mounted.current) return;
      setError((err as Error).message);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleRefresh() {
    if (!profile) return;
    setRefreshing(true);
    setError(null);
    try {
      const result = await refreshHoroscope(profile.id, profile.zodiac_type, profile.zodiac_sign);
      if (mounted.current) {
        setHoroscope(result);
        setShowingOriginal(false);
      }
    } catch (err) {
      if (mounted.current) setError((err as Error).message);
    } finally {
      if (mounted.current) setRefreshing(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      // _layout.tsx will redirect to '/' when session clears
    } catch (err) {
      Alert.alert('Sign Out', (err as Error).message);
    }
  }

  const displayText = showingOriginal ? horoscope?.rawText : horoscope?.horrorText;
  const horoscopeTitle = showingOriginal ? '📜 Original Reading' : '🩸 Today\'s Horroscope';
  const toggleLabel = showingOriginal ? '🩸 Show the Horroscope' : '📜 Reveal original reading';

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/logo_192.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>Horroscope</Text>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconBtn} onPress={() => router.push('/support')}>
            <Text style={styles.iconBtnText}>♥</Text>
          </Pressable>
          <Pressable style={styles.iconBtn} onPress={handleSignOut}>
            <Text style={styles.iconBtnText}>⏻</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Loading */}
        {loading && (
          <View style={styles.centerContent}>
            <ActivityIndicator color={Colors.accent} size="large" />
            <Text style={styles.loadingText}>Consulting the darkness...</Text>
          </View>
        )}

        {/* Error */}
        {error && !loading && (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>The spirits are silent: {error}</Text>
            <Pressable style={styles.retryBtn} onPress={loadData}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        )}

        {/* Content */}
        {!loading && !error && profile && horoscope && (
          <>
            {/* Sign card */}
            <StyledCard style={styles.signCard}>
              <Text style={styles.signEmoji}>
                {getSignEmoji(profile.zodiac_type, profile.zodiac_sign)}
              </Text>
              <Text style={styles.signName}>{profile.zodiac_sign}</Text>
              <Text style={styles.signType}>
                {profile.zodiac_type === 'western' ? 'Western Zodiac' : 'Chinese Zodiac'}
              </Text>
              <Text style={styles.welcome}>Beware, {profile.full_name}...</Text>
            </StyledCard>

            {/* Stale notice */}
            {horoscope.isStale && (
              <Text style={styles.staleNotice}>
                ⚠ Showing a previous reading — the oracle is unreachable.
              </Text>
            )}

            {/* Horoscope card */}
            <StyledCard style={styles.horoscopeCard}>
              <Text style={styles.horoscopeTitle}>{horoscopeTitle}</Text>
              <Text
                style={[
                  styles.horoscopeText,
                  showingOriginal && styles.horoscopeTextOriginal,
                ]}
                selectable
              >
                {displayText}
              </Text>

              {/* Toggle */}
              <Pressable style={styles.toggleBtn} onPress={() => setShowingOriginal((v) => !v)}>
                <Text style={styles.toggleText}>{toggleLabel}</Text>
              </Pressable>
            </StyledCard>

            {/* Refresh button — always shown; most useful when stale */}
            <Pressable
              style={({ pressed }) => [styles.refreshBtn, pressed && styles.refreshBtnPressed]}
              onPress={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <ActivityIndicator color={Colors.accent} />
              ) : (
                <Text style={styles.refreshText}>Update Horroscope</Text>
              )}
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLogo: {
    width: 32,
    height: 32,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    color: Colors.accent,
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBtnText: {
    color: Colors.textSecondary,
    fontSize: 18,
  },
  scroll: {
    padding: 16,
    gap: 12,
  },
  centerContent: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
  errorText: {
    color: Colors.error,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  retryBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: Colors.textPrimary,
    fontSize: 13,
  },
  signCard: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 20,
  },
  signEmoji: {
    fontSize: 36,
  },
  signName: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  signType: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  welcome: {
    color: Colors.textTertiary,
    fontSize: 12,
    marginTop: 4,
  },
  staleNotice: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  horoscopeCard: {
    gap: 12,
  },
  horoscopeTitle: {
    color: Colors.accent,
    fontSize: 16,
    fontWeight: 'bold',
  },
  horoscopeText: {
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
  },
  horoscopeTextOriginal: {
    color: Colors.textSecondary,
  },
  toggleBtn: {
    paddingTop: 4,
  },
  toggleText: {
    color: Colors.accent,
    fontSize: 13,
  },
  refreshBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshBtnPressed: {
    borderColor: Colors.accent,
    backgroundColor: Colors.card,
  },
  refreshText: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
});
