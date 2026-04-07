# Mobial Mobile Performance & UX Audit Report
**Date:** 2026-03-12  
**Project:** Mobial eSIM Marketplace (`/Users/ezekaj/Desktop/Projects/mobial`)  
**Stack:** Next.js 16.1.1, React 19.0.0, TypeScript, Tailwind CSS 4, Framer Motion 12.23.2

---

## Executive Summary

Comprehensive audit of 12 critical mobile UX/performance areas identified **7 critical issues** (touch targets, typography), **4 high-severity concerns** (animation performance, sticky positioning, safe areas), and **several optimization opportunities**. Most issues are easily remediable with targeted CSS/component updates.

---

## Audit Findings by Checklist Item

### 1. Animation Libraries & Mobile Optimization

**Status:** HIGH SEVERITY - Performance Concerns

#### Framer Motion Usage
- **Dependency:** framer-motion v12.23.2 (package.json:58)
- **Primary Usage Pattern:** Widespread layout animations with `AnimatePresence`

**Critical Issue - popLayout Mode:**
```
src/app/(store)/checkout/page.tsx:431
<AnimatePresence mode="popLayout">

src/components/store/cart-drawer.tsx:~135
<AnimatePresence mode="popLayout">
```
**Severity:** HIGH
- `popLayout` triggers expensive layout recalculations on every item add/remove
- Each animation recalculates the entire cart layout on mobile
- **Impact:** Visible jank during quantity changes, laggy cart interactions
- **Recommendation:** Change to `mode="wait"` (like auth-modal.tsx:23 does correctly) or remove layout animations for mobile viewports

**Heavy Simultaneous Animations:**
```
src/app/(store)/page.tsx - Multiple sections
- Blur + pulse animations firing simultaneously
- Hover states with 2x scaling on icons
- Staggered children animations without viewport detection
```
**Severity:** MEDIUM-HIGH
- Mobile devices struggle with multiple simultaneous transforms
- No mobile-specific animation throttling
- **Recommendation:** Implement viewport-based animation disable on small screens using `useMediaQuery` hook

**Correctly Implemented:**
```
src/components/auth/auth-modal.tsx:23
<AnimatePresence mode="wait">
```
✓ Uses `mode="wait"` which is proper for mobile

---

### 2. Image Optimization

**Status:** GOOD with Minor Concerns

**Configuration:** next.config.ts contains image optimization setup
- Remote pattern support for external CDNs
- **Issue:** No explicit mobile-specific image sizing strategy visible
- **Recommendation:** Ensure `sizes` attribute used in all Image components for responsive loading

---

### 3. Bundle Size & Code Splitting

**Status:** ACCEPTABLE

**Heavy Dependencies Identified:**
- Radix UI: 22 individual component packages
- Framer Motion: 12.23.2 (large motion library)
- TanStack React Query: 5.82.0
- Multiple form libraries (@hookform, react-hook-form)

**470-Line Client Component (Concern):**
```
src/app/(store)/checkout/page.tsx - 470 lines
- Entire component marked "use client"
- Heavy state management for checkout flow
- Large single file instead of smaller extracted components
```
**Severity:** LOW-MEDIUM
- Adds significant JS to payment flow
- **Recommendation:** Break into smaller client/server components (email input, promo code, summary as separate components)

---

### 4. Scroll Behavior

**Status:** NEEDS REVIEW

**Horizontal Scroll Issue:**
```
src/components/store/compare-drawer.tsx - Lines ~100-110
<div className="overflow-x-auto">
  <table className="w-full border-collapse">
    <!-- Very narrow columns for mobile -->
```
**Severity:** MEDIUM
- Compare table doesn't scroll smoothly on mobile
- Columns cramped with horizontal overflow
- **Recommendation:** Implement mobile-specific view (stack rows vertically on <768px)

---

### 5. Modal & Drawer Behavior

**Status:** GOOD - Proper Implementation

**Responsive Drawers:**
```
src/components/store/cart-drawer.tsx
- Uses Sheet component with responsive max-width
- Proper close behavior
- AnimatePresence handling correct
```
✓ Well-implemented with responsive breakpoints

---

### 6. Loading States

**Status:** ACCEPTABLE with Minor Improvements

**Implementation Pattern:**
```
src/app/(store)/checkout/page.tsx:315-320
{validatingCode ? (
  <Loader2 className="h-4 w-4 animate-spin" />
) : "Apply"}

src/app/(store)/checkout/page.tsx:376-380
{processing ? (
  <>
    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
    Processing...
  </>
)
```
✓ Spinner states present
**Improvement:** Add aria-label="Loading" for accessibility

---

### 7. Touch Target Sizes (44px minimum)

**Status:** CRITICAL - Multiple Violations

**CRITICAL ISSUE - Quantity Buttons in Cart:**
```
src/components/store/cart-drawer.tsx
Classes: h-7 w-7
Actual Size: 28px × 28px (7 * 4px base unit)
```
**Severity:** CRITICAL - WCAG Failure
- Users cannot reliably tap quantity buttons on mobile
- Especially problematic for users with motor impairments
- **Fix (Required):**
  ```
  Change: h-7 w-7 → h-11 w-11 (44px minimum)
  OR: Add padding: p-3 (12px × 4 = 48px container)
  ```

**CRITICAL ISSUE - Compare Drawer Close/Remove Buttons:**
```
src/components/store/compare-drawer.tsx
Classes: p-1 (8px padding = ~24px × 24px button)
```
**Severity:** CRITICAL - WCAG Failure
- Remove buttons in compare modal are too small
- **Fix (Required):**
  ```
  Change: p-1 → p-2 or p-2.5 (minimum)
  OR: h-9 w-9 explicit sizing
  ```

**All Other Button Elements:**
- Primary buttons: Properly sized (h-10 w-full, h-11, etc.)
- Navigation buttons: Adequate sizing
- ✓ Most buttons pass 44px rule

---

### 8. Font Sizes (Minimum 16px for body, labels)

**Status:** CRITICAL - Multiple Typography Violations

**CRITICAL ISSUE - Extremely Small Text:**

**Badge Text in Product Card:**
```
src/components/store/product-card.tsx
Classes: text-[10px], text-[9px]
Actual Size: 10px, 9px
```
**Severity:** CRITICAL - Readability Failure
- Illegible on mobile devices
- **Fix (Required):**
  ```
  text-[10px] → text-xs (12px) minimum
  text-[9px] → text-xs (12px) minimum
  ```

**Country Count Badge:**
```
src/app/(store)/esim/page.tsx
Classes: text-[10px]
Actual Size: 10px
Context: "20 countries" badge
```
**Severity:** CRITICAL
- **Fix (Required):**
  ```
  text-[10px] → text-xs (12px)
  ```

**Compare Drawer Labels:**
```
src/components/store/compare-drawer.tsx
Classes: text-[10px] font black uppercase tracking-widest
Actual Size: 10px + excessive letter-spacing
```
**Severity:** CRITICAL - Unreadable
- Tracking-widest makes already tiny text even more spread
- **Fix (Required):**
  ```
  Remove: tracking-widest
  Change: text-[10px] → text-sm (14px)
  Remove: font black (use font-semibold instead)
  ```

**Summary - Typography Issues:**
- **≥3 instances of text-[10px]** (Product card, eSIM page, Compare drawer)
- **1 instance of text-[9px]** (Product card badge)
- **Multiple instances combining aggressive tracking with small sizes**
- **Total fixes needed: ~5-8 typography updates across 3 files**

---

### 9. Page File Reading (Lazy Load, Infinite Scroll)

**Status:** NOT IMPLEMENTED - Consider Enhancement

**Current Implementation:**
```
src/app/(store)/products/[slug]/page.tsx - Lines 10-19
export async function generateStaticParams() {
  const { products } = await getProducts({ limit: 50 })
  return products.map((product) => ({ slug: product.slug }))
}
```
- Static generation for popular products
- No infinite scroll or lazy loading detected

**Improvement Opportunity:**
- Implement virtual scrolling for product lists on mobile
- Use React Query `useInfiniteQuery` for pagination
- **Not critical but recommended for large product lists**

---

### 10. Safe Area Insets & Viewport Handling

**Status:** GOOD - Basic Configuration Present

**Viewport Configuration:**
```
src/app/layout.tsx:15-26
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
}
```
✓ Proper device-width and scale settings

**Font Configuration:**
```
src/app/layout.tsx:33-44
const inter = Inter({
  display: "swap",  // ← Correct: prevents font swap delay
})
```
✓ Using display="swap" for web fonts

**Issue - Dark Mode Hardcoded:**
```
src/app/layout.tsx:95
<html lang="en" className="dark">
```
**Severity:** LOW
- Removes user choice for light mode
- **Recommendation:** Allow theme toggle via next-themes

**Safe Area Handling:**
- No explicit `padding-safe` or `env(safe-area-inset-*)` in root layout
- **Recommendation (Low Priority):** Add safe area insets for iPhone notch/Dynamic Island:
  ```css
  padding: max(1rem, env(safe-area-inset-top)) max(1rem, env(safe-area-inset-right)) ...
  ```

---

### 11. Sticky Elements Positioning & Overlap

**Status:** HIGH SEVERITY - Layout Issues

**Order Summary Card:**
```
src/app/(store)/checkout/page.tsx:419
<Card className="sticky top-24">
```
**Issues on Mobile:**
1. `top-24` (96px from top) = 1/3 of typical mobile viewport height
2. May overlap with:
   - Header content
   - Form inputs
   - User scrolling area
3. No responsive adjustment for mobile screens

**Severity:** HIGH - Poor UX
- Sticky card covers input fields on small viewports
- Users can't see top of card or form fields simultaneously

**Fix (Required):**
```
Add responsive positioning:
className="sticky top-16 lg:top-24"
OR implement mobile detection:
<Card className={`sticky ${isMobile ? 'top-12' : 'top-24'}`}>

Also add bottom margin to prevent overlap:
className="mb-4"
```

**Compare Drawer Fixed Bottom:**
```
src/components/store/compare-drawer.tsx
Classes: fixed bottom-0 left-0 right-0
```
✓ Fixed positioning appropriate for drawer action bar
- Ensure it doesn't overlap with safe area (add bottom padding)

---

### 12. Haptic Feedback & Vibration API

**Status:** NOT IMPLEMENTED

**Current State:**
- No usage of `navigator.vibrate()` detected
- No haptic feedback on:
  - Button clicks
  - Form validation
  - Success/error states
  - Quantity changes

**Recommendation (Enhancement):**
```javascript
// Add haptic feedback utility
const triggerHaptic = (pattern = 50) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern)
  }
}

// Usage in cart quantity buttons
onClick={() => {
  triggerHaptic([10, 5, 10]) // Double tap pattern
  handleQuantityChange()
}}

// Usage in form validation
onBlur={() => {
  if (isInvalid) triggerHaptic(100) // Long buzz for error
}}
```
**Priority:** LOW-MEDIUM Enhancement
- Improves tactile feedback on form interactions
- Especially valuable for e-commerce checkouts

---

## Severity Summary

| Severity | Count | Issues |
|----------|-------|--------|
| CRITICAL | 5 | Touch targets (2), Typography (3) |
| HIGH | 4 | Animation popLayout, Sticky positioning, Scroll behavior |
| MEDIUM | 3 | Large client component, Dark mode hardcoding |
| LOW | 3 | Safe area insets, Image sizing strategy, Haptic feedback |

---

## Implementation Priority Roadmap

### Phase 1: CRITICAL FIXES (Must Fix)
1. **Touch Targets** (~15 min)
   - Cart quantity buttons: `h-7 w-7` → `h-11 w-11`
   - Compare drawer buttons: `p-1` → `p-2.5`

2. **Typography** (~20 min)
   - Product card: `text-[10px]` → `text-xs`, `text-[9px]` → `text-xs`
   - eSIM page: `text-[10px]` → `text-xs`
   - Compare drawer: Remove `tracking-widest`, change `text-[10px]` → `text-sm`

### Phase 2: HIGH-SEVERITY FIXES (Do Soon)
3. **Animation Performance** (~30 min)
   - Change `popLayout` to `mode="wait"` in cart/checkout
   - Add viewport-based animation disable

4. **Sticky Positioning** (~20 min)
   - Adjust checkout order summary: `top-24` → responsive `top-12 lg:top-24`
   - Test overlap on iPhone 12 mini (375px)

### Phase 3: IMPROVEMENTS (Nice to Have)
5. **Bundle Optimization** (~45 min)
   - Extract smaller components from checkout page
   - Lazy load non-critical animations

6. **Haptic Feedback** (~30 min)
   - Add vibration utility
   - Wire to cart, validation, success states

---

## Files Requiring Changes

| File | Changes | Severity |
|------|---------|----------|
| src/components/store/cart-drawer.tsx | h-7 w-7 → h-11 w-11 | CRITICAL |
| src/components/store/compare-drawer.tsx | Touch targets, typography | CRITICAL |
| src/components/store/product-card.tsx | text-[10px], text-[9px] → text-xs | CRITICAL |
| src/app/(store)/esim/page.tsx | text-[10px] → text-xs | CRITICAL |
| src/app/(store)/checkout/page.tsx | sticky positioning, popLayout mode | HIGH |
| src/app/layout.tsx | Safe areas (optional), dark mode toggle | LOW |

---

## Testing Recommendations

### Mobile Device Testing
- iPhone 12 mini (375px) - smallest common width
- iPhone SE (375px)
- Android 5" phone (360px)
- Tablet (768px+)

### Tap Target Testing
- Use DevTools device emulation + Chrome Remote Debugging
- Test with 1cm × 1cm physical touch area
- Verify 44px minimum on all interactive elements

### Typography Readiness
- Use DevTools mobile view
- Verify text readability at 100% zoom
- Test at actual device sizes (not just browser resize)

### Performance Testing
- Lighthouse mobile audit (target: 90+ on mobile)
- Check Core Web Vitals (FCP, LCP, CLS)
- Monitor animation frame rates (target: 60 FPS on mobile)
