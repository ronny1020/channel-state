# Contributing to channel-state

First off, thank you for considering contributing to `channel-state`! It's people like you that make the open source community such a great place.

## Development Setup

This project is a monorepo managed by `pnpm` workspaces. To get started, you'll need to have `pnpm` installed on your machine.

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/channel-state.git
    cd channel-state
    ```

2.  **Install dependencies:**

    ```bash
    pnpm install
    ```

3.  **Build all packages:**

    ```bash
    pnpm build
    ```

## Project Structure

The repository is structured as follows:

- `packages/*`: This directory contains the source code for the different `channel-state` packages:
  - `core`: The core library, containing the `ChannelStore` class.
  - `react`: The React hook (`useChannelState`).
  - `vue`: The Vue composable (`useChannelState`).
  - `svelte`: The Svelte store (`useChannelState`).
- `examples/*`: This directory contains example applications for each of the supported frameworks. These are useful for testing your changes in a real browser environment.

## Development Workflow

1.  **Make your changes:** Make your desired changes to the package(s) you want to contribute to.

2.  **Run the examples:** To test your changes, you can run the example applications:

    ```bash
    # Run all examples in parallel
    pnpm dev:examples

    # Run a specific example
    pnpm dev:react-example
    pnpm dev:vue-example
    pnpm dev:svelte-example
    pnpm dev:core-example
    ```

3.  **Run tests:** Make sure all tests pass:

    ```bash
    pnpm test
    ```

4.  **Lint and format:** Ensure your code adheres to the project's coding standards:

    ```bash
    pnpm lint
    pnpm format
    ```

5.  **Commit your changes:** Follow the conventional commit message format.

6.  **Create a pull request:** Push your changes to your fork and create a pull request.

## Submitting a Pull Request

Before you submit your pull request, please make sure you've done the following:

- Run `pnpm build` to ensure your changes have been compiled correctly.
- Run `pnpm test` to make sure all tests pass.
- Run `pnpm lint` and `pnpm format` to check for any linting or formatting issues.
- Update the documentation if you've added a new feature or changed an existing one.

Thank you for your contribution!
