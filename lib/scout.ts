export type Category = 'Productivity' | 'Health' | 'Finance' | 'Tools' | 'Games' | 'Education';
export type Model = 'Subscription' | 'Ads + purchases' | 'Paid';
export interface ScoutApp {
  id: string;
  name: string;
  tagline: string;
  category: Category;
  developer: string;
  icon: 'focus' | 'leaf' | 'wallet' | 'wave' | 'puzzle' | 'book' | 'orbit' | 'spark';
  tint: 'accent' | 'teal' | 'peach' | 'blue' | 'violet' | 'yellow';
  installs: number;
  rating: number;
  ratings: number;
  launched: string;
  updated: string;
  size: string;
  model: Model;
  activeRate: number;
  paidRate: number;
  arppu: number;
  adsPerMonth: number;
  ecpm: number;
  growth: number;
  trend: number[];
  keywords: string[];
  description: string;
}
// Entirely fictional fixtures. These are not scraped or verified store facts.
export const apps: ScoutApp[] = [
  {
    id: 'focusly',
    name: 'Focusly',
    tagline: 'Focus timer & daily planner',
    category: 'Productivity',
    developer: 'Focusly Studio',
    icon: 'focus',
    tint: 'accent',
    installs: 500000,
    rating: 4.8,
    ratings: 18400,
    launched: '2024-08-15',
    updated: '2026-09-30',
    size: '28 MB',
    model: 'Subscription',
    activeRate: 0.12,
    paidRate: 0.028,
    arppu: 7.4,
    adsPerMonth: 0,
    ecpm: 0,
    growth: 32.4,
    trend: [22, 24, 23, 27, 26, 30, 32, 30, 35, 38, 37, 42],
    keywords: ['focus timer', 'daily planner', 'productivity', 'pomodoro'],
    description:
      'Make room for deep work. Plan your day, build focused sessions and find a calmer daily rhythm.',
  },
  {
    id: 'bloomday',
    name: 'Bloomday',
    tagline: 'Small habits, better days',
    category: 'Health',
    developer: 'Bloomday Labs',
    icon: 'leaf',
    tint: 'teal',
    installs: 1000000,
    rating: 4.7,
    ratings: 32600,
    launched: '2023-03-12',
    updated: '2026-10-01',
    size: '42 MB',
    model: 'Subscription',
    activeRate: 0.09,
    paidRate: 0.034,
    arppu: 8,
    adsPerMonth: 0,
    ecpm: 0,
    growth: 24.8,
    trend: [20, 23, 22, 25, 27, 26, 29, 31, 30, 32, 35, 37],
    keywords: ['habit tracker', 'wellness', 'daily routine', 'health'],
    description:
      'Build habits that fit your life. Track sleep, movement and the little routines that help you feel better.',
  },
  {
    id: 'pocketpilot',
    name: 'PocketPilot',
    tagline: 'Budget & expense tracker',
    category: 'Finance',
    developer: 'PocketPilot Co.',
    icon: 'wallet',
    tint: 'peach',
    installs: 1000000,
    rating: 4.6,
    ratings: 25700,
    launched: '2024-02-20',
    updated: '2026-09-25',
    size: '35 MB',
    model: 'Subscription',
    activeRate: 0.14,
    paidRate: 0.035,
    arppu: 9,
    adsPerMonth: 0,
    ecpm: 0,
    growth: 18.2,
    trend: [26, 27, 30, 29, 31, 33, 32, 34, 35, 37, 36, 40],
    keywords: ['budget', 'expense tracker', 'money planner', 'finance'],
    description:
      'A clear view of your everyday spending. Create budgets, follow your expenses and plan your next goal.',
  },
  {
    id: 'driftwave',
    name: 'Driftwave',
    tagline: 'Sleep sounds & meditation',
    category: 'Health',
    developer: 'Driftwave Studio',
    icon: 'wave',
    tint: 'blue',
    installs: 500000,
    rating: 4.5,
    ratings: 12800,
    launched: '2026-06-03',
    updated: '2026-10-03',
    size: '64 MB',
    model: 'Subscription',
    activeRate: 0.1,
    paidRate: 0.04,
    arppu: 6,
    adsPerMonth: 0,
    ecpm: 0,
    growth: 41.6,
    trend: [10, 12, 13, 16, 18, 17, 22, 25, 28, 27, 32, 38],
    keywords: ['sleep sounds', 'meditation', 'relax', 'white noise'],
    description:
      'Wind down with soft soundscapes, gentle guided sessions and a sleep timer made for your evenings.',
  },
  {
    id: 'tiletrail',
    name: 'Tile Trail',
    tagline: 'A little puzzle, every day',
    category: 'Games',
    developer: 'Little Orbit Games',
    icon: 'puzzle',
    tint: 'violet',
    installs: 5000000,
    rating: 4.4,
    ratings: 86500,
    launched: '2022-11-08',
    updated: '2026-09-28',
    size: '92 MB',
    model: 'Ads + purchases',
    activeRate: 0.08,
    paidRate: 0.012,
    arppu: 5,
    adsPerMonth: 45,
    ecpm: 2.5,
    growth: 12.5,
    trend: [26, 28, 27, 29, 30, 28, 31, 32, 31, 33, 34, 36],
    keywords: ['puzzle', 'tile game', 'brain games', 'casual games'],
    description:
      'Connect colorful tiles and discover new puzzles. A fresh set of challenges for a quick daily break.',
  },
  {
    id: 'wordnest',
    name: 'Wordnest',
    tagline: 'Learn a language your way',
    category: 'Education',
    developer: 'Wordnest Learning',
    icon: 'book',
    tint: 'yellow',
    installs: 1000000,
    rating: 4.7,
    ratings: 41200,
    launched: '2023-07-19',
    updated: '2026-10-02',
    size: '56 MB',
    model: 'Subscription',
    activeRate: 0.13,
    paidRate: 0.038,
    arppu: 10,
    adsPerMonth: 0,
    ecpm: 0,
    growth: 9.8,
    trend: [31, 32, 34, 33, 34, 36, 35, 36, 37, 38, 37, 40],
    keywords: ['language learning', 'vocabulary', 'english', 'study'],
    description:
      'Learn useful words in short sessions. Build a personal vocabulary and practise with daily exercises.',
  },
  {
    id: 'orbitnote',
    name: 'OrbitNote',
    tagline: 'Notes, ideas & everything between',
    category: 'Tools',
    developer: 'OrbitNote Works',
    icon: 'orbit',
    tint: 'blue',
    installs: 100000,
    rating: 4.3,
    ratings: 3200,
    launched: '2026-08-04',
    updated: '2026-10-04',
    size: '19 MB',
    model: 'Subscription',
    activeRate: 0.16,
    paidRate: 0.045,
    arppu: 6,
    adsPerMonth: 0,
    ecpm: 0,
    growth: 56.2,
    trend: [5, 8, 7, 12, 14, 18, 17, 24, 28, 31, 35, 43],
    keywords: ['notes', 'notepad', 'ideas', 'tools'],
    description:
      'A home for your ideas. Capture quick notes, organize projects and keep everything easy to find.',
  },
  {
    id: 'dayframe',
    name: 'Dayframe: Calendar & Life Organizer',
    tagline: 'Your plans in one place',
    category: 'Productivity',
    developer: 'Dayframe Studio',
    icon: 'spark',
    tint: 'peach',
    installs: 500000,
    rating: 4.2,
    ratings: 9200,
    launched: '2025-01-10',
    updated: '2026-09-22',
    size: '31 MB',
    model: 'Subscription',
    activeRate: 0.1,
    paidRate: 0.025,
    arppu: 7,
    adsPerMonth: 0,
    ecpm: 0,
    growth: -6.8,
    trend: [40, 38, 39, 36, 37, 34, 35, 32, 33, 30, 31, 29],
    keywords: ['calendar', 'daily planner', 'organizer', 'schedule'],
    description:
      'Bring tasks and events into one simple view. Plan your week without losing sight of what matters.',
  },
];
export function estimate(app: ScoutApp, paidMultiplier = 1) {
  const active = app.installs * app.activeRate;
  const purchases = active * app.paidRate * paidMultiplier * app.arppu;
  const ads = ((active * app.adsPerMonth) / 1000) * app.ecpm;
  const mid = purchases + ads;
  return {
    active,
    purchases,
    ads,
    mid,
    low: mid * 0.35,
    high: mid * 2.4,
    confidence: 'Low' as const,
  };
}
export function money(n: number) {
  return n >= 1000000
    ? `$${(n / 1000000).toFixed(1)}M`
    : n >= 1000
      ? `$${(n / 1000).toFixed(1)}K`
      : `$${Math.round(n).toLocaleString('en-US')}`;
}
export function compact(n: number) {
  return n >= 1000000 ? `${n / 1000000}M` : n >= 1000 ? `${Math.round(n / 1000)}K` : String(n);
}
export function searchApps(query: string) {
  const q = query.trim().toLowerCase();
  return apps.filter((a) =>
    `${a.name} ${a.category} ${a.developer} ${a.keywords.join(' ')}`.toLowerCase().includes(q),
  );
}
export const categories = [
  'Trending',
  'New',
  'Rising',
  'Tools',
  'Games',
  'Productivity',
  'Health',
  'Education',
  'Finance',
] as const;
export type FeedCategory = (typeof categories)[number];
export function filterApps(category: FeedCategory) {
  if (category === 'Trending') return apps;
  if (category === 'New') return apps.filter((a) => a.launched >= '2026-04-14');
  if (category === 'Rising')
    return [...apps].filter((a) => a.growth > 0).sort((a, b) => b.growth - a.growth);
  return apps.filter((a) => a.category === category);
}
