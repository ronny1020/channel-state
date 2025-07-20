## `@channel-state/core`

`@channel-state/core` stands as the robust, foundational layer of `channel-state`. It introduces the powerful `ChannelStore` class, a meticulously engineered, zero-dependency state management solution. This core package empowers developers to achieve seamless, real-time state synchronization across disparate browser tabs, windows, and even diverse JavaScript frameworks. By intelligently leveraging the browser's native `BroadcastChannel` and `IndexedDB` APIs, `@channel-state/core` delivers an exceptionally reliable and persistent state management experience, forming the bedrock for highly interactive and consistent web applications.

### Features

- **Cross-tab and Cross-window State Sync:** Automatically synchronizes state across all open tabs and windows of the same origin.
- **Persistent State:** Optionally persist state to `IndexedDB`, so your application's state is restored after a page reload or even when the browser is restarted.
- **Framework Agnostic:** The core library is written in plain TypeScript and can be used in any JavaScript project.
- **Lightweight and Zero-dependency:** The core library has no external dependencies, keeping your bundle size small.

### `ChannelStore` Class

The `ChannelStore` class is the core of the `channel-state` library. It allows you to create and manage a state that can be shared and synchronized across multiple browser contexts.

#### Constructor

`new ChannelStore<T>(options: ChannelStoreOptions<T>)`

Creates a new `ChannelStore` instance.

- `options`: An object with the following properties:
  - `name: string` (required): A unique name for the channel. This name is used for both `BroadcastChannel` and `IndexedDB`.
  - `initial: T` (required): The initial state of the store.
  - `persist?: boolean` (optional): Whether the store should persist its state to `IndexedDB`. Defaults to `false`.

#### Properties

- `status: StoreStatus`: The current status of the store, indicating its readiness and lifecycle phase. Possible values are `'initializing'`, `'ready'`, and `'destroyed'`.

#### Methods

- `get(): T`
  Synchronously retrieves the current state from the store.

- `set(value: T): Promise<void>`
  Sets a new value for the store's state. This updates the value, broadcasts the change to other tabs/windows, and optionally persists it to `IndexedDB` asynchronously.

- `subscribe(callback: (value: T) => void): () => void`
  Subscribes a callback function to state changes. The callback will be invoked whenever the state changes.
  Returns an unsubscribe function that can be called to stop receiving updates.

- `subscribeStatus(callback: (status: StoreStatus) => void): () => void`
  Subscribes a callback function to status changes of the store. The callback will be invoked when the store's status changes (e.g., from 'initial' to 'ready').
  Returns an unsubscribe function that can be called to stop receiving status updates.

- `destroy(): void`
  Cleans up resources used by the `ChannelStore`, including closing the `BroadcastChannel` and `IndexedDB` connection, and clearing all subscribers. After calling `destroy()`, the store can no longer be used.

- `reset(): Promise<void>`
  Resets the store's state to its initial value. This also triggers a change notification and persists the reset state if persistence is enabled.

### Example Usage

```typescript
import { ChannelStore } from '@channel-state/core'

const countStore = new ChannelStore<number>({
  name: 'count', // A unique name for the channel
  initial: 0, // The initial state
  persist: true, // (Optional) Whether to persist the state to IndexedDB
})

// Get the current state
const currentCount = countStore.get()

// Set a new state
countStore.set(currentCount + 1)

// Subscribe to state changes
const unsubscribe = countStore.subscribe((newCount) => {
  console.log('Count changed:', newCount)
})

// Unsubscribe when you're done
unsubscribe()

// Subscribe to status changes
const unsubscribeStatus = countStore.subscribeStatus((status) => {
  console.log('Store status:', status)
})

// Reset the store
countStore.reset()

// Destroy the store
countStore.destroy()
```
