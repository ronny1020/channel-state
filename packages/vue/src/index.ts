/**
 * @module @channel-state/vue
 * @description Provides a Vue Composition API hook for integrating with ChannelStore.
 */
import { ref, onUnmounted, Ref, UnwrapRef, computed, watchEffect } from 'vue'
import { ChannelStore } from '@channel-state/core'

/**
 * A Vue Composition API hook that provides a reactive reference to a ChannelStore's state.
 * The returned `Ref` can be used directly in Vue templates and will automatically update
 * when the store's state changes (either locally or from other tabs/windows).
 * @template T The type of the state managed by the ChannelStore.
 * @param store The ChannelStore instance to connect to.
 * @returns A `Ref` object that represents the current state of the ChannelStore.
 *          Assigning a new value to this `Ref` will update the ChannelStore's state.
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { useChannelState } from '@channel-state/vue'
 * import { ChannelStore } from '@channel-state/core'
 *
 * const countStore = new ChannelStore<number>({ name: 'count', initial: 0 });
 * const count = useChannelState(countStore);
 * </script>
 *
 * <template>
 *   <button @click="count++">Count: {{ count }}</button>
 * </template>
 * ```
 */
export function useChannelState<T>(store: ChannelStore<T>) {
  const state = ref<T>(store.get())

  store.subscribe(() => {
    state.value = store.get() as UnwrapRef<T>
  })

  return computed<T>({
    get() {
      return state.value
    },
    set(newValue: T) {
      store.set(newValue)
    },
  })
}
