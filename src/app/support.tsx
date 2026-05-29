import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
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
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { signOut } from '../services/auth';
import { supabase } from '../services/supabase';
import { HeaderIconBtn } from '../components/HeaderIconBtn';

const FEEDBACK_URL = 'https://tally.so/r/OD8ZDa';
const POWRDATA_URL = 'https://powrdata.com.au'; // update to specific page when ready
const APPSTORE_URL = 'https://apps.apple.com/app/id6773741555';
const PLAYSTORE_URL = 'https://play.google.com/store/apps/details?id=com.powrdata.horroscope';
const DELETE_URL = 'https://tally.so/r/81jYol';


export default function SupportScreen() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [hoveredSuffering, setHoveredSuffering] = useState(false);
  const [hoveredRate, setHoveredRate] = useState(false);
  const hoverProps = (setter: (v: boolean) => void) =>
    Platform.OS === 'web'
      ? { onPointerEnter: () => setter(true), onPointerLeave: () => setter(false) }
      : {};
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

  async function handleSignOut() {
    try {
      await signOut();
    } catch (err) {
      Alert.alert('Sign Out', (err as Error).message);
    }
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
        <Image
          source={require('../../assets/images/simple_logo_48.png')}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>Horroscope</Text>
        <View style={styles.headerActions}>
          <HeaderIconBtn onPress={() => router.back()} tooltip="Back">
            <Ionicons name="arrow-back-outline" size={20} color={Colors.textSecondary} />
          </HeaderIconBtn>
          <HeaderIconBtn onPress={handleSignOut} tooltip="Log out">
            <Ionicons name="log-out-outline" size={20} color={Colors.textSecondary} />
          </HeaderIconBtn>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Title block */}
        <View style={styles.heroBlock}>
          <Text style={styles.heroEmoji}>💀</Text>
          <Text style={styles.heroTitle}>The Cursed Need Your Voice</Text>
          <Text style={styles.heroSubtitle}>Help shape the darkness...</Text>
        </View>

        {/* Feedback */}
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            (hoveredSuffering || pressed) && styles.actionBtnHovered,
          ]}
          onPress={() => openUrl(FEEDBACK_URL)}
          {...hoverProps(setHoveredSuffering)}
        >
          <Text style={styles.actionBtnText}>📣 Share Your Suffering</Text>
        </Pressable>
        <Text style={styles.hint}>Tell us what the spirits whisper about the app</Text>

        <View style={styles.divider} />

        {/* Rate the app */}
        <Pressable
          style={({ pressed }) => [
            styles.actionBtn,
            styles.actionBtnOutline,
            (hoveredRate || pressed) && styles.actionBtnOutlineHovered,
          ]}
          onPress={() => openUrl(Platform.OS === 'ios' ? APPSTORE_URL : PLAYSTORE_URL)}
          {...hoverProps(setHoveredRate)}
        >
          <Text style={styles.actionBtnOutlineText}>⭐ Rate the App</Text>
        </Pressable>
        <Text style={styles.hint}>Leave a review and help others find the darkness</Text>

        <View style={styles.divider} />

        {/* Notifications */}
        <View style={styles.notifContainer}>
          <View style={styles.notifRow}>
            <View style={styles.notifLabel}>
              <View style={styles.notifTitleRow}>
                <Ionicons name="notifications-outline" size={15} color={Colors.textSecondary} />
                <Text style={styles.notifTitle}>Daily Prophecy</Text>
              </View>
              <Text style={styles.notifSubtitle}>Coming soon</Text>
            </View>
            <Switch
              value={false}
              onValueChange={handleNotificationToggle}
              disabled
              thumbColor={Colors.textSecondary}
              trackColor={{ false: Colors.border, true: Colors.primary }}
            />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Delete account */}
        <Pressable style={styles.deleteBtn} onPress={() => openUrl(DELETE_URL)}>
          <Text style={styles.deleteText}>Delete My Account</Text>
        </Pressable>

        {/* PowerData credit */}
        <Pressable style={styles.creditBtn} onPress={() => openUrl(POWRDATA_URL)}>
          <Text style={styles.creditText}>Built by PowerData · powrdata.com.au</Text>
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
  iconBtnHovered: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  scroll: {
    padding: 16,
    alignItems: 'center',
    gap: 10,
  },
  heroBlock: {
    width: 280,
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
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    width: 280,
  },
  actionBtnText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: 'bold',
  },
  actionBtnHovered: {
    backgroundColor: '#8B0000',
  },
  actionBtnOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  actionBtnOutlineText: {
    color: Colors.accent,
    fontSize: 15,
    fontWeight: 'bold',
  },
  actionBtnOutlineHovered: {
    backgroundColor: 'rgba(139,0,0,0.15)',
  },
  hint: {
    color: Colors.textTertiary,
    fontSize: 12,
    textAlign: 'center',
  },
  divider: {
    width: 280,
    height: 1,
    backgroundColor: '#222222',
    marginVertical: 4,
  },
  notifContainer: {
    width: 280,
    backgroundColor: '#1a0000',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#330000',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifLabel: {
    flex: 1,
  },
  notifTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
  creditBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingBottom: 16,
  },
  creditText: {
    color: '#4a3333',
    fontSize: 11,
  },
});
