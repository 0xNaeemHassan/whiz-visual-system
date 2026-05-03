# Primitive Component Coverage Map

This map defines required test cases for `src/components/primitives.jsx` and expected coverage targets.

## Coverage thresholds

- **File:** `src/components/primitives.jsx`
- **Lines:** >= 95%
- **Statements:** >= 95%
- **Functions:** >= 95%
- **Branches:** >= 90%

## Explicit case mapping

| Primitive / helper behavior | Required test cases | Notes |
| --- | --- | --- |
| `IconButton` | defaults `type="button"`; applies `aria-label` from `label`; defaults `title` to `label`; preserves explicit `title` | Rendering + accessibility contract |
| `AccessibleIconButton` alias | mirrors `IconButton` behavior | Ensures export alias contract |
| `LabeledField` ID fallback helper (`labeledFieldIdCounter` + memoized id) | generated id shape `labeled-field-n`; label id `-label`; `htmlFor` points at resolved field id | A11y binding contract |
| `LabeledField` child clone behavior | injects child `id` and `aria-labelledby` when missing; preserves explicit child `id`; preserves explicit child `aria-labelledby` | Prop merge/precedence behavior |
| `SemanticChip` token map (`CHIP_TOKENS`) | `status:published` token selection; `risk:unknown` default fallback; unknown `kind` fallback to `category.default` | Explicit case table in tests |
| `SemanticChip` rendering behavior | uses `children` over `value`; merges caller `style` overrides | Rendering + style precedence |
| `Sparkline` empty guard | returns `null` for empty `values` | Defensive rendering contract |
| `Sparkline` stroke helper maps (`SPARKLINE_STROKES`) | `strokeWidth="thick"` -> `2.25`; unknown width falls back to `regular` (recommended additional case) | Mapping validation |
| `Sparkline` role color helper (`ROLE_COLORS`) | `contrast` fixed color; `subtle` appends transparency to accent | Helper behavior via rendered stroke |
| `Sparkline` baseline + marker branching | baseline `mid` renders dashed line; baseline `none` omits line; marker `all` renders N circles; marker `last` renders one circle | Branch coverage focus |

## Test implementation location

- `src/components/primitives.test.jsx`

