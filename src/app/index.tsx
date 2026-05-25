import { useState } from 'react';
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
import { Colors } from '../constants/Colors';
import { WESTERN_SIGNS, CHINESE_SIGNS, type ZodiacType } from '../constants/Zodiacs';
import { signIn, signUp, resetPassword } from '../services/auth';
import { ModalPicker } from '../components/ModalPicker';

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

  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [signPickerOpen, setSignPickerOpen] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<{ text: string; isError: boolean } | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);

  const zodiacSigns = Object.keys(zodiacType === 'western' ? WESTERN_SIGNS : CHINESE_SIGNS);

  function switchMode() {
    setMode((m) => (m === 'login' ? 'signup' : 'login'));
    setStatus(null);
    setZodiacSign('');
  }

  function handleTypeSelect(val: string) {
    setZodiacType(val === 'Western (Zodiac)' ? 'western' : 'chinese');
    setZodiacSign('');
  }

  async function handleSubmit() {
    if (!email || !password) {
      setStatus({ text: 'Email and password are required.', isError: true });
      return;
    }
    if (mode === 'signup' && (!fullName || !zodiacSign)) {
      setStatus({ text: 'Please fill in all fields.', isError: true });
      return;
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
          setStatus({ text: 'Check your email to confirm your account.', isError: false });
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
      setForgotStatus({ text: 'Please enter your email address.', isError: true });
      return;
    }
    setForgotLoading(true);
    try {
      await resetPassword(forgotEmail);
      setForgotStatus({ text: 'Reset link sent — check your email.', isError: false });
    } catch (err) {
      setForgotStatus({ text: (err as Error).message, isError: true });
    } finally {
      setForgotLoading(false);
    }
  }

  const isSignup = mode === 'signup';

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require('../../assets/images/logo_512.png')}
            style={[styles.logo, isSignup && styles.logoSmall]}
            resizeMode="contain"
          />

          <Text style={styles.title}>Horroscope</Text>
          <Text style={styles.tagline}>Your fate awaits...</Text>

          {/* Email */}
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={Colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Password */}
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor={Colors.textTertiary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable style={styles.eyeBtn} onPress={() => setShowPassword((v) => !v)}>
              <Text style={styles.eyeText}>{showPassword ? 'HIDE' : 'SHOW'}</Text>
            </Pressable>
          </View>

          {/* Sign-up extras */}
          {isSignup && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={Colors.textTertiary}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />

              {/* Zodiac Type picker */}
              <Pressable style={styles.picker} onPress={() => setTypePickerOpen(true)}>
                <Text style={styles.pickerText}>
                  {zodiacType === 'western' ? 'Western (Zodiac)' : 'Chinese (Zodiac)'}
                </Text>
                <Text style={styles.pickerChevron}>▼</Text>
              </Pressable>

              {/* Zodiac Sign picker */}
              <Pressable style={styles.picker} onPress={() => setSignPickerOpen(true)}>
                <Text style={[styles.pickerText, !zodiacSign && styles.pickerPlaceholder]}>
                  {zodiacSign || 'Select your sign...'}
                </Text>
                <Text style={styles.pickerChevron}>▼</Text>
              </Pressable>
            </>
          )}

          {/* Status */}
          {status && (
            <Text style={[styles.status, status.isError ? styles.statusError : styles.statusOk]}>
              {status.text}
            </Text>
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
              <Text style={styles.submitText}>
                {isSignup ? 'Seal your fate...' : 'Enter if you dare...'}
              </Text>
            )}
          </Pressable>

          {/* Toggle mode */}
          <Pressable style={styles.linkBtn} onPress={switchMode}>
            <Text style={styles.linkText}>
              {isSignup ? 'Already cursed? Sign in...' : 'No account? Join the cursed...'}
            </Text>
          </Pressable>

          {/* Forgot password — login mode only */}
          {!isSignup && (
            <Pressable style={styles.linkBtn} onPress={openForgotModal}>
              <Text style={styles.forgotText}>Forgot your password? Reset it here</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Zodiac type picker modal */}
      <ModalPicker
        visible={typePickerOpen}
        title="Choose zodiac system"
        options={['Western (Zodiac)', 'Chinese (Zodiac)']}
        onSelect={handleTypeSelect}
        onClose={() => setTypePickerOpen(false)}
      />

      {/* Zodiac sign picker modal */}
      <ModalPicker
        visible={signPickerOpen}
        title="Choose your sign"
        options={zodiacSigns}
        onSelect={setZodiacSign}
        onClose={() => setSignPickerOpen(false)}
      />

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
              Enter your email address and we'll send you a reset link.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor={Colors.textTertiary}
              value={forgotEmail}
              onChangeText={setForgotEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
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
                <Text style={styles.submitText}>Send Reset Link</Text>
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
  scroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 8,
  },
  logoSmall: {
    width: 80,
    height: 80,
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
    maxWidth: 360,
    height: 50,
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
    maxWidth: 360,
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
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
  eyeText: {
    color: Colors.textTertiary,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  picker: {
    width: '100%',
    maxWidth: 360,
    height: 50,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: Colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    color: Colors.textPrimary,
    fontSize: 15,
  },
  pickerPlaceholder: {
    color: Colors.textTertiary,
  },
  pickerChevron: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  status: {
    fontSize: 13,
    textAlign: 'center',
    maxWidth: 360,
  },
  statusError: {
    color: Colors.error,
  },
  statusOk: {
    color: Colors.success,
  },
  submitBtn: {
    width: '100%',
    maxWidth: 360,
    height: 50,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitBtnPressed: {
    backgroundColor: Colors.accent,
  },
  submitText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: 'bold',
  },
  linkBtn: {
    paddingVertical: 4,
  },
  linkText: {
    color: Colors.accent,
    fontSize: 13,
  },
  linkTextDim: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  forgotText: {
    color: Colors.textSecondary,
    fontSize: 12,
    textDecorationLine: 'underline',
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
