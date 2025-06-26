/**
 * Callback function type for store changes.
 */
type StoreChangeCallback = () => void

/**
 * Options for configuring a ChannelStore instance.
 * @template T The type of the state managed by the store.
 */
interface ChannelStoreOptions<T> {
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
  private _subscribers = new Set<StoreChangeCallback>()
  private _cache: T
  private readonly _name: string
  private readonly _persist: boolean
  private readonly _initial: T
  private readonly _channel: BroadcastChannel
  private readonly _dbKey = 'state' // Fixed key for storing the single state object
  private readonly _prefixedName: string

  /**
   * Creates an instance of ChannelStore.
   * @param options The options for configuring the store.
   */
  constructor(options: ChannelStoreOptions<T>) {
    this._name = options.name
    this._persist = options.persist ?? false
    this._initial = options.initial
    this._prefixedName = `channel-state__${this._name}`

    this._cache = structuredClone(this._initial)

    this._channel = new BroadcastChannel(this._prefixedName)
    this._channel.addEventListener('message', this._handleBroadcast)

    this._initDB()
  }

  /**
   * Initializes the IndexedDB for persistence if `_persist` is true.
   * @private
   */
  private _initDB() {
    if (!this._persist) {
      // Use in-memory cache only; cache already initialized
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
      // fallback to initial values cache (already set)
    }
  }

  /**
   * Loads the cached state from IndexedDB.
   * @private
   */
  private _loadCacheFromDB() {
    if (!this._db) return

    const tx = this._db.transaction(this._prefixedName, 'readonly')
    const store = tx.objectStore(this._prefixedName)

    const req = store.get(this._dbKey)
    req.onsuccess = () => {
      const val = req.result
      if (val === undefined) {
        // No stored value, fallback to initial
        this._cache = { ...this._initial }
        if (this._persist && this._db) {
          // Save initial value to DB
          this.set(this._initial)
        }
      } else {
        this._cache = val
      }
      this._notifySubscribers()
    }
    req.onerror = () => {
      this._cache = { ...this._initial }
      this._notifySubscribers()
    }
  }

  /**
   * Handles messages received from the BroadcastChannel, updating the cache and notifying subscribers.
   * @param e The MessageEvent containing the broadcasted data.
   * @private
   */
  private _handleBroadcast = (e: MessageEvent) => {
    // Update cache directly with received data
    this._cache = e.data
    this._notifySubscribers()
  }

  /**
   * Notifies all registered subscribers about a change in the store's state.
   * @private
   */
  private _notifySubscribers() {
    for (const cb of this._subscribers) cb()
  }

  /**
   * Triggers a change notification by posting the current cache to the BroadcastChannel
   * and notifying local subscribers.
   * @private
   */
  private _triggerChange() {
    this._channel.postMessage(this._cache)
    this._notifySubscribers()
  }

  /**
   * Synchronously retrieves the current state from the cache.
   * @returns The current state of the store.
   */
  get(): T {
    return this._cache
  }

  /**
   * Sets the new value for the store's state, updates the cache, and optionally persists it to IndexedDB asynchronously.
   * @param value The new state value to set.
   * @returns A Promise that resolves when the state has been set and persisted (if applicable).
   */
  async set(value: T): Promise<void> {
    this._cache = value

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
  subscribe(callback: StoreChangeCallback): () => void {
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
