import { ref, onUnmounted, Ref, UnwrapRef, computed, watchEffect } from 'vue'
import { ChannelStore } from '@channel-state/core'

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
