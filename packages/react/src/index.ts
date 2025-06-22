import React, { useSyncExternalStore } from 'react';
import { ChannelStore } from '@channel-state/core';

const store = new ChannelStore<Record<string, any>>({
  name: 'channel-state',
  persist: true,
  initial: {}
});

export function useChannelState<K extends string>(key: K) {
  const value = useSyncExternalStore(
    (onStoreChange: () => void) => store.subscribe(key, onStoreChange),
    () => store.get(key),
    () => store.get(key)
  );

  const set = (newValue: any) => {
    store.set(key, newValue);
  };

  return [value, set] as const;
}

export { store }; // Fix: Remove incorrect module path
export * from '@channel-state/core';
