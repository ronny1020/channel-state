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

  it('should persist if persist option is true', () => {
    const store = new ChannelStore({
      name: 'test-store',
      initial: 0,
      persist: true,
    })
    expect(mockIndexedDB.open).toHaveBeenCalledWith(
      'channel-state__test-store',
      1,
    )
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

    const store2 = new ChannelStore({ name: 'test-store', initial: 0 })

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
    const unsubscribe = store.subscribe(() => {})
    store.destroy()
    expect(mockClose).toHaveBeenCalled()
    expect(store['_subscribers'].size).toBe(0)
  })
})
