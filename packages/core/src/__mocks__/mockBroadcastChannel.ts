const channelInstances: Map<string, MockBroadcastChannel[]> = new Map()

export class MockBroadcastChannel extends EventTarget {
  name: string
  private listeners: Map<string, Set<EventListener>> = new Map()

  constructor(name: string) {
    super()
    this.name = name
    if (!channelInstances.has(name)) {
      channelInstances.set(name, [])
    }
    channelInstances.get(name)?.push(this)
  }

  postMessage(message: any) {
    // Simulate async message passing
    setTimeout(() => {
      channelInstances.get(this.name)?.forEach((channel) => {
        if (channel !== this) {
          const event = new MessageEvent('message', { data: message })
          Object.defineProperty(event, 'target', { value: channel })
          Object.defineProperty(event, 'currentTarget', { value: channel })
          channel.dispatchEvent(event)
        }
      })
    }, 0)
  }

  addEventListener(type: string, listener: EventListenerOrEventListenerObject) {
    let listeners = this.listeners.get(type)
    if (!listeners) {
      listeners = new Set()
      this.listeners.set(type, listeners)
    }
    listeners.add(listener as EventListener)
    super.addEventListener(type, listener)
  }

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
  ) {
    const listeners = this.listeners.get(type)
    if (listeners) {
      listeners.delete(listener as EventListener)
      if (listeners.size === 0) {
        this.listeners.delete(type)
      }
    }
    super.removeEventListener(type, listener)
  }

  close() {
    const instances = channelInstances.get(this.name)
    if (instances) {
      const index = instances.indexOf(this)
      if (index > -1) {
        instances.splice(index, 1)
      }
      if (instances.length === 0) {
        channelInstances.delete(this.name)
      }
    }
    // Clear all listeners when channel is closed
    this.listeners.clear()
  }

  static clearAllChannels() {
    channelInstances.clear()
  }
}
