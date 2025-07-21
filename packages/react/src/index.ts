/*
 * Copyright 2025 ronny1020
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
    (onStoreChange) => store.subscribe(onStoreChange),
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
    (onStoreStatusChange) => store.subscribeStatus(onStoreStatusChange),
    () => store.status,
    () => store.status,
  )

  return status
}
