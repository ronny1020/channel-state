<script setup lang="ts">
import { ChannelStore } from '@channel-state/core'
import { useChannelState } from '@channel-state/vue'

const countStore = new ChannelStore<number>({
  name: 'count',
  initial: 0,
})

const count = useChannelState(countStore)

const increment = () => {
  count.value++
}
</script>

<template>
  <div>
    <h1>Vue App Example</h1>
    <p>Count: {{ count ?? 0 }}</p>
    <button @click="increment()">Increment</button>
  </div>
</template>
