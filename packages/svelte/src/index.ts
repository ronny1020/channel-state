import { ChannelStore } from '@channel-state/core'
import { writable } from 'svelte/store'

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
export function useChannelState<T>(channelStore: ChannelStore<T>) {
  // Create a Svelte writable store.
  // The second argument (start function) is called when the first subscriber
  // subscribes, and the function it returns (stop function) is called when
  // the last subscriber unsubscribes.
  const svelteStore = writable<T>(channelStore.get(), (set) => {
    // Subscribe to the ChannelStore
    const unsubscribeChannelStore = channelStore.subscribe((value) => {
      set(value) // Update the Svelte store with the ChannelStore's value
    })

    // This function is returned by the start function and is called when
    // the last subscriber unsubscribes. It cleans up the ChannelStore subscription.
    return () => {
      unsubscribeChannelStore()
    }
  })

  // Return a store-like object that is writable from the Svelte side
  // and also reflects changes from ChannelStore.
  return {
    subscribe: svelteStore.subscribe, // Expose the writable store's subscribe method
    set: (value: T) => {
      channelStore.set(value) // Update the underlying ChannelStore
    },
    update: svelteStore.update, // Expose update method for convenience (optional but standard for writable stores)
  }
}
