# react-native-nitro-charts

High-performance chart primitives for Expo and React Native, powered by Skia for rendering, D3 for chart math, and a Nitro-backed native engine for performance-sensitive paths on iOS and Android.

`react-native-nitro-charts` is built for teams who want polished chart components without giving up low-level control. You get ready-to-use primitives for common chart types, plus headless geometry helpers when you need to build custom interactions or visuals.

## Highlights

- Expo-first workflow with a colocated example app
- Skia-rendered chart components for smooth visuals
- Nitro-native execution path for downsampling and hit testing on iOS and Android
- TypeScript fallback engine for web and non-native environments
- Headless chart geometry exports for fully custom rendering

## What Is In This Repo

- `packages/chart`: the publishable library package
- `apps/example`: the Expo example app used for development and manual verification

## Current API Surface

Version `0.0.1` currently includes:

- `LineChart`
- `AreaChart`
- `BarChart`
- `DonutChart`
- hooks such as `useLineChart`, `useAreaChart`, `useBarChart`, `useDonutChart`, `useNearestPoint`, and `useChartPressState`
- geometry helpers exported from `headless/models`

Package installation, usage examples, and API details live in [packages/chart/README.md](./packages/chart/README.md).

## Quick Start

Install workspace dependencies:

```bash
bun install
```

Build the library:

```bash
bun run build
```

Run tests:

```bash
bun test
```

Start the example app:

```bash
bun run example
```

Run the example on web:

```bash
bun run example:web
```

## Development

Repository layout:

```text
.
├── apps/example        # Expo example app
├── packages/chart      # Library source, tests, native bindings, dist output
├── package.json        # Workspace scripts
└── bun.lock
```

Common commands:

- `bun run build`: build the library package
- `bun run typecheck`: run TypeScript checks across workspaces
- `bun test`: run the test suite
- `bun run example`: start the Expo example app
- `bun run example:web`: start the example app on web

Implementation notes:

- The package uses a TypeScript engine on web and falls back to TypeScript when the native Nitro engine is unavailable.
- Native Nitro integration is intended for iOS and Android builds where the module is installed and linked.

## Open Source

This project is released under the MIT license. That means the code is open source and reusable, including in commercial settings, as long as the license notice is preserved.

If your goal is to prevent copying, reselling, or reuse entirely, an open source license is not the right tool. MIT is intentionally permissive. In this repository, MIT is used to make the package easy to adopt while still preserving attribution and warranty disclaimers.

- [Contributing guide](./CONTRIBUTING.md)
- [Code of conduct](./CODE_OF_CONDUCT.md)
- [Security policy](./SECURITY.md)
- [License](./LICENSE)

## Status

This is the first public iteration of the library. Until `1.0.0`, expect the API to move quickly as the primitives harden and the example surface expands.
