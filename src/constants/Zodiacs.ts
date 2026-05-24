export const WESTERN_SIGNS: Record<string, string> = {
  Aries: '♈',
  Taurus: '♉',
  Gemini: '♊',
  Cancer: '♋',
  Leo: '♌',
  Virgo: '♍',
  Libra: '♎',
  Scorpio: '♏',
  Sagittarius: '♐',
  Capricorn: '♑',
  Aquarius: '♒',
  Pisces: '♓',
};

export const CHINESE_SIGNS: Record<string, string> = {
  Rat: '🐀',
  Ox: '🐂',
  Tiger: '🐅',
  Rabbit: '🐇',
  Dragon: '🐉',
  Snake: '🐍',
  Horse: '🐎',
  Goat: '🐐',
  Monkey: '🐒',
  Rooster: '🐓',
  Dog: '🐕',
  Pig: '🐖',
};

export type ZodiacType = 'western' | 'chinese';

export function getSignsForType(type: ZodiacType): Record<string, string> {
  return type === 'western' ? WESTERN_SIGNS : CHINESE_SIGNS;
}

export function getSignEmoji(type: ZodiacType, sign: string): string {
  const signs = getSignsForType(type);
  return signs[sign] ?? '💀';
}
