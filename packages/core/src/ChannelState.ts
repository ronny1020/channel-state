type StoreChangeCallback = () => void

interface ChannelStoreOptions<T extends Record<string, any>> {
  name: string // required
  persist?: boolean // default true
  initial: T // required
}

export class ChannelStore<T extends Record<string, any>> {
  private _db: IDBDatabase | null = null
  private _subscribers = new Map<keyof T, Set<StoreChangeCallback>>()
  private _cache: Partial<T> = {}
  private readonly _name: string
  private readonly _persist: boolean
  private readonly _initial: T
  private readonly _channel: BroadcastChannel

  constructor(options: ChannelStoreOptions<T>) {
    this._name = options.name
    this._persist = options.persist ?? true
    this._initial = options.initial

    this._channel = new BroadcastChannel(`__${this._name}`)
    this._channel.addEventListener('message', this._handleBroadcast)

    this._initDB()
  }

  private _initDB() {
    if (!this._persist) {
      // Use in-memory cache only; initialize cache with initial values
      this._cache = { ...this._initial }
      return
    }

    const request = indexedDB.open(this._name, 1)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(this._name)) {
        db.createObjectStore(this._name)
      }
    }

    request.onsuccess = () => {
      this._db = request.result
      this._loadCacheFromDB()
    }

    request.onerror = () => {
      console.error('IndexedDB init failed:', request.error)
      // fallback to initial values cache
      this._cache = { ...this._initial }
    }
  }

  private _loadCacheFromDB() {
    if (!this._db) return

    const tx = this._db.transaction(this._name, 'readonly')
    const store = tx.objectStore(this._name)

    const keys = Object.keys(this._initial) as (keyof T)[]
    let loadedCount = 0

    keys.forEach((key) => {
      const req = store.get(key as string)
      req.onsuccess = () => {
        const val = req.result
        if (val === undefined) {
          // No stored value, fallback to initial
          this._cache[key] = this._initial[key]
          if (this._persist && this._db) {
            // Save initial value to DB
            this.set(key, this._initial[key])
          }
        } else {
          this._cache[key] = val
        }
        loadedCount++
        if (loadedCount === keys.length) {
          // All keys loaded, optionally notify subscribers here if needed
        }
      }
      req.onerror = () => {
        this._cache[key] = this._initial[key]
        loadedCount++
      }
    })
  }

  private _handleBroadcast = (e: MessageEvent) => {
    const key = e.data as keyof T
    this._notifySubscribers(key)
  }

  private _notifySubscribers(key: keyof T) {
    const subs = this._subscribers.get(key)
    if (subs) {
      for (const cb of subs) cb()
    }
  }

  private _triggerChange(key: keyof T) {
    this._channel.postMessage(key)
    this._notifySubscribers(key)
  }

  /**
   * Synchronous getter from cache
   */
  get<K extends keyof T>(key: K): T[K] {
    if (key in this._cache) {
      return this._cache[key] as T[K]
    }
    // fallback if cache is empty for some reason
    return this._initial[key]
  }

  /**
   * Set value, update cache and optionally IndexedDB asynchronously
   */
  async set<K extends keyof T>(key: K, value: T[K]): Promise<void> {
    this._cache[key] = value

    if (!this._persist || !this._db) {
      this._triggerChange(key)
      return
    }

    return new Promise((resolve, reject) => {
      const tx = this._db!.transaction(this._name, 'readwrite')
      const store = tx.objectStore(this._name)
      const req = store.put(value, key as string)

      req.onsuccess = () => {
        this._triggerChange(key)
        resolve()
      }
      req.onerror = () => reject(req.error)
    })
  }

  async delete<K extends keyof T>(key: K): Promise<void> {
    delete this._cache[key]

    if (!this._persist || !this._db) {
      this._triggerChange(key)
      return
    }

    return new Promise((resolve, reject) => {
      const tx = this._db!.transaction(this._name, 'readwrite')
      const store = tx.objectStore(this._name)
      const req = store.delete(key as string)

      req.onsuccess = () => {
        this._triggerChange(key)
        resolve()
      }
      req.onerror = () => reject(req.error)
    })
  }

  subscribe<K extends keyof T>(
    key: K,
    callback: StoreChangeCallback,
  ): () => void {
    if (!this._subscribers.has(key)) {
      this._subscribers.set(key, new Set())
    }
    this._subscribers.get(key)!.add(callback)

    return () => {
      this._subscribers.get(key)!.delete(callback)
    }
  }

  destroy() {
    this._channel.close()
    this._subscribers.clear()
    this._db?.close()
  }
}
