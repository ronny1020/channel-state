## `@channel-state/vue`

`@channel-state/vue` offers a comprehensive set of Vue Composition API composables, expertly crafted to simplify the integration of `channel-state` with your Vue 3 applications. It provides reactive references to your `ChannelStore`'s state and status, ensuring flawless, real-time synchronization across diverse browser contexts. This package empowers Vue developers to build dynamic, multi-instance applications with inherent state consistency and an enhanced development workflow.

### Features

- **Vue Composables:** Provides idiomatic Vue Composition API composables (`useChannelState` and `useChannelStatus`) for easy state and status management.
- **Reactivity:** The state and status returned are Vue `ref`s, ensuring full reactivity within your Vue components.
- **Seamless Integration:** Designed to work effortlessly with your existing Vue components and the `@channel-state/core` library.

### Installation

You can install `@channel-state/vue` using your favorite package manager:

```bash
pnpm add @channel-state/core @channel-state/vue
# or
npm install @channel-state/core @channel-state/vue
# or
yarn add @channel-state/core @channel-state/vue
```

### API

#### `useChannelState<T>(store: ChannelStore<T>): Ref<T>`

A Vue Composition API hook that provides a reactive reference to a `ChannelStore`'s state. The returned `Ref` can be used directly in Vue templates and will automatically update when the store's state changes (either locally or from other tabs/windows).

- `store`: The `ChannelStore` instance to connect to.
- **Returns:** A `Ref` object that represents the current state of the `ChannelStore`. Assigning a new value to this `Ref` will update the `ChannelStore`'s state.

##### Example

```vue
<script setup lang="ts">
import { useChannelState } from '@channel-state/vue'
import { ChannelStore } from '@channel-state/core'

const countStore = new ChannelStore<number>({ name: 'count', initial: 0 })
const count = useChannelState(countStore)
</script>

<template>
  <button @click="count++">Count: {{ count }}</button>
</template>
```

#### `useChannelStatus<T>(store: ChannelStore<T>): Ref<StoreStatus>`

A Vue Composition API hook that provides a reactive reference to a `ChannelStore`'s status. The returned `Ref` reflects the current lifecycle status of the `ChannelStore`.

- `store`: The `ChannelStore` instance to connect to.
- **Returns:** A `Ref` object that represents the current status of the `ChannelStore` (`'initializing'`, `'ready'`, or `'destroyed'`).

##### Example

```vue
<script setup lang="ts">
import { useChannelStatus } from '@channel-state/vue'
import { ChannelStore } from '@channel-state/core'

const countStore = new ChannelStore<number>({ name: 'count', initial: 0 })
const status = useChannelStatus(countStore)
</script>

<template>
  <p>Status: {{ status }}</p>
</template>
```
