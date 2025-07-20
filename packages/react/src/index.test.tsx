import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'
import { useChannelState, useChannelStatus } from './index'
import { ChannelStore, StoreStatus } from '@channel-state/core'

// Mock the ChannelStore module
vi.mock('@channel-state/core', () => {
  let _value: any
  let _status: StoreStatus = 'initializing'
  const _subscribers = new Set<(value: any) => void>()
  const _statusSubscribers = new Set<(status: StoreStatus) => void>()

  const mockChannelStore = vi.fn((options: any) => {
    _value = options.initial
    _status = 'initializing'
    return {
      get: vi.fn(() => _value),
      set: vi.fn((newValue: any) => {
        _value = newValue
        _subscribers.forEach((cb) => cb(_value))
        // Explicitly trigger onStoreChange for value subscribers
        _subscribers.forEach((cb) => cb(_value))
        return Promise.resolve()
      }),
      subscribe: vi.fn((callback: (value: any) => void) => {
        _subscribers.add(callback)
        callback(_value) // Call immediately with current value
        return () => _subscribers.delete(callback)
      }),
      get status(): StoreStatus {
        return _status
      },
      set status(newStatus: StoreStatus) {
        _status = newStatus
        _statusSubscribers.forEach((cb) => cb(_status))
      },
      subscribeStatus: vi.fn((callback: (status: StoreStatus) => void) => {
        _statusSubscribers.add(callback)
        callback(_status) // Call immediately with current status
        return () => _statusSubscribers.delete(callback)
      }),
      destroy: vi.fn(() => {
        _status = 'destroyed'
        _statusSubscribers.forEach((cb) => cb(_status)) // Notify first
        _subscribers.clear()
        _statusSubscribers.clear() // Then clear
      }),
      reset: vi.fn(() => {
        _value = options.initial
        _subscribers.forEach((cb) => cb(_value))
        return Promise.resolve()
      }),
    }
  })

  return {
    ChannelStore: mockChannelStore,
  }
})

describe('useChannelState in React', () => {
  let store: InstanceType<typeof ChannelStore>

  beforeEach(() => {
    // Reset the mock before each test
    vi.clearAllMocks()
    store = new ChannelStore({
      name: 'test-count',
      initial: 0,
      persist: false,
    }) as unknown as InstanceType<typeof ChannelStore>
  })

  it('should render with initial state', async () => {
    function TestComponent() {
      const [count] = useChannelState(store as ChannelStore<number>)
      return <div>Count: {count}</div>
    }

    await act(async () => {
      render(<TestComponent />)
    })
    expect(await screen.findByText('Count: 0')).toBeInTheDocument()
  })

  it('should update state when setter is called', async () => {
    function TestComponent() {
      const [count, setCount] = useChannelState(store as ChannelStore<number>)
      return (
        <button onClick={() => setCount(count + 1)}>Increment: {count}</button>
      )
    }

    await act(async () => {
      render(<TestComponent />)
    })
    const button = screen.getByText('Increment: 0')

    await act(async () => {
      fireEvent.click(button)
    })

    expect(await screen.findByText('Increment: 1')).toBeInTheDocument()
    expect(store.get()).toBe(1)
  })

  it('should update state when ChannelStore changes externally', async () => {
    function TestComponent() {
      const [count] = useChannelState(store as ChannelStore<number>)
      return <div>Count: {count}</div>
    }

    await act(async () => {
      render(<TestComponent />)
    })

    await act(async () => {
      store.set(5)
    })
    expect(await screen.findByText('Count: 5')).toBeInTheDocument()
  })

  it('should return the correct status', async () => {
    function TestComponent() {
      const status = useChannelStatus(store as ChannelStore<unknown>)
      return <div>Status: {status}</div>
    }

    await act(async () => {
      render(<TestComponent />)
    })

    expect(await screen.findByText('Status: initializing')).toBeInTheDocument()

    await act(async () => {
      store.status = 'ready'
    })

    expect(await screen.findByText('Status: ready')).toBeInTheDocument()

    await act(async () => {
      store.destroy()
    })

    expect(await screen.findByText('Status: destroyed')).toBeInTheDocument()
  })
})
