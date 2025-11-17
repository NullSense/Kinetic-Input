# Contributing to @tensil/kinetic-input

Thank you for your interest in contributing to Kinetic Input! This guide will help you get started.

## Table of Contents

- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Code Standards](#code-standards)
- [Testing](#testing)
- [Debugging](#debugging)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

---

## Development Setup

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Git**: Latest stable version

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/NullSense/Kinetic-Input.git
cd Kinetic-Input

# Install all dependencies (handles monorepo workspaces)
npm install
```

### Running the Demo

```bash
# From project root
npm run dev:demo

# Open http://localhost:3001
```

The demo provides an interactive playground for testing components with:
- Live code editing
- Theme customization
- Preset configurations
- Real-time rendering

---

## Project Structure

This is a monorepo with the following structure:

```
Kinetic-Input/
├── packages/
│   └── number-picker/          # Main library package
│       ├── src/                # Source code
│       ├── __tests__/          # Unit tests
│       ├── dist/               # Build output (gitignored)
│       └── package.json
├── demo/                       # Interactive demo app
│   ├── src/
│   └── package.json
├── ARCHITECTURE.md             # Architecture documentation
├── CONTRIBUTING.md             # This file
└── README.md                   # User-facing documentation
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture documentation.

---

## Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `perf/` - Performance improvements
- `test/` - Test additions/fixes

### 2. Make Your Changes

Follow the [Code Standards](#code-standards) below.

### 3. Test Your Changes

```bash
# Run unit tests
cd packages/number-picker
npm test

# Run tests in watch mode
npm test -- --watch

# Run linter
npm run lint

# Build the package
npm run build
```

### 4. Test in Demo

```bash
# From demo directory
npm run dev

# Test your changes interactively
```

### 5. Commit Your Changes

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Feature
git commit -m "feat: add haptic feedback intensity control"

# Bug fix
git commit -m "fix: resolve snap physics at boundaries"

# Breaking change
git commit -m "feat!: redesign theme API

BREAKING CHANGE: theme.colors renamed to theme.palette"
```

**Commit types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Formatting, missing semicolons, etc.
- `refactor:` - Code change that neither fixes a bug nor adds a feature
- `perf:` - Performance improvement
- `test:` - Adding missing tests
- `chore:` - Maintain tooling, dependencies, etc.

---

## Code Standards

### TypeScript

- **Strict Mode**: Enabled (no `any` types)
- **Naming Conventions**:
  - `PascalCase` for components and types
  - `camelCase` for functions and variables
  - `UPPER_SNAKE_CASE` for constants
  - Prefix hooks with `use`
- **Type Imports**: Use `import type` for types
- **No Type Assertions**: Avoid `as` unless absolutely necessary
- **No `@ts-ignore`**: Use `@ts-expect-error` with explanation if needed

### React

- **Functional Components**: No class components
- **Hooks**:
  - Follow [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
  - Extract complex logic into custom hooks
  - Memoize expensive calculations with `useMemo`
  - Memoize callbacks with `useCallback`
- **Props**:
  - Define explicit prop types
  - Use destructuring in function signature
  - Document complex props with JSDoc

Example:

```typescript
interface MyComponentProps {
  /** The value to display */
  value: number;
  /** Callback when value changes */
  onChange: (value: number) => void;
  /** Optional theme overrides */
  theme?: Partial<Theme>;
}

export const MyComponent = ({
  value,
  onChange,
  theme,
}: MyComponentProps): JSX.Element => {
  // Component implementation
};
```

### Code Organization

- **File Length**: Keep files under 400 lines (split if larger)
- **Function Length**: Keep functions under 50 lines
- **Single Responsibility**: Each function/component should do one thing
- **Extract Constants**: No magic numbers - use named constants from `config/`
- **Comments**:
  - Explain *why*, not *what*
  - Use JSDoc for public APIs
  - Remove commented-out code before committing

### Clean Code Principles

We follow Uncle Bob's clean code principles:

1. **Meaningful Names**: Variables/functions should reveal intent
2. **Small Functions**: Functions should do one thing well
3. **No Side Effects**: Pure functions when possible
4. **Error Handling**: Don't pass nulls, use proper error boundaries
5. **DRY Principle**: Don't Repeat Yourself
6. **SOLID Principles**: Especially Single Responsibility

---

## Testing

### Unit Tests

We use **Vitest** and **React Testing Library**.

#### Writing Tests

```typescript
// MyComponent.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders the value', () => {
    render(<MyComponent value={42} onChange={() => {}} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('calls onChange when clicked', () => {
    const handleChange = vi.fn();
    render(<MyComponent value={0} onChange={handleChange} />);

    fireEvent.click(screen.getByRole('button'));
    expect(handleChange).toHaveBeenCalledWith(1);
  });
});
```

#### Test Coverage

- **Minimum**: 80% line coverage for new code
- **Focus Areas**:
  - Component rendering
  - User interactions (click, drag, wheel)
  - State transitions
  - Edge cases (boundaries, empty lists, etc.)
  - Accessibility (ARIA, keyboard navigation)

#### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage

# Run specific test file
npm test -- MyComponent.test.tsx
```

### Integration Testing

Test components in the demo app:

1. **Manual Testing**:
   - Touch gestures on mobile devices
   - Mouse wheel scrolling
   - Keyboard navigation
   - Screen reader compatibility

2. **Visual Testing**:
   - Test all theme presets
   - Verify animations are smooth
   - Check for visual regressions

---

## Debugging

### Debug Logging

Enable debug logging in the browser console:

```javascript
// Enable all namespaces
enableAllDebugNamespaces()

// Or enable specific namespaces
window.__QNI_DEBUG__ = true           // CollapsibleNumberPicker
window.__QNI_PICKER_DEBUG__ = true    // Picker physics
window.__QNI_SNAP_DEBUG__ = true      // Snap physics
window.__QNI_STATE_DEBUG__ = true     // State machine
window.__QNI_ANIMATION_DEBUG__ = true // Animations

// Reload page for changes to take effect
location.reload()
```

### Common Issues

#### Pointer Events Not Working

- Check that `pointer-events: none` isn't set on parent elements
- Verify `pointerCapture` is being released properly
- Look for errors in console (pointer ID already released)

#### Snapping Feels Wrong

- Adjust `snapRange` in physics config
- Tune `pullStrength` and `centerLock`
- Check `velocityThreshold` for fast scrolling

#### Animation Stuttering

- Profile with Chrome DevTools Performance tab
- Check for excessive re-renders (React DevTools)
- Verify `transform` is used instead of `top`/`left`
- Ensure `will-change: transform` is set

### Browser DevTools

Useful tools for debugging:

- **React DevTools**: Component hierarchy and props
- **Performance Tab**: Identify rendering bottlenecks
- **Console**: Debug logging output
- **Network Tab**: Check bundle sizes

---

## Pull Request Process

### Before Submitting

Checklist:

- [ ] Code follows style guidelines
- [ ] All tests pass (`npm test`)
- [ ] Linter passes (`npm run lint`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Changes tested in demo app
- [ ] Documentation updated (if needed)
- [ ] CHANGELOG.md updated (if user-facing change)

### PR Title

Use conventional commit format:

```
feat: add haptic feedback intensity control
fix: resolve snap physics at boundaries
docs: update README with new API
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Motivation
Why is this change needed?

## Changes
- List of specific changes made

## Testing
- [ ] Unit tests added/updated
- [ ] Tested in demo app
- [ ] Tested on mobile device (if UI change)

## Screenshots (if applicable)
[Add screenshots here]

## Breaking Changes
[List any breaking changes]

## Related Issues
Closes #123
```

### Review Process

1. **Automated Checks**: CI runs tests and linter
2. **Code Review**: Maintainer reviews code
3. **Feedback**: Address review comments
4. **Approval**: Once approved, PR will be merged
5. **Cleanup**: Delete your feature branch after merge

---

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features (backwards compatible)
- **Patch** (0.0.1): Bug fixes (backwards compatible)

### Current Status

Current version is `0.1.1` (published to npm as `@tensil/kinetic-input`). During v0.x:
- Breaking changes may occur between minor versions
- Version increments: `0.1.x → 0.2.0`
- Each release updates CHANGELOG.md

### Release Checklist (for maintainers)

- [ ] Update version in `package.json`
- [ ] Update CHANGELOG.md
- [ ] Run full test suite
- [ ] Build package (`npm run build`)
- [ ] Test build in demo
- [ ] Create git tag (`v0.1.0`)
- [ ] Push to GitHub
- [ ] Publish to npm (`npm publish`)
- [ ] Create GitHub release with notes

---

## Code of Conduct

### Our Standards

- **Be Respectful**: Treat everyone with respect
- **Be Constructive**: Provide helpful feedback
- **Be Patient**: Everyone is learning
- **Be Inclusive**: Welcome newcomers

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Publishing private information
- Other unprofessional conduct

### Enforcement

Violations should be reported to the project maintainers. Consequences may include:
- Warning
- Temporary ban
- Permanent ban

---

## Questions?

- **Documentation**: See [README.md](./README.md) and [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Issues**: Check [GitHub Issues](https://github.com/NullSense/Kinetic-Input/issues)
- **Discussions**: Use [GitHub Discussions](https://github.com/NullSense/Kinetic-Input/discussions)

---

Thank you for contributing to Kinetic Input! 🎉
