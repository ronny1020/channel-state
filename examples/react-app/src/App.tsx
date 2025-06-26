

import { useChannelState } from '@channel-state/react';
import { ChannelStore } from '@channel-state/core';

const countStore = new ChannelStore({
  name: 'count',
  initial: { value: 0 },
});

export default function App() {
  const [state, setState] = useChannelState(countStore);

  return (
    <div>
       <h1>React App Example</h1>
      
        <p>Count: {state.value ?? 0}</p>
        <button onClick={() => setState({ value: (state.value ?? 0) + 1 })}>
          Increment
        </button>      
    </div>
  );
}


