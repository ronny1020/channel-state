import { ref, watch, onMounted, onUnmounted } from 'vue'
import { createChannelStore } from '@channel-state/core'

const store = createChannelStore()

export function useChannelState<T>(key: string, initial: T) {
  const state = ref<T>(initial)

  const setState = (value: T) => {
    store.set(key, value)
  }

  onMounted(() => {
    const value = store.get<T>(key)
    if (value !== undefined) {
      state.value = value
    }
  })

  const unsubscribe = store.subscribe(key, (newValue: T) => {
    state.value = newValue
  })

  onUnmounted(() => {
    unsubscribe()
  })

  return [state, setState] as const
}
