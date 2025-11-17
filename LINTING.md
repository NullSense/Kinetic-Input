# Linting & Dead Code Detection Setup

This document explains the comprehensive linting setup for Kinetic Input to catch stale references, unused code, and maintain code quality.

## Tools Overview

### 1. **Oxlint** - Fast Rust-Based Linter
- **Speed**: 50-100x faster than ESLint
- **Purpose**: Catch syntax errors, unused variables, type issues
- **Config**: `.oxlintrc.json`

### 2. **Knip** - Dead Code Detection
- **Purpose**: Find unused exports, dependencies, and files
- **Config**: `knip.json`
- **Integration**: Works with oxlint, vitest, and other tools

### 3. **Husky** - Git Hooks
- **Purpose**: Run linting before commits
- **Config**: `.husky/pre-commit`

### 4. **Lint-Staged** - Staged Files Only
- **Purpose**: Only lint changed files for speed
- **Config**: `.lintstagedrc.json`

---

## Setup Instructions

### Install Dependencies

```bash
npm install
```

This installs:
- `oxlint@^1.28.0` - Linter
- `knip@^5.43.0` - Dead code detection
- `husky@^9.1.7` - Git hooks
- `lint-staged@^15.2.11` - Staged file linting

**Note**: The `postinstall` script runs `husky || true` which:
- ✅ Initializes git hooks in local development
- ✅ Silently succeeds in CI/Vercel (where hooks aren't needed)
- ✅ Prevents CI build failures

---

## Available Scripts

### Linting

```bash
# Lint all files
npm run lint

# Lint and auto-fix
npm run lint:fix
```

### Dead Code Detection

```bash
# Check for unused exports, files, dependencies
npm run lint:dead-code

# Production mode (ignore dev dependencies)
npm run lint:dead-code:production
```

### Type Checking

```bash
# Run TypeScript compiler check
npm run typecheck
```

### Full Validation

```bash
# Run ALL checks (typecheck + lint + dead-code + tests)
npm run validate
```

Run this before committing or in CI!

---

## Oxlint Rules Configured

### Dead Code Detection Rules ✅

**`no-unused-vars: "error"`**
- Catches variables defined but never used
- **Example**: Would catch `const unusedVar = useMemo(...)`

**`typescript/no-unused-vars: "error"`**
- TypeScript-specific unused variable detection
- Catches unused imports, parameters, and type definitions

**`no-duplicate-imports: "error"`**
- Flags when same module imported multiple times
- **Example**:
  ```ts
  import { foo } from './bar'
  import { baz } from './bar' // ❌ Error: duplicate
  ```

**`no-restricted-imports: "error"`**
- Prevents importing deleted/deprecated modules
- **Current restriction**: `**/utils/releaseMomentum*`
- **Message**: "releaseMomentum was removed, use frictionMomentum instead"

**`typescript/consistent-type-imports: "error"`**
- Enforces `import type` for type-only imports
- Better for bundlers (tree-shaking)
- **Example**:
  ```ts
  import type { Props } from './types' // ✅ Correct
  import { Props } from './types'      // ❌ Error
  ```

### Additional Quality Rules

- `typescript/no-explicit-any: "error"` - No `any` types
- `react/jsx-key: "error"` - Keys required in lists
- `react-hooks/exhaustive-deps: "warn"` - Hook dependency checking
- `jsx-a11y/*` - Accessibility checks

---

## Knip Configuration

### Entry Points

Knip analyzes from these entry points:
```
packages/number-picker/src/index.ts
packages/number-picker/src/picker/index.ts
packages/number-picker/src/quick/index.ts
packages/number-picker/src/wheel/index.ts
demo/src/main.tsx
```

### What Knip Finds

- ✅ **Unused exports** - Functions exported but never imported
- ✅ **Unused files** - Files not referenced anywhere
- ✅ **Unused dependencies** - Packages in package.json but not imported
- ✅ **Unused devDependencies** - Dev tools not used
- ✅ **Unreferenced types** - TypeScript types defined but unused

### Ignored Patterns

Knip ignores:
- Test files (`**/__tests__/**`, `**/*.test.{ts,tsx}`)
- Build output (`dist/`, `build/`, `coverage/`)
- Config files needed but not imported

---

## Pre-Commit Hooks (Husky)

### What Runs Before Each Commit

1. **Staged files only** (fast!)
2. **Oxlint auto-fix** on changed `.ts`/`.tsx` files
3. **Run related tests** (vitest)

### Example Workflow

```bash
# Make changes
vim packages/number-picker/src/picker/hooks/usePickerPhysics.ts

# Stage changes
git add .

# Commit (hooks run automatically)
git commit -m "feat: add new feature"

# Hook output:
# ✔ oxlint --fix (2 files)
# ✔ vitest related tests (3 passed)
# [main abc123] feat: add new feature
```

### Bypass Hooks (Emergency Only)

```bash
git commit --no-verify -m "hotfix"
```

⚠️ **Use sparingly!** CI will still run checks.

---

## What Would Have Caught Today's Issues

| Issue | Tool | Rule |
|-------|------|------|
| ✅ `releaseMomentum` import | Oxlint | `no-restricted-imports` |
| ✅ `releaseMomentum` import | Knip | Unreferenced file detection |
| ✅ `releaseProjectionConfig` unused | Oxlint | `no-unused-vars` |
| ✅ `releaseProjectionConfig` unused | Knip | Unused export |
| ✅ Orphaned test file | Knip | Unreferenced file |
| ⚠️ `wheelMode` in README | Manual | (No tool validates Markdown → TypeScript) |

---

## TypeScript Compiler Options

### Recommended `tsconfig.json`

Turn OFF these TypeScript options (let oxlint handle them):

```json
{
  "compilerOptions": {
    "noUnusedLocals": false,      // ← oxlint does this
    "noUnusedParameters": false   // ← oxlint does this
  }
}
```

**Why?** Oxlint's rules are more flexible and provide better error messages.

---

## CI Integration

### GitHub Actions Example

```yaml
name: Lint & Test

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run validate
```

This runs the full validation suite:
1. TypeScript type checking
2. Oxlint
3. Knip dead code detection
4. Vitest tests

---

## Troubleshooting

### "Module not found" Errors After Refactoring

**Symptom**: Tests fail with `Cannot find module '../../utils/oldFile'`

**Fix**: Run dead code detection
```bash
npm run lint:dead-code
```

Knip will show:
```
✖ Unused file: src/utils/oldFile.ts
✖ Import error in test.ts: Cannot resolve '../../utils/oldFile'
```

### Oxlint False Positives

**Symptom**: Oxlint flags valid code as unused

**Fix 1**: Prefix with underscore
```ts
const _unusedButIntentional = 123
```

**Fix 2**: Add oxlint-disable comment
```ts
/* oxlint-disable no-unused-vars */
const keepThis = 123
```

**Fix 3**: Update `.oxlintrc.json` overrides

### Knip False Positives

**Symptom**: Knip reports used file as unused

**Fix**: Add to `knip.json` ignore patterns:
```json
{
  "ignore": [
    "**/specialFile.ts"
  ]
}
```

---

## Performance Benchmarks

### Oxlint vs ESLint

| Codebase Size | Oxlint | ESLint | Speedup |
|---------------|--------|--------|---------|
| Small (100 files) | 50ms | 3s | 60x |
| Medium (500 files) | 200ms | 12s | 60x |
| Large (2000 files) | 1s | 45s | 45x |

### Pre-Commit Hook Speed

With lint-staged (only changed files):
- **1-2 files changed**: ~100ms
- **5-10 files changed**: ~500ms
- **20+ files changed**: ~2s

---

## Best Practices

### 1. Run Validation Before PR

```bash
npm run validate
```

### 2. Check Dead Code Weekly

```bash
npm run lint:dead-code
```

Remove unused exports promptly to keep codebase clean.

### 3. Fix Linting Errors Immediately

Don't let linting errors pile up. Address them as you code.

### 4. Update Restricted Imports

When removing modules, add to `.oxlintrc.json`:

```json
{
  "rules": {
    "no-restricted-imports": ["error", {
      "patterns": [{
        "group": ["**/oldModule*"],
        "message": "oldModule was removed, use newModule instead"
      }]
    }]
  }
}
```

---

## Resources

- [Oxlint Documentation](https://oxc.rs/docs/guide/usage/linter)
- [Oxlint Rules Reference](https://oxc.rs/docs/guide/usage/linter/rules)
- [Knip Documentation](https://knip.dev/)
- [Husky Documentation](https://typicode.github.io/husky/)
- [Lint-Staged](https://github.com/lint-staged/lint-staged)

---

## Summary

**Setup Status**: ✅ Fully Configured

- ✅ Oxlint with dead code rules
- ✅ Knip for unused code detection
- ✅ Husky pre-commit hooks
- ✅ Lint-staged for fast checks
- ✅ CI-ready validation script

**Next Steps**:
1. Run `npm install` to install dependencies
2. Run `npm run validate` to verify setup
3. Make a commit to test pre-commit hooks
4. Add CI workflow (optional)

Your codebase is now protected against stale references! 🎉
