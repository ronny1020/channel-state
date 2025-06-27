<script lang="ts">
  import { ChannelStore } from '@channel-state/core'
  import { useChannelState } from '@channel-state/svelte'

  const countStore = new ChannelStore<number>({
    name: 'count',
    initial: 0,
  })

  const count = useChannelState(countStore)

  function increment() {
    count.set($count + 1)
  }
</script>

<main>
  <h1>Svelte App Example</h1>
  <p>Count: {$count ?? 0}</p>
  <button on:click={increment}>Increment</button>
</main>
