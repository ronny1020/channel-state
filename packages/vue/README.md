<h1 align="center">💚 @channel-state/vue</h1>

<p align="center">
  <strong>Official Vue Composables for <code>channel-state</code>.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@channel-state/vue">
    <img src="https://img.shields.io/npm/v/@channel-state/vue.svg" alt="NPM Version" />
  </a>
  <a href="https://www.npmjs.com/package/@channel-state/vue">
    <img src="https://img.shields.io/npm/dm/@channel-state/vue.svg" alt="NPM Downloads" />
  </a>
  <a href="https://github.com/ronny1020/channel-state/blob/main/packages/vue/LICENSE">
    <img src="https://img.shields.io/npm/l/@channel-state/vue?label=license&color=blue" alt="License" />
  </a>
</p>

## 📖 Overview

`@channel-state/vue` provides a set of idiomatic Vue Composition API composables for integrating `channel-state` into your Vue 3 applications. It makes it easy to create reactive, synchronized user interfaces that work across multiple browser contexts.

## 🛠️ Installation

<details>
<summary>npm</summary>

```bash
npm install @channel-state/core @channel-state/vue
```

</details>

<details>
<summary>yarn</summary>

```bash
yarn add @channel-state/core @channel-state/vue
```

</details>

<details>
<summary>pnpm</summary>

```bash
pnpm add @channel-state/core @channel-state/vue
```

</details>

<details>
<summary>bun</summary>

```bash
bun add @channel-state/core @channel-state/vue
```

</details>

## 🌐 CDN Usage

For direct usage in the browser, you can use the UMD builds from a CDN like jsDelivr or unpkg. Note that you must also include the `vue` and `@channel-state/core` packages.

```html
<script src="https://cdn.jsdelivr.net/npm/vue@3"></script>
<script src="https://cdn.jsdelivr.net/npm/@channel-state/core@0"></script>
<script src="https://cdn.jsdelivr.net/npm/@channel-state/vue@0"></script>
```

## 📚 API Reference

### `useChannelState<T>`

A Vue `ref` that is connected to a `ChannelStore`'s state.

| Parameter | Type              | Description                                |
| --------- | ----------------- | ------------------------------------------ |
| `store`   | `ChannelStore<T>` | The `ChannelStore` instance to connect to. |

| Returns | Type     | Description                                                                                                 |
| ------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `ref`   | `Ref<T>` | A Vue `ref`. Its `.value` property holds the current state, and updating it will update the `ChannelStore`. |

### `useChannelStatus<T>`

A Vue `ref` that is connected to a `ChannelStore`'s status.

| Parameter | Type              | Description                                |
| --------- | ----------------- | ------------------------------------------ |
| `store`   | `ChannelStore<T>` | The `ChannelStore` instance to connect to. |

| Returns | Type               | Description                                                                                                               |
| ------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `ref`   | `Ref<StoreStatus>` | A Vue `ref` whose `.value` property holds the current status of the store: `'initializing'`, `'ready'`, or `'destroyed'`. |

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

Now, you can use the composables in your Vue components:

```vue
<script setup lang="ts">
import { useChannelState, useChannelStatus } from '@channel-state/vue'
import { counterStore } from '../store'

// useChannelState returns a reactive Vue ref.
const count = useChannelState(counterStore)
// useChannelStatus returns a reactive Vue ref for the status.
const status = useChannelStatus(counterStore)

// You can interact with the ref's .value property.
function increment() {
  count.value++
}

function decrement() {
  count.value--
}

// You can also call methods directly on the original store instance.
function reset() {
  counterStore.reset()
}
</script>

<template>
  <!-- It's good practice to handle the initializing state -->
  <div v-if="status !== 'ready'">Loading state...</div>
  <div v-else>
    <h2>Counter</h2>
    <p>Current count: {{ count }}</p>
    <button @click="increment">Increment</button>
    <button @click="decrement">Decrement</button>
    <button @click="reset">Reset to Initial</button>
  </div>
</template>
```
