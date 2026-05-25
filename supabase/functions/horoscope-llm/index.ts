const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';

// Try models in order until one works
const MODELS = [
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent',
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent',
];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function callGemini(prompt: string): Promise<string> {
  let lastError = '';
  for (const url of MODELS) {
    const res = await fetch(`${url}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 300, temperature: 0.9 },
      }),
    });
    if (res.ok) {
      const json = await res.json();
      return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
    }
    const err = await res.text();
    lastError = `${url.split('/models/')[1].split(':')[0]}: ${res.status} ${err}`;
    // Only retry on 404/429; bail on auth errors
    if (res.status !== 404 && res.status !== 429) break;
  }
  throw new Error(`All models failed. Last: ${lastError}`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json() as {
      type: 'transform' | 'generate';
      sign: string;
      zodiac_type?: 'western' | 'chinese';
      raw_text?: string;
    };

    const { type, sign, raw_text } = body;
    const zodiacType = body.zodiac_type ?? 'chinese';

    let prompt: string;

    if (type === 'transform' && raw_text) {
      prompt = `You are a gothic horror rewriter. Transform this ${sign} horoscope into a dark, ominous gothic horror reading. Preserve all the specific astrological advice, themes, relationships, and events — but recast every element through a gothic horror lens using vivid, macabre language: omens, dread, shadows, fate, and inevitability. Match the length and detail of the original. Return only the rewritten text — no explanations, no preamble, no sign name header.\n\nOriginal horoscope:\n${raw_text}`;
    } else if (type === 'generate_raw' && zodiacType === 'western') {
      prompt = `You are an astrologer. Write a plain, grounded horoscope reading for ${sign} for today. Cover planetary influences, the sign's traits, relationships, career, and inner life. Write 4–5 sentences of practical astrological guidance. Return only the reading — no label, no sign name, no preamble.`;
    } else if (type === 'generate' && zodiacType === 'western') {
      prompt = `You are a gothic horror astrologer writing daily horoscopes. Write a dark, ominous horoscope reading for ${sign} (Western zodiac) for today. Ground it in real astrological themes — planetary influences, the sign's traits, relationships, career, and inner life — but render everything through a gothic horror lens: fate, shadows, whispers, omens, dread, and inevitability. Write 4–5 sentences of rich, vivid prose. Return only the reading — no label, no sign name, no preamble.`;
    } else {
      prompt = `You are a gothic horror astrologer writing daily horoscopes. Write a dark, ominous horoscope reading for the ${sign} (Chinese zodiac) for today. Ground it in real Chinese astrological themes — the sign's nature, current energies, relationships, fortune — but render everything through a gothic horror lens: fate, shadows, whispers, omens, dread, and inevitability. Write 4–5 sentences of rich, vivid prose. Return only the reading — no label, no sign name, no preamble.`;
    }

    const text = await callGemini(prompt);

    return new Response(JSON.stringify({ text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
