/**
 * @module @channel-state/vue
 * @description Provides a Vue Composition API hook for integrating with ChannelStore.
 */
import { ref, onUnmounted, computed } from 'vue'
import { ChannelStore } from '@channel-state/core'

/**
 * A Vue Composition API hook that provides a reactive reference to a ChannelStore's state.
 * The returned `Ref` can be used directly in Vue templates and will automatically update
 * when the store's state changes (either locally or from other tabs/windows).
 * @template T The type of the state managed by the ChannelStore.
 * @param store The ChannelStore instance to connect to.
 * @returns A `Ref` object that represents the current state of the ChannelStore.
 *          Assigning a new value to this `Ref` will update the ChannelStore's state.
 */
export function useChannelState<T>(store: ChannelStore<T>) {
  const state = ref<T>(store.get())

  const unsubscribe = store.subscribe(() => {
    state.value = store.get()
  })

  onUnmounted(() => {
    unsubscribe()
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

/**
 * A Vue Composition API hook that provides a reactive reference to a ChannelStore's status.
 * The returned `Ref` reflects the current lifecycle status of the ChannelStore.
 * @param store The ChannelStore instance to connect to.
 * @returns A `Ref` object that represents the current status of the ChannelStore.
 */
export function useChannelStatus(store: ChannelStore<unknown>) {
  const status = ref(store.status)

  const unsubscribeStatus = store.subscribeStatus((newStatus) => {
    status.value = newStatus
  })

  onUnmounted(() => {
    unsubscribeStatus()
  })

  return status
}
