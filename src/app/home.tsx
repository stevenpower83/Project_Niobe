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
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { getSignEmoji, type ZodiacType } from '../constants/Zodiacs';
import { signOut } from '../services/auth';
import { getHoroscope, type HoroscopeResult } from '../services/horoscope';
import { supabase } from '../services/supabase';
import { StyledCard } from '../components/StyledCard';
import { HeaderIconBtn } from '../components/HeaderIconBtn';

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
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredToggle, setHoveredToggle] = useState(false);
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
    // eslint-disable-next-line react-compiler/react-compiler
    loadData();
  }, [loadData]);

  async function handleRetry() {
    if (!profile) return;
    setRetrying(true);
    setError(null);
    try {
      const result = await getHoroscope(profile.id, profile.zodiac_type, profile.zodiac_sign);
      if (mounted.current) {
        setHoroscope(result);
        setShowingOriginal(false);
      }
    } catch (err) {
      if (mounted.current) setError((err as Error).message);
    } finally {
      if (mounted.current) setRetrying(false);
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
          source={require('../../assets/images/simple_logo_48.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>Horroscope</Text>
        <View style={styles.headerActions}>
          <HeaderIconBtn onPress={() => router.push('/support')} tooltip="Support">
            <Ionicons name="heart-outline" size={20} color={Colors.textSecondary} />
          </HeaderIconBtn>
          <HeaderIconBtn onPress={handleSignOut} tooltip="Log out">
            <Ionicons name="log-out-outline" size={20} color={Colors.textSecondary} />
          </HeaderIconBtn>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.content}>
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
                {`${getSignEmoji(profile.zodiac_type, profile.zodiac_sign)}︎`}
              </Text>
              <View style={styles.signInfo}>
                <Text style={styles.signName}>{profile.zodiac_sign}</Text>
                <Text style={styles.signType}>
                  {profile.zodiac_type === 'western' ? 'Western Zodiac' : 'Chinese Zodiac'}
                </Text>
                <Text style={styles.welcome}>Beware, {profile.full_name}...</Text>
              </View>
            </StyledCard>

            {/* Stale notice + retry */}
            {horoscope.isStale && (
              <Pressable onPress={handleRetry} disabled={retrying} style={styles.staleNotice}>
                {retrying
                  ? <ActivityIndicator color={Colors.textSecondary} size="small" />
                  : <Text style={styles.staleNoticeText}>⚠ Showing a previous reading — tap to consult the oracle again.</Text>
                }
              </Pressable>
            )}

            {/* Horoscope section — no card background */}
            <View style={styles.horoscopeSection}>
              <Text style={[styles.horoscopeTitle, showingOriginal && styles.horoscopeTitleOriginal]}>
                {horoscopeTitle}
              </Text>
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
              <Pressable
                style={[styles.toggleBtn, hoveredToggle && styles.toggleBtnHovered]}
                onPress={() => setShowingOriginal((v) => !v)}
                {...(Platform.OS === 'web'
                  ? { onPointerEnter: () => setHoveredToggle(true), onPointerLeave: () => setHoveredToggle(false) }
                  : {})}
              >
                <Text style={styles.toggleText}>{toggleLabel}</Text>
              </Pressable>
            </View>

          </>
        )}
        </View>
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
    backgroundColor: Colors.header,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLogo: {
    width: 44,
    height: 44,
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    color: Colors.accent,
    fontSize: 20,
    fontWeight: 'bold',
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
    borderRadius: 18,
  },
  iconBtnText: {
    color: Colors.textSecondary,
    fontSize: 18,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 16,
  },
  content: {
    width: '100%',
    maxWidth: 700,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    backgroundColor: '#1a0000',
    borderColor: '#8B0000',
  },
  signEmoji: {
    fontSize: 44,
    width: 64,
    textAlign: 'center',
    color: Colors.textPrimary,
  },
  signInfo: {
    flex: 1,
    gap: 3,
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
    fontStyle: 'italic',
    marginTop: 2,
  },
  staleNotice: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  staleNoticeText: {
    color: Colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  horoscopeSection: {
    gap: 12,
  },
  horoscopeTitle: {
    color: Colors.accent,
    fontSize: 18,
    fontWeight: 'bold',
  },
  horoscopeTitleOriginal: {
    color: '#666666',
  },
  horoscopeText: {
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
  },
  horoscopeTextOriginal: {
    color: '#AAAAAA',
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    alignSelf: 'flex-start',
  },
  toggleBtnHovered: {
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  toggleText: {
    color: '#666666',
    fontSize: 13,
  },
});
