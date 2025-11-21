# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

<!-- Add new changes here before publishing -->

## [0.0.5] - 2025-01-20

### Changed
- Updated all dependencies to latest versions
  - Upgraded `framer-motion` from ^11.11.11 to ^12.23.24 (major)
  - Upgraded `vite` from ^6.4.1 to ^7.2.4 (major)
  - Upgraded `@types/node` from ^22.19.1 to ^24.10.1 (major)
  - Upgraded `typescript` from ~5.8.3 to ~5.9.3 (minor)
  - Upgraded `xstate` from ^5.0.0 to ^5.24.0 (minor)
  - Upgraded `vitest` and related tools from ^4.0.10 to ^4.0.12 (patch)
  - Upgraded `tsup` from ^8.3.0 to ^8.5.1 (minor)
  - Upgraded `knip`, `lint-staged`, and other dev dependencies to latest
- Updated peer dependency for `framer-motion` to support both v11 and v12 (^11.0.0 || ^12.0.0)
- Reduced default `balanced` timing preset idle timeout from 4s to 2.5s for better UX
- Corrected documentation showing accurate timing values (was incorrectly showing 1.5s)

### Added
- New `TimingBehavior` component in demo site documenting auto-close behavior
- Interactive timing grid showing all 4 interaction types with visual indicators
- Preset comparison table in demo with use cases and technical details

### Fixed
- Fixed TypeScript compatibility issues with newer TypeScript 5.9
- Fixed framer-motion v12 type errors in demo (cubic-bezier ease arrays)
- Removed all backdrop-related functionality (no longer needed)
- Removed deprecated `wheelMode` prop usage (now always enabled with auto-detection)
- Fixed type imports for presenter ViewModels
- Fixed optional chaining in test assertions for stricter TypeScript checks

## [0.0.4] - 2025-01 (Previous)

### Added
- Initial public release of `@tensil/kinetic-input`
- `CollapsiblePicker` component with momentum scrolling
- `Picker` component for list/range selection
- Smart auto-close timing with configurable presets (instant/fast/balanced/patient)
- XState v5 powered state machine for interaction tracking
- Controlled and uncontrolled modes
- Full theming support via `buildTheme` utility and theme prop
- Custom render hooks for values and items
- Optional snap physics for magnetic item alignment
- Comprehensive TypeScript types
- Debug logging system with namespace controls
- CSS convenience bundle (`all.css`) for simplified imports
- Comprehensive test suite (220+ tests passing)

### Fixed
- Infinite loop bug in Firefox when navigating between wizard steps
- Inconsistent auto-close timing on repeated interactions
- State machine interaction counter not resetting after natural auto-close
- Unstable callback references causing unnecessary re-renders

## [0.1.1] - 2025-01 (Legacy Reference)

### Added
- Initial public release of `@tensil/kinetic-input`
- `CollapsiblePicker` component with momentum scrolling
- `Picker` component for list/range selection
- Smart auto-close timing with configurable presets (instant/fast/balanced/patient)
- XState v5 powered state machine for interaction tracking
- Controlled and uncontrolled modes
- Full theming support via `buildTheme` utility and theme prop
- Custom render hooks for values and items
- Optional snap physics for magnetic item alignment
- Comprehensive TypeScript types
- Debug logging system with namespace controls
- CSS convenience bundle (`all.css`) for simplified imports
- Comprehensive test suite (219 tests passing)

### Fixed
- Infinite loop bug in Firefox when navigating between wizard steps
- Inconsistent auto-close timing on repeated interactions
- State machine interaction counter not resetting after natural auto-close
- Unstable callback references causing unnecessary re-renders

## [0.0.1] - 2025-01 (Internal Development)

### Added
- Initial package structure and build configuration
- Core picker primitives from Tensil monorepo
- XState migration from manual state management
- Performance optimizations for drag interactions

---

## Publishing Checklist

Before publishing a new version:

1. Update version in `package.json`
2. Document changes in this CHANGELOG under appropriate version
3. Run tests: `npm test`
4. Build: `npm run build`
5. Verify dist output
6. Commit changes: `git commit -am "Release vX.Y.Z"`
7. Tag release: `git tag @tensil/kinetic-input@X.Y.Z`
8. Push: `git push && git push --tags`
9. Publish: `npm publish --access public`
10. Create GitHub release with changelog

## Version Types

- **Major (X.0.0)**: Breaking changes, API incompatibilities
- **Minor (0.X.0)**: New features, backward compatible
- **Patch (0.0.X)**: Bug fixes, performance improvements

## Categories

- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Vulnerability fixes
