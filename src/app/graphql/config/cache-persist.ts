
// src/app/graphql/config/cache-persist.ts
import { InMemoryCache } from '@apollo/client/core';
import { persistCache } from 'apollo3-cache-persist';
import { Preferences } from '@capacitor/preferences';

export async function initApolloCachePersistence(cache: InMemoryCache): Promise<void> {
  await persistCache({
    cache,
    storage: {
      getItem: async (key: string) => {
        const { value } = await Preferences.get({ key });
        return value;
      },
      setItem: async (key: string, value: string) => {
        await Preferences.set({ key, value });
      },
      removeItem: async (key: string) => {
        await Preferences.remove({ key });
      },
    },
  });
}