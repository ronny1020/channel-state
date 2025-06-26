import React, { useSyncExternalStore } from 'react'
import { ChannelStore } from '@channel-state/core'

export function useChannelState<T>(store: ChannelStore<T>) {
  const value = useSyncExternalStore(
    (onStoreChange: () => void) => store.subscribe(onStoreChange),
    () => store.get(),
    () => store.get(),
  )

  const set = (newValue: T) => {
    store.set(newValue)
  }

  return [value, set] as const
}
