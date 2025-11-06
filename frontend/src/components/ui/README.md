# ShadCN UI Components Documentation

## Overview
This directory contains ShadCN UI components integrated into the GAIA PWA. All components are built with:
- **Radix UI primitives** for accessibility (WCAG 2.1 Level AA)
- **TailwindCSS** for styling with CSS variables
- **TypeScript** for type safety
- **Dark mode support** via class-based theme switching

## Component List

### Core Components

#### Button (`button.tsx`)
Versatile button component with multiple variants.

**Variants:**
- `default` - Primary action button (CSS variable: `--primary`)
- `destructive` - Dangerous actions (delete, remove)
- `outline` - Secondary actions with border
- `secondary` - Alternative actions
- `ghost` - Minimal style, hover effect only
- `link` - Text link style

**Sizes:** `default`, `sm`, `lg`, `icon`

**Usage:**
```tsx
import { Button } from "@/components/ui/button"

<Button>Click Me</Button>
<Button variant="destructive" size="lg">Delete</Button>
<Button variant="outline" asChild>
  <a href="/docs">Learn More</a>
</Button>
```

#### Card (`card.tsx`)
Container component for grouping related content.

**Sub-components:**
- `Card` - Main container
- `CardHeader` - Top section with title/description
- `CardTitle` - Heading (h3)
- `CardDescription` - Subtitle text
- `CardContent` - Main content area
- `CardFooter` - Bottom section for actions

**Usage:**
```tsx
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Hazard Report</CardTitle>
    <CardDescription>Flood in Metro Manila</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Water level rising at Katipunan Avenue</p>
  </CardContent>
  <CardFooter>
    <Button>Verify</Button>
  </CardFooter>
</Card>
```

#### Input (`input.tsx`)
Text input field with consistent styling.

**Usage:**
```tsx
import { Input } from "@/components/ui/input"

<Input type="email" placeholder="Enter email" />
<Input type="password" placeholder="Password" />
<Input disabled value="Read-only" />
```

#### Textarea (`textarea.tsx`)
Multi-line text input with auto-resize capability.

**Usage:**
```tsx
import { Textarea } from "@/components/ui/textarea"

<Textarea placeholder="Describe the hazard..." rows={4} />
```

#### Select (`select.tsx`)
Dropdown selection component using Radix UI primitives.

**Sub-components:**
- `Select` - Root container
- `SelectTrigger` - Button that opens dropdown
- `SelectValue` - Displays selected value
- `SelectContent` - Dropdown menu container
- `SelectItem` - Individual option
- `SelectGroup` - Group related options
- `SelectLabel` - Group label
- `SelectSeparator` - Visual divider

**Usage:**
```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

<Select>
  <SelectTrigger className="w-[180px]">
    <SelectValue placeholder="Select hazard type" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="flood">Flood</SelectItem>
    <SelectItem value="typhoon">Typhoon</SelectItem>
    <SelectItem value="earthquake">Earthquake</SelectItem>
  </SelectContent>
</Select>
```

### Feedback Components

#### Badge (`badge.tsx`)
Small label for status, tags, or categories.

**Variants:**
- `default` - Primary badge
- `secondary` - Alternative style
- `destructive` - Error/warning state
- `outline` - Bordered badge
- **GAIA Hazard Types:**
  - `flood` - Uses `bg-flood` from tailwind config
  - `typhoon` - Uses `bg-typhoon`
  - `earthquake` - Uses `bg-earthquake`
  - `fire` - Uses `bg-fire`
  - `landslide` - Uses `bg-landslide`

**Usage:**
```tsx
import { Badge } from "@/components/ui/badge"

<Badge>New</Badge>
<Badge variant="flood">Flood Warning</Badge>
<Badge variant="destructive">High Risk</Badge>
```

#### Alert (`alert.tsx`)
Prominent message for user attention.

**Variants:**
- `default` - Informational alert
- `destructive` - Error/critical alert

**Sub-components:**
- `Alert` - Container
- `AlertTitle` - Heading
- `AlertDescription` - Message content

**Usage:**
```tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

<Alert>
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Warning</AlertTitle>
  <AlertDescription>
    Typhoon approaching Metro Manila. Evacuate low-lying areas.
  </AlertDescription>
</Alert>
```

#### Toast (Sonner) (`sonner.tsx`)
Notification toasts using Sonner library.

**Usage:**
```tsx
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"

// In root component (App.tsx)
<Toaster />

// Trigger toast anywhere
toast.success("Report verified successfully")
toast.error("Failed to submit report")
toast.loading("Processing hazard data...")
```

### Overlay Components

#### Dialog (`dialog.tsx`)
Modal dialog using Radix UI Dialog primitive.

**Sub-components:**
- `Dialog` - Root provider
- `DialogTrigger` - Button to open dialog
- `DialogContent` - Modal container
- `DialogHeader` - Top section
- `DialogTitle` - Modal title
- `DialogDescription` - Subtitle
- `DialogFooter` - Bottom action area
- `DialogClose` - Close button

**Usage:**
```tsx
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Submit Report</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Confirm Submission</DialogTitle>
      <DialogDescription>
        This report will be marked as unverified until reviewed.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Data Display

#### Table (`table.tsx`)
Responsive table component for tabular data.

**Sub-components:**
- `Table` - Main container
- `TableHeader` - Header row section
- `TableBody` - Data rows section
- `TableFooter` - Footer section
- `TableRow` - Individual row
- `TableHead` - Header cell
- `TableCell` - Data cell
- `TableCaption` - Table description

**Usage:**
```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Hazard Type</TableHead>
      <TableHead>Location</TableHead>
      <TableHead>Confidence</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Flood</TableCell>
      <TableCell>Quezon City</TableCell>
      <TableCell>85%</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

#### Tabs (`tabs.tsx`)
Tabbed interface using Radix UI Tabs.

**Sub-components:**
- `Tabs` - Root container
- `TabsList` - Tab button container
- `TabsTrigger` - Individual tab button
- `TabsContent` - Content panel for each tab

**Usage:**
```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="recent">
  <TabsList>
    <TabsTrigger value="recent">Recent Reports</TabsTrigger>
    <TabsTrigger value="verified">Verified</TabsTrigger>
    <TabsTrigger value="triage">Needs Triage</TabsTrigger>
  </TabsList>
  <TabsContent value="recent">
    {/* Recent reports content */}
  </TabsContent>
  <TabsContent value="verified">
    {/* Verified reports content */}
  </TabsContent>
  <TabsContent value="triage">
    {/* Triage queue content */}
  </TabsContent>
</Tabs>
```

## Theming

### CSS Variables
All components use CSS variables defined in `src/index.css`:

**Light Mode Variables:**
- `--background` - Main background color
- `--foreground` - Main text color
- `--primary` - Primary brand color
- `--secondary` - Secondary accent color
- `--muted` - Subdued backgrounds
- `--accent` - Hover/focus states
- `--destructive` - Error/danger states
- `--border` - Border colors
- `--input` - Input field borders
- `--ring` - Focus ring color

**Dark Mode:**
Toggle dark mode by adding `class="dark"` to the root element. All variables automatically switch.

### Customization
Edit `tailwind.config.js` to modify:
- Color values (HSL format)
- Border radius (`borderRadius` section)
- Container settings
- Animations

**Example:**
```js
// tailwind.config.js
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: "hsl(var(--primary))",
        foreground: "hsl(var(--primary-foreground))",
      },
      // Add custom colors
      flood: '#3B82F6',
      typhoon: '#6366F1',
    }
  }
}
```

## GAIA-Specific Customizations

### Hazard Badge Variants
The `Badge` component includes custom variants for Philippine hazard types:

```tsx
<Badge variant="flood">Flood</Badge>
<Badge variant="typhoon">Typhoon</Badge>
<Badge variant="earthquake">Earthquake</Badge>
<Badge variant="fire">Fire</Badge>
<Badge variant="landslide">Landslide</Badge>
```

These use the existing color palette from `tailwind.config.js`:
- `flood`: `#3B82F6` (blue-500)
- `typhoon`: `#6366F1` (indigo-500)
- `earthquake`: `#8B5CF6` (violet-500)
- `fire`: `#EF4444` (red-500)
- `landslide`: `#F97316` (orange-500)

### Future Enhancements
Planned components for Phase 3 (Advanced Components):
- **Label** - Form field labels with proper association
- **Switch** - Toggle for settings (e.g., dark mode, notifications)
- **Dropdown Menu** - Context menus for actions
- **Tooltip** - Informational hints on hover
- **Separator** - Visual dividers for sections

## Development Notes

### Docker Environment
All components work within the Docker container setup:
- Files auto-reload via volume mounts (`./frontend/src:/app/src`)
- TypeScript compilation happens in container
- No need to rebuild container when adding/modifying components

### Accessibility
All components follow WCAG 2.1 Level AA guidelines:
- Keyboard navigation support
- Screen reader compatibility
- Focus indicators
- Proper ARIA attributes (via Radix UI)
- Color contrast ratios

### Testing
Component tests located in `tests/frontend/components/`:
- Unit tests with Jest + React Testing Library
- Integration tests for complex interactions
- Accessibility tests with axe-core

**Run tests:**
```bash
# Inside Docker container
docker-compose run frontend npm test

# With coverage
docker-compose run frontend npm test --coverage
```

## Resources
- [ShadCN UI Documentation](https://ui.shadcn.com)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [TailwindCSS Documentation](https://tailwindcss.com)
- [Lucide Icons](https://lucide.dev)
