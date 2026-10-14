import { useEffect } from 'react';
import { QueryClient, useQuery } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { bilt } from '@/lib/bilt';
import type { FeedCategory, ScoutApp, Snapshot, StoreReview } from './scout';
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 300000, retry: 1, refetchOnWindowFocus: false } },
});
export async function playRequest<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await bilt.functions.invoke<T>('play-store', { body });
  if (
    error ||
    !data ||
    (typeof data === 'object' &&
      'error' in data &&
      data.error &&
      !('apps' in data) &&
      !('reviews' in data))
  )
    throw new Error('Could not load Google Play data. Try again.');
  return data;
}
export function useErrorFeedback(error: unknown) {
  useEffect(() => {
    if (error) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [error]);
}
export function usePlayList(category: FeedCategory, term: string) {
  const result = useQuery({
    queryKey: ['play-list', category, term],
    queryFn: () =>
      playRequest<{ apps: ScoutApp[]; fetchedAt: string; country: string }>({
        action: term.trim() ? 'search' : 'list',
        category,
        query: term.trim(),
      }),
  });
  useErrorFeedback(result.error);
  return result;
}
export function usePlayDetail(id: string) {
  const result = useQuery({
    queryKey: ['play-detail', id],
    queryFn: () =>
      playRequest<{ app: ScoutApp; history: Snapshot[]; historyError: string | null }>({
        action: 'detail',
        id,
      }),
    enabled: Boolean(id),
  });
  useErrorFeedback(result.error);
  return result;
}
export function usePlaySection(kind: 'similar' | 'developer', id: string) {
  const result = useQuery({
    queryKey: ['play-section', kind, id],
    queryFn: () => playRequest<{ apps: ScoutApp[]; error: string | null }>({ action: kind, id }),
    enabled: Boolean(id),
  });
  useErrorFeedback(result.error || result.data?.error);
  return result;
}
export function usePlayReviews(id: string) {
  const result = useQuery({
    queryKey: ['play-reviews', id],
    queryFn: () =>
      playRequest<{ reviews: StoreReview[]; error: string | null }>({ action: 'reviews', id }),
    enabled: Boolean(id),
  });
  useErrorFeedback(result.error || result.data?.error);
  return result;
}
