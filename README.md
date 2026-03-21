# react-native-nitro-charts

High-performance chart primitives for Expo and React Native apps, powered by Skia for rendering, D3 for geometry, and a Nitro-backed native engine for performance-sensitive paths on iOS and Android.

This repository contains:

- `packages/chart`: the publishable library package
- `apps/example`: an Expo app used for development and manual verification

## Why this library

- Expo-first developer experience
- Skia-rendered charts with interactive primitives
- Shared headless geometry utilities for custom chart work
- TypeScript fallback engine for web and non-native environments
- Native Nitro execution path for hit-testing and downsampling on iOS and Android

## Current surface area

Version `0.0.1` currently ships:

- `LineChart`
- `AreaChart`
- `BarChart`
- `DonutChart`
- hooks like `useLineChart`, `useAreaChart`, `useBarChart`, `useDonutChart`, `useNearestPoint`, and `useChartPressState`
- headless geometry helpers exported from `headless/models`

## Quick Start

Install workspace dependencies:

```bash
bun install
```

Run the package tests:

```bash
bun test
```

Start the example app:

```bash
bun run example
```

Open the web example:

```bash
bun run example:web
```

Build the package:

```bash
bun run build
```

## Using The Package

Library usage, installation, and API documentation live in [packages/chart/README.md](/Users/vaib/Documents/Projects/codes/chart/packages/chart/README.md).

## Development

### Repository layout

```text
.
├── apps/example        # Expo example app
├── packages/chart      # Library source, tests, native bindings, dist output
├── package.json        # Workspace scripts
└── bun.lock
```

### Common commands

- `bun run build`: build the library package
- `bun run typecheck`: run TypeScript checks across workspaces
- `bun test`: run the test suite
- `bun run example`: start the Expo example app
- `bun run example:web`: start the example app on web

### Notes

- The package uses a TypeScript engine on web and falls back to TypeScript when the native Nitro engine is unavailable.
- Native Nitro integration is intended for iOS and Android builds where the module is installed and linked.

## Open Source

- [Contributing guide](/Users/vaib/Documents/Projects/codes/chart/CONTRIBUTING.md)
- [Code of conduct](/Users/vaib/Documents/Projects/codes/chart/CODE_OF_CONDUCT.md)
- [Security policy](/Users/vaib/Documents/Projects/codes/chart/SECURITY.md)
- [License](/Users/vaib/Documents/Projects/codes/chart/LICENSE)

## Versioning

This is the first public iteration of the library. Until `1.0.0`, expect the API to improve quickly and for some breaking changes to happen as the primitives harden.
