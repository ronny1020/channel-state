

import { useChannelState } from '@channel-state/react';

export default function App() {
  const [count, setCount] = useChannelState('count');

  return (
    <div>
       <h1>React App Example</h1>
      
        <p>Count: {count ?? 0}</p>
        <button onClick={() => setCount((count ?? 0) + 1)}>
          Increment
        </button>      
    </div>
  );
}


