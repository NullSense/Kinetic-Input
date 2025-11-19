# Pre-Publish Checklist for @tensil/number-picker

## ✅ Code Quality
- [x] All 40 unit tests passing
- [x] No console.log statements in production code
- [x] TypeScript strict mode enabled
- [x] Build succeeds without errors (`npm run build`)
- [x] Infinite loop bugs fixed (Firefox + state machine)

## ✅ Documentation (User-Facing)
- [x] README.md comprehensive and accurate
- [x] API documentation complete (props, types, examples)
- [x] Auto-close timing documented (150ms/800ms/1.5s)
- [x] DEBUG.md explains debug flags
- [x] ARCHITECTURE.md documents advanced APIs

## ❌ Package Metadata (NEEDS ATTENTION)
- [ ] `package.json` `"private": false` (currently `true`)
- [ ] Professional description (currently "Experimental packaging scaffold...")
- [ ] `"license"` field (e.g., "MIT", "Apache-2.0")
- [ ] `"author"` field (name and email)
- [ ] `"repository"` field (GitHub URL)
- [ ] `"homepage"` field (docs site or repo URL)
- [ ] `"bugs"` field (issue tracker URL)
- [ ] Version set to `0.1.0` or `1.0.0` (currently `0.0.1`)

## ❌ Documentation Cleanup (NEEDS ATTENTION)
- [ ] Move internal docs to `docs/internal/` or `.internal/`
  - `MIGRATION.md` (dev-only XState migration notes)
  - `snap-roadmap.md` (dev-only roadmap)
  - `docs/snap-architecture.md` (implementation details)
- [ ] Consider merging DEBUG.md into README "Debugging" section
- [ ] Consider merging ARCHITECTURE.md into README "Advanced" section
- [ ] Add CHANGELOG.md with version history

## ⚠️ Pre-Publish Actions
- [ ] Bump version appropriately (`npm version [patch|minor|major]`)
- [ ] Run `npm run build:number-picker` one final time
- [ ] Verify `dist/` output looks correct
- [ ] Test installation in a fresh project:
  ```bash
  npm pack  # Creates tarball
  cd /tmp/test-project && npm install /path/to/tensil-number-picker-0.1.0.tgz
  ```
- [ ] Verify peer dependencies are correctly listed
- [ ] Verify `dist/` includes CSS files

## 📦 Publishing
- [ ] `cd packages/number-picker`
- [ ] `npm publish --access public` (if scoped package)
- [ ] Tag release in Git: `git tag @tensil/number-picker@0.1.0`
- [ ] Push tags: `git push --tags`

## Post-Publish
- [ ] Update main app to use published version
- [ ] Add GitHub release with changelog
- [ ] Update README with npm install badge
- [ ] Announce on relevant channels

---

## Recommended package.json Updates

```json
{
  "name": "@tensil/number-picker",
  "version": "0.1.0",
  "private": false,
  "description": "High-performance React scrubber components with momentum scrolling, smart auto-close, and full theming support",
  "author": "Your Name <email@example.com>",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourorg/yourrepo",
    "directory": "packages/number-picker"
  },
  "homepage": "https://github.com/yourorg/yourrepo/tree/main/packages/number-picker",
  "bugs": {
    "url": "https://github.com/yourorg/yourrepo/issues"
  },
  "keywords": [
    "react",
    "picker",
    "number-input",
    "scrubber",
    "wheel-picker",
    "touch",
    "momentum",
    "mobile"
  ]
}
```

---

## Documentation Structure Recommendation

**Keep in package root:**
- `README.md` - Main docs (merge DEBUG + ARCHITECTURE sections)
- `CHANGELOG.md` - Version history
- `LICENSE` - License file

**Move to `.internal/` or exclude from npm:**
- `MIGRATION.md`
- `snap-roadmap.md`
- `docs/snap-architecture.md`
- `docs/DEVTOOLS_VALIDATION.md`

**Update `.npmignore` or `package.json` files array:**
```json
{
  "files": [
    "dist",
    "README.md",
    "CHANGELOG.md",
    "LICENSE"
  ]
}
```
