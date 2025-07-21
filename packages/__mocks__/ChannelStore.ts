import { vi } from 'vitest'
import type { ChannelStore, StoreStatus } from '@channel-state/core'

export const createMockChannelStore = <T>(initialValue: T): ChannelStore<T> => {
  let _value: T = initialValue
  let _status: StoreStatus = 'initializing'
  const _subscribers = new Set<(value: T) => void>()
  const _statusSubscribers = new Set<(status: StoreStatus) => void>()

  const store = {
    get: vi.fn(() => _value),
    set: vi.fn((newValue: T) => {
      _value = newValue
      _subscribers.forEach((cb) => cb(_value))
      Promise.resolve()
    }),
    subscribe: vi.fn((callback: (value: T) => void) => {
      _subscribers.add(callback)
      callback(_value)
      return () => _subscribers.delete(callback)
    }),
    get status() {
      return _status
    },
    set status(newStatus: StoreStatus) {
      _status = newStatus
      _statusSubscribers.forEach((cb) => cb(_status))
    },
    subscribeStatus: vi.fn((callback: (status: StoreStatus) => void) => {
      _statusSubscribers.add(callback)
      callback(_status)
      return () => _statusSubscribers.delete(callback)
    }),
    destroy: vi.fn(() => {
      store.status = 'destroyed'
      _subscribers.clear()
      _statusSubscribers.clear()
    }),
    reset: vi.fn(async () => {
      _value = initialValue
      _subscribers.forEach((cb) => cb(_value))
      await Promise.resolve()
    }),
    // HACK: This is a mock implementation
  } as unknown as ChannelStore<T>

  return store
}
