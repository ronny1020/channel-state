/// <reference types="node" />
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ChannelStore } from './ChannelState'

// Mock BroadcastChannel and IndexedDB
const mockPostMessage = vi.fn()
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()
const mockClose = vi.fn()

Object.defineProperty(global, 'BroadcastChannel', {
  writable: true,
  value: vi.fn(() => ({
    postMessage: mockPostMessage,
    addEventListener: mockAddEventListener,
    removeEventListener: mockRemoveEventListener,
    close: mockClose,
  })),
})

const mockIndexedDB = {
  open: vi.fn(() => ({
    onupgradeneeded: null,
    onsuccess: null,
    onerror: null,
    result: {
      objectStoreNames: {
        contains: vi.fn(() => true),
      },
      createObjectStore: vi.fn(),
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          get: vi.fn(() => ({
            onsuccess: null,
            onerror: null,
          })),
          put: vi.fn(() => ({
            onsuccess: null,
            onerror: null,
          })),
        })),
      })),
      close: vi.fn(),
    },
  })),
}

Object.defineProperty(global, 'indexedDB', {
  writable: true,
  value: mockIndexedDB,
})

describe('ChannelStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with initial value and not persist by default', () => {
    const store = new ChannelStore({ name: 'test-store', initial: 0 })
    expect(store.get()).toBe(0)
    expect(mockIndexedDB.open).not.toHaveBeenCalled()
  })

  it('should update value and notify subscribers', () => {
    const store = new ChannelStore({ name: 'test-store', initial: 0 })
    const subscriber = vi.fn()
    store.subscribe(subscriber)

    store.set(1)
    expect(store.get()).toBe(1)
    expect(subscriber).toHaveBeenCalledWith(1)
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'STATE_UPDATE',
      payload: 1,
      senderId: expect.any(String),
    })
  })

  it('should receive updates from other tabs', () => {
    const store1 = new ChannelStore({ name: 'test-store', initial: 0 })
    const subscriber1 = vi.fn()
    store1.subscribe(subscriber1)

    // Simulate message from store2 to store1
    const messageEvent = new MessageEvent('message', {
      data: {
        type: 'STATE_UPDATE',
        payload: 5,
        senderId: 'some-other-id',
      },
    })
    mockAddEventListener.mock.calls[0][1](messageEvent)

    expect(store1.get()).toBe(5)
    expect(subscriber1).toHaveBeenCalledWith(5)
  })

  it('should request initial state from other tabs if not persisted and no initial value', async () => {
    const store = new ChannelStore({
      name: 'test-store',
      initial: 0,
      persist: false,
    })

    // Simulate another tab responding with state
    const messageEvent = new MessageEvent('message', {
      data: {
        type: 'STATE_UPDATE',
        payload: 10,
        senderId: 'some-other-id',
      },
    })
    mockAddEventListener.mock.calls[0][1](messageEvent)

    expect(store.get()).toBe(10)
  })

  it('should destroy the store correctly', () => {
    const store = new ChannelStore({ name: 'test-store', initial: 0 })
    store.subscribe(() => {})
    store.destroy()
    expect(mockClose).toHaveBeenCalled()
    expect(store['_subscribers'].size).toBe(0)
  })

  it('should reset the store to its initial value', async () => {
    const store = new ChannelStore({ name: 'test-store', initial: 0 })
    store.set(10)
    expect(store.get()).toBe(10)
    await store.reset()
    expect(store.get()).toBe(0)
  })

  it('should update status throughout the lifecycle', () => {
    const store = new ChannelStore({ name: 'test-store', initial: 0 })
    expect(store.status).toBe('initial')

    // Simulate successful initialization
    // In a real scenario, this would be handled by the store's internal logic
    store.status = 'ready'
    expect(store.status).toBe('ready')

    store.destroy()
    expect(store.status).toBe('destroyed')
  })

  it('should notify status subscribers when status changes', () => {
    const store = new ChannelStore({ name: 'test-store', initial: 0 })
    const statusSubscriber = vi.fn()
    store.subscribeStatus(statusSubscriber)

    // Simulate status change to ready (e.g., after initDB or loadCacheFromDB)
    store.status = 'ready'
    store['_notifyStatusSubscribers']()
    expect(statusSubscriber).toHaveBeenCalledWith('ready')

    statusSubscriber.mockClear()
    store.destroy()
    expect(statusSubscriber).toHaveBeenCalledWith('destroyed')
  })

  it('should prevent set operations if the store is destroyed', async () => {
    const store = new ChannelStore({ name: 'test-store', initial: 0 })
    store.destroy()
    const initialValue = store.get()
    await store.set(10)
    expect(store.get()).toBe(initialValue) // Value should not change
    expect(mockPostMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ payload: 10 }),
    )
  })

  it('should prevent reset operations if the store is destroyed', async () => {
    const store = new ChannelStore({ name: 'test-store', initial: 0 })
    store.set(10)
    store.destroy()
    await store.reset()
    expect(store.get()).toBe(10) // Value should not reset
    expect(mockPostMessage).not.toHaveBeenCalledWith(
      expect.objectContaining({ payload: 0 }),
    )
  })

  it('should prevent new subscriptions if the store is destroyed', () => {
    const store = new ChannelStore({ name: 'test-store', initial: 0 })
    store.destroy()
    const subscriber = vi.fn()
    const unsubscribe = store.subscribe(subscriber)
    store.set(10) // Attempt to trigger a change
    expect(subscriber).not.toHaveBeenCalled()
    expect(unsubscribe).toBeInstanceOf(Function) // Still returns a function
  })

  it('should prevent new status subscriptions if the store is destroyed', () => {
    const store = new ChannelStore({ name: 'test-store', initial: 0 })
    store.destroy()
    const statusSubscriber = vi.fn()
    const unsubscribe = store.subscribeStatus(statusSubscriber)
    store.status = 'ready' // Attempt to change status
    store['_notifyStatusSubscribers']() // Manually trigger notification
    expect(statusSubscriber).not.toHaveBeenCalled()
    expect(unsubscribe).toBeInstanceOf(Function) // Still returns a function
  })

  it('should prevent destroy method itself if the store is already destroyed', () => {
    const store = new ChannelStore({ name: 'test-store', initial: 0 })
    store.destroy()
    expect(mockClose).toHaveBeenCalledTimes(1)
    expect(store.status).toBe('destroyed')

    // Attempt to destroy again
    store.destroy()
    expect(mockClose).toHaveBeenCalledTimes(1) // Should not be called again
    expect(store.status).toBe('destroyed') // Status should remain destroyed
  })
})
