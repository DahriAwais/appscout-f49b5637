import { useEffect } from 'react';
import { QueryClient, useQuery, useQueries } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { bilt } from '@/lib/bilt';
import type { FeedCategory, ScoutApp, Snapshot, StoreReview } from './scout';
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 300000, retry: 1, refetchOnWindowFocus: false } },
});
// Keep public-data requests sequential so listing enrichment does not flood the service.
let requestTail: Promise<void> = Promise.resolve();
export function playRequest<T>(body: Record<string, unknown>): Promise<T> {
  const request = requestTail.then(async () => {
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
  });
  requestTail = request.then(
    () => undefined,
    () => undefined,
  );
  return request;
}
export function useErrorFeedback(error: unknown) {
  useEffect(() => {
    if (error) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [error]);
}
interface MetadataResponse {
  results: { id: string; app: ScoutApp | null; error: string | null }[];
}
const needsMetadata = (app: ScoutApp) =>
  app.installs === null || app.offersIAP === null || app.adSupported === null;
function useListingMetadata(apps: ScoutApp[]) {
  const ids = [...new Set(apps.filter(needsMetadata).map((app) => app.id))].sort();
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += 6) chunks.push(ids.slice(i, i + 6));
  const queries = useQueries({
    queries: chunks.map((batch) => ({
      queryKey: ['play-metadata', ...batch],
      queryFn: async () => {
        const response = await playRequest<MetadataResponse>({ action: 'metadata', ids: batch });
        // Fail a partial batch so retry has real work to perform, retaining successful facts.
        for (const item of response.results) {
          if (item.app) queryClient.setQueryData(['play-observation', item.id], item.app);
        }
        if (response.results.some((item) => item.error))
          throw new Error('Some app estimates could not load. Try again.');
        return response;
      },
      staleTime: 3600000,
    })),
  });
  const error = queries.find((query) => query.error)?.error;
  useErrorFeedback(error);
  return {
    apps: apps.map((app): ScoutApp => {
      if (!needsMetadata(app)) return app;
      const index = chunks.findIndex((batch) => batch.includes(app.id));
      const query = queries[index];
      const observation =
        query?.data?.results.find((item) => item.id === app.id)?.app ??
        queryClient.getQueryData<ScoutApp>(['play-observation', app.id]);
      return observation
        ? { ...observation, metadataState: 'ready' }
        : { ...app, metadataState: query?.isError ? 'error' : 'loading' };
    }),
    error,
    pending: queries.some((query) => query.isFetching),
    retry: () => {
      for (const query of queries) void query.refetch();
    },
  };
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
  const metadata = useListingMetadata(result.data?.apps ?? []);
  useErrorFeedback(result.error);
  return {
    ...result,
    data: result.data ? { ...result.data, apps: metadata.apps } : undefined,
    metadataError: metadata.error,
    metadataPending: metadata.pending,
    refetch: () => {
      metadata.retry();
      return result.refetch();
    },
  };
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
  const metadata = useListingMetadata(result.data?.apps ?? []);
  useErrorFeedback(result.error || result.data?.error);
  return {
    ...result,
    data: result.data ? { ...result.data, apps: metadata.apps } : undefined,
    refetch: () => {
      metadata.retry();
      return result.refetch();
    },
  };
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
