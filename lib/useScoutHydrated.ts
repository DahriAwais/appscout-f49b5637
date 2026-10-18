import { useSyncExternalStore } from 'react';
import { useScout } from './store';

const subscribe = (onChange: () => void) => {
  const unsubscribeStart = useScout.persist.onHydrate(onChange);
  const unsubscribeFinish = useScout.persist.onFinishHydration(onChange);
  return () => {
    unsubscribeStart();
    unsubscribeFinish();
  };
};
const getSnapshot = () => useScout.persist.hasHydrated();
const getServerSnapshot = () => false;

export function useScoutHydrated() {
  // oxlint-disable-next-line store/no-unstable-zustand-selector -- This is React's subscription callback, not a Zustand selector; snapshots are booleans.
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
