## `@channel-state/svelte`

`@channel-state/svelte` delivers a robust collection of Svelte stores, meticulously designed to simplify the integration of `channel-state` with your Svelte applications. It provides highly reactive and intuitive readable and writable stores for your `ChannelStore`'s state and status, ensuring seamless, real-time synchronization across all browser contexts. This package empowers Svelte developers to build dynamic, multi-instance applications with inherent state consistency and a significantly enhanced development experience.

### Features

- **Svelte Stores:** Provides idiomatic Svelte stores (`useChannelState` and `useChannelStatus`) for easy state and status management.
- **Reactivity:** The state and status returned are Svelte stores, ensuring full reactivity within your Svelte components.
- **Seamless Integration:** Designed to work effortlessly with your existing Svelte components and the `@channel-state/core` library.

### Installation

You can install `@channel-state/svelte` using your favorite package manager:

```bash
pnpm add @channel-state/core @channel-state/svelte
# or
npm install @channel-state/core @channel-state/svelte
# or
yarn add @channel-state/core @channel-state/svelte
```

### API

#### `useChannelState<T>(channelStore: ChannelStore<T>): Writable<T>`

A Svelte store that provides access to a `ChannelStore`'s state. The returned store is both readable and writable. Updates to the store will update the underlying `ChannelStore`, and changes in the `ChannelStore` (from other tabs/windows or local updates) will update the Svelte store.

- `channelStore`: The `ChannelStore` instance to connect to.
- **Returns:** A Svelte `Writable` store that represents the current state of the `ChannelStore`.

##### Example

```svelte
<script lang="ts">
  import { useChannelState } from '@channel-state/svelte'
  import { ChannelStore } from '@channel-state/core'

  const countStore = new ChannelStore<number>({ name: 'count', initial: 0 })
  const count = useChannelState(countStore)

  function increment() {
    $count++
  }
</script>

<button on:click={increment}>Count: {$count}</button>
```

#### `useChannelStatus<T>(channelStore: ChannelStore<T>): Readable<StoreStatus>`

A Svelte store that provides access to a `ChannelStore`'s status.

- `channelStore`: The `ChannelStore` instance to connect to.
- **Returns:** A Svelte `Readable` store that represents the current status of the `ChannelStore` (`'initializing'`, `'ready'`, or `'destroyed'`).

##### Example

```svelte
<script lang="ts">
  import { useChannelStatus } from '@channel-state/svelte'
  import { ChannelStore } from '@channel-state/core'

  const countStore = new ChannelStore<number>({ name: 'count', initial: 0 })
  const status = useChannelStatus(countStore)
</script>

<p>Status: {$status}</p>
```
