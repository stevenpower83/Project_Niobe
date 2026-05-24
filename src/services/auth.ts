import { supabase } from './supabase';
import type { ZodiacType } from '../constants/Zodiacs';

export async function signUp(
  email: string,
  password: string,
  fullName: string,
  zodiacType: ZodiacType,
  zodiacSign: string,
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, zodiac_type: zodiacType, zodiac_sign: zodiacSign },
    },
  });
  if (error) throw error;
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: 'https://www.powrdata.com.au/horroscope/reset-password',
  });
  if (error) throw error;
}
