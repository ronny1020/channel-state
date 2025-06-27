import { describe, it, expect, beforeEach } from 'vitest'
import { ChannelStore } from '@channel-state/core'
import { useChannelState } from './index'
import { get } from 'svelte/store'
import { tick } from 'svelte'

describe('useChannelState in Svelte', () => {
  let store: ChannelStore<number>

  beforeEach(() => {
    store = new ChannelStore<number>({
      name: 'test-count',
      initial: 0,
      persist: false,
    })
  })

  it('should return a readable store with initial state', () => {
    const svelteStore = useChannelState(store)
    expect(get(svelteStore)).toBe(0)
  })

  it('should update svelte store when ChannelStore changes', async () => {
    const svelteStore = useChannelState(store)
    let updatedValue: number | undefined
    const unsubscribe = svelteStore.subscribe((value) => {
      updatedValue = value
    })

    await store.set(5) // Ensure the ChannelStore update completes
    await tick() // Wait for Svelte's updates
    expect(updatedValue).toBe(5)
    unsubscribe()
  })

  it('should update ChannelStore when svelte store is set', () => {
    const svelteStore = useChannelState(store)
    svelteStore.set(10)
    expect(store.get()).toBe(10)
  })
})
