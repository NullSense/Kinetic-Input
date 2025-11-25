# Picker interaction review

The review below highlights interaction issues and improvement ideas observed in the picker implementation.

## Accessibility and focus handling
- The picker column container is rendered as a plain `div` with pointer handlers but no list semantics or active descendant wiring, which makes it difficult for screen readers to announce state changes. Consider adding `role="listbox"`, `aria-activedescendant` pointing at the selected option, and `aria-label`/`aria-labelledby` props. List items can expose `role="option"` with `aria-selected` to mirror the visible highlight states. Ensuring the highlighted element receives focus updates will improve keyboard and assistive tech usability.【F:packages/number-picker/src/picker/PickerColumn.tsx†L267-L329】

## Pointer capture cleanup
- Pointer captures are tracked during drag gestures and released on pointer-up/double-click, but there is no unmount cleanup to release any capture if the component is removed mid-gesture. Adding a `useEffect` cleanup that iterates `capturedPointersRef` and releases remaining IDs would prevent stuck captures that can block scrolling or other page interactions after abrupt unmounts (e.g., route changes).【F:packages/number-picker/src/picker/hooks/usePickerPhysics.ts†L556-L610】【F:packages/number-picker/src/picker/hooks/usePickerPhysics.ts†L661-L760】【F:packages/number-picker/src/picker/hooks/usePickerPhysics.ts†L980-L1030】

## Tunable physics for different contexts
- Spring and snap physics constants (stiffness/damping) are currently hard-coded when starting settle animations and friction momentum, which limits tuning for device classes or theme-specific motion preferences. Exposing these values through props or a theme config would allow softer motion for desktop mice versus more responsive motion for touch contexts without editing source constants.【F:packages/number-picker/src/picker/hooks/usePickerPhysics.ts†L345-L388】【F:packages/number-picker/src/picker/hooks/usePickerPhysics.ts†L523-L539】
