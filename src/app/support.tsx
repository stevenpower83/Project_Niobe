import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { supabase } from '../services/supabase';
import { StyledCard } from '../components/StyledCard';

const FEEDBACK_URL = 'https://tally.so/r/OD8ZDa';
const DONATION_URL = 'https://ko-fi.com/stevenpower';
const DELETE_URL = 'https://tally.so/r/81jYol';

function feedbackUrl(): string {
  if (Platform.OS === 'ios') return FEEDBACK_URL;
  if (Platform.OS === 'android') return FEEDBACK_URL;
  return FEEDBACK_URL;
}

export default function SupportScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    async function loadPrefs() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !mounted.current) return;

      setUserId(user.id);

      const { data } = await supabase
        .from('profiles')
        .select('notifications_enabled')
        .eq('id', user.id)
        .limit(1)
        .single();

      if (mounted.current && data) {
        setNotificationsEnabled(data.notifications_enabled ?? false);
      }
    }
    loadPrefs();
  }, []);

  async function handleNotificationToggle(value: boolean) {
    if (!userId) return;
    setNotificationsEnabled(value);
    await supabase
      .from('profiles')
      .update({ notifications_enabled: value })
      .eq('id', userId);
  }

  async function openUrl(url: string) {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Cannot open', url);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Support</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Title block */}
        <View style={styles.heroBlock}>
          <Text style={styles.heroEmoji}>💀</Text>
          <Text style={styles.heroTitle}>The Cursed Need Your Voice</Text>
          <Text style={styles.heroSubtitle}>Help shape the darkness...</Text>
        </View>

        {/* Feedback */}
        <StyledCard>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
            onPress={() => openUrl(feedbackUrl())}
          >
            <Text style={styles.actionBtnText}>📣 Share Your Suffering</Text>
          </Pressable>
          <Text style={styles.hint}>Tell us what the spirits whisper about the app</Text>
        </StyledCard>

        {/* Donation */}
        <StyledCard>
          <Pressable
            style={({ pressed }) => [styles.actionBtn, pressed && styles.actionBtnPressed]}
            onPress={() => openUrl(DONATION_URL)}
          >
            <Text style={styles.actionBtnText}>🩸 Feed the Developer</Text>
          </Pressable>
          <Text style={styles.hint}>Keep the dark arts alive with a small donation</Text>
        </StyledCard>

        {/* Notifications */}
        <StyledCard style={styles.notifCard}>
          <View style={styles.notifRow}>
            <View style={styles.notifLabel}>
              <Text style={styles.notifTitle}>Daily Prophecy</Text>
              <Text style={styles.notifSubtitle}>Coming soon</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              disabled
              thumbColor={Colors.textSecondary}
              trackColor={{ false: Colors.border, true: Colors.primary }}
            />
          </View>
        </StyledCard>

        {/* Delete account */}
        <Pressable style={styles.deleteBtn} onPress={() => openUrl(DELETE_URL)}>
          <Text style={styles.deleteText}>Delete My Account</Text>
        </Pressable>
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
  backBtn: {
    marginRight: 12,
  },
  backText: {
    color: Colors.accent,
    fontSize: 15,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  scroll: {
    padding: 16,
    gap: 12,
  },
  heroBlock: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 6,
  },
  heroEmoji: {
    fontSize: 40,
  },
  heroTitle: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  heroSubtitle: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  actionBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionBtnPressed: {
    backgroundColor: Colors.accent,
  },
  actionBtnText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: 'bold',
  },
  hint: {
    color: Colors.textTertiary,
    fontSize: 12,
    textAlign: 'center',
  },
  notifCard: {
    paddingVertical: 12,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifLabel: {
    flex: 1,
  },
  notifTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
  },
  notifSubtitle: {
    color: Colors.textTertiary,
    fontSize: 12,
    marginTop: 2,
  },
  deleteBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  deleteText: {
    color: Colors.textTertiary,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
});
