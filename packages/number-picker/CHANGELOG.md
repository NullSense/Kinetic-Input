# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial public release of `@tensil/kinetic-input`
- `QuickNumberInput` component with momentum scrolling
- `WheelPicker` component for list/range selection
- Smart auto-close timing (150ms pointer, 800ms wheel, 1.5s idle)
- XState v5 powered state machine for interaction tracking
- Controlled and uncontrolled modes
- Full theming support via `buildTheme` utility
- Custom render hooks for values and items
- Optional snap physics for magnetic item alignment
- Comprehensive TypeScript types
- Debug logging system with namespace controls
- 40 unit tests with 100% coverage of state machine logic

### Fixed
- Infinite loop bug in Firefox when navigating between wizard steps
- Inconsistent auto-close timing on repeated interactions
- State machine interaction counter not resetting after natural auto-close
- Unstable callback references causing unnecessary re-renders

## [0.0.1] - 2025-01-XX (Internal Development)

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
