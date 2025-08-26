<h1 align="center">⚛️ @channel-state/react</h1>

<p align="center">
  <strong>Official React hooks for <code>channel-state</code>.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@channel-state/react">
    <img src="https://img.shields.io/npm/v/@channel-state/react.svg" alt="NPM Version" />
  </a>
  <a href="https://www.npmjs.com/package/@channel-state/react">
    <img src="https://img.shields.io/npm/dm/@channel-state/react.svg" alt="NPM Downloads" />
  </a>
  <a href="https://github.com/ronny1020/channel-state/blob/main/packages/react/LICENSE">
    <img src="https://img.shields.io/npm/l/@channel-state/react?label=license&color=blue" alt="License" />
  </a>
</p>

## 📖 Overview

`@channel-state/react` provides a set of idiomatic React hooks for integrating `channel-state` into your React applications. It uses the `useSyncExternalStore` hook to ensure efficient, concurrent-safe updates, making it easy to build responsive and synchronized user interfaces.

## 🛠️ Installation

<details>
<summary>npm</summary>

```bash
npm install @channel-state/core @channel-state/react
```

</details>

<details>
<summary>yarn</summary>

```bash
yarn add @channel-state/core @channel-state/react
```

</details>

<details>
<summary>pnpm</summary>

```bash
pnpm add @channel-state/core @channel-state/react
```

</details>

<details>
<summary>bun</summary>

```bash
bun add @channel-state/core @channel-state/react
```

</details>

## 🌐 CDN Usage

For direct usage in the browser, you can use the UMD builds from a CDN like jsDelivr or unpkg. Note that you must also include the `react`, `react-dom`, and `@channel-state/core` packages.

```html
<script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@channel-state/core@0"></script>
<script src="https://cdn.jsdelivr.net/npm/@channel-state/react@0"></script>
```

## 🚀 Playground

Explore and experiment with `@channel-state/react` in a live environment using our interactive playground.

- **[React Channel State Demo](https://stackblitz.com/edit/vitejs-vite-bez3gkrn)**

This playground provides a simple example of how to use `@channel-state/core` and `@channel-state/react` together.

> **Note:** To see the cross-tab state synchronization in action, open the preview in a new tab.

## 📚 API Reference

### `useChannelState<T>`

A hook for accessing and updating a `ChannelStore`'s state.

| Parameter | Type              | Description                                |
| --------- | ----------------- | ------------------------------------------ |
| `store`   | `ChannelStore<T>` | The `ChannelStore` instance to connect to. |

| Returns    | Type                    | Description                                                                                     |
| ---------- | ----------------------- | ----------------------------------------------------------------------------------------------- |
| `state`    | `T`                     | The current state of the store.                                                                 |
| `setState` | `(newValue: T) => void` | A function to update the state of the store. This is a wrapper around the store's `set` method. |

### `useChannelStatus<T>`

A hook for accessing the status of a `ChannelStore`.

| Parameter | Type              | Description                                |
| --------- | ----------------- | ------------------------------------------ |
| `store`   | `ChannelStore<T>` | The `ChannelStore` instance to connect to. |

| Returns  | Type          | Description                                                                     |
| -------- | ------------- | ------------------------------------------------------------------------------- |
| `status` | `StoreStatus` | The current status of the store: `'initializing'`, `'ready'`, or `'destroyed'`. |

## 🚀 Example Usage

First, create a `ChannelStore` instance and export it. This should be done in a separate file to be shared across your components.

```typescript
// src/store.ts
import { ChannelStore } from '@channel-state/core'

export const counterStore = new ChannelStore<number>({
  name: 'shared-counter',
  initial: 0,
  persist: true,
})
```

Now, you can use the hooks in your React components:

```tsx
// src/components/Counter.tsx
import React, { useEffect } from 'react'
import { useChannelState, useChannelStatus } from '@channel-state/react'
import { counterStore } from '../store'

function Counter() {
  // useChannelState provides the current state and a setter function.
  const [count, setCount] = useChannelState(counterStore)
  // useChannelStatus provides the current status of the store.
  const status = useChannelStatus(counterStore)

  // It's good practice to handle the initializing state,
  // especially when persistence is enabled.
  if (status !== 'ready') {
    return <div>Loading state...</div>
  }

  return (
    <div>
      <h2>Counter</h2>
      <p>Current count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
      {/* You can still call store methods directly */}
      <button onClick={() => counterStore.reset()}>Reset to Initial</button>
    </div>
  )
}

export default Counter
```
