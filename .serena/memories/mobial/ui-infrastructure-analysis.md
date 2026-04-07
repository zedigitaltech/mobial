# Mobial UI Infrastructure Analysis

## Overview
Comprehensive exploration of the Mobial eSIM marketplace project's UI libraries, components, and mobile optimization capabilities. Completed 2026-03-12.

## Available UI Libraries & Dependencies

### Core Framework Stack
- **Next.js**: v16.1.1 (latest, React 19, TypeScript)
- **React**: v19.0.0
- **TypeScript**: v5
- **Tailwind CSS**: v4 (latest syntax with @theme, @plugin, @import)

### Component Library Ecosystem
- **Radix UI**: 25+ headless component primitives
  - Dialogs (@radix-ui/react-dialog)
  - Dropdowns (@radix-ui/react-dropdown-menu)
  - Tabs (@radix-ui/react-tabs)
  - Selects (@radix-ui/react-select)
  - Popovers (@radix-ui/react-popover)
  - Hover cards, tooltips, progress, sliders
  - Full accessibility built-in (ARIA attributes)

### Animation & Motion
- **Framer Motion**: v12.23.2
  - AnimatePresence for mount/unmount animations
  - motion.div, motion.button wrappers
  - Transitions: scale, opacity, y-offset, rotate
  - Spring animations and easing functions

### Mobile-Specific Components
- **Vaul**: v1.1.2 (native drawer library)
  - Directional support: top, bottom, left, right
  - Responsive sizing with mobile optimization
  - Animated handle bar for bottom drawer
  - Data-driven state (open/closed with animations)

### Form & Input Management
- **React Hook Form**: v7.60.0
  - Flexible validation with @hookform/resolvers
  - Form state management without component re-renders
  - Integration with Zod validation

### Data & State Management
- **Zustand**: v5.0.6 (lightweight state management)
- **TanStack React Query**: v5.82.0 (server state & caching)
- **Zod**: v4.0.2 (runtime type validation)

### UI Component Styling
- **Class Variance Authority**: v0.7.1 (component prop variants)
- **Tailwind Merge**: v3.3.1 (smart class merging)
- **CLSX**: v2.1.1 (conditional classnames)
- **Tailwind CSS Animate**: v1.0.7 (animation utilities)

### Icons & Assets
- **Lucide React**: v0.525.0 (650+ SVG icons)
- **Sharp**: v0.34.3 (image optimization)

### Notifications & Feedback
- **Sonner**: v2.0.6 (toast notifications)

### Data Utilities
- **Date-fns**: v4.1.0 (date manipulation)
- **QR Code**: v1.5.4 (QR code generation)

### Accessibility & Internationalization
- **Next Intl**: v4.3.4 (i18n support)
- **Input OTP**: v1.4.2 (one-time password input)
- **Isomorphic DOM Purify**: v3.1.0 (XSS protection)

### Payment & External Services
- **Stripe**: v20.4.1 (payment processing)
- **Resend**: v6.9.3 (email sending)

---

## Component Availability in `src/components/ui/`

**Located at**: `/Users/ezekaj/Desktop/Projects/mobial/src/components/ui/`

### Confirmed Components (with source files)
- **drawer.tsx**: Vaul-based drawer with directional sliding
- **sheet.tsx**: Radix Dialog-based sheet component
- **tabs.tsx**: Radix Tabs with responsive styling
- **badge.tsx**: Small label component
- **button.tsx**: Primary interactive component
- **card.tsx**: Container with border and spacing
- **input.tsx**: Form input field
- **progress.tsx**: Progress bar visualization
- **accordion.tsx**: Expandable content sections
- **alert.tsx**: Alert/warning messages
- **avatar.tsx**: User profile images
- **checkbox.tsx**: Checkbox input
- **command.tsx**: Command palette/search
- **context-menu.tsx**: Right-click menu
- **dropdown-menu.tsx**: Dropdown menu
- **label.tsx**: Form labels
- **popover.tsx**: Floating content
- **radio-group.tsx**: Radio button groups
- **scroll-area.tsx**: Custom scrollbar
- **select.tsx**: Dropdown select
- **separator.tsx**: Visual divider
- **slider.tsx**: Range/value slider
- **switch.tsx**: Toggle switch
- **tooltip.tsx**: Hover tooltips

**Total**: 25+ components available

---

## Mobile Optimization Features

### Current Mobile-Friendly Patterns

#### 1. **Responsive Grid Layouts**
- Destination search: Full-width on mobile
- Product detail: Single column (mobile) → lg:grid-cols-2 (desktop)
- Check usage: max-w-xl container (mobile-optimized)
- Product grid: sm:grid-cols-2 lg:grid-cols-3 (progressive enhancement)

#### 2. **Touch-Optimized Input Heights**
- Button heights: h-12 (48px - comfortable touch target)
- Input heights: h-12 to h-14 (56px - exceeds 44px minimum)
- Icon buttons: h-11 w-11, h-10 w-10 (safe touch zones)

#### 3. **Mobile Drawers & Sheets**
- Vaul drawer: Bottom sheet pattern with slide-in animation
- Sheet component: Directional sliding (right, left, top, bottom)
- Both support responsive sizing: max-h-[80vh], w-3/4, sm:max-w-sm

#### 4. **Animation on Mobile**
- Framer Motion: Initial state opacity 0, scales/y-offsets to prevent jump
- AnimatePresence: Manages enter/exit animations smoothly
- Duration: 200ms-700ms (fast enough for perceived responsiveness)

#### 5. **Glass Morphism & Styling**
- Custom utilities: glass-panel, glass-card (backdrop-blur-2xl/3xl)
- Rounded corners: rounded-[28px], rounded-2xl, rounded-xl (modern aesthetic)
- Color variables: oklch color space (perceptually uniform)

---

## Gap Analysis: Missing Libraries

### **Carousel/Swiper** - NOT PRESENT
- No `embla-carousel`, `swiper`, or `react-carousel-next`
- Current workaround: Grid layouts with overflow-x-auto
- **Opportunity**: Mobile product browse could use smooth carousel swiping
- **Recommendation**: Consider Embla Carousel (headless, Radix-compatible)

### **Mobile Gesture Recognition** - LIMITED
- Framer Motion supports drag/pan but not comprehensive gesture library
- No `react-use-gesture` or `@use-gesture/react`
- **Opportunity**: Swipe gestures for navigation, pull-to-refresh
- **Recommendation**: Framer Motion drag API or @use-gesture/react

### **Mobile-Specific Patterns**
- No viewport height fix library (address 100vh issues on mobile)
- No mobile device detection middleware
- No view transitions API wrapper

---

## Key Files & Implementation Details

### Styling Architecture
**File**: `/Users/ezekaj/Desktop/Projects/mobial/src/app/globals.css`

- Tailwind 4 with @import, @plugin, @theme inline
- Dark mode by default (oklch(0.12 0.015 220) background)
- Custom utilities with glass effects, pulse animations, text gradients
- Backdrop blur effects: backdrop-blur-2xl (12px), backdrop-blur-3xl (32px)
- Ring colors for focus states
- Custom scrollbar styling

### Security & Middleware
**File**: `/Users/ezekaj/Desktop/Projects/mobial/src/middleware.ts`

- CSP headers for script/style safety
- X-Frame-Options: SAMEORIGIN (clickjacking protection)
- HSTS: 31536000s (1 year)
- Nonce generation for inline scripts
- Admin route token validation
- No explicit mobile detection (handled client-side via CSS media queries)

### Search Component (Mobile-Critical)
**File**: `/Users/ezekaj/Desktop/Projects/mobial/src/components/common/destination-search.tsx`

- **Mobile Optimizations**:
  - Debounced search (300ms) reduces API load
  - Local storage persistence (recent searches max 5)
  - Rounded search rail: rounded-[28px]
  - Input height: h-14 (56px touch target)
  - Dropdown max-h-[480px] with custom scrollbar (prevents viewport overflow)
  - Backdrop blur: backdrop-blur-3xl
  - Three search types: countries, regions, products
  - Top destinations feature (default view when empty)
  - Async fetch: `/api/products?search=...&limit=6&sortBy=price_asc`

### Product Detail Page
**File**: `/Users/ezekaj/Desktop/Projects/mobial/src/app/(store)/products/[slug]/client.tsx` (read previously)

- **Mobile Layout**: Single column (mobile) → lg:grid-cols-2 (desktop)
- **Tabs Component**: Features, Activation, FAQ sections with smooth transitions
- **Data Display**:
  - Main amount: text-5xl font-black
  - Stats: grid-cols-2 on mobile for compact layout
  - Provider card: gradient background (from-primary/5 to-primary/10)
- **Related Products**: sm:grid-cols-2 lg:grid-cols-3 responsive grid
- **Animations**: Framer Motion opacity/x-offset on mount

### Usage Checker (Form-Heavy)
**File**: `/Users/ezekaj/Desktop/Projects/mobial/src/app/(store)/check-usage/page.tsx`

- **Form UX**:
  - Tab toggle: order_number vs iccid (flex-1 equal width)
  - Input: h-12, font-mono (monospace for code-like inputs)
  - Button: Disabled state when input empty
  - Enter key support for quick lookup
- **Results Display**:
  - Framer Motion animation: initial y 20 → animate y 0
  - Progress bar: h-3, animated fill with color-coding
    - Red ≥90%, amber 70-89%, primary <70%
  - Remaining data calculation: max(0, total - used)
  - Stats grid: grid-cols-2 gap-4
  - Status badge with pulsing dot (animated using CSS)
- **Mobile-Friendly**: max-w-xl container, vertical stacking

---

## Architecture Patterns Observed

### 1. **Server Components + Client Components** (App Router)
- SSR for data fetching (product lists, SEO metadata)
- Client components for interactive UI (forms, animations)
- Clear boundary between server (page.tsx) and client (client.tsx)

### 2. **Responsive Design Strategy**
- Mobile-first: Default styles for mobile
- Breakpoints: sm (640px), lg (1024px) progressively enhance
- Grid layouts: grid-cols-1 → sm:grid-cols-2 → lg:grid-cols-3
- Max-width containers: max-w-xl (336px for small screens), max-w-3xl (768px)

### 3. **Animation Pattern**
- Framer Motion AnimatePresence wraps conditional renders
- Initial state defines starting position/opacity
- Animate state defines final state
- Exit state defines unmount animation
- Duration: 200ms (fast) to 700ms (slow for important transitions)

### 4. **Form Handling**
- React Hook Form for state management
- Local input state (useState) for immediate UI feedback
- API calls on submit with loading states
- Error messages in red with AlertCircle icon

### 5. **State Management**
- Local state (useState) for UI state (open/closed, input values)
- Local storage for persistence (recent searches)
- Zustand/React Query for global/server state (implied by presence in package.json)

---

## Mobile UX Strengths
1. Touch-friendly hit targets (44px+ minimum)
2. Smooth animations reduce cognitive load
3. Bottom sheet pattern for navigation (Vaul drawer)
4. Vertical-stacking default (single-column layout)
5. Glassmorphic design with backdrop blur (modern aesthetic)
6. Responsive typography and spacing
7. Form-first approach (no complex multi-column layouts)

## Mobile UX Gaps
1. No carousel/swiper for product browse swiping
2. No gesture support (swipe navigation, pull-to-refresh)
3. Limited mobile device detection/optimization
4. No viewport height fix for 100vh issues
5. No lazy loading or infinite scroll mentioned
6. Search dropdown could use mobile swipe-to-close gesture

---

## Recommendations for Mobile Enhancement

### High-Impact Improvements
1. **Add Carousel Library**: Embla Carousel (lightweight, Radix-compatible)
   - Use for product listings, featured deals, image galleries
   - Mobile: Touch swiping, desktop: arrow buttons

2. **Gesture Support**: Framer Motion drag API or @use-gesture/react
   - Swipe-to-navigate between tabs
   - Swipe-to-close for search dropdown/sheets

3. **Lazy Loading**: Next.js Image optimization + React Intersection Observer
   - For product images in grid layouts
   - Reduces initial page load on mobile networks

4. **Mobile Detection**: next-device library or user-agent parsing
   - Serve optimized layouts for iOS/Android
   - Adjust animation duration/complexity for lower-end devices

### Medium-Impact Improvements
5. **Infinite Scroll**: React Infinite Scroll Component or TanStack Virtual
   - Product listings (vs pagination)
   - Search results

6. **Viewport Height Fix**: next-safe-action or custom CSS solution
   - Addresses 100vh issues on mobile browsers
   - Uses dvh (dynamic viewport height) CSS variable

7. **Bottom Sheet Improvements**: Vaul configuration
   - Gesture dismissal (swipe down to close)
   - Snap points for partial/full views
   - Blur backdrop overlay option

---

## File Structure Reference
```
/Users/ezekaj/Desktop/Projects/mobial/
├── src/
│   ├── app/
│   │   ├── globals.css (Tailwind 4 configuration)
│   │   ├── middleware.ts (security headers)
│   │   └── (store)/
│   │       ├── products/[slug]/
│   │       │   ├── page.tsx (server component)
│   │       │   └── client.tsx (product detail UI)
│   │       └── check-usage/
│   │           └── page.tsx (usage lookup form)
│   └── components/
│       ├── ui/ (25+ Radix-based components)
│       └── common/
│           └── destination-search.tsx (search component)
├── package.json (all dependencies)
└── ...
```

---

## Next Steps
1. Assess carousel requirements for product browsing
2. Evaluate gesture support for improved mobile navigation
3. Implement lazy loading for product images
4. Add mobile device detection for optimized rendering
5. Consider viewport height fixes for consistent 100vh behavior
