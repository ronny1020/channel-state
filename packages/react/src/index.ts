/**
 * @module @channel-state/react
 * @description Provides a React hook for integrating with ChannelStore.
 */
import { useSyncExternalStore, useRef } from 'react'
import { ChannelStore } from '@channel-state/core'

/**
 * A React hook that provides access to a ChannelStore's state and a setter function.
 * It uses `useSyncExternalStore` for efficient and concurrent-safe updates.
 * @template T The type of the state managed by the ChannelStore.
 * @param store The ChannelStore instance to connect to.
 * @returns A tuple containing the current state and a function to update the state.
 * @example
 * ```tsx
 * import { useChannelState } from '@channel-state/react';
 * import { ChannelStore } from '@channel-state/core';
 *
 * const countStore = new ChannelStore<number>({ name: 'count', initial: 0 });
 *
 * function Counter() {
 *   const [count, setCount] = useChannelState(countStore);
 *   return (
 *     <button onClick={() => setCount(count + 1)}>Count: {count}</button>
 *   );
 * }
 * ```
 */
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

/**
 * A React hook that provides access to a ChannelStore's status.
 * It uses `useSyncExternalStore` for efficient and concurrent-safe updates.
 * @template T The type of the state managed by the ChannelStore.
 * @param store The ChannelStore instance to connect to.
 * @returns The current status of the store.
 * @example
 * ```tsx
 * import { useChannelStateWithStatus } from '@channel-state/react';
 * import { ChannelStore } from '@channel-state/core';
 *
 * const countStore = new ChannelStore<number>({ name: 'count', initial: 0 });
 *
 * function StatusDisplay() {
 *   const status = useChannelStateWithStatus(countStore);
 *   return <p>Status: {status}</p>;
 * }
 * ```
 */
export function useChannelStateWithStatus<T>(store: ChannelStore<T>) {
  const lastStatus = useRef<string | null>(null)

  const status = useSyncExternalStore(
    (onStoreChange) => store.subscribeStatus(onStoreChange),
    () => {
      const newStatus = store.status

      if (lastStatus.current === newStatus) {
        return lastStatus.current
      }

      lastStatus.current = newStatus
      return lastStatus.current
    },
    () => lastStatus.current || store.status,
  )

  return status
}
