# Mobial i18n Implementation Plan

## Overview
Convert Mobial from 4-language support (en, de, es, fr) to 17-language support including Balkan, Eastern European, and broader European languages.

## Phase 1: Foundation Setup (Prerequisite)

### 1.1 Extend Locale Configuration
**File:** `src/i18n/locale.ts`

**Current state:** Only 4 locales (en, de, es, fr)

**Required changes:**
- Add 13 new language codes to SUPPORTED_LOCALES
- Update type definitions
- Handle Montenegrin language code decision (recommend using 'cnr' as custom code for now)

**New locales:**
- Balkan: sq (Albanian), sr (Serbian), hr (Croatian), bs (Bosnian), mk (Macedonian), cnr (Montenegrin), sl (Slovenian)
- Eastern European: bg (Bulgarian), ro (Romanian)
- Southern European: el (Greek), tr (Turkish), it (Italian), pt (Portuguese)

### 1.2 Update Language Switcher Component
**File:** `src/components/common/language-switcher.tsx`

**Current state:** Hardcoded array with 4 languages and flag emojis

**Required changes:**
- Expand languages array from 4 to 17 entries
- Add appropriate flag emojis for each new language
- Consider splitting into language configuration file for maintainability

**Flag emoji mapping:**
- Albanian (sq): 🇦🇱
- Serbian (sr): 🇷🇸
- Croatian (hr): 🇭🇷
- Bosnian (bs): 🇧🇦
- Macedonian (mk): 🇲🇰
- Montenegrin (cnr): 🇲🇪
- Slovenian (sl): 🇸🇮
- Bulgarian (bg): 🇧🇬
- Romanian (ro): 🇷🇴
- Greek (el): 🇬🇷
- Turkish (tr): 🇹🇷
- Italian (it): 🇮🇹
- Portuguese (pt): 🇵🇹

## Phase 2: Middleware Enhancement

### 2.1 Add Accept-Language Detection
**File:** `src/middleware.ts`

**Current state:** No Accept-Language header processing or automatic locale detection

**Required changes:**
- Parse Accept-Language header from incoming requests
- Match browser preference against SUPPORTED_LOCALES
- Implement fallback chain (browser preference → cookie preference → default locale)
- Preserve existing security headers (CSP, HSTS, etc.)

**Algorithm:**
1. Check if NEXT_LOCALE cookie already exists → use it
2. Parse Accept-Language header and extract language codes
3. Find first match in SUPPORTED_LOCALES from browser preferences
4. Fall back to DEFAULT_LOCALE (en) if no match
5. Store preference in NEXT_LOCALE cookie for future requests

### 2.2 Update API Route Handler
**File:** `/api/locale` (existing endpoint)

**Current state:** Accepts POST with locale parameter

**Verify:** Endpoint properly validates incoming locale codes against SUPPORTED_LOCALES before storing in cookie

## Phase 3: Component Integration - Hardcoded Strings to next-intl

### 3.1 Priority 1: High-Impact User-Facing Pages

**Target files and estimated hardcoded strings:**

1. **`src/app/(store)/checkout/page.tsx`** (470 lines)
   - ~35-40 hardcoded strings
   - Scope: Form labels, validation messages, trust signals, section headers
   - Impact: Critical user conversion flow

2. **`src/app/(store)/orders/page.tsx`** (430 lines)
   - ~40-50 hardcoded strings
   - Scope: Dashboard headers, status labels, data labels, empty states
   - Impact: Critical post-purchase experience

3. **`src/components/auth/login-form.tsx`** (188 lines)
   - ~15-20 hardcoded strings
   - Scope: Form labels, validation messages, links, button text
   - Impact: Critical authentication flow

4. **`src/components/auth/register-form.tsx`** (278 lines)
   - ~20-25 hardcoded strings
   - Scope: Form labels, validation rules display, terms text, button text
   - Impact: Critical registration flow

5. **`src/components/common/language-switcher.tsx`** (76 lines)
   - ~2-3 hardcoded strings
   - Scope: aria-label text (already has sr-only)
   - Impact: Accessibility

**Integration approach for each:**
- Wrap components with `<I18nProvider>` if not already done
- Import `useTranslations()` hook from next-intl
- Replace hardcoded strings with `t('key')` calls
- Create translation files for each language (JSON or TypeScript modules)

### 3.2 Priority 2: Secondary Components

**Scan required for:**
- `src/app/(store)/` - All page components and layouts
- `src/components/` - All remaining UI components
- `src/app/layout.tsx` - Root layout strings
- Navigation/header components
- Footer components
- Error/404 pages
- Success/confirmation pages

### 3.3 Priority 3: Form Validation and Error Messages

**Systematic conversion of:**
- Zod schema validation error messages (spread across form components)
- API error responses and user-facing error handling
- Toast notification messages
- Modal/dialog text

## Phase 4: Translation File Structure

### 4.1 Recommended Directory Structure

```
src/
├── i18n/
│   ├── locale.ts (existing - expand)
│   ├── translations/ (new)
│   │   ├── en.json
│   │   ├── de.json
│   │   ├── es.json
│   │   ├── fr.json
│   │   ├── sq.json (Albanian)
│   │   ├── sr.json (Serbian)
│   │   ├── hr.json (Croatian)
│   │   ├── bs.json (Bosnian)
│   │   ├── mk.json (Macedonian)
│   │   ├── cnr.json (Montenegrin)
│   │   ├── sl.json (Slovenian)
│   │   ├── bg.json (Bulgarian)
│   │   ├── ro.json (Romanian)
│   │   ├── el.json (Greek)
│   │   ├── tr.json (Turkish)
│   │   ├── it.json (Italian)
│   │   └── pt.json (Portuguese)
│   └── request.ts (next-intl configuration)
```

### 4.2 Translation Key Naming Convention

Use hierarchical key structure for organization:

```json
{
  "checkout": {
    "title": "Checkout",
    "description": "Complete your purchase and get your eSIM delivered instantly",
    "contact": {
      "title": "Contact Information",
      "email_label": "Email Address",
      "email_required": "Email Address *",
      "email_placeholder": "your@email.com"
    },
    "promo": {
      "title": "Promo Code",
      "optional": "(Optional)",
      "placeholder": "Enter promo code (optional)",
      "invalid": "Invalid promo code. Please check and try again."
    },
    "trust_signals": {
      "secure": "Secure payment via Stripe",
      "speed": "eSIM in ~2 minutes",
      "no_account": "No account required",
      "guarantee": "Money-back guarantee"
    }
  },
  "orders": {
    "title": "Track Your eSIM",
    "dashboard": "My Dashboard",
    "description": "Manage your eSIMs, track data usage, and view your complete purchase history.",
    "data_remaining": "Data Remaining",
    "no_orders": "No active orders",
    "no_orders_message": "You haven't purchased any eSIMs yet."
  },
  "auth": {
    "login": {
      "welcome": "Welcome back!",
      "description": "Enter your credentials to access your account",
      "email_label": "Email",
      "password_label": "Password",
      "sign_in": "Sign In",
      "forgot": "Forgot password?",
      "no_account": "Don't have an account?",
      "sign_up_link": "Sign up",
      "errors": {
        "invalid_email": "Please enter a valid email address",
        "password_short": "Password must be at least 8 characters",
        "failed": "Login failed. Please check your credentials."
      }
    },
    "register": {
      "create_account": "Create an account",
      "description": "Enter your details to get started",
      "name_label": "Full Name",
      "email_label": "Email",
      "password_label": "Password",
      "confirm_label": "Confirm Password",
      "terms_accept": "I accept the terms and conditions",
      "button": "Create Account",
      "have_account": "Already have an account?",
      "sign_in_link": "Sign in",
      "errors": {
        "name_short": "Name must be at least 2 characters",
        "invalid_email": "Please enter a valid email address",
        "password_short": "Password must be at least 8 characters",
        "password_uppercase": "Password must contain at least one uppercase letter",
        "password_lowercase": "Password must contain at least one lowercase letter",
        "password_number": "Password must contain at least one number",
        "password_mismatch": "Passwords don't match",
        "terms_required": "You must accept the terms and conditions",
        "failed": "Registration failed"
      },
      "success": "Account created successfully!"
    }
  }
}
```

## Phase 5: Testing Strategy

### 5.1 Unit Tests
- Verify locale detection from Accept-Language header
- Test locale cookie persistence
- Verify language switcher updates locale correctly
- Test translation key resolution for all locales

### 5.2 Integration Tests
- Full checkout flow in multiple languages
- Orders page rendering in all languages
- Authentication flow (login/register) in all languages
- Language switching and persistence across page navigation

### 5.3 Manual Testing Checklist
- [ ] All 17 languages render without layout breaks
- [ ] Hardcoded strings replaced with translations in all priority components
- [ ] Language switcher functional and updates all UI text
- [ ] Browser back/forward preserves language preference
- [ ] Locale persists across sessions via cookie
- [ ] Accept-Language header detection works (test with browser language preferences)
- [ ] All validation error messages appear in correct language
- [ ] Toast notifications display in correct language

## Phase 6: Deployment Considerations

### 6.1 Build-Time vs Runtime
- Confirm next-intl handles 17 locales efficiently
- Monitor bundle size impact of 17 translation files
- Consider code splitting strategy for translation loading

### 6.2 SEO and Routing
- Verify URL structure handles locale prefixes correctly (e.g., `/en/checkout`, `/sr/checkout`)
- Test alternate link tags for hreflang SEO signals
- Verify sitemap includes all locale variants

## Implementation Priority Sequence

1. **Week 1:** Phase 1 (Foundation - locale.ts, language-switcher.tsx)
2. **Week 2:** Phase 2 (Middleware - Accept-Language detection)
3. **Week 3-4:** Phase 3 Priority 1 (checkout, orders, auth components)
4. **Week 5:** Phase 3 Priority 2 & 3 (remaining components and validation)
5. **Week 6:** Phase 5 (Testing and validation across all languages)
6. **Week 7:** Phase 6 (Deployment preparation and monitoring)

## Success Criteria

- [ ] All 17 languages configured and selectable
- [ ] Accept-Language header properly detects browser preferences
- [ ] Language preference persists across sessions
- [ ] All user-facing strings translated in priority components
- [ ] No hardcoded English strings in checkout and orders flows
- [ ] All authentication forms support all languages
- [ ] Tests pass for all locale variants
- [ ] Performance metrics maintained with 17 translation files
- [ ] Users can switch between any language seamlessly

## Notes

- **Montenegrin Code:** Currently using 'cnr' as placeholder. Monitor for official ISO 639-3 adoption or adjust to 'sr-ME' variant if needed.
- **Regional Variants:** Portuguese (pt) currently represents generic Portuguese. Consider pt-PT vs pt-BR split in future phase if Brazilian market is targeted.
- **Spanish Variants:** Similarly, es represents generic Spanish. es-ES vs es-MX split available for future consideration.
- **Translation Maintenance:** Plan for ongoing localization workflow - consider CAT tool integration or crowdsourcing for non-primary languages.
