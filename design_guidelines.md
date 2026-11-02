# NPT - Norfolk Poker Tour Website - Design Guidelines

## Design Approach
**Hybrid Approach**: Drawing inspiration from premium poker platforms (PokerStars, World Series of Poker) combined with modern event registration best practices. Create an exciting yet professional atmosphere that builds trust while maintaining efficient functionality for the Norfolk Poker Tour brand.

## Core Design Elements

### A. Color Palette
**Dark Mode Primary** (poker table aesthetic):
- Background: 220 20% 12% (deep charcoal)
- Surface: 220 18% 18% (elevated cards)
- Primary: 142 70% 45% (poker table green - confident, professional)
- Accent: 25 95% 60% (tournament red - urgency, high-stakes)
- Text Primary: 0 0% 95%
- Text Secondary: 0 0% 70%

**Light Mode** (optional daytime variant):
- Background: 0 0% 98%
- Surface: 0 0% 100%
- Primary: 142 50% 35%
- Accent: 25 75% 50%

### B. Typography
- **Headings**: Inter or Outfit (bold, modern, competitive feel)
  - H1: 3.5rem/bold (tournament titles)
  - H2: 2.5rem/semibold (section headers)
  - H3: 1.75rem/medium (event names)
- **Body**: Inter or System UI
  - Base: 1rem/regular (400)
  - Small: 0.875rem (tournament details)
  - Labels: 0.75rem/medium (uppercase for metadata)

### C. Layout System
**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16, 20
- Section padding: py-16 to py-24
- Card spacing: p-6 to p-8
- Grid gaps: gap-6 to gap-8
- Container: max-w-7xl mx-auto

### D. Component Library

**Navigation**
- Sticky header with dark background (backdrop-blur-xl)
- Logo left, navigation center, "Register Now" CTA button right
- Mobile: Hamburger menu with slide-out panel

**Tournament Cards**
- Elevated surface with subtle border (border-white/10)
- Header: Tournament name + format badge
- Grid layout: Date/Time | Buy-in | Prize Pool | Seats Available
- Participant count indicator with progress bar
- Primary "Register" button at bottom
- Hover: Subtle lift effect (translate-y-1, shadow-2xl)

**Registration Form**
- Two-column layout on desktop: Form left, Selected event details right
- Input fields: Dark background with green border on focus
- Phone number with country code selector
- Email validation with live feedback
- Terms checkbox with link to rules
- Large submit button with loading state

**Event Listing**
- Filter bar: Tournament type (Texas Hold'em, Omaha, etc.), Date range, Buy-in range
- Sort options: Date, Prize Pool, Seats Available
- Grid view: 2 columns tablet, 3 columns desktop
- List view toggle option

**Success Confirmation**
- Modal overlay with confirmation details
- Event summary card
- Unique registration ID
- Calendar add button
- Email confirmation notice
- Social share options

**Trust Elements**
- "500+ players registered this month" stat in header
- Security badges in footer
- Tournament rules link
- Organizer information section

### E. Visual Enhancements
**Micro-interactions**:
- Button hover: Subtle brightness increase
- Card hover: Gentle elevation
- Input focus: Border glow animation
- Success: Confetti or chip-stack animation (subtle)

**Imagery**:
- Hero section: Atmospheric poker table scene (chips, cards in soft focus) - full-width, 60vh
- Tournament type icons: Card suit symbols
- No decorative animations - keep professional

**Special Elements**:
- Countdown timers for upcoming tournaments (using monospace font)
- Seat availability badges (Green: >10 seats, Yellow: 5-10 seats, Red: <5 seats)
- Prize pool display with currency formatting
- Tournament structure info (blind levels, starting stack)

## Page Structure

**Homepage/Tournament Listing**:
1. Hero: Dramatic poker imagery + "Register for Our Next Tournament" headline
2. Filter/Sort Bar
3. Featured Tournaments (carousel or grid)
4. All Tournaments (grid with infinite scroll or pagination)
5. Why Play With Us (trust section)
6. Footer with quick links, contact

**Registration Flow**:
1. Event selection confirmation banner (sticky)
2. Registration form (prominent)
3. Event details sidebar
4. Submit → Success modal
5. Post-registration: Redirect to confirmation page with next steps

## Responsive Behavior
- Mobile: Stack all multi-column layouts
- Tablet: 2-column tournament grid
- Desktop: 3-column tournament grid
- Form: Full-width mobile, 2-column desktop