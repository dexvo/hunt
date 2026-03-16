import type { IntentMode } from '@/src/types';

export function getInitial(name?: string | null): string {
  if (!name) return '?';
  return name.trim().charAt(0).toUpperCase();
}

// Deterministic gradient from profile ID
const GRADIENTS = [
  ['#2A2F45', '#1E3A5F'],
  ['#1F2D40', '#2D1F40'],
  ['#1A3040', '#0D2030'],
  ['#2D1F2D', '#1F2D30'],
  ['#1F2D25', '#2D2A1F'],
];
export function getProfileGradient(id: string): [string, string] {
  const sum = id.split('').reduce((s, c) => s + c.charCodeAt(0), 0);
  const pair = GRADIENTS[sum % GRADIENTS.length];
  return [pair[0], pair[1]];
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

export function formatVoiceDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function generateIcebreakers(profile: { interests?: string[]; city?: string; bio?: string }): string[] {
  const base: string[] = [];
  if (profile.city) base.push(`What do you love most about ${profile.city}?`, `Best spot you've found in ${profile.city}?`);
  if (profile.interests?.length) base.push(`You're into ${profile.interests[0]} — tell me more.`, `How long have you been into ${profile.interests[0]}?`);
  if (profile.bio) base.push('Your bio caught my attention — what inspired it?');
  base.push('What brought you here?', 'Plans this week?', 'Coffee or cocktails first?');
  return base.slice(0, 4);
}

export function intentLabel(mode: IntentMode): string {
  const map: Record<IntentMode, string> = { Now: '⚡ Now', Date: '◆ Date', Chat: '◻ Chat', Travel: '✈ Travel' };
  return map[mode] || mode;
}
