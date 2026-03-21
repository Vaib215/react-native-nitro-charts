# Contributing

Thanks for helping improve `react-native-nitro-charts`.

This project is still early, so the most helpful contributions are:

- bug fixes
- tests for geometry and interaction behavior
- documentation improvements
- performance improvements with benchmarks or clear before/after notes
- example app improvements that demonstrate real usage patterns

## Development Setup

### Prerequisites

- Bun `1.3.9` or newer
- A working Expo / React Native development environment
- Xcode for iOS native verification
- Android Studio for Android native verification

### Install dependencies

```bash
bun install
```

### Useful commands

```bash
bun run build
bun run typecheck
bun test
bun run example
bun run example:web
```

## Project Structure

- `packages/chart`: source code for the library
- `packages/chart/test`: unit tests
- `apps/example`: example app for manual testing and demos

## Contribution Guidelines

### Before opening a change

- Look for an existing issue or discussion first when the change is large.
- Keep pull requests focused. Small, isolated changes are easier to review and release.
- If you change public API behavior, update docs in the same pull request.

### Coding expectations

- Prefer simple APIs over clever abstractions.
- Keep platform behavior consistent unless there is a clear platform-specific reason not to.
- Add tests when changing geometry, engine behavior, or interactions.
- Avoid introducing dependencies unless they clearly improve the package.

### Tests and verification

Before submitting, run:

```bash
bun run typecheck
bun test
```

If your change affects rendering or interactions, also validate it in the example app.

## Documentation

Please keep docs practical and honest:

- document what exists today
- avoid roadmap language in API docs
- include examples when behavior is easier to understand in code

## Pull Request Checklist

- The code builds successfully
- Type checks pass
- Tests pass or the change includes an explanation for missing coverage
- Docs were updated if the public API changed
- Example app was checked for UI or interaction changes

## Reporting Security Issues

Please do not open public issues for security problems. Follow the process in [SECURITY.md](/Users/vaib/Documents/Projects/codes/chart/SECURITY.md).
