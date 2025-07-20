/**
 * @module @channel-state/react
 * @description Provides a React hook for integrating with ChannelStore.
 */
import { useSyncExternalStore } from 'react'
import type { ChannelStore } from '@channel-state/core'

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
    store.subscribe.bind(store),
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
 * @param store The ChannelStore instance to connect to.
 * @returns The current status of the store.
 * @example
 * ```tsx
 * import { useChannelStatus } from '@channel-state/react';
 * import { ChannelStore } from '@channel-state/core';
 *
 * const countStore = new ChannelStore<number>({ name: 'count', initial: 0 });
 *
 * function StatusDisplay() {
 *   const status = useChannelStatus(countStore);
 *   return <p>Status: {status}</p>;
 * }
 * ```
 */
export function useChannelStatus(store: ChannelStore<unknown>) {
  const status = useSyncExternalStore(
    store.subscribeStatus,
    () => store.status,
    () => store.status,
  )

  return status
}
