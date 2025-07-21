<script lang="ts">
  /*
   * Copyright 2025 ronny1020
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *     http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */
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
  <p>Count: {$count}</p>
  <button on:click={increment}>Increment</button>
</main>
