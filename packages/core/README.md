<h1 align="center">📦 @channel-state/core</h1>

<p align="center">
  <strong>The core, framework-agnostic library for <code>channel-state</code>.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@channel-state/core">
    <img src="https://img.shields.io/npm/v/@channel-state/core.svg" alt="NPM Version" />
  </a>
  <a href="https://www.npmjs.com/package/@channel-state/core">
    <img src="https://img.shields.io/npm/dm/@channel-state/core.svg" alt="NPM Downloads" />
  </a>
  <a href="https://github.com/ronny1020/channel-state/blob/main/packages/core/LICENSE">
    <img src="https://img.shields.io/npm/l/@channel-state/core?label=license&color=blue" alt="License" />
  </a>
</p>

## Overview

`@channel-state/core` is the foundational package of the `channel-state` ecosystem. It provides the `ChannelStore` class, a powerful, zero-dependency solution for state management that works in any JavaScript environment. It enables seamless, real-time state synchronization across browser tabs and windows using the native `BroadcastChannel` and `IndexedDB` APIs.

## Installation

```bash
pnpm add @channel-state/core
```

## CDN Usage

For direct usage in the browser, you can use the UMD build from a CDN like jsDelivr or unpkg:

```html
<script src="https://cdn.jsdelivr.net/npm/@channel-state/core@0"></script>
```

## API Reference

### `ChannelStore<T>`

The primary class for creating and managing a synchronized state.

#### Constructor

`new ChannelStore<T>(options: ChannelStoreOptions<T>)`

| Parameter | Type                  | Description                                           |
| --------- | --------------------- | ----------------------------------------------------- |
| `options` | `ChannelStoreOptions` | An object containing the configuration for the store. |

**`ChannelStoreOptions`**

| Property  | Type      | Required | Default | Description                                                                                                  |
| --------- | --------- | -------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| `name`    | `string`  | Yes      | -       | A unique name for the channel. This is used for the `BroadcastChannel` and as the `IndexedDB` database name. |
| `initial` | `T`       | Yes      | -       | The initial value of the state.                                                                              |
| `persist` | `boolean` | No       | `false` | If `true`, the state will be persisted to `IndexedDB` and restored on initialization.                        |

#### Properties

| Property | Type          | Description                                                                     |
| -------- | ------------- | ------------------------------------------------------------------------------- |
| `status` | `StoreStatus` | The current status of the store: `'initializing'`, `'ready'`, or `'destroyed'`. |

#### Methods

| Method              | Signature                                               | Description                                                                                                                           |
| ------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `get()`             | `(): T`                                                 | Synchronously returns the current state.                                                                                              |
| `set()`             | `(value: T): Promise<void>`                             | Asynchronously sets a new state, broadcasts it to other contexts, and persists it if `persist` is enabled.                            |
| `subscribe()`       | `(callback: (value: T) => void): () => void`            | Subscribes to state changes. The callback receives the new state. Returns an `unsubscribe` function.                                  |
| `subscribeStatus()` | `(callback: (status: StoreStatus) => void): () => void` | Subscribes to store status changes. The callback receives the new status. Returns an `unsubscribe` function.                          |
| `destroy()`         | `(): void`                                              | Closes the `BroadcastChannel` and `IndexedDB` connections and cleans up all subscribers. The store instance cannot be used afterward. |
| `reset()`           | `(): Promise<void>`                                     | Resets the state to its `initial` value and broadcasts the change.                                                                    |

## Example Usage

```typescript
import { ChannelStore } from '@channel-state/core'

// 1. Create a new store instance. This should be done once and shared.
const counterStore = new ChannelStore<number>({
  // A unique name for the channel, used for BroadcastChannel and IndexedDB.
  name: 'shared-counter',
  // The initial state of the store if no persisted state is found.
  initial: 0,
  // Set to true to persist the state to IndexedDB.
  persist: true,
})

// 2. Subscribe to status changes to know when the store is ready.
// This is crucial when `persist` is true, as it takes time to load from IndexedDB.
const unsubscribeStatus = counterStore.subscribeStatus((status) => {
  console.log('Store status is now:', status)

  // 3. Once the store is ready, you can safely interact with it.
  if (status === 'ready') {
    // Get the current state. This will be the persisted value if it exists.
    const currentCount = counterStore.get()
    console.log('Initial or persisted count:', currentCount)

    // Set a new state. This will be broadcast to other tabs.
    counterStore.set(currentCount + 1)
  }
})

// 4. Subscribe to state changes from any tab.
const unsubscribeState = counterStore.subscribe((newCount) => {
  console.log('Count has changed to:', newCount)
  // Here you would typically update your UI.
})

// 5. It's important to clean up when your application or component unmounts.
// The function below should be called from your framework's lifecycle hook
// (e.g., `useEffect` in React, `onUnmounted` in Vue, `onDestroy` in Svelte).
function cleanup() {
  unsubscribeStatus()
  unsubscribeState()
  counterStore.destroy()
}

// The line below is a generic example and is commented out because the specific
// implementation depends on your application's architecture.
// window.addEventListener('beforeunload', cleanup);
```
