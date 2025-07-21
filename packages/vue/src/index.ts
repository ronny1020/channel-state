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
  const state = ref(store.get())

  const unsubscribe = store.subscribe((value) => {
    state.value = value
  })

  onUnmounted(() => {
    unsubscribe()
  })

  return computed<T>({
    get() {
      return state.value as T
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
