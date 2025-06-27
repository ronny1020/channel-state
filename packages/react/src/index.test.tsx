import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import React from 'react'
import { ChannelStore } from '@channel-state/core'
import { useChannelState } from './index'

describe('useChannelState in React', () => {
  let store: ChannelStore<number>

  beforeEach(() => {
    store = new ChannelStore<number>({
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

    await act(async () => {
      render(<TestComponent />)
    })
    expect(await screen.findByText('Count: 0')).toBeInTheDocument()
  })

  it('should update state when setter is called', async () => {
    function TestComponent() {
      const [count, setCount] = useChannelState(store)
      return (
        <button onClick={() => setCount(count + 1)}>Increment: {count}</button>
      )
    }

    let button
    await act(async () => {
      render(<TestComponent />)
    })
    button = screen.getByText('Increment: 0')

    await act(async () => {
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

    await act(async () => {
      render(<TestComponent />)
    })

    await act(async () => {
      store.set(5)
    })
    expect(await screen.findByText('Count: 5')).toBeInTheDocument()
  })
})
