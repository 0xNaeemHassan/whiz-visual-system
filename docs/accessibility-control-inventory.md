# Accessibility Control Inventory

## Scope
- `src/components/*`
- `src/pages/Editor.jsx`

## Icon-only buttons
- `IconButton` primitive (`src/components/primitives.jsx`) is the shared source for icon-only button naming via `aria-label`.
- `Editor.jsx`: modal close buttons, zoom/action glyph buttons, and save delete glyph button now use `IconButton` with explicit labels.
- Existing `AccessibleIconButton` is retained as alias to `IconButton` for backward compatibility.

## Custom radios
- `AspectRatioSelector.jsx` (`role="radiogroup"`, children `role="radio"`).
- `PatternSelector.jsx` (`role="radiogroup"`, children `role="radio"`).
- `ImageUpload.jsx` has fit/depth custom radio groups.

## Modal actions
- `ConfirmDialog.jsx`: confirm/cancel are text-labeled buttons.
- `Editor.jsx`: command palette, table import, save/load, compare, and keyboard help close controls now have explicit icon-button labels.

## Naming policy
Each interactive control should have exactly one explicit accessible naming source:
- preferred for icon-only controls: `aria-label` via `IconButton`
- preferred for form fields: visible `<label>`/`aria-labelledby`
- avoid mixing both `aria-label` and `aria-labelledby` on the same control unless intentional override is required.
