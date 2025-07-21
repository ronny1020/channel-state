import { render, screen, fireEvent, act } from '@testing-library/react'
import { useChannelState, useChannelStatus } from './index'
import { ChannelStore, ChannelStoreOptions } from '@channel-state/core'
import { createMockChannelStore } from '../../__mocks__/ChannelStore'

vi.mock('@channel-state/core', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@channel-state/core')>()
  return {
    ...mod,
    ChannelStore: vi.fn(function <T>(options: ChannelStoreOptions<T>) {
      return createMockChannelStore<T>(options.initial) as ChannelStore<T>
    }),
  }
})

describe('useChannelState in React', () => {
  let store: ChannelStore<number>

  beforeEach(() => {
    vi.clearAllMocks()
    store = new ChannelStore({
      name: 'test-count',
      initial: 0,
      persist: false,
    })
  })

  it('should render with initial state', async () => {
    function TestComponent() {
      const [count] = useChannelState(store)
      return <div>Count: {count}</div>
    }

    act(() => {
      render(<TestComponent />)
    })
    expect(await screen.findByText('Count: 0')).toBeInTheDocument()
  })

  it('should update state when setter is called', async () => {
    function TestComponent() {
      const [count, setCount] = useChannelState(store)
      return (
        <button
          onClick={() => {
            setCount(count + 1)
          }}
        >
          Increment: {count}
        </button>
      )
    }

    act(() => {
      render(<TestComponent />)
    })
    const button = screen.getByText('Increment: 0')

    act(() => {
      fireEvent.click(button)
    })

    expect(await screen.findByText('Increment: 1')).toBeInTheDocument()
    expect(store.get()).toBe(1)
  })

  it('should update state when ChannelStore changes externally', async () => {
    function TestComponent() {
      const [count] = useChannelState(store)
      return <div>Count: {count}</div>
    }

    act(() => {
      render(<TestComponent />)
    })

    act(() => {
      store.set(5)
    })
    expect(await screen.findByText('Count: 5')).toBeInTheDocument()
  })

  it('should return the correct status', async () => {
    function TestComponent() {
      const status = useChannelStatus(store)
      return <div>Status: {status}</div>
    }

    act(() => {
      render(<TestComponent />)
    })

    expect(await screen.findByText('Status: initializing')).toBeInTheDocument()

    act(() => {
      store.status = 'ready'
    })

    expect(await screen.findByText('Status: ready')).toBeInTheDocument()

    act(() => {
      store.destroy()
    })

    expect(await screen.findByText('Status: destroyed')).toBeInTheDocument()
  })
})
