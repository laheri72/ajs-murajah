# Design and UI Document

## 1. Design Vision
The interface should feel:
- calm
- modern
- spiritual
- minimal
- responsive
- fast to use

The app should not feel like a heavy corporate admin panel. It should feel like a clean, devotional tracking space with clear data and one-click interaction.

---

## 2. Core UI Principles
1. **One-click first:** the main action should be easy and instant.
2. **Low cognitive load:** users should not need to think much before updating progress.
3. **Mobile-first responsiveness:** room heads will likely use phones.
4. **Clear visual hierarchy:** admin metrics, room progress, and Quran tracker should be visually separated.
5. **Soft and respectful visual tone:** avoid overly bright or noisy interfaces.

---

## 3. Suggested Visual Style
### Colors
- Primary: deep green / emerald
- Accent: soft gold
- Background: off-white or very light sand
- Text: charcoal / near-black
- Success: green
- Warning: amber
- Danger: muted red

### Typography
- Use a modern sans-serif such as Inter, Manrope, or similar.
- Headings should be bold and clean.
- Body text should remain highly readable.

### Shape language
- Rounded cards
- Soft shadows
- Gentle borders
- Large touch targets for mobile use

---

## 4. Layout Structure
### Global layout
- Top bar with logo and current context
- Sidebar for admin on desktop
- Bottom navigation or compact drawer on mobile
- Main content area with card-based sections

### Responsive behavior
- Desktop: multi-column dashboard with panels and charts
- Tablet: stacked cards with reduced sidebar complexity
- Mobile: single-column, thumb-friendly layout

---

## 5. Main Screens
## 5.1 Login screen
### Purpose
Simple, fast login for admin and room heads.

### Elements
- Logo / app name
- Username field
- Password field
- Login button
- Small help note or room reference text

### UX behavior
- Very low friction
- Autofocus on username
- Remember session after login

---

## 5.2 Room dashboard
### Purpose
This is the room head’s main working screen.

### Must show
- Room name
- Floor name
- Member count
- Total progress percentage
- Weekly progress
- Remaining target
- Progress bar
- Quran Rub’ tracker grid
- Recent activity

### Ideal behavior
- A room head should open this and immediately know how the room is doing.
- The tracker should be tappable without needing to scroll much.

---

## 5.3 Quran tracker grid
### Purpose
The main action area.

### Layout idea
- 30 Juz sections
- 4 Rub’ per Juz
- Each Rub represented as a small square or pill
- Completed items filled with color
- Incomplete items outlined or neutral

### Interaction
- Tap once to mark complete
- Tap again to undo
- Multi-select mode for bulk progress marking
- Smooth animation when status changes

### UI features
- hover states on desktop
- pressed states on mobile
- confirmation toast on completion
- subtle animation on save

---

## 5.4 Admin dashboard
### Purpose
The main control center for Maskan head.

### Must show
- total rooms
- total floors
- overall completion
- rooms behind target
- top rooms
- floor-wise performance
- weekly trends
- activity feed
- target settings summary

### Layout idea
- Top overview cards
- Middle analytics charts
- Side panel for alerts or recent activity
- Room table below

---

## 6. Key Components
### Overview cards
Small metric cards showing:
- rooms created
- rooms active
- rub completed
- completion rate
- rooms behind target

### Progress bar
Shows room or Maskan progress visually.

### Quran matrix
The core tracker UI.

### Room table
Admin can quickly inspect and manage room records.

### Floor analytics cards
Show each floor’s completion percentage in a compact format.

### Activity timeline
Shows progress updates in chronological order.

### Filters
- floor filter
- room filter
- week filter
- month filter
- completion status filter

---

## 7. Interaction Design
### For room heads
- minimal clicks
- progress actions should happen instantly
- undo should be obvious
- current status should always be visible

### For admin
- fast access to create/edit rooms
- visible summaries before drilling down
- no hidden navigation clutter
- searchable room lists

---

## 8. UX Features to Include
- instant save after click
- toast messages for success/error
- loading skeletons for dashboards
- keyboard-friendly admin editing
- mobile-friendly large buttons
- drag-free or scroll-light interactions
- sticky summary panel on desktop

---

## 9. Visual Hierarchy
### Priority order on room screen
1. room progress percentage
2. primary tracker grid
3. weekly target
4. recent activity
5. secondary stats

### Priority order on admin screen
1. overall Maskan completion
2. rooms behind target
3. floor-wise performance
4. room list and filters
5. trend charts

---

## 10. Empty States
The UI should handle empty data gracefully.

Examples:
- no rooms yet
- no floors created yet
- no progress recorded yet
- no analytics available yet

Empty states should explain what to do next.

---

## 11. Mobile UX Requirements
Because room heads may use phones:
- buttons must be large enough for thumbs
- tracker should not be cramped
- cards should stack vertically
- tables should collapse into cards on mobile
- filters should appear in a bottom sheet or compact drawer

---

## 12. Accessibility
- ensure strong text contrast
- keep buttons labeled clearly
- use recognizable icons with text where necessary
- avoid relying on color alone to show completion
- support readable font sizes

---

## 13. Future UI Enhancements
- leaderboard panels
- achievement badges
- floor comparison charts
- streak indicators
- heatmap calendar for progress updates
- monthly summary cards
- internal notifications panel
- export/report interface

---

## 14. Recommended UI style reference
Think of a combination of:
- a calm Islamic visual identity
- a modern SaaS dashboard
- a habit tracker with highly tactile controls
- a clean analytics system

The design should feel simple enough for daily use and polished enough for university administration.

