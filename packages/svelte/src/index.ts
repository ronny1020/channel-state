import { ChannelStore } from '@channel-state/core'
import { readable } from 'svelte/store'

/**
 * @module @channel-state/svelte
 * @description Provides a Svelte store for integrating with ChannelStore.
 */

/**
 * A Svelte store that provides access to a ChannelStore's state.
 * The returned store is both readable and writable. Updates to the store
 * will update the underlying ChannelStore, and changes in the ChannelStore
 * (from other tabs/windows or local updates) will update the Svelte store.
 * @template T The type of the state managed by the ChannelStore.
 * @param store The ChannelStore instance to connect to.
 * @returns A Svelte `Writable` store that represents the current state of the ChannelStore.
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useChannelState } from '@channel-state/svelte';
 *   import { ChannelStore } from '@channel-state/core';
 *
 *   const countStore = new ChannelStore<number>({ name: 'count', initial: 0 });
 *   const count = useChannelState(countStore);
 *
 *   function increment() {
 *     $count++;
 *   }
 * </script>
 *
 * <button on:click={increment}>Count: {$count}</button>
 * ```
 */
export function useChannelState<T>(store: ChannelStore<T>) {
  const { subscribe } = readable<T>(store.get(), (set: (value: T) => void) => {
    const unsubscribe = store.subscribe((value) => {
      set(value)
    })

    return () => {
      unsubscribe()
    }
  })

  return {
    subscribe,
    set: (value: T) => {
      store.set(value)
    },
  }
}
