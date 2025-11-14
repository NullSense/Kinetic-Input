# Debug Logging Guide

**TL;DR:** Debug logging is **OFF by default** to prevent console spam. Enable it when you need it.

---

## Quick Start

### Enable All Debug Logs

**In browser console:**
```javascript
window.__QNI_DEBUG__ = true;
window.__QNI_SNAP_DEBUG__ = true;
window.__QNI_STATE_DEBUG__ = true;
window.__QNI_WHEEL_DEBUG__ = true;

// Reload page
location.reload();
```

**Or programmatically:**
```typescript
import { enableAllDebugNamespaces } from '@tensil/number-picker/utils';

if (import.meta.env.DEV) {
  enableAllDebugNamespaces();
  // Reload page
}
```

### Disable All Debug Logs

```javascript
import { disableAllDebugNamespaces } from '@tensil/number-picker/utils';

disableAllDebugNamespaces();
// Reload page
```

---

## Available Debug Namespaces

| Namespace | Flag | What it logs |
|-----------|------|--------------|
| **QuickNumberInput** | `window.__QNI_DEBUG__` | Main component lifecycle, picker open/close |
| **SnapPhysics** | `window.__QNI_SNAP_DEBUG__` | Snap calculations, velocity tracking |
| **StateMachine** | `window.__QNI_STATE_DEBUG__` | State transitions, timer events |
| **WheelPicker** | `window.__QNI_WHEEL_DEBUG__` | Wheel picker interactions |

---

## Performance Impact

| Environment | Overhead | Notes |
|-------------|----------|-------|
| **Production** | Zero | Completely tree-shaken out |
| **Development (disabled)** | ~0.0001ms per call | Early return check only |
| **Development (enabled)** | ~0.001ms per call | Includes console.debug overhead |

**Bottom line:** No performance concerns even with all namespaces enabled.

---

## Example Debug Output

**When enabled:**
```
[QuickNumberInput] Picker opened { value: 42, min: 0, max: 500 }
[StateMachine] State transition { from: 'closed', to: 'interacting' }
[SnapPhysics] Snap calculated { offset: 10, velocity: 250 }
[StateMachine] State transition { from: 'interacting', to: 'settling' }
[StateMachine] State transition { from: 'settling', to: 'idle' }
[QuickNumberInput] Auto-close scheduled { delay: 150, reason: 'gesture' }
```

**When disabled (default):**
```
(clean console - no picker logs)
```

---

## Production Safety

### Automatic Protection

Debug logging is automatically disabled in production through multiple layers:

1. **Build-time stripping** - Bundlers remove debug code when `NODE_ENV=production`
2. **Runtime gate** - `isProduction()` check prevents logging even if flags are set
3. **Tree-shaking** - Minifiers optimize away unused debug functions

### Verification

Check your production bundle:
```bash
npm run build
# Debug code should not appear in dist/index.js
grep -i "debugLog" dist/index.js  # Should return nothing
```

---

## Common Use Cases

### Debugging State Machine Issues

```javascript
// Enable only state machine logs
window.__QNI_STATE_DEBUG__ = true;
location.reload();

// Interact with picker, observe state transitions in console
```

### Debugging Snap Physics

```javascript
// Enable snap physics logs
window.__QNI_SNAP_DEBUG__ = true;
location.reload();

// Drag picker slowly, observe snap calculations
```

### Debugging Everything

```javascript
// Nuclear option - enable all namespaces
import { enableAllDebugNamespaces } from '@tensil/number-picker/utils';
enableAllDebugNamespaces();
location.reload();
```

---

## Why OPT-IN?

**Problem with auto-enable:**
- Console spam in development (100s-1000s of logs)
- Hard to find your own app's logs
- Performance degradation from excessive logging
- Developers assume something is broken

**Solution (opt-in):**
- Clean console by default
- Enable only when debugging specific issues
- Better developer experience
- No false alarms

---

## Tips

1. **Enable selectively** - Only enable the namespace you're debugging
2. **Reload after setting flags** - Flags are checked on module load
3. **Use browser console** - Easiest way to toggle flags during development
4. **Don't commit flags** - Keep debug flags out of source code (use console instead)

---

## Troubleshooting

**"I set the flag but don't see logs"**
- Did you reload the page? Flags are checked on module load
- Are you in production? Debug is always disabled in production
- Check the console for the confirmation message from `enableAllDebugNamespaces()`

**"Logs are spamming my console"**
```javascript
// Disable the noisy namespace
window.__QNI_SNAP_DEBUG__ = false;
location.reload();
```

**"I want to enable debug for a demo/staging environment"**
```typescript
// In your app initialization
const isStaging = window.location.hostname.includes('staging');

if (isStaging) {
  window.__QNI_DEBUG__ = true;
}
```

---

## Developer Notes

### Adding New Debug Logs

```typescript
import { debugLog } from '@tensil/number-picker/utils';

function myComponent() {
  debugLog('Component initialized', { props });

  // No-op unless __QNI_DEBUG__ = true
  // Zero overhead in production (tree-shaken)
}
```

### Creating New Debug Namespaces

```typescript
// In src/utils/debug.ts
export const DEBUG_MY_FEATURE = logger.register('MyFeature', () =>
  resolveDebugFlag('__QNI_MY_FEATURE_DEBUG__')
);

export const debugMyFeatureLog = (...args: unknown[]) =>
  logger.log(DEBUG_MY_FEATURE, ...args);
```

---

**Questions?** Check ARCHITECTURE.md for debug system design details.
