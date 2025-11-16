# Design Guidelines: Karaoke & DJ Business Management App

## Design Approach
**Design System Foundation**: Modern productivity tool aesthetic drawing from Linear, Notion, and Stripe Dashboard. Focus on information clarity, efficient data management, and professional presentation for business operations.

## Typography System

**Font Families**:
- Primary: Inter (headers, UI elements, data tables)
- Secondary: System UI fallback for optimal performance

**Type Scale**:
- Page Titles: text-3xl font-semibold
- Section Headers: text-xl font-semibold
- Card/Panel Headers: text-lg font-medium
- Body Text: text-sm
- Table Data: text-sm
- Form Labels: text-sm font-medium
- Helper Text: text-xs
- Metadata/Timestamps: text-xs

## Layout System

**Spacing Primitives**: Use Tailwind units of 1, 2, 3, 4, 6, 8, 12, 16 for consistent rhythm
- Component internal padding: p-4, p-6
- Section spacing: space-y-6, space-y-8
- Page margins: px-6 py-8 (mobile), px-8 py-12 (desktop)
- Card padding: p-6
- Form field spacing: space-y-4
- Table cell padding: px-4 py-3

**Container Strategy**:
- Full-width layout with sidebar navigation (w-64 sidebar, remaining space for content)
- Main content area: max-w-7xl mx-auto
- Form modals: max-w-2xl (standard), max-w-4xl (complex gig forms)
- Detail pages: max-w-5xl

## Core Components

### Navigation
**Sidebar** (collapsible):
- Fixed position, full height
- Logo/company name at top (h-16)
- Navigation items with icons (lucide-react) on left
- Active state: distinct background treatment
- Role-based menu items with clear visual separation
- User profile/logout at bottom

### Dashboard Layout
**Overview Cards** (grid-cols-1 md:grid-cols-2 lg:grid-cols-3):
- Metric cards showing key numbers (upcoming gigs, pending items)
- Card structure: icon + label + large number + small trend indicator
- Minimum height: min-h-32
- Clear visual hierarchy with emphasized numbers

**Quick Action Lists**:
- Compact card lists (upcoming gigs, pending tasks)
- Each item: title + metadata row + action button
- Hover state for interactivity

### Data Tables (shadcn/ui)
**Structure**:
- Header row: font-medium with sort indicators
- Row height: comfortable padding (py-3)
- Alternating row treatment for scannability
- Sticky header on scroll
- Action column on right (edit/delete icons)
- Pagination at bottom right
- Search/filter controls at top left

**Table Features**:
- Status badges (inline, small, rounded-full px-2 py-1)
- Date formatting: consistent, relative when recent
- Truncate long text with tooltips
- Empty states with helpful messaging

### Forms & Modals
**Modal Structure**:
- Overlay with backdrop blur
- Modal: rounded-lg with shadow-xl
- Header: flex justify-between with title + close button (h-16, px-6)
- Content area: px-6 py-4 with overflow-y-auto max-h-[80vh]
- Footer: sticky bottom with action buttons (px-6 py-4)

**Form Layout**:
- Single column for most forms
- Grid layout (grid-cols-2 gap-4) for related fields (first/last name, city/state)
- Label above input pattern
- Required field indicators
- Inline validation messages below fields
- Grouped sections with subtle dividers (border-t, pt-6)

**Form Controls** (all shadcn/ui):
- Text inputs with clear focus states
- Searchable combobox for customer/venue/personnel selection
- Multi-select with tags display
- Date/time pickers with calendar dropdown
- Textareas: min-h-24 for notes fields
- Checkboxes with label alignment

### Detail Pages
**Layout Pattern**:
- Page header with title + action buttons (flex justify-between)
- Info sections in cards with clear headers
- Tabbed interface for complex details (Gig Details, Financials, Assignments)
- Related records in tables or list groups
- Inline editing capability with save/cancel actions

**Financial Sections**:
- Two-column layout (Invoices | Payouts)
- List items with amount emphasized (text-lg font-semibold)
- Status indicators
- "Add" buttons positioned at section headers
- Running totals where applicable

### Role-Based UI
**Visual Differentiation**:
- Owner/Manager: Full sidebar with all modules
- Personnel: Limited sidebar (3-4 items only)
- Page titles indicate user context ("My Profile" vs "Personnel Management")
- Restricted actions hidden completely (not just disabled)

### Status & Metadata
**Status Badges**:
- Pending, Confirmed, Cancelled for gigs
- Sent, Paid for invoices
- Badge style: inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium

**Metadata Display**:
- Created/updated timestamps: text-xs
- User attribution: "Added by John Doe"
- Icon + text pattern for quick scanning

### Empty States
- Centered content with icon (size-16)
- Heading + descriptive text
- Primary action button ("Create Your First Gig")
- Helpful hints about the feature

## Interaction Patterns

**Loading States**: 
- Skeleton screens for table rows
- Spinner for form submissions
- Optimistic updates where possible

**Confirmation Dialogs**:
- Alert dialog (shadcn/ui) for destructive actions
- Clear action buttons (Cancel/Delete)
- Explain consequences

**Animations**: 
- Minimal, functional only
- Modal enter/exit transitions
- Dropdown menu animations (built into shadcn/ui)
- No decorative animations

## File Upload
- Drag-and-drop zone with border-dashed
- File list with name, size, upload date
- Download/delete actions per file
- Document type badge

## Responsive Behavior
- Mobile: Stack all multi-column layouts to single column
- Sidebar: Overlay drawer on mobile
- Tables: Horizontal scroll with fixed first column
- Forms: Full-width inputs on mobile
- Action buttons: Full-width on mobile (w-full sm:w-auto)