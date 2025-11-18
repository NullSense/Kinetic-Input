# Publishing Guide: @tensil/kinetic-input

## Prerequisites

### 1. NPM Account Setup
```bash
# Create NPM account if you don't have one
https://www.npmjs.com/signup

# Login to NPM
npm login

# Verify login
npm whoami
```

### 2. Package Scope Access
Ensure you have publish access to the `@tensil` scope:
```bash
npm access ls-packages @tensil
```

If you don't have access, you'll need to either:
- Create the `@tensil` scope (if it doesn't exist)
- Request access from the scope owner

---

## Pre-Publish Checklist

### 1. Version Validation
```bash
# Check current version
cd packages/number-picker
cat package.json | grep version

# Ensure version follows semver
# Format: MAJOR.MINOR.PATCH (e.g., 0.1.0, 1.0.0, 1.2.3)
```

### 2. Build Verification
```bash
# Clean build
cd /home/user/Kinetic-Input
npm run build

# Verify build artifacts
ls -la packages/number-picker/dist/

# Expected output:
# - dist/index.js
# - dist/index.d.ts
# - dist/styles/*.css
# - dist/quick/
# - dist/wheel/
# - dist/picker/
```

### 3. Run Tests
```bash
# Run all tests
npm test

# Run linter
npm run lint

# Run type check
npm run typecheck
```

### 4. Verify Package Contents
```bash
cd packages/number-picker

# Dry-run pack to see what will be published
npm pack --dry-run

# Review files that will be included
# Check: package.json "files" field matches dist/
```

### 5. Update Package Metadata

Edit `packages/number-picker/package.json`:
```json
{
  "name": "@tensil/kinetic-input",
  "version": "0.1.0",  // ← Update this before publishing
  "description": "Kinetic iOS-style wheel picker with momentum, haptics, and audio",
  "author": "Your Name",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/NullSense/Kinetic-Input.git"
  },
  "keywords": [
    "react",
    "picker",
    "wheel-picker",
    "touch",
    "momentum",
    "mobile",
    "xstate",
    "framer-motion",
    "accessibility"
  ]
}
```

---

## Publishing Process

### Option 1: Manual Publish (Recommended for First Release)

```bash
cd packages/number-picker

# 1. Bump version (choose one)
npm version patch  # 0.1.0 → 0.1.1 (bug fixes)
npm version minor  # 0.1.0 → 0.2.0 (new features, backward compatible)
npm version major  # 0.1.0 → 1.0.0 (breaking changes)

# 2. Build package
npm run build

# 3. Publish to NPM
npm publish --access public

# 4. Verify publication
npm view @tensil/kinetic-input
```

### Option 2: Automated with CI/CD

Create `.github/workflows/publish.yml`:
```yaml
name: Publish Package

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Publish
        run: |
          cd packages/number-picker
          npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

Then publish by pushing a git tag:
```bash
git tag v0.1.0
git push origin v0.1.0
```

---

## Post-Publish Steps

### 1. Verify Package Installation
```bash
# Test in a new directory
mkdir test-install && cd test-install
npm init -y
npm install @tensil/kinetic-input

# Check installed files
ls -la node_modules/@tensil/kinetic-input/
```

### 2. Update Demo Site
```bash
cd /home/user/Kinetic-Input/demo

# Update to use published package instead of local
# Edit demo/package.json:
{
  "dependencies": {
    "@tensil/kinetic-input": "^0.1.0"  // Change from "*"
  }
}

npm install
npm run build
```

### 3. Update StackBlitz Examples
- All StackBlitz embeds will now resolve correctly
- No more "Can't find package" errors
- Peer dependencies will install cleanly

### 4. Create GitHub Release
```bash
# Tag the release
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0

# Create GitHub release with changelog
```

---

## Version Strategy

### Semantic Versioning Guide
| Version | Use Case | Example Changes |
|---------|----------|-----------------|
| **Patch** (0.1.0 → 0.1.1) | Bug fixes, docs | Fix haptic timing bug |
| **Minor** (0.1.0 → 0.2.0) | New features (backward compatible) | Add settle haptic feedback |
| **Major** (0.1.0 → 1.0.0) | Breaking changes | Change prop names, remove APIs |

### Pre-1.0.0 Considerations
- Version `0.x.x` signals "in development"
- Breaking changes allowed in minor versions
- Stable API = bump to `1.0.0`

---

## Troubleshooting

### "Package already exists"
```bash
# Version collision - bump version
cd packages/number-picker
npm version patch
npm publish --access public
```

### "403 Forbidden"
```bash
# Not logged in or no access
npm login
npm access ls-packages @tensil

# If scope doesn't exist, create it on npmjs.com
```

### "Missing dependencies"
```bash
# Ensure peer dependencies are correctly declared
# Check package.json "peerDependencies" field
```

### Build Artifacts Missing
```bash
# Ensure prepublishOnly script runs
cd packages/number-picker
npm run build

# Check tsup.config.ts and package.json "files" field
```

---

## Package Access Levels

### Public Package (Recommended)
```bash
npm publish --access public
```
- Free
- Anyone can install
- Best for open-source

### Private Package
```bash
npm publish --access restricted
```
- Requires paid NPM account
- Only authenticated users can install

---

## Rollback / Unpublish

### Deprecate Version (Recommended)
```bash
# Mark version as deprecated
npm deprecate @tensil/kinetic-input@0.1.0 "Please upgrade to 0.1.1"
```

### Unpublish (Use Carefully)
```bash
# Unpublish specific version (only within 72 hours)
npm unpublish @tensil/kinetic-input@0.1.0

# Unpublish entire package (DANGEROUS)
npm unpublish @tensil/kinetic-input --force
```

⚠️ **Warning**: Unpublishing breaks existing users. Only unpublish if absolutely necessary.

---

## Continuous Delivery Setup

### Changesets (Recommended)
```bash
npm install -D @changesets/cli
npx changeset init

# Workflow:
# 1. Make changes
# 2. npx changeset  (document changes)
# 3. npx changeset version  (bump version)
# 4. npm run build && npm publish
```

### Conventional Commits + semantic-release
```bash
npm install -D semantic-release

# Auto-versioning based on commit messages:
# feat: ... → minor bump
# fix: ... → patch bump
# feat!: ... → major bump
```

---

## Quick Reference

### First-Time Publish
```bash
cd packages/number-picker
npm version 0.1.0
npm run build
npm publish --access public
```

### Subsequent Releases
```bash
cd packages/number-picker
npm version patch  # or minor/major
npm run build
npm publish
```

### Check Published Package
```bash
npm view @tensil/kinetic-input
npm view @tensil/kinetic-input versions
```

---

## Resources

- [NPM Publishing Guide](https://docs.npmjs.com/cli/v9/commands/npm-publish)
- [Semantic Versioning](https://semver.org/)
- [NPM Package Scope](https://docs.npmjs.com/cli/v9/using-npm/scope)
- [Changesets Documentation](https://github.com/changesets/changesets)
