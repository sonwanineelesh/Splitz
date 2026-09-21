# Splitz — Design System

**Platform:** React Native  
**Framework:** Expo + React Native  
**Font:** Geist  
**Theme:** Light + Dark  
**Style:** Minimal, slightly playful, modern fintech, premium  
**Primary Color:** Dark Green  
**Background:** Off-white / dark charcoal  
**Navigation:** Mobile-first

---

# 1. Design Direction

Splitz should feel like:

> **A premium fintech app made for friends.**

Reference characteristics:

- Clean
- Spacious
- Simple
- Trustworthy
- Slightly playful
- Modern
- Fast
- No visual clutter

Avoid:

- Generic banking UI
- Excessive gradients
- Excessive rounded cards
- Too many colors
- Glassmorphism everywhere
- Huge illustrations
- Excessive animations

---

# 2. Brand

## Name

**Splitz**

Always use:

```text
Splitz
```

Do not use:

```text
SPLITZ
SplitZ
splitz
```

---

# 3. Logo

Create a simple geometric icon representing:

**splitting / sharing / two people**

Recommended concept:

```text
     ●
    / \
   /   \
  ●     ●
```

The icon should work independently as:

- App icon
- Favicon
- Avatar
- Loading indicator

Logo should remain recognizable at small sizes.

### Logo colors

Light theme:

- Dark green icon
- Off-white background

Dark theme:

- Off-white icon
- Dark green/charcoal background

Do not create a complicated logo.

---

# 4. Color System

## Primary

```text
Primary Green
#14532D
```

Secondary green:

```text
#166534
```

Light green:

```text
#DCFCE7
```

Accent:

```text
#22C55E
```

Use accent green sparingly.

---

## Light Theme

```text
Background
#F8F7F2

Surface
#FFFFFF

Primary Text
#17201A

Secondary Text
#667067

Border
#E6E7E3

Success
#15803D

Error
#DC2626
```

---

## Dark Theme

```text
Background
#101512

Surface
#171D19

Elevated Surface
#202821

Primary Text
#F5F5F0

Secondary Text
#A7B0A9

Border
#29322C

Success
#4ADE80

Error
#F87171
```

---

# 5. Color Usage Rules

Green is the brand color.

Use it for:

- Primary buttons
- Active navigation
- Positive balances
- Important actions
- Selected states
- Logo

Do NOT make every element green.

Most UI should remain:

**Off-white + white + dark text + subtle borders.**

---

# 6. Typography

Use **Geist**.

## Display

```text
32px
Weight: 600
Line height: 38px
```

## Screen heading

```text
26px
Weight: 600
Line height: 32px
```

## Section heading

```text
18px
Weight: 600
```

## Body

```text
16px
Weight: 400
Line height: 24px
```

## Secondary

```text
14px
Weight: 400
Line height: 20px
```

## Caption

```text
12px
Weight: 500
```

Currency amounts can use:

```text
28–40px
Weight: 600
```

---

# 7. Spacing System

Use an 8px base system.

```text
4px
8px
12px
16px
24px
32px
40px
48px
64px
```

Default screen padding:

```text
16px
```

Large sections:

```text
24px
```

Never randomly use spacing values unless required.

---

# 8. Border Radius

Use moderate rounding.

```text
Small controls: 8px
Buttons: 12px
Inputs: 12px
Cards: 16px
Large containers: 20px
Bottom sheets: 24px
```

Avoid making everything pill-shaped.

Pills should mainly be used for:

- Tags
- Status
- Small filters

---

# 9. Shadows

Use shadows extremely lightly.

Prefer:

```text
Border
+
Subtle elevation
```

rather than heavy shadows.

Dark mode should rely mostly on:

```text
surface contrast
```

rather than shadows.

---

# 10. Buttons

## Primary

Dark green background.

```text
Create Group
Add Expense
Save Expense
Settle Up
```

Height:

```text
48–52px
```

Radius:

```text
12px
```

Text:

```text
16px / 600
```

---

## Secondary

Transparent/off-white surface.

Use subtle border.

---

## Destructive

Use red only for:

- Delete expense
- Remove member
- Destructive confirmation

---

# 11. Inputs

Inputs should be simple.

Example:

```text
Expense name
┌─────────────────────────┐
│ Dinner                  │
└─────────────────────────┘
```

Height:

```text
48–52px
```

Focus:

```text
2px green border
```

Error:

```text
red border
+
small error message
```

---

# 12. Cards

Cards should be used selectively.

### Balance card

Large, visually prominent.

```text
┌─────────────────────────────┐
│ YOUR BALANCE                │
│                             │
│ ₹1,240                      │
│ You are owed                │
└─────────────────────────────┘
```

Do not put every piece of information inside a card.

---

# 13. Avatars

Use initials by default.

Example:

```text
AS
NR
RK
```

Use subtle background colors derived from the theme.

No random stock profile images.

---

# 14. Navigation

Use **bottom navigation**.

Maximum:

**4 tabs**

```text
Home
Groups
Activity
Profile
```

However, inside a group:

```text
Overview
Expenses
Balances
```

Keep group navigation contextual rather than adding more global tabs.

### Active state

Use:

- Green icon
- Green label

Inactive:

- Muted gray

---

# 15. Home Screen

Header:

```text
Good evening, Arpan

Splitz
```

Main balance:

```text
You are owed

₹1,240
```

Then:

```text
Recent Groups
```

Group cards:

```text
Goa Trip
4 people

You are owed ₹840
```

Primary action:

```text
+ New Group
```

---

# 16. Group Screen

Header:

```text
← Goa Trip                ⋯
4 members
```

Balance section:

```text
You are owed

₹1,240
```

Members:

```text
Neelesh       owes you ₹840
Rahul         owes you ₹400
Priya         settled
```

Recent expenses below.

Floating/action button:

```text
+ Add Expense
```

---

# 17. Add Expense UX

Use a **bottom sheet/modal**, not a full complicated screen.

Structure:

```text
Add Expense

What was it?
[ Dinner ]

Amount
[ ₹ 2,000 ]

Paid by
[ Arpan ▼ ]

Split between
[ 4 people ]

Split
[ Equal ▼ ]

        Save Expense
```

The amount input should receive focus naturally.

---

# 18. Amount Input

Make the amount visually dominant.

Example:

```text
₹ 2,000
```

Large typography:

```text
36px / 600
```

Use numeric keyboard.

Do not build a custom calculator keyboard for MVP.

---

# 19. Split Selector

Bottom sheet:

```text
Split equally
Split by exact amount
Split by percentage
```

Selected option gets:

- Green icon
- Light green background

---

# 20. Balance Visualization

Positive:

```text
+₹840
```

Negative:

```text
-₹840
```

Settled:

```text
Settled
```

Use color + text.

Never rely on color alone.

---

# 21. Settlement UI

Example:

```text
Rahul owes you

₹840

[ Mark as Paid ]
```

Keep the screen extremely simple.

After completion:

```text
✓ Settlement recorded

Rahul is settled up.
```

---

# 22. Empty States

Keep them lightweight.

Example:

```text
No expenses yet

Add your first expense and Splitz
will handle the math.

[ Add Expense ]
```

Use the Splitz logo/icon as a small illustration.

No giant illustrations.

---

# 23. Loading States

Use skeletons for:

- Dashboard
- Group list
- Expense list
- Balance list

Avoid full-screen spinners whenever possible.

---

# 24. Animations

Animations should be subtle.

Use:

- Button press scale
- Bottom-sheet transition
- List item entrance
- Balance update
- Success checkmark

Duration:

```text
150–250ms
```

Avoid:

- Bouncy animations
- Excessive transitions
- Long loading animations

---

# 25. Haptic Feedback

Use light haptic feedback for:

- Expense saved
- Settlement completed
- Button confirmation

Do not use haptics everywhere.

---

# 26. Dark Mode

Provide a theme toggle.

Location:

```text
Profile
→ Appearance
→ Light / Dark / System
```

Default:

**System**

Persist the user's selection.

---

# 27. Responsive Rules

Design primarily for:

```text
375px
390px
430px
```

Support tablets naturally.

Avoid desktop-style layouts on phones.

Content should generally use:

```text
16px horizontal padding
```

---

# 28. Component Library

Create reusable components:

```text
Button
IconButton
TextInput
AmountInput
Avatar
AvatarGroup
Card
BalanceCard
ExpenseRow
MemberRow
GroupCard
BottomSheet
Modal
SegmentedControl
TabBar
EmptyState
Skeleton
Toast
ConfirmationDialog
```

Do not duplicate components screen-by-screen.

---

# 29. Iconography

Use one icon library consistently.

Recommended:

**Lucide React Native**

Icons:

- 20–24px
- Consistent stroke width
- No mixing icon styles

---

# 30. Screen Consistency

Every screen should follow:

```text
Safe Area
↓
Header
↓
Content
↓
Primary action
↓
Bottom navigation/contextual navigation
```

Maintain consistent:

- Padding
- Typography
- Button height
- Icon size
- Border radius
- Colors

---

# 31. Accessibility

Required:

- Minimum 44px touch targets
- Accessible labels
- Sufficient contrast
- Dynamic text support where practical
- Do not rely only on colors

---

# 32. React Native Structure

Recommended:

```text
src/
├── components/
├── screens/
├── navigation/
├── theme/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── radius.ts
├── hooks/
├── services/
├── utils/
└── types/
```

Keep design tokens centralized.

---

# 33. Theme Tokens

Never hardcode colors throughout components.

Use:

```text
theme.colors.primary
theme.colors.background
theme.colors.surface
theme.colors.text
theme.colors.textSecondary
theme.colors.border
theme.colors.success
theme.colors.error
```

Same components must work in both themes.

---

# 34. Design Rule

When choosing between:

**More information**

and

**Less information**

choose **less information** unless the additional information directly helps the user split or settle an expense.

---

# 35. Final Visual Target

Splitz should visually communicate:

```text
Minimal
    +
Premium fintech
    +
Friendly
    +
Indian-first
    +
Fast
```

The UI should feel polished enough that users can immediately understand:

> **What did I spend? Who owes me? Who do I owe?**

without needing instructions.

---

# 36. Antigravity Instruction

> Build the Splitz React Native application using this design system as the single source of truth.
>
> Do not invent new colors, typography, spacing, navigation patterns, component styles, or visual patterns unless required by a missing specification.
>
> Reuse components and design tokens.
>
> Prioritize mobile usability and consistency over adding visual complexity.
>
> When a requirement is ambiguous, choose the simplest implementation consistent with this design system.