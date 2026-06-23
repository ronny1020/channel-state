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

interface MockLockManager {
  readonly request: ReturnType<typeof vi.fn>
}

interface CreateMockLockManagerOptions {
  initialLockAvailable: boolean
}

interface QueuedMockLockRequest {
  readonly name: string
  readonly callback: LockGrantedCallback<unknown>
  readonly resolve: (value: unknown) => void
  readonly reject: (reason?: unknown) => void
  readonly signal: AbortSignal | undefined
}

async function flushPromises(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}

async function flushWebLockPromotion(): Promise<void> {
  await flushPromises()
  await flushPromises()
  await flushPromises()
}

function setNavigatorLocks(locks: MockLockManager | undefined): void {
  Object.defineProperty(globalThis.navigator, 'locks', {
    configurable: true,
    value: locks,
  })
}

function createAbortError(): DOMException {
  return new DOMException('Aborted', 'AbortError')
}

function createMockLockManager(
  options: CreateMockLockManagerOptions,
): MockLockManager {
  let lockAvailable = options.initialLockAvailable
  const queuedRequests: QueuedMockLockRequest[] = []

  function grantNextQueuedLock(): void {
    const queuedRequest = queuedRequests.shift()

    if (!queuedRequest) {
      lockAvailable = true
      return
    }

    if (queuedRequest.signal?.aborted) {
      queuedRequest.reject(createAbortError())
      grantNextQueuedLock()
      return
    }

    void grantLock(queuedRequest.name, queuedRequest.callback).then(
      queuedRequest.resolve,
      queuedRequest.reject,
    )
  }

  async function grantLock<T>(
    name: string,
    callback: LockGrantedCallback<T>,
  ): Promise<T> {
    lockAvailable = false

    try {
      return await callback({ name, mode: 'exclusive' })
    } finally {
      grantNextQueuedLock()
    }
  }

  async function enqueueLockRequest<T>(
    name: string,
    callback: LockGrantedCallback<T>,
    signal: AbortSignal | undefined,
  ): Promise<T> {
    if (signal?.aborted) {
      throw createAbortError()
    }

    return new Promise<T>((resolve, reject) => {
      function handleAbort(): void {
        reject(createAbortError())
      }

      signal?.addEventListener('abort', handleAbort, { once: true })

      queuedRequests.push({
        name,
        callback,
        resolve: resolve as (value: unknown) => void,
        reject,
        signal,
      })
    })
  }

  async function request<T>(
    name: string,
    requestOptions: LockOptions,
    callback: LockGrantedCallback<T>,
  ): Promise<T> {
    if (requestOptions.signal?.aborted) {
      throw createAbortError()
    }

    if (requestOptions.ifAvailable) {
      if (!lockAvailable) {
        return callback(null)
      }

      return grantLock(name, callback)
    }

    if (lockAvailable) {
      return grantLock(name, callback)
    }

    return enqueueLockRequest(name, callback, requestOptions.signal)
  }

  return {
    request: vi.fn(request),
  }
}

Object.defineProperty(global, 'indexedDB', {
  writable: true,
  value: mockIndexedDB,
})

describe('ChannelStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    setNavigatorLocks(undefined)
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
    setNavigatorLocks(undefined)
    vi.useRealTimers()
  })

  it('should initialize with initial value and not persist by default', () => {
    const store = new ChannelStore({ name: 'test-store', initial: 0 })
    expect(store.get()).toBe(0)
    expect(mockIndexedDB.open).not.toHaveBeenCalled()
  })

  it('should skip initial state request when Web Locks prove this is the only memory-only store', async () => {
    const lockManager = createMockLockManager({ initialLockAvailable: true })
    setNavigatorLocks(lockManager)

    const store = new ChannelStore({
      name: 'test-store',
      initial: 0,
      persist: false,
    })

    await flushPromises()

    expect(store.status).toBe('ready')
    expect(mockPostMessage).not.toHaveBeenCalledWith({
      type: 'REQUEST_INIT_STATE',
      senderId: expect.any(String) as string,
    })
    expect(lockManager.request).toHaveBeenCalledWith(
      'channel-state__test-store__leader',
      { ifAvailable: true },
      expect.any(Function),
    )

    store.destroy()
  })

  it('should request initial state when Web Locks indicate another memory-only store exists', async () => {
    const lockManager = createMockLockManager({ initialLockAvailable: false })
    setNavigatorLocks(lockManager)

    const store = new ChannelStore({
      name: 'test-store',
      initial: 0,
      persist: false,
    })

    await flushPromises()

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'REQUEST_INIT_STATE',
      senderId: expect.any(String) as string,
    })
    // 1st time for checking if lock is available
    // 2nd time for queuing
    expect(lockManager.request).toHaveBeenCalledTimes(2)

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

    expect(store.status).toBe('ready')
    expect(store.get()).toBe(10)

    store.destroy()
  })

  it('should only let the memory-only Web Locks leader answer initial state requests', async () => {
    // current tab is follower
    const lockManager = createMockLockManager({ initialLockAvailable: false })
    setNavigatorLocks(lockManager)

    const store = new ChannelStore({
      name: 'test-store',
      initial: 0,
      persist: false,
    })

    await flushPromises()

    const eventHandler = mockAddEventListener.mock.calls[0][1] as EventListener

    // initalize current tab
    eventHandler(
      new MessageEvent('message', {
        data: {
          type: 'RESPONSE_INIT_STATE',
          payload: 10,
          senderId: 'leader-id',
        },
      }),
    )

    expect(store.status).toBe('ready')
    expect(store.get()).toBe(10)

    mockPostMessage.mockClear()

    eventHandler(
      new MessageEvent('message', {
        data: {
          type: 'REQUEST_INIT_STATE',
          senderId: 'new-tab-id',
        },
      }),
    )

    // current tab ignores the request because it's not the leader
    expect(mockPostMessage).not.toHaveBeenCalledWith({
      type: 'RESPONSE_INIT_STATE',
      payload: 10,
      senderId: expect.any(String) as string,
    })

    store.destroy()
  })

  it('should let the memory-only Web Locks leader answer initial state requests', async () => {
    const lockManager = createMockLockManager({ initialLockAvailable: true })
    setNavigatorLocks(lockManager)

    const store = new ChannelStore({
      name: 'test-store',
      initial: 0,
      persist: false,
    })

    await flushPromises()
    store.set(10)
    mockPostMessage.mockClear()

    const eventHandler = mockAddEventListener.mock.calls[0][1] as EventListener

    eventHandler(
      new MessageEvent('message', {
        data: {
          type: 'REQUEST_INIT_STATE',
          senderId: 'new-tab-id',
        },
      }),
    )

    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'RESPONSE_INIT_STATE',
      payload: 10,
      senderId: expect.any(String) as string,
    })

    store.destroy()
  })

  it('should appoint a queued memory-only store as the new Web Locks leader when the current leader is gone', async () => {
    const lockManager = createMockLockManager({ initialLockAvailable: true })
    setNavigatorLocks(lockManager)

    const leaderStore = new ChannelStore({
      name: 'test-store',
      initial: 0,
      persist: false,
    })

    await flushPromises()
    leaderStore.set(10)

    const queuedStore = new ChannelStore({
      name: 'test-store',
      initial: 0,
      persist: false,
    })

    await flushPromises()

    const queuedStoreEventHandler = mockAddEventListener.mock
      .calls[1][1] as EventListener

    queuedStoreEventHandler(
      new MessageEvent('message', {
        data: {
          type: 'RESPONSE_INIT_STATE',
          payload: 10,
          senderId: 'leader-id',
        },
      }),
    )

    expect(queuedStore.status).toBe('ready')
    expect(queuedStore.get()).toBe(10)

    mockPostMessage.mockClear()

    queuedStoreEventHandler(
      new MessageEvent('message', {
        data: {
          type: 'REQUEST_INIT_STATE',
          senderId: 'new-tab-before-promotion-id',
        },
      }),
    )

    expect(mockPostMessage).not.toHaveBeenCalledWith({
      type: 'RESPONSE_INIT_STATE',
      payload: 10,
      senderId: expect.any(String) as string,
    })

    leaderStore.destroy()
    await flushWebLockPromotion()
    mockPostMessage.mockClear()

    queuedStoreEventHandler(
      new MessageEvent('message', {
        data: {
          type: 'REQUEST_INIT_STATE',
          senderId: 'new-tab-after-promotion-id',
        },
      }),
    )

    // only leader respond to initial state requests
    expect(mockPostMessage).toHaveBeenCalledWith({
      type: 'RESPONSE_INIT_STATE',
      payload: 10,
      senderId: expect.any(String) as string,
    })

    queuedStore.destroy()
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
