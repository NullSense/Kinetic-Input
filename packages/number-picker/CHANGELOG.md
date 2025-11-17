# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

<!-- Add new changes here before publishing -->

## [0.1.1] - 2025-01 (Current)

### Added
- Initial public release of `@tensil/kinetic-input`
- `CollapsibleNumberPicker` component with momentum scrolling
- `StandaloneWheelPicker` component for list/range selection
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
