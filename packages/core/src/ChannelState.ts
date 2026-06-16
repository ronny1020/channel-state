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
 * Represents a message sent between stores.
 * @template T The type of the payload.
 * @remarks This interface is used for both sending and receiving messages between stores.
 */
export type StoreBroadcastMessage<T> =
  | {
      type: 'REQUEST_INIT_STATE'
      senderId: string
    }
  | {
      type: 'RESPONSE_INIT_STATE'
      senderId: string
      payload: T
    }
  | {
      type: 'STATE_UPDATE'
      senderId: string
      payload: T
    }

/**
 * Represents the types of messages that can be sent between stores.
 * - 'REQUEST_INIT_STATE': A request from a new store instance asking for the current state.
 * - 'RESPONSE_INIT_STATE': A response from an existing store, providing its state to the new instance.
 * - 'STATE_UPDATE': A regular state update broadcast to all other stores.
 */
export type StoreBroadcastMessageType = StoreBroadcastMessage<unknown>['type']

/**
 * Represents the status of the ChannelStore.
 * - 'initializing': The store is initializing.
 * - 'ready': The store is ready to be used.
 * - 'destroyed': The store has been destroyed.
 */
export type StoreStatus = 'initializing' | 'ready' | 'destroyed'

/**
 * Callback function type for store status changes.
 */
export type StoreStatusCallback = (status: StoreStatus) => void

/**
 * Callback function type for store changes.
 */
type StoreChangeCallback<T> = (value: T) => void

interface LeaderLockHold {
  readonly promise: Promise<void>
  readonly release: () => void
}

interface MarkReadyOptions {
  notifySubscribers: boolean
}

/**
 * Options for configuring a ChannelStore instance.
 * @template T The type of the state managed by the store.
 */
export interface ChannelStoreOptions<T> {
  /**
   * The name of the channel. This is used for both BroadcastChannel and IndexedDB.
   * @remarks Required.
   */
  name: string
  /**
   * Whether the store should persist its state to IndexedDB.
   * @remarks Defaults to `false`.
   */
  persist?: boolean
  /**
   * The initial state of the store.
   * @remarks Required.
   */
  initial: T
}

function createLeaderLockHold(): LeaderLockHold {
  let release!: () => void

  const promise = new Promise<void>((resolve) => {
    release = resolve
  })

  return { promise, release }
}

function isAbortError(error: unknown): boolean {
  return (
    typeof DOMException !== 'undefined' &&
    error instanceof DOMException &&
    error.name === 'AbortError'
  )
}

/**
 * A class that manages and shares state across different browser tabs or windows
 * using BroadcastChannel and IndexedDB for persistence.
 * @template T The type of the state managed by the store.
 *
 * @property {StoreStatus} status The current status of the store, indicating its readiness and lifecycle phase.
 */
export class ChannelStore<T> {
  private _db: IDBDatabase | null = null
  private _subscribers = new Set<StoreChangeCallback<T>>()
  private _statusSubscribers = new Set<StoreStatusCallback>()
  private _value: T
  private readonly _name: string
  private readonly _persist: boolean
  private readonly _initial: T
  private readonly _channel: BroadcastChannel
  private readonly _dbKey = 'state' // Fixed key for storing the single state object
  private readonly _prefixedName: string
  private readonly _instanceId = crypto.randomUUID()
  private _initialStateRequestTimeout: ReturnType<typeof setTimeout> | null =
    null
  private readonly _leaderLockName: string
  private _leaderLockHold: LeaderLockHold | null = null
  private _waitToBecomeLeaderAbortController: AbortController | null = null

  /**
   * The current status of the store.
   */
  status: StoreStatus = 'initializing'

  /**
   * Creates an instance of ChannelStore.
   * @param options The options for configuring the store.
   */
  constructor(options: ChannelStoreOptions<T>) {
    this._name = options.name
    this._persist = options.persist ?? false
    this._initial = options.initial
    this._prefixedName = `channel-state__${this._name}`
    this._leaderLockName = `${this._prefixedName}__leader`

    this._value = structuredClone(this._initial)

    this._channel = new BroadcastChannel(this._prefixedName)
    this._channel.addEventListener('message', this._handleChannelMessage)

    if (this._persist) {
      this._initDB()
    } else {
      this._initMemoryOnlyStore()
    }
  }

  private _initDB(): void {
    if (this.status === 'destroyed') {
      return
    }
    const request = indexedDB.open(this._prefixedName, 1)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(this._prefixedName)) {
        db.createObjectStore(this._prefixedName)
      }
    }

    request.onsuccess = () => {
      this._db = request.result
      this._loadCacheFromDB()
    }

    request.onerror = () => {
      console.error('IndexedDB init failed:', request.error)
      this._markReady({ notifySubscribers: false }) // Fallback to initial values cache
    }
  }

  private _loadCacheFromDB(): void {
    if (this.status === 'destroyed') {
      return
    }
    if (!this._db) return

    const tx = this._db.transaction(this._prefixedName, 'readonly')
    const store = tx.objectStore(this._prefixedName)

    const req = store.get(this._dbKey) as IDBRequest<T>
    req.onsuccess = () => {
      if (this.status === 'ready') {
        return
      }
      const val = req.result
      if (val !== undefined) {
        this._value = val
      }
      this._markReady({ notifySubscribers: true })
    }
    req.onerror = () => {
      // If IndexedDB read fails, request from other tabs
      this._initMemoryOnlyStore()
    }
  }

  private _initMemoryOnlyStore(): void {
    if (this.status === 'destroyed') {
      return
    }

    const lockManager = this._getLockManager()

    if (lockManager === null) {
      this._requestInitialStateFromOtherTabs()
      return
    }

    try {
      void lockManager
        .request<Promise<boolean>>(
          this._leaderLockName,
          { ifAvailable: true },
          async (lock) => {
            if (this.status === 'destroyed' || lock === null) {
              return false
            }

            await this._currentTabIsLeader()
            return true
          },
        )
        .then((acquiredLockPromise) => {
          // Workaround for a TypeScript false positive that appears to be fixed in TS 6
          const acquiredLock = acquiredLockPromise as unknown as boolean
          if (this.status === 'destroyed' || acquiredLock) {
            return
          }

          if (this.status === 'initializing') {
            this._requestInitialStateFromOtherTabs()
          }

          this._waitToBecomeLeader(lockManager)
        })
        .catch((error: unknown) => {
          if (this.status === 'destroyed' || isAbortError(error)) {
            return
          }

          this._requestInitialStateFromOtherTabs()
        })
    } catch {
      this._requestInitialStateFromOtherTabs()
    }
  }

  private _getLockManager(): LockManager | null {
    if (
      typeof navigator === 'undefined' ||
      typeof navigator.locks === 'undefined'
    ) {
      return null
    }

    return navigator.locks
  }

  private _currentTabIsLeader(): Promise<void> {
    const leaderLockHold = createLeaderLockHold()
    this._leaderLockHold = leaderLockHold

    this._markReady({ notifySubscribers: true })

    return leaderLockHold.promise.finally(() => {
      // Not leader anymore
      if (this._leaderLockHold === leaderLockHold) {
        this._leaderLockHold = null
      }
    })
  }

  private _waitToBecomeLeader(lockManager: LockManager): void {
    if (
      this.status === 'destroyed' ||
      this._leaderLockHold !== null ||
      this._waitToBecomeLeaderAbortController !== null
    ) {
      return
    }

    const abortController = new AbortController()
    this._waitToBecomeLeaderAbortController = abortController

    try {
      void lockManager
        .request<unknown>(
          this._leaderLockName,
          { signal: abortController.signal },
          async (lock) => {
            if (this.status === 'destroyed' || lock === null) {
              return
            }

            this._waitToBecomeLeaderAbortController = null
            await this._currentTabIsLeader()
          },
        )
        .catch((error: unknown) => {
          if (this.status === 'destroyed' || isAbortError(error)) {
            return
          }

          this._waitToBecomeLeaderAbortController = null
        })
    } catch {
      this._waitToBecomeLeaderAbortController = null
    }
  }

  private _requestInitialStateFromOtherTabs(): void {
    if (this.status === 'destroyed') {
      return
    }
    this._channel.postMessage({
      type: 'REQUEST_INIT_STATE',
      senderId: this._instanceId,
    })

    this._initialStateRequestTimeout = setTimeout(() => {
      if (this.status !== 'ready') {
        this._markReady({ notifySubscribers: true })
      }
      this._initialStateRequestTimeout = null
    }, 500) // Wait for 500ms for a response when another tab may exist or Web Locks are unavailable
  }

  private _clearInitialStateRequestTimeout(): void {
    if (!this._initialStateRequestTimeout) {
      return
    }

    clearTimeout(this._initialStateRequestTimeout)
    this._initialStateRequestTimeout = null
  }

  private _markReady(options: MarkReadyOptions): void {
    if (this.status !== 'initializing') {
      return
    }

    this.status = 'ready'

    if (options.notifySubscribers) {
      this._notifySubscribers()
    }

    this._notifyStatusSubscribers()
  }

  private _shouldRespondToInitialStateRequest(): boolean {
    if (this.status !== 'ready') {
      return false
    }

    if (this._persist) {
      return true
    }

    const lockManager = this._getLockManager()

    // If locking isn't available, then always respond
    if (lockManager === null) {
      return true
    }

    // Only leader should respond
    return this._leaderLockHold !== null
  }

  /**
   * Processes messages received from the BroadcastChannel.
   *
   * This method handles three types of messages:
   * - 'REQUEST_INIT_STATE': Responds to other tabs by sending the current state.
   * - 'RESPONSE_INIT_STATE': Sets the store's initial state if the store is still 'initializing'.
   * - 'STATE_UPDATE': Updates the store's state if the store is 'ready'.
   * @param messageEvent The MessageEvent containing the broadcasted data.
   * @private
   */
  private _handleChannelMessage = (
    messageEvent: MessageEvent<StoreBroadcastMessage<T>>,
  ): void => {
    if (this.status === 'destroyed') {
      return
    }

    const message = messageEvent.data

    if (message.senderId === this._instanceId) {
      return // Ignore messages from self
    }

    switch (message.type) {
      case 'REQUEST_INIT_STATE':
        if (this._shouldRespondToInitialStateRequest()) {
          this._channel.postMessage({
            type: 'RESPONSE_INIT_STATE',
            payload: this._value,
            senderId: this._instanceId,
          })
        }
        break

      case 'RESPONSE_INIT_STATE':
        // Only accept this if we are still initializing
        if (this.status === 'initializing') {
          this._clearInitialStateRequestTimeout()
          this._value = message.payload
          this._markReady({ notifySubscribers: true })
        }
        break

      case 'STATE_UPDATE':
        // Only accept this if we are already ready
        if (this.status === 'ready') {
          this._value = message.payload
          this._notifySubscribers()
        }
        break
    }
  }

  /**
   * Notifies all registered subscribers about a change in the store's state.
   * @private
   */
  private _notifySubscribers(): void {
    this._subscribers.forEach((subscriber) => {
      subscriber(this._value)
    })
  }

  private _notifyStatusSubscribers(): void {
    this._statusSubscribers.forEach((subscriber) => {
      subscriber(this.status)
    })
  }

  /**
   * Triggers a change notification by posting the current cache to the BroadcastChannel
   * and notifying local subscribers.
   * @private
   */
  private _triggerChange(): void {
    if (this.status === 'destroyed') {
      return
    }
    this._channel.postMessage({
      type: 'STATE_UPDATE',
      payload: this._value,
      senderId: this._instanceId,
    })
    this._notifySubscribers()
  }

  /**
   * Synchronously retrieves the current state from the cache.
   * @returns The current state of the store.
   */
  get(): T {
    return this._value
  }

  /**
   * Sets a new value for the store's state.
   *
   * This method updates the value, broadcasts the change to other tabs, and
   * persists the new value to IndexedDB if persistence is enabled.
   *
   * If `set()` is called while the store is still `initializing`, it will
   * immediately transition the store to the `ready` state with the new value,
   * cancelling any pending initial state synchronization.
   *
   * @param value The new state value to set.
   */
  set(value: T): void {
    if (this.status === 'destroyed') {
      return
    }

    if (this.status === 'initializing') {
      this._clearInitialStateRequestTimeout()
      this._markReady({ notifySubscribers: false })
    }

    this._value = value

    if (!this._persist || this._db === null) {
      this._triggerChange()
      return
    }

    void new Promise<void>((resolve, reject) => {
      const db = this._db

      if (!db) {
        reject(new Error('Database not initialized'))
        return
      }

      const tx = db.transaction(this._prefixedName, 'readwrite')
      const store = tx.objectStore(this._prefixedName)
      const req = store.put(value, this._dbKey)

      req.onsuccess = () => {
        this._triggerChange()
        resolve()
      }
      req.onerror = () => {
        reject(new Error(req.error?.message ?? 'unknown error'))
      }
    })
  }

  /**
   * Subscribes a callback function to state changes.
   * @param callback The function to call when the state changes.
   * @returns A function that can be called to unsubscribe the callback.
   */
  subscribe(callback: StoreChangeCallback<T>): () => void {
    if (this.status === 'destroyed') {
      throw new Error('ChannelStore is destroyed')
    }
    this._subscribers.add(callback)

    return () => {
      this._subscribers.delete(callback)
    }
  }

  /**
   * Subscribes a callback function to status changes.
   * @param callback The function to call when the status changes.
   * @returns A function that can be called to unsubscribe the callback.
   */
  subscribeStatus(callback: StoreStatusCallback): () => void {
    if (this.status === 'destroyed') {
      throw new Error('ChannelStore is destroyed')
    }
    this._statusSubscribers.add(callback)

    return () => {
      this._statusSubscribers.delete(callback)
    }
  }

  /**
   * Cleans up resources used by the ChannelStore, including closing the BroadcastChannel
   * and IndexedDB connection, and clearing subscribers.
   */
  destroy(): void {
    if (this.status === 'destroyed') {
      return
    }
    this.status = 'destroyed'
    this._notifyStatusSubscribers()
    this._channel.removeEventListener('message', this._handleChannelMessage)
    this._channel.close()
    this._subscribers.clear()
    this._statusSubscribers.clear()
    this._db?.close()
    this._clearInitialStateRequestTimeout()

    if (this._waitToBecomeLeaderAbortController) {
      this._waitToBecomeLeaderAbortController.abort()
      this._waitToBecomeLeaderAbortController = null
    }

    if (this._leaderLockHold) {
      this._leaderLockHold.release()
      this._leaderLockHold = null
    }
  }

  /**
   * Resets the store's state to its initial value.
   * @returns A Promise that resolves when the state has been reset.
   */
  reset(): Promise<void> {
    if (this.status === 'destroyed') {
      return Promise.resolve()
    }
    this._value = structuredClone(this._initial)

    if (!this._db) {
      this._triggerChange()
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const db = this._db

      if (!db) {
        reject(new Error('IndexedDB is not available'))
        return
      }

      const tx = db.transaction(this._prefixedName, 'readwrite')
      const store = tx.objectStore(this._prefixedName)
      const req = store.put(this._value, this._dbKey)

      req.onsuccess = () => {
        this._triggerChange()
        resolve()
      }
      req.onerror = () => {
        reject(new Error(req.error?.message ?? 'unknown error'))
      }
    })
  }
}
