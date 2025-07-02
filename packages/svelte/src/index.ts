import { ChannelStore, StoreStatus } from '@channel-state/core'
import { writable, readable } from 'svelte/store'

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
 * @param channelStore The ChannelStore instance to connect to.
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
export function useChannelState<T>(channelStore: ChannelStore<T>) {
  const svelteStore = writable<T>(channelStore.get(), (set) => {
    const unsubscribeChannelStore = channelStore.subscribe((value) => {
      set(value)
    })

    return () => {
      unsubscribeChannelStore()
    }
  })

  return {
    subscribe: svelteStore.subscribe,
    set: (value: T) => {
      channelStore.set(value)
    },
    update: svelteStore.update,
  }
}

/**
 * A Svelte store that provides access to a ChannelStore's status.
 * @template T The type of the state managed by the ChannelStore.
 * @param channelStore The ChannelStore instance to connect to.
 * @returns A Svelte `Readable` store that represents the current status of the ChannelStore.
 * @example
 * ```svelte
 * <script lang="ts">
 *   import { useChannelStatus } from '@channel-state/svelte';
 *   import { ChannelStore } from '@channel-state/core';
 *
 *   const countStore = new ChannelStore<number>({ name: 'count', initial: 0 });
 *   const status = useChannelStatus(countStore);
 * </script>
 *
 * <p>Status: {$status}</p>
 * ```
 */
export function useChannelStatus<T>(channelStore: ChannelStore<T>) {
  const status = readable<StoreStatus>(channelStore.status, (set) => {
    const unsubscribe = channelStore.subscribeStatus((newStatus) => {
      set(newStatus)
    })
    return () => {
      unsubscribe()
    }
  })

  return status
}
