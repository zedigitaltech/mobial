# Mobial i18n Language Support Analysis

## Current State (language-switcher.tsx, line 15-20)
```typescript
const languages = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
] as const
```

Currently supported in `src/i18n/locale.ts`:
- `SUPPORTED_LOCALES = ['en', 'de', 'es', 'fr']`
- `DEFAULT_LOCALE = 'en'`

## Language Mapping: Current vs. Needed

### Currently Supported (4 languages)
| Code | Language | Region | Current | Flag |
|------|----------|--------|---------|------|
| en | English | Global/UK | ✓ | 🇬🇧 |
| de | Deutsch | Germany/Austria/Switzerland | ✓ | 🇩🇪 |
| es | Español | Spain/Latin America | ✓ | 🇪🇸 |
| fr | Français | France/Belgium/Switzerland | ✓ | 🇫🇷 |

### Balkan Languages (Needed Additions)
| Code | Language | Region | ISO 639-1 | Native Name | Flag | Priority |
|------|----------|--------|-----------|-------------|------|----------|
| sq | Albanian | Albania/Kosovo | ISO 639-1 | Shqip | 🇦🇱 | High |
| sr | Serbian | Serbia/Bosnia | ISO 639-1 | Српски | 🇷🇸 | High |
| hr | Croatian | Croatia | ISO 639-1 | Hrvatski | 🇭🇷 | High |
| bs | Bosnian | Bosnia/Herzegovina | ISO 639-1 | Bosanski | 🇧🇦 | High |
| mk | Macedonian | North Macedonia | ISO 639-1 | Македонски | 🇲🇰 | High |
| cnr | Montenegrin | Montenegro | (No ISO 639-1) | Црногорски | 🇲🇪 | Medium |
| sl | Slovenian | Slovenia | ISO 639-1 | Slovenščina | 🇸🇮 | High |
| bg | Bulgarian | Bulgaria | ISO 639-1 | Български | 🇧🇬 | High |
| ro | Romanian | Romania/Moldova | ISO 639-1 | Română | 🇷🇴 | High |
| el | Greek | Greece/Cyprus | ISO 639-1 | Ελληνικά | 🇬🇷 | Medium |
| tr | Turkish | Turkey/Cyprus | ISO 639-1 | Türkçe | 🇹🇷 | Medium |
| it | Italian | Italy/Switzerland | ISO 639-1 | Italiano | 🇮🇹 | Medium |
| pt | Portuguese | Portugal/Brazil | ISO 639-1 | Português | 🇵🇹 | Medium |

### Geographic Coverage Summary

**Balkans (Core Market)**: Albanian (sq), Serbian (sr), Croatian (hr), Bosnian (bs), Macedonian (mk), Montenegrin (cnr), Slovenian (sl) = 7 languages

**Broader European Neighbors**: Bulgarian (bg), Romanian (ro), Greek (el), Turkish (tr), Italian (it), Portuguese (pt) = 6 languages

**Total Proposed**: 13 new languages + 4 existing = **17 total supported locales**

## Key Implementation Notes

### Montenegrin (cnr) Consideration
- Montenegrin does not have an official ISO 639-1 code (shares 639-3 code `cnr`)
- Historically treated as dialect of Serbian
- Officially recognized as separate language since Montenegro independence (2006)
- For next-intl compatibility, can use `cnr` as custom code or consider using `sr-ME` (Serbian-Montenegro)

### Regional Variants
Consider future support for regional variants:
- `pt-BR` (Brazilian Portuguese) vs `pt-PT` (European Portuguese)
- `es-MX` (Mexican Spanish) vs `es-ES` (European Spanish)
- `sr-Latn` (Serbian Latin script) vs `sr-Cyrl` (Serbian Cyrillic)

## Integration Points to Update

1. **src/i18n/locale.ts**
   - Update `SUPPORTED_LOCALES` array from 4 to 17 languages
   - Consider adding language metadata (native names, regions)

2. **src/components/common/language-switcher.tsx**
   - Expand `languages` array with 13 new entries
   - Update flag emojis appropriately
   - Add second region selector if regional variants implemented

3. **API Endpoint: POST /api/locale**
   - Currently accepts locale via `{ locale: newLocale }` JSON body
   - Should validate against expanded SUPPORTED_LOCALES list

4. **Middleware.ts (src/middleware.ts)**
   - Currently has NO Accept-Language header detection
   - Should detect browser Accept-Language and suggest appropriate locale
   - Falls back to DEFAULT_LOCALE if no match found
