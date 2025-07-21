import {
  ChannelStore,
  ChannelStoreOptions,
  StoreStatus,
} from '@channel-state/core'
import { useChannelState, useChannelStatus } from './index'
import { get } from 'svelte/store'
import { tick } from 'svelte'
import { createMockChannelStore } from '../../__mocks__/ChannelStore'

vi.mock('@channel-state/core', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@channel-state/core')>()
  return {
    ...mod,
    ChannelStore: vi.fn(
      <T>(options: ChannelStoreOptions<T>) =>
        createMockChannelStore<T>(options.initial) as ChannelStore<T>,
    ),
  }
})

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

    store.set(5)
    await tick()
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
    await tick()

    expect(currentStatus).toBe('destroyed')
    unsubscribe()
  })
})
