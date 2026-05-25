import { useEffect, useRef, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';
import { Colors } from '../constants/Colors';

export default function RootLayout() {
  const [fontsLoaded] = useFonts(Ionicons.font);
  // undefined = still loading; null = no session; Session = authenticated
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const router = useRouter();
  const initialRedirectDone = useRef(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return;

    if (!initialRedirectDone.current) {
      initialRedirectDone.current = true;
      router.replace(session ? '/home' : '/');
      return;
    }

    // After initial load: only force-redirect on sign-out
    if (!session) {
      router.replace('/');
    }
  }, [session]);

  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="home" />
        <Stack.Screen name="support" />
      </Stack>
    </>
  );
}
