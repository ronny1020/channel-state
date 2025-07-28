<h1 align="center">📢 channel-state</h1>

<p align="center">
  <strong>A zero-dependency, framework-agnostic state management library for synchronizing state across browser tabs and windows.</strong>
</p>

<p align="center">
  <a href="https://github.com/ronny1020/channel-state/actions/workflows/ci.yml">
    <img src="https://github.com/ronny1020/channel-state/actions/workflows/ci.yml/badge.svg" alt="CI Status" />
  </a>
  <a href="https://www.npmjs.com/package/@channel-state/core">
    <img src="https://img.shields.io/npm/v/@channel-state/core.svg" alt="NPM Version" />
  </a>
  <a href="https://www.npmjs.com/package/@channel-state/core">
    <img src="https://img.shields.io/npm/dm/@channel-state/core.svg" alt="NPM Downloads" />
  </a>
  <a href="https://github.com/ronny1020/channel-state/blob/main/LICENSE">
    <img src="https://img.shields.io/npm/l/@channel-state/core?label=license&color=blue" alt="License" />
  </a>
</p>

## Overview

`channel-state` is a lightweight, powerful state management library designed for modern web applications. It leverages the native `BroadcastChannel` API to seamlessly synchronize state across all browser contexts (tabs, windows, iframes) of the same origin. With an optional persistence layer using `IndexedDB`, it ensures your application's state can be restored across sessions, providing a fluid user experience.

Built with TypeScript and with zero external dependencies, `channel-state` offers a minimal footprint and maximum flexibility. It includes dedicated, easy-to-use wrappers for popular frameworks like React, Vue, and Svelte, making integration a breeze.

## Table of Contents

- [Common Use Cases](#-common-use-cases)
- [Key Features](#-key-features)
- [Packages](#-packages)
- [Installation](#-installation)
- [CDN Usage](#cdn-usage)
- [Contributing](#-contributing)
- [License](#-license)

## 🎯 Common Use Cases

- **Shopping Carts:** Keep a user's shopping cart synchronized across multiple tabs. If they add an item in one tab, it instantly appears in all others.
- **Real-time Notifications:** Display notifications (e.g., "You have a new message") across all open tabs simultaneously.
- **User Authentication:** When a user logs in or out in one tab, automatically update the authentication state in all other tabs.
- **Collaborative Tools:** In simple collaborative applications, synchronize form data or other shared state between users on the same machine.
- **Feature Flags & Settings:** Update application settings or feature flags in one tab and have them apply everywhere immediately.

## ✨ Key Features

- **Real-time Cross-Context Synchronization:** Automatically syncs state across all tabs and windows using the `BroadcastChannel` API.
- **Optional State Persistence:** Persist state to `IndexedDB` to restore it after page reloads or browser restarts.
- **Framework-Agnostic Core:** The `@channel-state/core` package works with any JavaScript project.
- **Official Framework Wrappers:** Idiomatic and optimized integrations for [React](./packages/react/), [Vue](./packages/vue/), and [Svelte](./packages/svelte/).
- **Zero Dependencies:** The core library is incredibly lightweight with no third-party dependencies.
- **TypeScript Native:** Written entirely in TypeScript for robust type safety.

## 📦 Packages

This repository is a monorepo containing the following packages:

| Package                                       | Version                                                                                                               | Description                           |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| [`@channel-state/core`](./packages/core/)     | [![npm](https://img.shields.io/npm/v/@channel-state/core.svg)](https://www.npmjs.com/package/@channel-state/core)     | The core, framework-agnostic library. |
| [`@channel-state/react`](./packages/react/)   | [![npm](https://img.shields.io/npm/v/@channel-state/react.svg)](https://www.npmjs.com/package/@channel-state/react)   | React hooks for `channel-state`.      |
| [`@channel-state/vue`](./packages/vue/)       | [![npm](https://img.shields.io/npm/v/@channel-state/vue.svg)](https://www.npmjs.com/package/@channel-state/vue)       | Vue composables for `channel-state`.  |
| [`@channel-state/svelte`](./packages/svelte/) | [![npm](https://img.shields.io/npm/v/@channel-state/svelte.svg)](https://www.npmjs.com/package/@channel-state/svelte) | Svelte stores for `channel-state`.    |

## 🛠️ Installation

Install the desired package(s) using your preferred package manager:

```bash
# Install the core library
pnpm add @channel-state/core

# Install for React
pnpm add @channel-state/core @channel-state/react

# Install for Vue
pnpm add @channel-state/core @channel-state/vue

# Install for Svelte
pnpm add @channel-state/core @channel-state/svelte
```

For detailed usage, please refer to the README file of the specific package you are using.

## 🌐 CDN Usage

For direct browser usage, you can use the UMD builds from a CDN like jsDelivr or unpkg. For detailed instructions and the required script tags for each package, please see the "CDN Usage" section in the respective package's README:

- [`@channel-state/core` README](./packages/core/README.md#cdn-usage)
- [`@channel-state/react` README](./packages/react/README.md#cdn-usage)
- [`@channel-state/vue` README](./packages/vue/README.md#cdn-usage)
- [`@channel-state/svelte` README](./packages/svelte/README.md#cdn-usage)

## 🤝 Contributing

Contributions are welcome! Please read our [**Contributing Guidelines**](./CONTRIBUTING.md) to get started. All contributors are expected to adhere to our [**Code of Conduct**](./CODE_OF_CONDUCT.md).

## 📜 License

This project is licensed under the [Apache-2.0 License](https://github.com/ronny1020/channel-state/blob/main/LICENSE).
