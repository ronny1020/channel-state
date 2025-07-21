/* eslint-disable vue/one-component-per-file */
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { ChannelStore, ChannelStoreOptions } from '@channel-state/core'
import { useChannelState, useChannelStatus } from './index'
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

describe('useChannelState in Vue', () => {
  let store: ChannelStore<number>

  beforeEach(() => {
    store = new ChannelStore<number>({
      name: 'test-count',
      initial: 0,
      persist: false,
    })
  })

  it('should render with initial state', () => {
    const TestComponent = defineComponent({
      setup() {
        const count = useChannelState(store)
        return { count }
      },
      template: `<div>Count: {{ count }}</div>`,
    })

    const wrapper = mount(TestComponent)
    expect(wrapper.text()).toContain('Count: 0')
  })

  it('should update state when ref is changed', async () => {
    const TestComponent = defineComponent({
      setup() {
        const count = useChannelState(store)
        const increment = () => {
          count.value++
        }
        return { count, increment }
      },
      template: `<button @click="increment()">Increment: {{ count }}</button>`,
    })

    const wrapper = mount(TestComponent)
    const button = wrapper.find('button')
    await button.trigger('click')
    expect(wrapper.text()).toContain('Increment: 1')
    expect(store.get()).toBe(1)
  })

  it('should update state when ChannelStore changes externally', async () => {
    const TestComponent = defineComponent({
      setup() {
        const count = useChannelState(store)
        return { count }
      },
      template: `<div>Count: {{ count }}</div>`,
    })

    const wrapper = mount(TestComponent)
    expect(wrapper.text()).toContain('Count: 0')

    store.set(5)
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Count: 5')
  })
})

describe('useChannelStatus in Vue', () => {
  let store: ChannelStore<number>

  beforeEach(() => {
    store = new ChannelStore<number>({
      name: 'test-status',
      initial: 0,
      persist: false,
    })
  })

  it('should return the initial status', () => {
    const TestComponent = defineComponent({
      setup() {
        const status = useChannelStatus(store)
        return { status }
      },
      template: `<div>Status: {{ status }}</div>`,
    })

    const wrapper = mount(TestComponent)
    expect(wrapper.text()).toContain('Status: initializing')
  })

  it('should update status when store is destroyed', async () => {
    const TestComponent = defineComponent({
      setup() {
        const status = useChannelStatus(store)
        return { status }
      },
      template: `<div>Status: {{ status }}</div>`,
    })

    const wrapper = mount(TestComponent)
    expect(wrapper.text()).toContain('Status: initializing')

    store.destroy()
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Status: destroyed')
  })
})
