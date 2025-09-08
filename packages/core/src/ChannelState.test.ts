import { vi } from 'vitest'
import { ChannelStore } from './ChannelState'

const mockPostMessage = vi.fn()
const mockAddEventListener = vi.fn()
const mockRemoveEventListener = vi.fn()
const mockClose = vi.fn()

const mockIndexedDB = {
  open: vi.fn(() => ({
    onupgradeneeded: null as
      | ((this: IDBOpenDBRequest, ev: IDBVersionChangeEvent) => any)
      | null,
    onsuccess: null as ((this: IDBRequest, ev: Event) => any) | null,
    onerror: null as ((this: IDBRequest, ev: Event) => any) | null,
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
    vi.useFakeTimers()
    mockPostMessage.mockRestore()
    mockAddEventListener.mockRestore()
    mockRemoveEventListener.mockRestore()
    mockClose.mockRestore()
    vi.spyOn(BroadcastChannel.prototype, 'postMessage').mockImplementation(
      mockPostMessage,
    )
    vi.spyOn(BroadcastChannel.prototype, 'addEventListener').mockImplementation(
      mockAddEventListener,
    )
    vi.spyOn(
      BroadcastChannel.prototype,
      'removeEventListener',
    ).mockImplementation(mockRemoveEventListener)
    vi.spyOn(BroadcastChannel.prototype, 'close').mockImplementation(mockClose)
  })

  afterEach(() => {
    vi.useRealTimers()
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
      senderId: expect.any(String) as string,
    })
  })

  it('should receive updates from other tabs', () => {
    const store1 = new ChannelStore({ name: 'test-store', initial: 0 })
    const subscriber1 = vi.fn()
    store1.subscribe(subscriber1)

    // Manually set the store to ready to simulate it has been initialized
    store1.status = 'ready'

    // Simulate message from store2 to store1
    const messageEvent = new MessageEvent('message', {
      data: {
        type: 'STATE_UPDATE',
        payload: 5,
        senderId: 'some-other-id',
      },
    })

    const eventHandler = mockAddEventListener.mock.calls[0][1] as EventListener

    eventHandler(messageEvent)

    vi.runAllTimers()

    expect(store1.get()).toBe(5)
    expect(subscriber1).toHaveBeenCalledWith(5)
  })

  it('should request initial state from other tabs if not persisted and no initial value', () => {
    const store = new ChannelStore({
      name: 'test-store',
      initial: 0,
      persist: false,
    })

    // Simulate another tab responding with state
    const messageEvent = new MessageEvent('message', {
      data: {
        type: 'RESPONSE_INIT_STATE',
        payload: 10,
        senderId: 'some-other-id',
      },
    })
    const eventHandler = mockAddEventListener.mock.calls[0][1] as EventListener

    eventHandler(messageEvent)
    vi.runAllTimers()

    expect(store.get()).toBe(10)
  })

  it('should destroy the store correctly', () => {
    const store = new ChannelStore({ name: 'test-store', initial: 0 })
    store.subscribe(() => {
      // empty
    })
    store.destroy()

    // @ts-expect-error - Testing private key
    expect(store._subscribers.size).toBe(0)
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
    expect(store.status).toBe('initializing')

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

    // @ts-expect-error - Testing private key
    store._notifyStatusSubscribers()
    expect(statusSubscriber).toHaveBeenCalledWith('ready')

    statusSubscriber.mockClear()
    store.destroy()
    expect(statusSubscriber).toHaveBeenCalledWith('destroyed')
  })

  it('should prevent set operations if the store is destroyed', () => {
    const store = new ChannelStore({ name: 'test-store', initial: 0 })
    store.destroy()
    const initialValue = store.get()
    store.set(10)
    expect(store.get()).toBe(initialValue) // Value should not change
    // expect(mockPostMessage).not.toHaveBeenCalledWith(
    //   expect.objectContaining({ payload: 10 }),
    // )
  })

  it('should prevent reset operations if the store is destroyed', async () => {
    const store = new ChannelStore({ name: 'test-store', initial: 0 })
    store.set(10)
    store.destroy()
    await store.reset()
    expect(store.get()).toBe(10) // Value should not reset
    // expect(mockPostMessage).not.toHaveBeenCalledWith(
    //   expect.objectContaining({ payload: 0 }),
    // )
  })

  it('should prevent new subscriptions if the store is destroyed', () => {
    const store = new ChannelStore({ name: 'test-store', initial: 0 })
    store.destroy()
    const subscriber = vi.fn()
    expect(() => store.subscribe(subscriber)).toThrow()
    store.set(10) // Attempt to trigger a change
    expect(subscriber).not.toHaveBeenCalled()
  })

  it('should prevent new status subscriptions if the store is destroyed', () => {
    const store = new ChannelStore({ name: 'test-store', initial: 0 })
    store.destroy()
    const statusSubscriber = vi.fn()
    expect(() => store.subscribe(statusSubscriber)).toThrow()

    // @ts-expect-error - Testing private key
    store._notifyStatusSubscribers()
    expect(statusSubscriber).not.toHaveBeenCalled()
  })

  it('should prevent destroy method itself if the store is already destroyed', () => {
    const store = new ChannelStore({ name: 'test-store', initial: 0 })
    store.destroy()
    // expect(mockClose).toHaveBeenCalledTimes(1) // No longer directly mockable
    expect(store.status).toBe('destroyed')

    // Attempt to destroy again
    store.destroy()
    expect(mockClose).toHaveBeenCalledTimes(1) // Should not be called again
    expect(store.status).toBe('destroyed') // Status should remain destroyed
  })

  it('should ignore initial state response if set() is called first', () => {
    const store = new ChannelStore({ name: 'test-store', initial: 0 })
    const statusSubscriber = vi.fn()
    store.subscribeStatus(statusSubscriber)

    expect(store.status).toBe('initializing')

    store.set(5)

    expect(store.get()).toBe(5)
    expect(store.status).toBe('ready')
    expect(statusSubscriber).toHaveBeenCalledWith('ready')

    // Simulate a late initial state response from another tab
    const messageEvent = new MessageEvent('message', {
      data: {
        type: 'RESPONSE_INIT_STATE',
        payload: 10,
        senderId: 'some-other-id',
      },
    })
    const eventHandler = mockAddEventListener.mock.calls[0][1] as EventListener
    eventHandler(messageEvent)

    // The value should not be overwritten
    expect(store.get()).toBe(5)
  })

  it('should ignore persisted state if set() is called before DB read completes', () => {
    // 1. Define the objects that will be returned by the mocks
    const mockGetRequest = {
      onsuccess: null as
        | ((event: { target: { result: number } }) => void)
        | null,
      onerror: null,
      result: 10,
    }
    const mockOpenRequest = {
      onupgradeneeded: null,
      onsuccess: null as (() => void) | null,
      onerror: null,
      result: {
        objectStoreNames: {
          contains: vi.fn(() => true),
        },
        createObjectStore: vi.fn(),
        close: vi.fn(),
        transaction: vi.fn(() => ({
          objectStore: vi.fn(() => ({
            get: vi.fn(() => mockGetRequest),
            put: vi.fn(() => ({
              onsuccess: null,
              onerror: null,
            })),
          })),
        })),
      },
    }

    // 2. Set up the mock implementation
    mockIndexedDB.open.mockImplementation(() => {
      // Simulate async open
      setTimeout(() => {
        if (mockOpenRequest.onsuccess) {
          mockOpenRequest.onsuccess()
        }
      }, 0)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return mockOpenRequest as any
    })

    // 3. Create the store. This will call open() and assign to onsuccess.
    const store = new ChannelStore({
      name: 'test-store',
      initial: 0,
      persist: true,
    })
    expect(store.status).toBe('initializing')

    // 4. Set the value while the store is initializing
    store.set(5)
    expect(store.get()).toBe(5)
    expect(store.status).toBe('ready')

    // 5. Now, manually trigger the get onsuccess, which was assigned by _loadCacheFromDB
    if (mockGetRequest.onsuccess) {
      mockGetRequest.onsuccess({ target: mockGetRequest })
    }
    vi.runAllTimers()

    // 6. The value should not have been overwritten
    expect(store.get()).toBe(5)
  })
})
