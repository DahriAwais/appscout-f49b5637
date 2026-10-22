import { createClient, asyncStorage } from '@biltme/backend';
import AsyncStorage from '@react-native-async-storage/async-storage';

const url = process.env.EXPO_PUBLIC_BILT_URL;
const anonKey = process.env.EXPO_PUBLIC_BILT_ANON_KEY;
if (!url || !anonKey) {
  throw new Error('EXPO_PUBLIC_BILT_URL and EXPO_PUBLIC_BILT_ANON_KEY are required.');
}

export const bilt = createClient(url, anonKey, {
  auth: {
    storage: asyncStorage(AsyncStorage),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
