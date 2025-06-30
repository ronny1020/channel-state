/**
 * Represents the status of the ChannelStore.
 * - 'init': The store is initializing.
 * - 'ready': The store is ready to be used.
 * - 'destroyed': The store has been destroyed.
 */
export type StoreStatus = 'initial' | 'ready' | 'destroyed'

/**
 * Callback function type for store status changes.
 */
export type StoreStatusCallback = (status: StoreStatus) => void

/**
 * Callback function type for store changes.
 */
type StoreChangeCallback<T> = (value: T) => void

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
  private _instanceId: string
  private _initialStateRequestTimeout: ReturnType<typeof setTimeout> | null =
    null

  /**
   * The current status of the store.
   */
  status: StoreStatus = 'initial'

  /**
   * Creates an instance of ChannelStore.
   * @param options The options for configuring the store.
   */
  constructor(options: ChannelStoreOptions<T>) {
    this._name = options.name
    this._persist = options.persist ?? false
    this._initial = options.initial
    this._prefixedName = `channel-state__${this._name}`
    this._instanceId = crypto.randomUUID()

    this._value = structuredClone(this._initial)

    this._channel = new BroadcastChannel(this._prefixedName)
    this._channel.addEventListener('message', this._handleBroadcast)

    if (this._persist) {
      this._initDB()
    } else {
      this._requestInitialStateFromOtherTabs()
    }
  }

  private _initDB() {
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
      this.status = 'ready' // Fallback to initial values cache
      this._notifyStatusSubscribers()
    }
  }

  private _loadCacheFromDB() {
    if (this.status === 'destroyed') {
      return
    }
    if (!this._db) return

    const tx = this._db.transaction(this._prefixedName, 'readonly')
    const store = tx.objectStore(this._prefixedName)

    const req = store.get(this._dbKey)
    req.onsuccess = () => {
      const val = req.result
      if (val === undefined) {
        // If no stored value, request from other tabs first
        this._requestInitialStateFromOtherTabs()
      } else {
        this._value = val
        this.status = 'ready'
        this._notifySubscribers()
        this._notifyStatusSubscribers()
      }
    }
    req.onerror = () => {
      // If IndexedDB read fails, request from other tabs
      this._requestInitialStateFromOtherTabs()
    }
  }

  private _requestInitialStateFromOtherTabs() {
    if (this.status === 'destroyed') {
      return
    }
    this._channel.postMessage({
      type: 'STATE_REQUEST',
      senderId: this._instanceId,
    })

    this._initialStateRequestTimeout = setTimeout(() => {
      if (this.status !== 'ready') {
        this.status = 'ready'
        this._notifySubscribers()
        this._notifyStatusSubscribers()
      }
      this._initialStateRequestTimeout = null
    }, 500) // Wait for 500ms for a response
  }

  /**
   * Handles messages received from the BroadcastChannel, updating the cache and notifying subscribers.
   * @param e The MessageEvent containing the broadcasted data.
   * @private
   */
  private _handleBroadcast = (e: MessageEvent) => {
    if (this.status === 'destroyed') {
      return
    }

    const message = e.data

    if (message.senderId === this._instanceId) {
      return // Ignore messages from self
    }

    if (message.type === 'STATE_REQUEST') {
      this._channel.postMessage({
        type: 'STATE_UPDATE',
        payload: this._value,
        senderId: this._instanceId,
      })
    } else if (message.type === 'STATE_UPDATE') {
      if (this._initialStateRequestTimeout) {
        clearTimeout(this._initialStateRequestTimeout)
        this._initialStateRequestTimeout = null
      }
      this._value = message.payload
      this.status = 'ready'
      this._notifySubscribers()
      this._notifyStatusSubscribers()
    }
  }

  /**
   * Notifies all registered subscribers about a change in the store's state.
   * @private
   */
  private _notifySubscribers() {
    this._subscribers.forEach((subscriber) => subscriber(this._value))
  }

  private _notifyStatusSubscribers() {
    console.log('ChannelStore: Notifying status subscribers with:', this.status)
    this._statusSubscribers.forEach((subscriber) => subscriber(this.status))
  }

  /**
   * Triggers a change notification by posting the current cache to the BroadcastChannel
   * and notifying local subscribers.
   * @private
   */
  private _triggerChange() {
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
   * Sets the new value for the store's state, updates the value, and optionally persists it to IndexedDB asynchronously.
   * @param value The new state value to set.
   * @returns A Promise that resolves when the state has been set and persisted (if applicable).
   */
  async set(value: T): Promise<void> {
    if (this.status === 'destroyed') {
      return
    }
    this._value = value

    if (!this._persist || this._db === null) {
      this._triggerChange()
      return
    }

    const db = this._db
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this._prefixedName, 'readwrite')
      const store = tx.objectStore(this._prefixedName)
      const req = store.put(value, this._dbKey)

      req.onsuccess = () => {
        this._triggerChange()
        resolve()
      }
      req.onerror = () => reject(req.error)
    })
  }

  /**
   * Subscribes a callback function to state changes.
   * @param callback The function to call when the state changes.
   * @returns A function that can be called to unsubscribe the callback.
   */
  subscribe(callback: StoreChangeCallback<T>): () => void {
    if (this.status === 'destroyed') {
      return () => {}
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
      return () => {}
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
  destroy() {
    if (this.status === 'destroyed') {
      return
    }
    this.status = 'destroyed'
    this._notifySubscribers()
    this._notifyStatusSubscribers()
    this._channel.close()
    this._subscribers.clear()
    this._statusSubscribers.clear()
    this._db?.close()
    if (this._initialStateRequestTimeout) {
      clearTimeout(this._initialStateRequestTimeout)
      this._initialStateRequestTimeout = null
    }
  }

  /**
   * Resets the store's state to its initial value.
   * @returns A Promise that resolves when the state has been reset.
   */
  async reset(): Promise<void> {
    if (this.status === 'destroyed') {
      return
    }
    this._value = structuredClone(this._initial)
    this._triggerChange()
    return Promise.resolve()
  }
}
