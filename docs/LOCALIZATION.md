# Localization / i18n

## Setup

Custom (no react-i18next). Core: `src/utils/i18n.ts`.

### Supported Locales

| Code | Language | Direction | File |
|------|----------|-----------|------|
| `ar` | Arabic (default) | RTL | `src/locales/ar.json` |
| `en` | English | LTR | `src/locales/en.json` |
| `ckb` | Kurdish Sorani | RTL | `src/locales/ckb.json` |

### Usage

```tsx
import { t } from "../../utils/i18n";

// Flat key
<p>{t("common.save")}</p>

// With interpolation
<p>{t("attachment.maxSize", { size: 10 })}</p>
```

### Switching Languages

- Saved to `localStorage` key `mcc_language`.
- Available in `AppLayout` via the language selector button.
- Sequence: Arabic → English → Kurdish Sorani → Arabic.
- On change: `html` `lang` and `dir` attributes update immediately.
- Page reloads to apply full locale file swap.

## Format Utilities

`src/utils/format.ts` exposes locale-aware formatters:

| Function | Example |
|----------|---------|
| `formatDate(date)` | "١٥ يناير ٢٠٢٦" or "Jan 15, 2026" |
| `formatDateTime(date)` | "١٥ يناير ٢٠٢٦ ١٠:٣٠" |
| `formatNumber(n)` | "١٬٢٣٤" or "1,234" |
| `formatFileSize(bytes)` | "٢٫٥ م.ب" or "2.5 MB" |
| `formatCurrency(amount, currency)` | "١٠٠ د.ع" or "$100.00" |

## Adding a New Locale

1. Create `src/locales/{code}.json` with the same flat keys as `ar.json`.
2. Add to `Lang` type and `RTL_LANGS` map in `src/utils/i18n.ts`.
3. Add import in `src/utils/i18n.ts`.
4. Run locale key parity tests: `npm test`.

## Key Parity

The test suite (`frontend.test.tsx` > "Locale key parity") enforces that all
three locale files share identical keys. Missing keys cause test failure.

## Translation Audit

## Phase 8C Keys Added

### Privacy Module (`privacy.*`)

| Key | Description |
|-----|-------------|
| `privacy.title` | Privacy settings page title |
| `privacy.export.*` | Data export labels, statuses, messages |
| `privacy.deactivation.*` | Account deactivation labels, confirmations |
| `privacy.deletion.*` | Account deletion labels, statuses |
| `privacy.status.*` | Status labels (pending, completed, expired, etc.) |

See `docs/PRIVACY.md` for full key reference.

### Operations Module (`operations.*`)

| Key | Description |
|-----|-------------|
| `operations.title` | Operations dashboard title |
| `operations.status.*` | System status labels |
| `operations.metrics.*` | Metrics labels and values |
| `operations.version` | Version display |
| `operations.degraded` | Degraded components warning |

See `docs/OPERATIONS.md` for full key reference.

---

Before release, search for hardcoded display strings:
```bash
grep -rn '>[A-Z][a-z]' src/pages/ src/components/ | grep -v '\.tsx:.*//'
```
Every user-facing string should use `t("key")`.
