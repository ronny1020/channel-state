# channel-state

`channel-state` is a cutting-edge, zero-dependency state management library engineered for modern web applications. It provides robust, seamless state synchronization across all browser tabs, windows, and even diverse JavaScript frameworks, leveraging native `BroadcastChannel` and `IndexedDB` APIs for unparalleled cross-context communication and optional persistence. This makes it an ideal choice for complex, multi-instance web applications requiring consistent state without the overhead of external dependencies.

## Key Advantages

- **Unparalleled Cross-Context State Synchronization:** Achieves automatic, real-time state synchronization across all open tabs and windows of the same origin, ensuring data consistency without complex manual orchestration.
- **Robust and Optional State Persistence:** Offers the capability to persist state to `IndexedDB`, guaranteeing that your application's state is reliably restored even after browser restarts or page reloads, enhancing user experience and data integrity.
- **Universal Framework Agnosticism:** Designed from the ground up in pure TypeScript, the core library integrates effortlessly with _any_ JavaScript project or framework, providing maximum flexibility and avoiding vendor lock-in.
- **Optimized Official Framework Integrations:** Provides meticulously crafted, easy-to-use wrappers for leading frameworks like React, Vue, and Svelte, streamlining development and ensuring idiomatic usage within those ecosystems.
- **Minimal Footprint & Zero External Dependencies:** The core library boasts a remarkably small bundle size due to its complete lack of external dependencies, contributing to faster load times and reduced attack surface.

## Status

| Package                                       | Version                                                                                                               | Downloads                                                                                                              |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| [`@channel-state/core`](./packages/core/)     | [![npm](https://img.shields.io/npm/v/@channel-state/core.svg)](https://www.npmjs.com/package/@channel-state/core)     | [![npm](https://img.shields.io/npm/dm/@channel-state/core.svg)](https://www.npmjs.com/package/@channel-state/core)     |
| [`@channel-state/react`](./packages/react/)   | [![npm](https://img.shields.io/npm/v/@channel-state/react.svg)](https://www.npmjs.com/package/@channel-state/react)   | [![npm](https://img.shields.io/npm/dm/@channel-state/react.svg)](https://www.npmjs.com/package/@channel-state/react)   |
| [`@channel-state/vue`](./packages/vue/)       | [![npm](https://img.shields.io/npm/v/@channel-state/vue.svg)](https://www.npmjs.com/package/@channel-state/vue)       | [![npm](https://img.shields.io/npm/dm/@channel-state/vue.svg)](https://www.npmjs.com/package/@channel-state/vue)       |
| [`@channel-state/svelte`](./packages/svelte/) | [![npm](https://img.shields.io/npm/v/@channel-state/svelte.svg)](https://www.npmjs.com/package/@channel-state/svelte) | [![npm](https://img.shields.io/npm/dm/@channel-state/svelte.svg)](https://www.npmjs.com/package/@channel-state/svelte) |

## Installation

You can install `channel-state` and its framework-specific packages using your favorite package manager:

```bash
# For the core library
pnpm add @channel-state/core
```

For framework-specific packages, see their respective READMEs:

- [React Package README](./packages/react/README.md)
- [Vue Package README](./packages/vue/README.md)
- [Svelte Package README](./packages/svelte/README.md)

### CDN Usage

For direct usage in the browser, you can use the UMD builds from a CDN like jsDelivr or unpkg. It is highly recommended to pin the version in the URL to avoid unexpected breaking changes. You can replace `@0` with a specific version.

When using the CDN build, make sure to include the necessary peer dependencies for the package you are using.

**Core Package:**

```html
<script src="https://cdn.jsdelivr.net/npm/@channel-state/core@0"></script>
```

**React Package:**

```html
<script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@channel-state/core@0"></script>
<script src="https://cdn.jsdelivr.net/npm/@channel-state/react@0"></script>
```

**Vue Package:**

```html
<script src="https://cdn.jsdelivr.net/npm/vue@3"></script>
<script src="https://cdn.jsdelivr.net/npm/@channel-state/core@0"></script>
<script src="https://cdn.jsdelivr.net/npm/@channel-state/vue@0"></script>
```

**Svelte Package:**

```html
<script src="https://cdn.jsdelivr.net/npm/svelte@4"></script>
<script src="https://cdn.jsdelivr.net/npm/@channel-state/core@0"></script>
<script src="https://cdn.jsdelivr.net/npm/@channel-state/svelte@0"></script>
```

## Usage

For detailed usage of the core library, please refer to the [Core Package README](./packages/core/README.md).

## License

MIT
