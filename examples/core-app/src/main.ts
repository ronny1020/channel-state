import { ChannelStore } from '@channel-state/core'

const countStore = new ChannelStore<number>({
  name: 'count',
  initial: 0,
})

const countSpan = document.querySelector<HTMLSpanElement>('#count')!
const statusSpan = document.querySelector<HTMLSpanElement>('#status')!
const incrementButton = document.querySelector<HTMLButtonElement>('#increment')!

countSpan.innerText = countStore.get().toString()
statusSpan.innerText = countStore.status

countStore.subscribe((count) => {
  countSpan.innerText = count.toString()
})

countStore.subscribeStatus((status) => {
  statusSpan.innerText = status
})

incrementButton.addEventListener('click', () => {
  countStore.set(countStore.get() + 1)
})
