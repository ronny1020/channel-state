type StoreChangeCallback = () => void

interface ChannelStoreOptions<T> {
  name: string // required
  persist?: boolean // default true
  initial: T // required
}

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

  constructor(options: ChannelStoreOptions<T>) {
    this._name = options.name
    this._persist = options.persist ?? true
    this._initial = options.initial
    this._prefixedName = `channel-state__${this._name}`

    this._cache = { ...this._initial } // Initialize cache with initial values

    this._channel = new BroadcastChannel(this._prefixedName)
    this._channel.addEventListener('message', this._handleBroadcast)

    this._initDB()
  }

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

  private _handleBroadcast = (e: MessageEvent) => {
    // Message indicates a state change, no specific key
    if (e.data === 'state-change') {
      this._notifySubscribers()
    }
  }

  private _notifySubscribers() {
    for (const cb of this._subscribers) cb()
  }

  private _triggerChange() {
    this._channel.postMessage('state-change')
    this._notifySubscribers()
  }

  /**
   * Synchronous getter from cache
   */
  get(): T {
    return this._cache
  }

  /**
   * Set value, update cache and optionally IndexedDB asynchronously
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

  subscribe(callback: StoreChangeCallback): () => void {
    this._subscribers.add(callback)

    return () => {
      this._subscribers.delete(callback)
    }
  }

  destroy() {
    this._channel.close()
    this._subscribers.clear()
    this._db?.close()
  }
}
