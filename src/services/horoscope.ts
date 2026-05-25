import { Platform } from 'react-native';
import { supabase } from './supabase';
import type { ZodiacType } from '../constants/Zodiacs';

// Today's date string in US Eastern time — matches ohmanda API timezone
function getApiDate(): string {
  try {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'America/New_York' });
  } catch {
    const d = new Date();
    d.setHours(d.getHours() - 5);
    return d.toISOString().split('T')[0];
  }
}

async function invokeLlm(body: Record<string, unknown>): Promise<string> {
  const { data, error } = await supabase.functions.invoke('horoscope-llm', { body });
  if (error) {
    // Extract the actual error body from the function response
    const ctx = (error as { context?: Response }).context;
    if (ctx) {
      try {
        const json = await ctx.clone().json() as { error?: string };
        if (json.error) throw new Error(json.error);
      } catch (e) {
        if (e instanceof Error && e.message !== error.message) throw e;
      }
    }
    throw error;
  }
  return (data as { text: string }).text;
}

async function fetchWesternHoroscope(sign: string): Promise<string> {
  // ohmanda.com blocks browser requests (CORS) — native only
  if (Platform.OS === 'web') throw new Error('web-cors');
  const res = await fetch(`https://ohmanda.com/api/horoscope/${sign.toLowerCase()}/`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = (await res.json()) as { horoscope: string };
  return json.horoscope;
}

async function transformHoroscope(sign: string, rawText: string): Promise<string> {
  return invokeLlm({ type: 'transform', sign, raw_text: rawText });
}

async function generateChineseHoroscope(sign: string): Promise<string> {
  return invokeLlm({ type: 'generate', sign, zodiac_type: 'chinese' });
}

// On web the ohmanda fetch is blocked by CORS — generate both readings via LLM
async function fetchAndTransformWestern(sign: string): Promise<{ rawText: string; horrorText: string }> {
  if (Platform.OS !== 'web') {
    const rawText = await fetchWesternHoroscope(sign);
    const horrorText = await transformHoroscope(sign, rawText);
    return { rawText, horrorText };
  }
  const [rawText, horrorText] = await Promise.all([
    invokeLlm({ type: 'generate_raw', sign, zodiac_type: 'western' }),
    invokeLlm({ type: 'generate', sign, zodiac_type: 'western' }),
  ]);
  return { rawText, horrorText };
}

export interface HoroscopeResult {
  horrorText: string;
  rawText: string;
  isStale: boolean;
}

export async function getHoroscope(
  userId: string,
  zodiacType: ZodiacType,
  zodiacSign: string,
): Promise<HoroscopeResult> {
  const today = getApiDate();

  // Check cache first
  const { data: cached } = await supabase
    .from('horoscopes')
    .select('horror_text, raw_text')
    .eq('user_id', userId)
    .eq('horoscope_date', today)
    .limit(1)
    .single();

  if (cached) {
    return { horrorText: cached.horror_text, rawText: cached.raw_text, isStale: false };
  }

  // Fetch fresh horoscope
  try {
    let rawText: string;
    let horrorText: string;

    if (zodiacType === 'western') {
      ({ rawText, horrorText } = await fetchAndTransformWestern(zodiacSign));
    } else {
      horrorText = await generateChineseHoroscope(zodiacSign);
      rawText = horrorText;
    }

    await supabase.from('horoscopes').upsert({
      user_id: userId,
      zodiac_type: zodiacType,
      zodiac_sign: zodiacSign,
      horoscope_date: today,
      raw_text: rawText,
      horror_text: horrorText,
    });

    const today2 = getApiDate();
    await supabase.from('profiles').update({ last_viewed_date: today2 }).eq('id', userId);

    return { horrorText, rawText, isStale: false };
  } catch {
    // Fall back to most recent cached reading
    const { data: stale } = await supabase
      .from('horoscopes')
      .select('horror_text, raw_text')
      .eq('user_id', userId)
      .order('horoscope_date', { ascending: false })
      .limit(1)
      .single();

    if (stale) {
      return { horrorText: stale.horror_text, rawText: stale.raw_text, isStale: true };
    }

    throw new Error('No horoscope available and fetch failed.');
  }
}

export async function refreshHoroscope(
  userId: string,
  zodiacType: ZodiacType,
  zodiacSign: string,
): Promise<HoroscopeResult> {
  const today = getApiDate();

  let rawText: string;
  let horrorText: string;

  if (zodiacType === 'western') {
    ({ rawText, horrorText } = await fetchAndTransformWestern(zodiacSign));
  } else {
    horrorText = await generateChineseHoroscope(zodiacSign);
    rawText = horrorText;
  }

  await supabase.from('horoscopes').upsert({
    user_id: userId,
    zodiac_type: zodiacType,
    zodiac_sign: zodiacSign,
    horoscope_date: today,
    raw_text: rawText,
    horror_text: horrorText,
  });

  return { horrorText, rawText, isStale: false };
}
