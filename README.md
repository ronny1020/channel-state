# channel-state

`channel-state` is a state management tool that uses IndexedDB to share state across different web frameworks (React, Vue, Angular). It allows you to share state between different tabs or even across apps within the same domain.

## Features

- **Cross-framework compatibility**: Wrappers for React, Vue, and Angular.
- **Same-domain sharing**: Works across apps on the same origin (even in different iframes).
- **Live sync**: State updates in one framework notify others via `storage` or `BroadcastChannel` fallback.
- **Persistent**: Uses IndexedDB as the primary backend for persistent storage.
- **React 18-ready**: Uses `useSyncExternalStore` for concurrent-safe updates.
- **Offline-first**: Works offline and after reload.

## File Structure

```
channel-state/
├── package.json               # Root: defines workspaces
├── tsconfig.base.json         # Shared TS config
├── .gitignore
├── README.md                  # Root project docs
├── examples/                  # Real-browser test apps
│   ├── react-app/
│   │   ├── src/
│   │   │   └── App.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   ├── vue-app/
│   └── angular-app/
└── packages/
    ├── core/                  # Core: IndexedDB + BroadcastChannel
    │   ├── src/
    │   │   ├── index.ts
    │   │   ├── ChannelStore.ts       # Core store class
    │   │   ├── constants.ts
    │   │   ├── types.ts
    │   │   └── utils.ts
    │   ├── package.json
    │   └── tsconfig.json
    ├── react/                 # React integration (useSyncExternalStore)
    │   ├── src/
    │   │   ├── index.ts
    │   │   └── useChannelState.ts
    │   ├── package.json
    │   └── tsconfig.json
    ├── vue/                   # Vue integration (ref, watch)
    │   ├── src/
    │   │   ├── index.ts
    │   │   └── useChannelState.ts
    │   ├── package.json
    │   └── tsconfig.json
    ├── angular/               # Angular service wrapper
    │   ├── src/
    │   │   ├── index.ts
    │   │   └── ChannelStateService.ts
    │   ├── package.json
    │   └── tsconfig.json
```

## Tooling Setup

### Root `package.json`

```json
{
  "name": "channel-state",
  "private": true,
  "workspaces": ["packages/*", "examples/*"],
  "devDependencies": {
    "tsup": "^7.2.0",
    "typescript": "^5.4.0",
    "vite": "^5.0.0",
    "eslint": "...",
    "prettier": "..."
  },
  "scripts": {
    "build": "pnpm -r run build",
    "dev": "pnpm -r --filter ./examples/* run dev"
  }
}
```

### `tsconfig.base.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Node",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "skipLibCheck": true,
    "baseUrl": "."
  }
}
```

Each package will extend this config.

### Example: `core/package.json`

```json
{
  "name": "@channel-state/core",
  "version": "0.1.0",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsup src/index.ts --dts --format esm,cjs"
  },
  "devDependencies": {
    "tsup": "^7.2.0"
  }
}
```

### Example: `react/package.json`

```json
{
  "name": "@channel-state/react",
  "version": "0.1.0",
  "main": "dist/index.js",
  "module": "dist/index.mjs",
  "types": "dist/index.d.ts",
  "peerDependencies": {
    "react": "^18.0.0"
  },
  "dependencies": {
    "@channel-state/core": "*"
  },
  "scripts": {
    "build": "tsup src/index.ts --dts --format esm,cjs"
  }
}
```

## Example Usage

### React

```tsx
import { useChannelState } from '@channel-state/react'

export default function App() {
  const [count, setCount] = useChannelState('counter', 0)
  return (
    <div>
      <h1>React App</h1>
      <button onClick={() => setCount(count + 1)}>Increment: {count}</button>
    </div>
  )
}
```

### Vue

```vue
<script setup lang="ts">
import { useChannelState } from '@channel-state/vue'

const [count, setCount] = useChannelState('counter', 0)
</script>

<template>
  <div>
    <h1>Vue App</h1>
    <button @click="setCount(count + 1)">Increment: {{ count }}</button>
  </div>
</template>
```

### Angular

```ts
import { Component } from '@angular/core'
import { ChannelStateService } from '@channel-state/angular'

@Component({
  selector: 'app-root',
  template: `
    <h1>Angular App</h1>
    <button (click)="increment()">Increment: {{ counter }}</button>
  `,
})
export class AppComponent {
  counter = 0

  constructor(private state: ChannelStateService) {
    this.state.useChannelState<number>('counter', 0).subscribe((value) => {
      this.counter = value
    })
  }

  increment() {
    this.state.set<number>('counter', this.counter + 1)
  }
}
```

## Development Workflow

1.  `pnpm install`

2.  Edit core + framework packages

3.  Run example apps to test in real browsers:

    ```bash
    pnpm dev
    ```

4.  Build for publish:

    ```bash
    pnpm build
    ```

## Testing

To test your shared state library on a real browser with multiple tabs and multiple frameworks, you can follow this structured plan:

### 1. Set Up Example Projects

Use `pnpm` workspaces or manual linking to include the packages you’re developing. Create:

```
examples/
├── react-app/
├── vue-app/
└── angular-app/
```

Each example should import and use your local `@channel-state/*` packages.

### 2. Basic Test Case

In each app, create a shared counter using the same key, e.g. `"counter"`.

### 3. Test Scenarios in the Browser

Now launch all apps and test:

#### In a single app

- Click the increment button.
- Refresh — the value should persist (IndexedDB working).
- Open devtools → Application → IndexedDB to inspect values.

#### Cross-tab

- Open two tabs of the same app.
- Click the button in one tab.
- See real-time update in the other tab (test `localStorage`/BroadcastChannel sync).

#### Cross-framework

- Open React, Vue, and Angular apps side-by-side.
- Click increment in one.
- All others should reflect the change instantly or very soon.

### Debugging Tips

- Use `console.log` in your core `ChannelStore.emitChange()` to confirm events.
- Use DevTools > Application > IndexedDB > `SharedStateDB` to confirm writes.
- Use `localStorage` tab to inspect `SharedState/counter` keys.
- Simulate network loss to test offline fallback.

## License

MIT
