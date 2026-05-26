import { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { WESTERN_SIGNS, CHINESE_SIGNS, type ZodiacType } from '../constants/Zodiacs';
import { signIn, signUp, resetPassword } from '../services/auth';
import { InlineDropdown } from '../components/InlineDropdown';

type Mode = 'login' | 'signup';

export default function LoginScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [zodiacType, setZodiacType] = useState<ZodiacType>('western');
  const [zodiacSign, setZodiacSign] = useState('');
  const [status, setStatus] = useState<{ text: string; isError: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<{ text: string; isError: boolean } | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  const zodiacSignsMap = zodiacType === 'western' ? WESTERN_SIGNS : CHINESE_SIGNS;
  const zodiacSigns = Object.keys(zodiacSignsMap);
  const zodiacSignLabels = Object.entries(zodiacSignsMap).map(([name, symbol]) => `${symbol}︎ ${name}`);

  function switchMode() {
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
    setStatus(null);
    setZodiacSign('');
  }

  function handleZodiacTypeSelect(val: string) {
    setZodiacType(val as ZodiacType);
    setZodiacSign('');
  }

  async function handleSubmit() {
    if (mode === 'login') {
      if (!email || !password) {
        setStatus({ text: 'The spirits require your email and password.', isError: true });
        return;
      }
    } else {
      const missing = [
        !fullName && 'Full Name',
        !email && 'Email',
        !password && 'Password',
        !zodiacSign && 'Your Sign',
      ].filter(Boolean) as string[];
      if (missing.length) {
        setStatus({ text: `Still needed: ${missing.join(', ')}`, isError: true });
        return;
      }
    }

    setLoading(true);
    setStatus(null);

    try {
      if (mode === 'login') {
        await signIn(email, password);
        router.replace('/home');
      } else {
        const result = await signUp(email, password, fullName, zodiacType, zodiacSign);
        if (!result.session) {
          setStatus({ text: 'Account created! Check your email, then return to face your fate.', isError: false });
        } else {
          router.replace('/home');
        }
      }
    } catch (err) {
      setStatus({ text: (err as Error).message, isError: true });
    } finally {
      setLoading(false);
    }
  }

  function openForgotModal() {
    setForgotEmail('');
    setForgotStatus(null);
    setForgotOpen(true);
  }

  async function handleForgotSubmit() {
    if (!forgotEmail) {
      setForgotStatus({ text: 'Enter your email address.', isError: true });
      return;
    }
    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail);
      setForgotStatus({ text: 'Check your email for a reset link.', isError: false });
    } catch (err) {
      setForgotStatus({ text: (err as Error).message, isError: true });
    } finally {
      setForgotLoading(false);
    }
  }

  const isSignup = mode === 'signup';
  const [hoveredLink, setHoveredLink] = useState<'signup' | 'forgot' | null>(null);
  const hoverProps = (id: 'signup' | 'forgot') =>
    Platform.OS === 'web'
      ? { onPointerEnter: () => setHoveredLink(id), onPointerLeave: () => setHoveredLink(null) }
      : {};

  return (
    <SafeAreaView style={styles.safe}>
      {/* Signup header — replaces logo/tagline in signup mode */}
      {isSignup && (
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/simple_logo_48.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <Text style={styles.headerTitle}>Horroscope</Text>
          <Pressable
            style={styles.iconBtn}
            onPress={switchMode}
            {...(Platform.OS === 'web' ? { title: 'Back' } as any : {})}
          >
            <Ionicons name="arrow-back-outline" size={20} color={Colors.textSecondary} />
          </Pressable>
        </View>
      )}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Login hero */}
          {!isSignup && (
            <>
              <Image
                source={require('../../assets/images/logo_512.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>Horroscope</Text>
              <Text style={styles.tagline}>Your fate awaits...</Text>
            </>
          )}

          {/* Full Name — signup only, shown first */}
          {isSignup && (
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor={Colors.textSecondary}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => emailRef.current?.focus()}
            />
          )}

          {/* Email */}
          <TextInput
            ref={emailRef}
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            blurOnSubmit={false}
            onSubmitEditing={() => passwordRef.current?.focus()}
          />

          {/* Password */}
          <View style={styles.passwordRow}>
            <TextInput
              ref={passwordRef}
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor={Colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              returnKeyType="go"
              onSubmitEditing={handleSubmit}
            />
            <Pressable style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={Colors.textTertiary}
              />
            </Pressable>
          </View>

          {/* Zodiac pickers — signup only */}
          {isSignup && (
            <>
              <InlineDropdown
                value={zodiacType}
                options={['western', 'chinese']}
                labels={['Western (Zodiac)', 'Chinese (Zodiac)']}
                onSelect={handleZodiacTypeSelect}
              />
              <InlineDropdown
                value={zodiacSign}
                options={zodiacSigns}
                labels={zodiacSignLabels}
                placeholder="Your Sign..."
                onSelect={setZodiacSign}
              />
            </>
          )}

          {/* Submit */}
          <Pressable
            style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.textPrimary} />
            ) : (
              <Text style={styles.submitText}>Enter if you dare...</Text>
            )}
          </Pressable>

          {/* Toggle mode + forgot — login only */}
          {!isSignup && (
            <>
              <Pressable
                style={[styles.linkBtn, hoveredLink === 'signup' && styles.linkBtnHovered]}
                onPress={switchMode}
                {...hoverProps('signup')}
              >
                <Text style={styles.linkText}>No account? Join the cursed...</Text>
              </Pressable>
              <Pressable
                style={[styles.linkBtn, hoveredLink === 'forgot' && styles.linkBtnHovered]}
                onPress={openForgotModal}
                {...hoverProps('forgot')}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>
            </>
          )}

          {/* Status */}
          {status && (
            <Text style={[styles.status, status.isError ? styles.statusError : styles.statusOk]}>
              {status.text}
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot password modal */}
      <Modal
        visible={forgotOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setForgotOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setForgotOpen(false)}>
          <Pressable style={styles.modalBox} onPress={() => {}}>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalBody}>
              Enter your email and we'll send a reset link.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.textSecondary}
              value={forgotEmail}
              onChangeText={setForgotEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              returnKeyType="go"
              onSubmitEditing={handleForgotSubmit}
            />
            {forgotStatus && (
              <Text style={[styles.status, forgotStatus.isError ? styles.statusError : styles.statusOk]}>
                {forgotStatus.text}
              </Text>
            )}
            <Pressable
              style={({ pressed }) => [styles.submitBtn, pressed && styles.submitBtnPressed]}
              onPress={handleForgotSubmit}
              disabled={forgotLoading}
            >
              {forgotLoading ? (
                <ActivityIndicator color={Colors.textPrimary} />
              ) : (
                <Text style={styles.submitText}>Send link</Text>
              )}
            </Pressable>
            <Pressable style={styles.linkBtn} onPress={() => setForgotOpen(false)}>
              <Text style={styles.linkText}>Cancel</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
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
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
    overflow: 'visible',
  },
  logo: {
    width: 210,
    height: 210,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.accent,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  input: {
    width: '100%',
    maxWidth: 300,
    height: 46,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    color: Colors.textPrimary,
    backgroundColor: Colors.card,
    fontSize: 15,
  },
  passwordRow: {
    width: '100%',
    maxWidth: 300,
    flexDirection: 'row',
    alignItems: 'center',
    height: 46,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    backgroundColor: Colors.card,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 14,
    color: Colors.textPrimary,
    fontSize: 15,
    height: '100%',
  },
  eyeBtn: {
    paddingHorizontal: 14,
    height: '100%',
    justifyContent: 'center',
  },
  status: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 300,
  },
  statusError: {
    color: Colors.error,
  },
  statusOk: {
    color: Colors.success,
  },
  submitBtn: {
    width: '100%',
    maxWidth: 300,
    height: 44,
    backgroundColor: Colors.primary,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnPressed: {
    backgroundColor: Colors.accent,
  },
  submitText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  linkBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  linkBtnHovered: {
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  linkText: {
    color: Colors.accent,
    fontSize: 13,
  },
  forgotText: {
    color: '#555555',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 24,
    gap: 12,
  },
  modalTitle: {
    color: Colors.accent,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    color: Colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
});
