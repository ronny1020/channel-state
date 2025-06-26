import { useChannelState } from '@channel-state/react'
import { ChannelStore } from '@channel-state/core'

const countStore = new ChannelStore({
  name: 'count',
  initial: 0,
})

export default function App() {
  const [count, setCount] = useChannelState(countStore)

  console.log(count)

  return (
    <div>
      <h1>React App Example</h1>
      <p>Count: {count ?? 0}</p>
      <button onClick={() => setCount((count ?? 0) + 1)}>Increment</button>
    </div>
  )
}
