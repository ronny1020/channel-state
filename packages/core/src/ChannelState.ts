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
 */
export class ChannelStore<T> {
  private _db: IDBDatabase | null = null
  private _subscribers = new Set<StoreChangeCallback<T>>()
  private _value: T
  private readonly _name: string
  private readonly _persist: boolean
  private readonly _initial: T
  private readonly _channel: BroadcastChannel
  private readonly _dbKey = 'state' // Fixed key for storing the single state object
  private readonly _prefixedName: string
  private _instanceId: string
  private _isInitialized: boolean = false

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
      this._isInitialized = true
    }

    request.onerror = () => {
      console.error('IndexedDB init failed:', request.error)
      this._isInitialized = true // Fallback to initial values cache
    }
  }

  private _loadCacheFromDB() {
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
        this._notifySubscribers()
        this._isInitialized = true
      }
    }
    req.onerror = () => {
      // If IndexedDB read fails, request from other tabs
      this._requestInitialStateFromOtherTabs()
    }
  }

  private _requestInitialStateFromOtherTabs() {
    this._channel.postMessage({
      type: 'STATE_REQUEST',
      senderId: this._instanceId,
    })

    setTimeout(() => {
      if (!this._isInitialized) {
        this._notifySubscribers()
      }
    }, 500) // Wait for 500ms for a response
  }

  /**
   * Handles messages received from the BroadcastChannel, updating the cache and notifying subscribers.
   * @param e The MessageEvent containing the broadcasted data.
   * @private
   */
  private _handleBroadcast = (e: MessageEvent) => {
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
      this._value = message.payload
      this._isInitialized = true
      this._notifySubscribers()
    }
  }

  /**
   * Notifies all registered subscribers about a change in the store's state.
   * @private
   */
  private _notifySubscribers() {
    this._subscribers.forEach((subscriber) => subscriber(this._value))
  }

  /**
   * Triggers a change notification by posting the current cache to the BroadcastChannel
   * and notifying local subscribers.
   * @private
   */
  private _triggerChange() {
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
    this._value = value

    if (!this._persist || !this._db) {
      this._triggerChange()
      return
    }

    return new Promise((resolve, reject) => {
      const tx = this._db!.transaction(this._prefixedName, 'readwrite')
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
    this._subscribers.add(callback)

    return () => {
      this._subscribers.delete(callback)
    }
  }

  /**
   * Cleans up resources used by the ChannelStore, including closing the BroadcastChannel
   * and IndexedDB connection, and clearing subscribers.
   */
  destroy() {
    this._channel.close()
    this._subscribers.clear()
    this._db?.close()
  }
}
