import { ChannelStore, StoreStatus } from '@channel-state/core'
import { useChannelState, useChannelStatus } from './index'
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

describe('useChannelStatus in Svelte', () => {
  let store: ChannelStore<number>

  beforeEach(() => {
    store = new ChannelStore<number>({
      name: 'test-status',
      initial: 0,
      persist: false,
    })
  })

  it('should return the initial status', () => {
    const status = useChannelStatus(store)
    expect(get(status)).toBe('initializing')
  })

  it('should update status when store is destroyed', async () => {
    const status = useChannelStatus(store)
    let currentStatus: StoreStatus = get(status)
    const unsubscribe = status.subscribe(
      (s: StoreStatus) => (currentStatus = s),
    )

    expect(currentStatus).toBe('initializing')

    store.destroy()
    // Wait for the next microtask tick to allow Svelte store to update
    await tick()

    expect(currentStatus).toBe('destroyed')
    unsubscribe()
  })
})
