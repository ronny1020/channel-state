# channel-state

`channel-state` is a lightweight, zero-dependency state management library that enables seamless state sharing across different browser tabs, windows, and even different JavaScript frameworks. It leverages the power of the browser's native `BroadcastChannel` and `IndexedDB` APIs to provide a robust and persistent state management solution.

## Features

- **Cross-tab and Cross-window State Sync:** Automatically synchronizes state across all open tabs and windows of the same origin.
- **Persistent State:** Optionally persist state to `IndexedDB`, so your application's state is restored after a page reload or even when the browser is restarted.
- **Framework Agnostic:** The core library is written in plain TypeScript and can be used in any JavaScript project.
- **Official Framework Wrappers:** Provides easy-to-use wrappers for popular frameworks like React, Vue, and Svelte.
- **Lightweight and Zero-dependency:** The core library has no external dependencies, keeping your bundle size small.

## Installation

You can install `channel-state` and its framework-specific packages using your favorite package manager:

```bash
# For the core library
pnpm add @channel-state/core

# For React
pnpm add @channel-state/core @channel-state/react

# For Vue
pnpm add @channel-state/core @channel-state/vue

# For Svelte
pnpm add @channel-state/core @channel-state/svelte
```

## Usage

### Core (`@channel-state/core`)

The core package provides the `ChannelStore` class, which is the foundation of `channel-state`.

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
```

### React (`@channel-state/react`)

The React package provides a `useChannelState` hook that makes it easy to integrate `channel-state` with your React components.

```tsx
import { ChannelStore } from '@channel-state/core'
import { useChannelState } from '@channel-state/react'

const countStore = new ChannelStore<number>({
  name: 'count',
  initial: 0,
  persist: true,
})

function Counter() {
  const [count, setCount] = useChannelState(countStore)

  return (
    <button onClick={() => setCount((count ?? 0) + 1)}>
      Count: {count ?? 0}
    </button>
  )
}
```

### Vue (`@channel-state/vue`)

The Vue package provides a `useChannelState` composable that returns a reactive `ref`.

```vue
<script setup lang="ts">
import { ChannelStore } from '@channel-state/core'
import { useChannelState } from '@channel-state/vue'

const countStore = new ChannelStore<number>({
  name: 'count',
  initial: 0,
  persist: true,
})

const count = useChannelState(countStore)
</script>

<template>
  <button @click="count++">Count: {{ count }}</button>
</template>
```

### Svelte (`@channel-state/svelte`)

The Svelte package provides a `useChannelState` function that returns a Svelte store.

```svelte
<script lang="ts">
  import { ChannelStore } from '@channel-state/core';
  import { useChannelState } from '@channel-state/svelte';

  const countStore = new ChannelStore<number>({
    name: 'count',
    initial: 0,
    persist: true,
  });

  const count = useChannelState(countStore);

  function increment() {
    $count++;
  }
</script>

<button on:click={increment}>Count: {$count}</button>
```

## License

MIT
