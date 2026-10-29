This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- This application uses **React Navigation v7** (Bottom Tabs + Native Stack).
- Root navigator is configured in `src/navigation/RootNavigator.tsx`.
- Screens live in `src/screens/` (e.g. `HomeScreen.tsx`, `MapScreen.tsx`, `DealsScreen.tsx`, `CartScreen.tsx`, `AccountScreen.tsx`, `VouchersScreen.tsx`).
- Modals and reusable UI elements live in `src/components/`.
- Do NOT introduce `expo-router` or create a `src/app/` file-based routing tree, as navigation is centrally orchestrated via `RootNavigator.tsx`.

## Building with EAS & Native Android

- Native Android configuration lives in `android/` with Gradle 9.4.1, compileSdk 35+, and React Native New Architecture (`newArchEnabled=true`, Hermes engine).
- Release APKs can be built locally or with EAS (`eas build --profile preview|production`). Run EAS CLI as `npx eas-cli@latest <command>`.
- Docs: https://docs.expo.dev/eas/index.md

## Rules

- Preserve React Navigation v7 structure and central state in `src/context/AppContext.tsx`.
- When adding libraries with native code, note that New Architecture is enabled (`newArchEnabled=true` in `android/gradle.properties`).
- Always run `npx tsc --noEmit` and verification test suites in `tests/` before declaring work done.
