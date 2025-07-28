<h1 align="center">🔥 @channel-state/svelte</h1>

<p align="center">
  <strong>Official Svelte stores for <code>channel-state</code>.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@channel-state/svelte">
    <img src="https://img.shields.io/npm/v/@channel-state/svelte.svg" alt="NPM Version" />
  </a>
  <a href="https://www.npmjs.com/package/@channel-state/svelte">
    <img src="https://img.shields.io/npm/dm/@channel-state/svelte.svg" alt="NPM Downloads" />
  </a>
  <a href="https://github.com/ronny1020/channel-state/blob/main/packages/svelte/LICENSE">
    <img src="https://img.shields.io/npm/l/@channel-state/svelte?label=license&color=blue" alt="License" />
  </a>
</p>

## 📖 Overview

`@channel-state/svelte` provides a set of idiomatic Svelte stores for integrating `channel-state` into your Svelte applications. It makes it easy to create reactive, synchronized user interfaces that work across multiple browser contexts.

## 🛠️ Installation

```bash
pnpm add @channel-state/core @channel-state/svelte
```

## 🌐 CDN Usage

For direct usage in the browser, you can use the UMD builds from a CDN like jsDelivr or unpkg. Note that you must also include the `svelte` and `@channel-state/core` packages.

```html
<script src="https://cdn.jsdelivr.net/npm/svelte@4/internal/index.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@channel-state/core@0"></script>
<script src="https://cdn.jsdelivr.net/npm/@channel-state/svelte@0"></script>
```

## 📚 API Reference

### `useChannelState<T>`

A Svelte `writable` store that is connected to a `ChannelStore`'s state.

| Parameter      | Type              | Description                                |
| -------------- | ----------------- | ------------------------------------------ |
| `channelStore` | `ChannelStore<T>` | The `ChannelStore` instance to connect to. |

| Returns | Type          | Description                                                                                                                 |
| ------- | ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `store` | `Writable<T>` | A Svelte `writable` store. Subscribing to it gives you the current state, and setting its value updates the `ChannelStore`. |

### `useChannelStatus<T>`

A Svelte `readable` store that is connected to a `ChannelStore`'s status.

| Parameter      | Type              | Description                                |
| -------------- | ----------------- | ------------------------------------------ |
| `channelStore` | `ChannelStore<T>` | The `ChannelStore` instance to connect to. |

| Returns | Type                    | Description                                                                                                             |
| ------- | ----------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `store` | `Readable<StoreStatus>` | A Svelte `readable` store that provides the current status of the store: `'initializing'`, `'ready'`, or `'destroyed'`. |

## 🚀 Example Usage

First, create a `ChannelStore` instance and export it. This should be done in a separate `.ts` file to be shared across your components.

```typescript
// src/store.ts
import { ChannelStore } from '@channel-state/core'

export const counterStore = new ChannelStore<number>({
  name: 'shared-counter',
  initial: 0,
  persist: true,
})
```

Now, you can use the Svelte stores in your components:

```svelte
<script lang="ts">
  import { useChannelState, useChannelStatus } from '@channel-state/svelte'
  import { counterStore } from '../store'

  // useChannelState returns a writable Svelte store.
  const count = useChannelState(counterStore)
  // useChannelStatus returns a readable Svelte store for the status.
  const status = useChannelStatus(counterStore)

  // You can interact with the store using the `$` prefix.
  function increment() {
    $count++
  }

  function decrement() {
    $count--
  }

  // You can also call methods directly on the original store instance.
  function reset() {
    counterStore.reset()
  }
</script>

<!-- It's good practice to handle the initializing state -->
{#if $status !== 'ready'}
  <div>Loading state...</div>
{:else}
  <div>
    <h2>Counter</h2>
    <p>Current count: {$count}</p>
    <button on:click={increment}>Increment</button>
    <button on:click={decrement}>Decrement</button>
    <button on:click={reset}>Reset to Initial</button>
  </div>
{/if}
```
