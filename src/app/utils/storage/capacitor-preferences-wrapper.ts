// import { Preferences } from '@capacitor/preferences';
// import { PersistentStorage } from 'apollo3-cache-persist';

// export class CapacitorPreferencesWrapper implements PersistentStorage<string> {
//   constructor(private keyPrefix: string = 'apollo-cache-') {}

//   async getItem(key: string): Promise<string | null> {
//     const { value } = await Preferences.get({ key: this.keyPrefix + key });
//     return value;
//   }

//   async setItem(key: string, value: string): Promise<void> {
//     await Preferences.set({ key: this.keyPrefix + key, value });
//   }

//   async removeItem(key: string): Promise<void> {
//     await Preferences.remove({ key: this.keyPrefix + key });
//   }
// }