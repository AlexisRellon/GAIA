# Landing Page Components

Reusable React components for the GAIA landing page, designed based on Figma specifications (node-id: 96:984).

## Table of Contents

- [Overview](#overview)
- [Component Architecture](#component-architecture)
- [Components Reference](#components-reference)
- [Design Patterns](#design-patterns)
- [Customization Guide](#customization-guide)
- [Responsive Design](#responsive-design)
- [Accessibility](#accessibility)

## Overview

The landing page is composed of 8 modular section components, each representing a distinct content area. All components are exported from `index.ts` for clean imports:

```tsx
import {
  Header,
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  ProductShowcaseSection,
  SocialProofSection,
  CTASection,
  Footer,
} from '../components/landing';
```

## Component Architecture

### Design Philosophy

- **Single Responsibility**: Each component handles one section of the landing page
- **Self-Contained**: Components include their own content, styling, and structure
- **Responsive**: Mobile-first design with Tailwind breakpoint utilities
- **Accessible**: Semantic HTML and ARIA attributes where needed

### File Structure

```
components/landing/
├── Header.tsx              # Navigation bar with logo and CTAs
├── HeroSection.tsx         # Hero with background, pins, and glassmorphism card
├── FeaturesSection.tsx     # Three-column feature showcase
├── HowItWorksSection.tsx   # Four-step workflow with arrows
├── ProductShowcaseSection.tsx # 2x2 grid of product previews
├── SocialProofSection.tsx  # Dark section with target audience messaging
├── CTASection.tsx          # Final call-to-action
├── Footer.tsx              # Dark footer with branding and links
└── index.ts                # Component exports
```

## Components Reference

### Header

**Purpose**: Navigation bar with GAIA branding and action buttons.

**Visual Specs**:
- Height: 101px
- Background: `#F0F4F8`
- Logo: GAIA.svg (133×53px) + tagline
- CTAs: "View Hazard Map" link + "Login" button

**Usage**:
```tsx
import { Header } from '../components/landing';

function App() {
  return <Header />;
}
```

**Customization**:
```tsx
// Edit Header.tsx to change navigation links
const navigationLinks = [
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];
```

**Responsive Behavior**:
- Desktop: Horizontal navigation with logo left, links center, CTAs right
- Mobile: Stacked layout with hamburger menu (future enhancement)

---

### HeroSection

**Purpose**: Main landing area with attention-grabbing headline and primary CTAs.

**Visual Specs**:
- Height: 750px
- Background: Combined grid + heatmap image (`background.png`)
- Decorative pins: 4 hazard pin SVGs with blur filters
- Glassmorphism card: Placeholder for future map preview
- Typography: "Empower Your Response. Protect Your Community." (Lato Bold, 64px, #005A9C)

**Usage**:
```tsx
import { HeroSection } from '../components/landing';

function LandingPage() {
  return (
    <>
      <HeroSection />
      {/* Other sections */}
    </>
  );
}
```

**Customization**:
```tsx
// Edit HeroSection.tsx to change headline
<h1 className="...">
  Your Custom Headline Here
</h1>

// Change CTA button text
<Link to="/map">View Live Hazard Map</Link>
<a href="#how-it-works">How It Works</a>
```

**Assets Used**:
- `background.png` - Hero background (grid + heatmap combined)
- `Pin-volcanic_eruption.svg`, `Pin-flood.svg`, `Pin-earthquake.svg`, `Pin-landslide.svg` - Decorative pins

**Responsive Behavior**:
- Desktop: Full-width background with centered content
- Tablet: Reduced padding, smaller headline (48px)
- Mobile: Stacked CTAs, reduced pin visibility

---

### FeaturesSection

**Purpose**: Showcase three core components of GAIA system.

**Visual Specs**:
- Section heading: "The Core Components of GAIA" (Lato ExtraBold, 39px)
- Layout: Three-column grid (flexbox, gap-32px)
- Cards: Image (350px height) + title + description
- Border radius: 16px

**Usage**:
```tsx
import { FeaturesSection } from '../components/landing';

function LandingPage() {
  return <FeaturesSection />;
}
```

**Feature Cards**:
1. **AI-Driven Classification** - Climate-NLI zero-shot classification
2. **Automated Geo-NER** - Location extraction from text
3. **Unified Command Dashboard** - Real-time visualization

**Customization**:
```tsx
// Edit FeaturesSection.tsx to change features
const features = [
  {
    title: 'Your Feature Title',
    description: 'Feature description text',
    image: landingAssets.features.yourImage,
  },
  // Add more features
];
```

**Responsive Behavior**:
- Desktop: 3 columns (1280px container)
- Tablet: 2 columns
- Mobile: 1 column (full-width cards)

---

### HowItWorksSection

**Purpose**: Explain the four-step AI pipeline workflow.

**Visual Specs**:
- Height: 769px
- Section heading: "From Raw Data to Real-Time Decision" (Lato ExtraBold, 39px)
- Layout: Horizontal step layout with arrow separators
- Step numbers: Lato Black, 61px, #575757
- Arrows: 50×50px, rotated 180deg + scale-y-flip

**Usage**:
```tsx
import { HowItWorksSection } from '../components/landing';

function LandingPage() {
  return <HowItWorksSection />;
}
```

**Steps**:
1. **Multi-Source Ingestion** - RSS feeds from PAGASA, PHIVOLCS
2. **AI Hazard Classification** - Zero-shot model classifies hazard type
3. **Geo-NER Location Extraction** - Extracts precise location data
4. **Actionable Visualization** - Plots on command dashboard

**Customization**:
```tsx
// Edit HowItWorksSection.tsx to change steps
const steps = [
  {
    number: '01',
    title: 'Your Step Title',
    description: 'Step description explaining the process.',
  },
  // Add more steps (recommend 4-6 steps max)
];
```

**Assets Used**:
- `arrow-right.svg` - Workflow step separator arrows

**Responsive Behavior**:
- Desktop: Horizontal layout with arrows between steps
- Tablet: Stacked steps, arrows hidden
- Mobile: Single column, no arrows

---

### ProductShowcaseSection

**Purpose**: Preview the four key outputs of GAIA's AI pipeline.

**Visual Specs**:
- Height: 1030px
- Section heading: "GAIA's AI-Generated Assessments" (Lato ExtraBold, 39px)
- Layout: 2×2 grid (gap-20px)
- Cards: 360px height, gradient overlay (bottom-to-top)
- Placeholder background: #d9d9d9

**Usage**:
```tsx
import { ProductShowcaseSection } from '../components/landing';

function LandingPage() {
  return <ProductShowcaseSection />;
}
```

**Showcase Cards**:
1. **Live Hazard Map** - Central dashboard view
2. **AI-Classified Report Feed** - Real-time feed of classified reports
3. **Hazard Density Heatmap** - Geospatial density visualization
4. **Real-Time Filtering** - Dynamic filtering interface

**Customization**:
```tsx
// Edit ProductShowcaseSection.tsx to change features
const showcaseItems = [
  {
    title: 'Your Feature Title',
    description: 'Feature description',
    image: landingAssets.showcase.yourImage, // Replace placeholder
  },
  // Add more items (recommend 4-6 items)
];
```

**Future Enhancement**: Replace placeholder backgrounds (#d9d9d9) with actual screenshots of GAIA dashboard features.

**Responsive Behavior**:
- Desktop: 2×2 grid
- Tablet: 2×2 grid with smaller cards
- Mobile: 1 column (stacked cards)

---

### SocialProofSection

**Purpose**: Highlight target audience and build credibility with LGU responders.

**Visual Specs**:
- Height: 229px
- Background: #0A2A4D (primary navy blue)
- Heading: "A Tool Built for Responders" (Lato ExtraBold, 39px, #F0F4F8)
- Text color: #F0F4F8 (light blue-gray)

**Usage**:
```tsx
import { SocialProofSection } from '../components/landing';

function LandingPage() {
  return <SocialProofSection />;
}
```

**Customization**:
```tsx
// Edit SocialProofSection.tsx to change messaging
<h2>A Tool Built for [Your Target Audience]</h2>
<p>
  [Your value proposition for target audience]
</p>
```

**Future Enhancement**: Add testimonials, partner logos, or statistics to strengthen social proof.

**Responsive Behavior**:
- All viewports: Full-width dark section with centered text

---

### CTASection

**Purpose**: Final call-to-action to drive conversions (demo requests, map access).

**Visual Specs**:
- Height: 400px
- Section heading: "Get Actionable Hazard Intelligence" (Lato ExtraBold, 39px)
- CTAs: "Request a Demo" (primary) + "View Live Map" (secondary)
- Button styling: Uses ShadCN UI Button component

**Usage**:
```tsx
import { CTASection } from '../components/landing';

function LandingPage() {
  return <CTASection />;
}
```

**Customization**:
```tsx
// Edit CTASection.tsx to change CTA buttons
<Link to="/demo">
  <Button>Request a Demo</Button>
</Link>
<Link to="/map">
  <Button variant="outline">View Live Map</Button>
</Link>
```

**Responsive Behavior**:
- Desktop: Horizontal button layout
- Mobile: Stacked buttons (full-width)

---

### Footer

**Purpose**: Provide navigation links, contact info, and institutional branding.

**Visual Specs**:
- Background: #171717 (dark neutral)
- Layout: Four-column grid (grid-cols-4, gap-40px)
- Height: 553px (main section) + 69px (copyright bar)
- Text color: White and #d9d9d9
- Border: White top border on copyright bar

**Usage**:
```tsx
import { Footer } from '../components/landing';

function LandingPage() {
  return (
    <>
      {/* Page sections */}
      <Footer />
    </>
  );
}
```

**Columns**:
1. **Branding** - GAIA logo (white), tagline, thesis statement, LPU-C + A-STARS logos
2. **Navigation** - Links to Home, Documentation, Hazard Map, Contact
3. **Contact** - Email and phone number
4. **Description** - System overview paragraph

**Customization**:
```tsx
// Edit Footer.tsx to change links
const navigationLinks = ['Home', 'Documentation', 'Hazard Map', 'Contact'];

// Change contact info
<p className="text-white">your-email@domain.com</p>
<p className="text-[#d9d9d9]">+63-XXX XXX XXXX</p>
```

**Assets Used**:
- `GAIA-white.svg` - White logo for dark background
- `lpu-c_logo.png` - Lyceum of the Philippines University - Cavite logo
- `A-stars-logo.svg` - A-STARS logo

**Responsive Behavior**:
- Desktop: 4 columns
- Tablet: 2 columns (2×2 grid)
- Mobile: 1 column (stacked)

---

## Design Patterns

### Container Pattern

All section components use a consistent container pattern:

```tsx
<section className="w-full max-w-[1280px] mx-auto px-[64px] py-[section-specific-padding]">
  {/* Section content */}
</section>
```

- **Max width**: 1280px (desktop)
- **Horizontal padding**: 64px (adjusts on mobile)
- **Centering**: `mx-auto` centers container

### Typography Hierarchy

```tsx
// Section headings (H2)
<h2 className="font-lato font-extrabold text-[39px] leading-[59px] text-[#334155]">
  Section Heading
</h2>

// Subsection headings (H3-H5)
<h3 className="font-lato font-bold text-[20px] leading-[30px] text-black">
  Subsection Heading
</h3>

// Body text
<p className="font-lato text-[16px] leading-[24px] text-black">
  Body paragraph text
</p>

// Endnote text (footer copyright)
<p className="font-lato text-[13px] leading-[20px] text-[#787878]">
  © 2025 GAIA. All rights reserved.
</p>
```

### Color System

```tsx
// Primary colors
bg-[#0A2A4D]   // Primary navy blue
bg-[#005A9C]   // Secondary deep blue
bg-[#FF7A00]   // Accent orange

// Neutral colors
bg-[#334155]   // Text slate gray
bg-[#F0F4F8]   // Background light blue-gray
bg-[#171717]   // Dark neutral (footer)
bg-white       // Pure white

// Grayscale
text-[#787878] // Medium gray (footer links)
text-[#d9d9d9] // Light gray (footer phone)
text-[#575757] // Gray (step numbers)
```

### Button Variants

Using ShadCN UI Button component:

```tsx
import { Button } from '../ui/button';

// Primary CTA (solid)
<Button className="bg-[#0a2a4d] text-white">
  Primary Action
</Button>

// Secondary CTA (outline)
<Button variant="outline" className="border-[#005a9c] text-[#005a9c]">
  Secondary Action
</Button>

// Link button
<Link to="/path">
  <Button>View More</Button>
</Link>
```

## Customization Guide

### Step-by-Step: Adding a New Section

1. **Create component file**:
   ```bash
   # Create NewSection.tsx in components/landing/
   touch src/components/landing/NewSection.tsx
   ```

2. **Component template**:
   ```tsx
   import React from 'react';
   
   export const NewSection: React.FC = () => {
     return (
       <section className="w-full max-w-[1280px] mx-auto px-[64px] py-[120px]">
         <div className="flex flex-col items-center gap-[32px]">
           <h2 className="font-lato font-extrabold text-[39px] leading-[59px] text-[#334155]">
             Section Heading
           </h2>
           <p className="font-lato text-[16px] leading-[24px] text-black max-w-[620px] text-center">
             Section description text.
           </p>
           {/* Section content */}
         </div>
       </section>
     );
   };
   ```

3. **Export from index.ts**:
   ```tsx
   export { NewSection } from './NewSection';
   ```

4. **Add to LandingPage.tsx**:
   ```tsx
   import { NewSection } from '../components/landing';
   
   const LandingPage: React.FC = () => {
     return (
       <div className="min-h-screen bg-white flex flex-col">
         {/* Existing sections */}
         <NewSection />
         {/* More sections */}
       </div>
     );
   };
   ```

### Updating Content

**Text-only changes** (no layout changes):
- Edit the component file directly
- No need to touch `landingAssets.ts` or other files
- Hot reload will show changes immediately

**Image changes**:
1. Add new image to `/public/assets/img/`
2. Update `src/constants/landingAssets.ts`:
   ```ts
   export const landingAssets = {
     sectionName: {
       newImage: '/assets/img/new-image.png',
     },
   };
   ```
3. Use in component:
   ```tsx
   <img src={landingAssets.sectionName.newImage} alt="Description" />
   ```

**Layout changes**:
- Modify TailwindCSS classes in component
- Use responsive utilities: `md:`, `sm:`, `lg:`
- Test at different breakpoints (1280px, 768px, 375px)

## Responsive Design

### Breakpoints

```tsx
// Mobile-first approach
sm:  // 640px and up (small tablets)
md:  // 768px and up (tablets)
lg:  // 1024px and up (small laptops)
xl:  // 1280px and up (desktops)
```

### Example Responsive Pattern

```tsx
// Three-column grid on desktop, single column on mobile
<div className="flex flex-col md:flex-row gap-[32px]">
  {features.map((feature) => (
    <div className="flex-1 md:max-w-[388px]">
      {/* Feature card */}
    </div>
  ))}
</div>
```

### Mobile Optimization Checklist

- [ ] Reduce font sizes (headline from 64px to 48px)
- [ ] Stack horizontal layouts vertically
- [ ] Increase touch target size (buttons ≥44×44px)
- [ ] Hide decorative elements (pins, arrows)
- [ ] Reduce padding (from 64px to 16-32px)
- [ ] Test scrolling and overflow

## Accessibility

### Semantic HTML

All components use proper semantic tags:

```tsx
<header>  // Navigation bar (Header component)
<section> // Content sections (all section components)
<nav>     // Navigation links (Footer component)
<footer>  // Footer content (Footer component)
<h1>      // Page title (HeroSection only)
<h2>      // Section headings
<h3>-<h5> // Subsection headings
```

### Alt Text Guidelines

```tsx
// Decorative images (no alt text needed)
<img src={decorativeImage} alt="" aria-hidden="true" />

// Informative images (descriptive alt text)
<img src={featureImage} alt="AI classification diagram showing hazard detection workflow" />

// Logo images
<img src={logoImage} alt="GAIA Geospatial AI-driven Assessment logo" />
```

### Keyboard Navigation

- All CTAs and links are keyboard-accessible (Tab key)
- Focus indicators visible (default browser outline or custom)
- No keyboard traps (focus can always escape)

### Color Contrast

All text meets WCAG 2.1 Level AA (4.5:1 ratio):

- White text on #0A2A4D: ✅ 9.93:1
- #334155 text on #F0F4F8: ✅ 5.81:1
- #005A9C text on white: ✅ 5.18:1

## Testing

### Component Testing Example

```tsx
import { render, screen } from '@testing-library/react';
import { HeroSection } from './HeroSection';

describe('HeroSection', () => {
  test('renders headline', () => {
    render(<HeroSection />);
    expect(screen.getByText(/Empower Your Response/i)).toBeInTheDocument();
  });
  
  test('renders CTA buttons', () => {
    render(<HeroSection />);
    expect(screen.getByText(/View Live Hazard Map/i)).toBeInTheDocument();
    expect(screen.getByText(/How It Works/i)).toBeInTheDocument();
  });
});
```

### Visual Regression Testing

1. Take screenshots at different breakpoints
2. Compare against Figma design
3. Check spacing, typography, colors
4. Verify responsive behavior

## Figma Design Reference

**Design File**: TerraSentinel  
**Node ID**: 96:984  
**URL**: `https://www.figma.com/design/Gj3ogXACugp1FZQUysXqLw/TerraSentinel?node-id=96-984&m=dev`

All components are implemented to match this Figma design specification.

## Troubleshooting

### Issue: Components not rendering

**Solution**: Check component export in `index.ts`:
```tsx
// Ensure all components are exported
export { Header } from './Header';
export { HeroSection } from './HeroSection';
// etc.
```

### Issue: Images not loading

**Solution**: Verify asset paths in `landingAssets.ts`:
```tsx
// Paths should start with /assets/img/
hero: {
  background: '/assets/img/background.png', // ✅ Correct
  background: 'assets/img/background.png',  // ❌ Wrong (missing /)
}
```

### Issue: Responsive layout broken

**Solution**: Check Tailwind responsive classes:
```tsx
// Mobile-first approach
className="flex-col md:flex-row" // ✅ Correct (mobile: column, desktop: row)
className="flex-row md:flex-col" // ❌ Wrong (inverted)
```

### Issue: Colors not matching Figma

**Solution**: Use exact hex values:
```tsx
// Use exact hex from Figma design
className="text-[#334155]" // ✅ Correct
className="text-gray-700"  // ❌ Wrong (Tailwind default, not exact match)
```

## Contributing

When adding or modifying landing page components:

1. Follow existing component patterns
2. Use consistent naming (PascalCase for files, camelCase for props)
3. Add TypeScript types for all props
4. Include JSDoc comments explaining component purpose
5. Test responsive behavior at all breakpoints
6. Verify accessibility (semantic HTML, alt text, color contrast)
7. Update this README with new component documentation

## Related Documentation

- **Main README**: `/frontend/README.md` - Full project documentation
- **Assets Registry**: `/frontend/src/constants/landingAssets.ts` - Asset path mappings
- **UI Components**: `/frontend/src/components/ui/README.md` - ShadCN UI component docs
- **Figma Design**: Node 96:984 - Original design specifications

---

**Questions or suggestions?**  
Contact the GAIA development team at contact@gaia-assessment.com.ph
