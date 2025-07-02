## `@channel-state/react`

`@channel-state/react` delivers a powerful suite of React hooks meticulously designed to streamline the integration of `channel-state` into your React applications. By harnessing React's `useSyncExternalStore`, it ensures highly efficient and concurrent-safe state management, guaranteeing that your components react seamlessly to state changes across all tabs and windows. This package empowers you to build sophisticated, multi-instance React applications with unparalleled state consistency and developer experience.

### Features

- **React Hooks:** Provides idiomatic React hooks (`useChannelState` and `useChannelStatus`) for easy state and status management.
- **Efficient Updates:** Utilizes `useSyncExternalStore` for optimal performance and compatibility with React's concurrent mode.
- **Seamless Integration:** Designed to work effortlessly with your existing React components and the `@channel-state/core` library.

### Installation

You can install `@channel-state/react` using your favorite package manager:

```bash
pnpm add @channel-state/core @channel-state/react
# or
npm install @channel-state/core @channel-state/react
# or
yarn add @channel-state/core @channel-state/react
```

### API

#### `useChannelState<T>(store: ChannelStore<T>): readonly [T, (newValue: T) => void]`

A React hook that provides access to a `ChannelStore`'s state and a setter function. It uses `useSyncExternalStore` for efficient and concurrent-safe updates.

- `store`: The `ChannelStore` instance to connect to.
- **Returns:** A tuple containing:
  - The current state of the `ChannelStore`.
  - A function to update the state of the `ChannelStore`.

##### Example

```tsx
import { useChannelState } from '@channel-state/react'
import { ChannelStore } from '@channel-state/core'

const countStore = new ChannelStore<number>({ name: 'count', initial: 0 })

function Counter() {
  const [count, setCount] = useChannelState(countStore)
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>
}
```

#### `useChannelStatus<T>(store: ChannelStore<T>): StoreStatus`

A React hook that provides access to a `ChannelStore`'s status. It uses `useSyncExternalStore` for efficient and concurrent-safe updates.

- `store`: The `ChannelStore` instance to connect to.
- **Returns:** The current status of the store (`'initial'`, `'ready'`, or `'destroyed'`).

##### Example

```tsx
import { useChannelStatus } from '@channel-state/react'
import { ChannelStore } from '@channel-state/core'

const countStore = new ChannelStore<number>({ name: 'count', initial: 0 })

function StatusDisplay() {
  const status = useChannelStatus(countStore)
  return <p>Status: {status}</p>
}
```
