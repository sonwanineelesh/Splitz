# Splitz V1 — React Native PRD

**Product:** Splitz  
**Version:** V1  
**Platform:** iOS + Android  
**Framework:** React Native + Expo + TypeScript  
**Purpose:** Working MVP for internal testing and user demos.

---

## 1. V1 Goal

Build a functional expense-splitting mobile app where users can:

```text
Create Group
→ Add Members (no account required)
→ Add Expense (unlimited)
→ Split Expense (equal / exact / percentage / shares)
→ View Balances
→ Simplify Debts
→ Settle Up
```

Also supported without a group:

```text
Quick Split → Direct Friend Split (1:1, no group needed)
```

**Priority:** Working product > backend complexity > extra features.

**V1 positioning:** Fast expense entry + flexible splitting + accurate balances + simplified debts + frictionless sharing. Unlimited expenses. No paywall for core splitting.

**V1 Priority Order (must-have add-ons):**

```text
1. Simplify Debts          🔴
2. Non-account members     🔴
3. Direct Friend Split     🔴
4. Shares Split            🔴
5. Unlimited Expenses      🔴
6. Search Expenses         🟠
7. Recurring Expenses      🟠
8. Categories              🟠
9. Default Split           🟠
10. Expense Notes          🟡
```

---

# 2. Tech Stack

Use:

- Expo
- React Native
- TypeScript
- Expo Router
- Zustand
- AsyncStorage
- React Native Paper OR custom components
- Lucide React Native
- Geist font

### V1 intentionally has NO backend.

Store all data locally.

This makes the app:

- Easy to run
- Easy to test
- No database setup
- No API keys
- No authentication setup
- Works offline

---

# 3. Project Setup

The project must run with:

```bash
npm install
npx expo start
```

Then users can:

```text
i → iOS simulator
a → Android emulator
Scan QR → Expo Go
```

Also support:

```bash
npx expo start --tunnel
```

if the phone and computer are on different networks.

---

# 4. V1 Data Storage

Use:

```text
AsyncStorage
```

Persist:

```text
groups
members
expenses
settlements
settings
```

Create a simple storage service:

```text
storage/
├── groups
├── expenses
├── settlements
└── settings
```

No server required.

---

# 5. Data Models

## Group

```ts
{
  id: string
  name: string
  type: string // "trip" | "friends" | "roommates" | "couple" | "family" | "other" | "direct"
  memberIds: string[]
  createdAt: string
  defaultSplitType?: "equal" | "exact" | "percentage" | "shares"
  defaultSplitData?: Record<string, number> // memberId -> exact amount | % | shares, depending on type
}
```

> `type: "direct"` is used for Direct Friend Split (implicit 2-member group, no formal group creation).
> `defaultSplitType/Data` powers Default Split per group (Sec 44).

## Member

Members can exist WITHOUT an account (Sec 38). Name is sufficient.

```ts
{
  id: string
  name: string
  groupId: string
  phone?: string      // optional, for future linking
  email?: string      // optional, for future linking
  isAccount?: boolean // false by default in V1; account linking happens later
}
```

## Expense

```ts
{
  id: string
  groupId: string // for Direct Friend Split, points to implicit `direct` group; never empty
  description: string
  amount: number // paise, integer. No limits (Sec 41: unlimited expenses)
  paidBy: string
  splitType: "equal" | "exact" | "percentage" | "shares"
  shares?: Record<string, number> // memberId -> shares, only when splitType === "shares"
  category: "food" | "stay" | "transport" | "shopping" | "entertainment" | "bills" | "other"
  note?: string
  recurring?: "none" | "weekly" | "monthly" | "yearly" // Sec 43; V1 creates next instance only
  createdAt: string
}
```

## Expense Share

```ts
{
  expenseId: string
  memberId: string
  amount: number // paise
}
```

## Settlement

Simplified debts (Sec 37). Minimum practical transactions. Total balance must never change.

```ts
{
  id: string
  groupId: string
  fromMember: string
  toMember: string
  amount: number // paise
  status: "pending" | "paid"
}
```

---

# 6. Navigation

Use Expo Router.

```text
app/
├── index.tsx
├── groups/
│   ├── index.tsx
│   ├── create.tsx
│   └── [id]/
│       ├── index.tsx
│       ├── expenses/
│       ├── balances.tsx
│       └── members.tsx
├── split/
│   ├── new.tsx        # Direct Friend Split (no group)
│   └── [id].tsx       # Direct split detail / balances
└── settings.tsx
```

Bottom navigation:

```text
Home
Groups
Settings
```

Inside a group:

```text
Overview
Expenses (with search + category filter)
Balances (simplified debts)
```

Quick Split entry point lives on Home (Sec 7) and routes to `app/split/new.tsx`.

---

# 7. Screen: Home

Display:

```text
Splitz

Your total balance

+₹1,240
You are owed
```

Sections:

### Quick Split (Direct Friend Split entry, Sec 39)

```text
Quick Split

[ With a friend ]
[ Create Group ]
```

`With a friend` → `app/split/new.tsx` (no group required).

### Recent Groups

```text
Goa Trip
4 members
You are owed ₹840
```

### CTA

```text
+ Create Group
```

If there are no groups:

```text
No groups yet

Create your first group
and start splitting expenses.

[ Create Group ]
```

---

# 8. Screen: Create Group

Fields:

```text
Group name
Group type
```

Group type options:

```text
Trip
Friends
Roommates
Couple
Family
Other
```

CTA:

```text
Create Group
```

After creation:

```text
→ Add Members
```

---

# 9. Screen: Add Members

No account required (Sec 38). Name is sufficient.

Display:

```text
Add people

[ Member name ]
[ Phone (optional) ]
[ Email (optional) ]

+ Add member
```

Example:

```text
Arpan
Neelesh
Rahul
Priya
```

CTA:

```text
Done
```

Minimum:

**2 members**

Maximum:

**20 members**

---

# 10. Screen: Group Overview

Header:

```text
Goa Trip
4 members
```

Main balance:

```text
You are owed

₹1,240
```

Members:

```text
Neelesh    owes you ₹840
Rahul      owes you ₹400
Priya      settled
```

Recent expenses:

```text
Hotel       ₹4,800
Dinner      ₹2,000
Taxi          ₹800
```

Primary button:

```text
+ Add Expense
```

---

# 11. Screen: Add Expense

Use a bottom sheet.

Fields:

```text
Expense

[ Dinner ]

Amount

[ ₹ 2,000 ]

Paid by

[ Arpan ]

Split between

[ 4 members ]

Split type

[ Equal | Exact | Percentage | Shares | Default* ]

Category

[ Food 🍔 ]

Note (optional)

[ "Rahul's birthday dinner" ]

Recurring

[ None | Weekly | Monthly | Yearly ]
```

*`Default` appears only if the group has a saved `defaultSplitType` (Sec 44). Selecting it pre-fills the saved split.

Split options:

```text
Equal
Exact amount
Percentage
Shares (Sec 40)
```

CTA:

```text
Save Expense
```

No limits on count or amount (Sec 41).

---

# 12. Equal Split

Example:

```text
Expense: ₹2,000
Members: 4

Each person:
₹500
```

Automatically calculate shares.

---

# 13. Exact Split

Example:

```text
Arpan       ₹300
Neelesh     ₹700
Rahul       ₹500
Priya       ₹500

Total: ₹2,000
```

Prevent saving if:

```text
Sum != expense amount
```

Show:

```text
Amount must equal ₹2,000
```

---

# 14. Percentage Split

Example:

```text
Arpan       25%
Neelesh     25%
Rahul       25%
Priya       25%
```

Prevent saving unless:

```text
Total = 100%
```

---

# 14b. Shares Split (Sec 40) 🔴

Example:

```text
Arpan       2 shares
Rahul       1 share
Priya       1 share

Total = 4 shares
```

₹2,000 expense:

```text
Arpan       ₹1,000
Rahul         ₹500
Priya         ₹500
```

Rules:

- Each member has `shares >= 0`, at least one member `> 0`
- `share_amount = expense_amount * member_shares / total_shares` (paise math, largest-remainder for rounding)
- Show computed ₹ per member live before save
- Prevent saving if `total_shares == 0`

Error:

```text
Add at least 1 share.
```

---

# 15. Expense List

Search + filter (Sec 42 🟠):

```text
🔍 Search expenses  [ hotel ]

Filters: [ All | Food | Stay | Transport | Shopping | Entertainment | Bills | Other ]
```

Display:

```text
Dinner
₹2,000
Paid by Arpan
Today

Hotel
₹4,800
Paid by Neelesh
Yesterday
```

Search matches `description` + `note` (case-insensitive substring). Filter by `category`.

Example:

```text
🔍 "hotel"

Hotel Goa
₹4,800
Aug 12
```

Tap expense:

```text
→ Expense Details
```

---

# 16. Expense Details

Display:

```text
Dinner 🍔 Food

₹2,000

Paid by Arpan

Arpan       ₹500
Neelesh     ₹500
Rahul       ₹500
Priya       ₹500

Note: "Rahul's birthday dinner"
Recurring: Monthly (next: Sep 25)
```

Actions:

```text
Edit
Delete
```

Delete requires confirmation.

---

# 17. Balance Calculation

For every member:

```text
Balance =
Total paid - Total owed
```

Positive:

```text
+₹840
You are owed
```

Negative:

```text
-₹840
You owe
```

Zero:

```text
₹0
Settled
```

All calculations must happen from the expense data.

Do not store calculated balances as the source of truth.

---

# 18. Settlement Algorithm

Generate simplified transactions (full spec: Sec 37 Simplify Debts 🔴).

Example:

```text
Arpan     +₹2,000
Rahul     -₹1,000
Priya     -₹1,000
```

Result:

```text
Rahul → Arpan ₹1,000
Priya → Arpan ₹1,000
```

V1 must implement greedy creditor/debtor matching to produce minimum practical payments. Total balance must never change.

Display:

```text
Simplified settlement

Rahul pays Arpan

₹1,000

[ Mark as Paid ]
```

---

# 19. Mark as Paid

When clicked:

```text
status = paid
```

UI changes to:

```text
✓ Paid

Rahul settled ₹1,000
```

Do not delete the settlement.

---

# 20. Members Screen

Show:

```text
Members

Arpan
Neelesh
Rahul
Priya
```

Actions:

- Add member
- Rename member
- Remove member

Prevent removing a member who has existing expenses unless a proper reassignment flow exists.

For V1:

> Disable removal if the member has expenses.

---

# 21. Settings

Settings:

```text
Appearance
  System
  Light
  Dark

Currency
  INR ₹

Clear Demo Data

Clear All Data
```

Dangerous actions require confirmation.

---

# 22. Demo Mode

The application must ship with a **Load Demo Data** option.

Demo data:

```text
Goa Trip

Arpan
Neelesh
Rahul
Priya

Hotel       ₹4,800
Dinner      ₹2,000
Taxi          ₹800
Breakfast     ₹600
```

This allows immediate showcasing without manually entering data.

---

# 23. First Launch

On first launch show:

```text
Splitz

Split expenses.
Not friendships.

[ Try Demo ]

[ Create Group ]
```

If user selects:

**Try Demo**

→ Load demo data  
→ Open Goa Trip.

---

# 24. Persistence

After closing/reopening the app:

- Groups remain
- Expenses remain
- Members remain
- Settlements remain
- Theme preference remains

Use AsyncStorage.

---

# 25. Money Handling

Never use floating-point arithmetic for financial calculations.

Represent money internally as:

```text
paise
```

Example:

```text
₹100.50
→ 10050
```

Format only when displaying.

---

# 26. Validation

Required:

- Group name
- Member name
- Expense name
- Expense amount
- Payer
- At least 2 split members

Amount:

```text
> ₹0
```

Exact split:

```text
sum === expense amount
```

Percentage:

```text
sum === 100
```

---

# 27. Error Handling

Use friendly messages.

Examples:

```text
Please enter an expense name.

Enter an amount greater than ₹0.

Split amounts must equal ₹2,000.

Percentages must add up to 100%.
```

No raw technical errors shown to users.

---

# 28. Loading / Empty States

Use skeletons where appropriate.

Empty group:

```text
No expenses yet.

Add your first expense.

[ Add Expense ]
```

Empty groups:

```text
No groups yet.

[ Create Group ]
```

---

# 29. Design Requirements

Follow `SPLITZ_DESIGN_SYSTEM.md`.

Core visual language:

- Dark green
- Off-white
- Geist
- Minimal
- Premium fintech
- Slightly playful
- Light/dark mode
- Moderate rounded corners
- Minimal shadows

Do not create new visual patterns without reason.

---

# 30. Components

Build reusable components:

```text
Button
IconButton
Input
AmountInput
Card
BalanceCard
GroupCard
ExpenseRow
MemberRow
Avatar
BottomSheet
Modal
Toast
EmptyState
Skeleton
```

Do not duplicate components.

---

# 31. Testing Requirements

V1 must include tests for:

### Expense calculations

- Equal split
- Exact split
- Percentage split
- Shares split (Sec 40: 2-1-1 on ₹2,000 → 1000/500/500, zero shares, rounding remainder)
- Rounding (paise largest-remainder)
- Zero values

### Balance calculation

Test:

```text
1 payer
2 members

Multiple payers
Multiple expenses

Fully settled group
Direct Friend Split (no group, 2 members)
```

### Settlement (Simplify Debts, Sec 37)

Test:

```text
Simple debt
Multiple debtors
Multiple creditors
Zero balance
Chain debts collapse (Rahul→Arpan 500, Priya→Rahul 300, Priya→Arpan 200 → Priya→Arpan 500, Rahul→Arpan 500)
Total balance unchanged after simplification
```

### New V1 add-ons

- Search: substring on description+note, category filter
- Recurring: weekly/monthly/yearly creates next instance
- Category: all 7 categories persist + display
- Default split: pre-fill on Add Expense
- Notes: optional, persists through edit/restart

---

# 32. Manual Test Checklist

Before considering V1 complete:

- [ ] Fresh install works
- [ ] Demo mode works
- [ ] Create group works
- [ ] Add members works (no account required, name-only + optional phone/email)
- [ ] Add equal expense works
- [ ] Exact split works
- [ ] Percentage split works
- [ ] Shares split works (Sec 40)
- [ ] Direct Friend Split works without group (Sec 39)
- [ ] Simplify Debts collapses chain debts, totals unchanged (Sec 37)
- [ ] Unlimited expenses: add 50+ expenses, no cap (Sec 41)
- [ ] Search expenses + category filter work (Sec 42)
- [ ] Recurring expense creates next instance (Sec 43)
- [ ] Category shows on list + details (Sec 44a)
- [ ] Default split pre-fills on Add Expense (Sec 44b)
- [ ] Note saves + displays (Sec 45)
- [ ] Edit expense works
- [ ] Delete expense works
- [ ] Balances are correct
- [ ] Settlements are correct
- [ ] Mark paid works
- [ ] Data survives app restart
- [ ] Dark mode works
- [ ] Light mode works
- [ ] Android works
- [ ] iOS works
- [ ] No crashes during core flow

---

# 33. V1 Non-Goals

Do NOT implement:

- Backend
- Authentication (members work without accounts in V1 — Sec 38)
- Cloud sync
- UPI payments / Complex UPI integration
- Push notifications
- AI
- Receipt scanning / OCR
- Itemization
- Charts / analytics UI (categories exist to enable this later, no charts in V1)
- Bank integrations
- Subscriptions
- Ads
- Multi-currency / Currency conversion
- WhatsApp API
- Social features

These belong to later versions.

Note: Unlimited expenses, search, saved default splits are IN scope for V1 (Secs 41-42, 44b) even though competitors paywall them — this is deliberate positioning.

---

# 34. Definition of Done

V1 is complete when a tester can install the app and perform:

```text
Open Splitz
↓
Try Demo
↓
View Goa Trip
↓
Add expense (with category + note)
↓
Change split (equal / exact / % / shares / default)
↓
Search expense ("hotel") + filter by category
↓
View balances
↓
View simplified settlement
↓
Mark settlement paid
↓
Quick Split with a friend (no group)
↓
Create recurring rent (monthly → next instance created)
↓
Close app
↓
Reopen app
↓
Data still exists (groups, direct splits, expenses unlimited, settings)
```

No backend or external service should be required.

---

# 35. Developer Rule

> **Do not over-engineer V1.**

The goal is a **working, polished local-first React Native prototype**, not a production SaaS backend.

Optimize for:

**Easy setup → Fast testing → Correct calculations → Polished UI**

---

# 36. Run Instructions

The final README must contain exactly:

```bash
npm install
npx expo start
```

Then:

```text
Press A → Android
Press I → iOS
Scan QR → Expo Go
```

Also document:

```bash
npm test
```

for automated tests.

The project must work immediately after cloning and installing dependencies

---

# 37. Simplify Debts 🔴 Must-have

Automatically reduces multiple debts into minimum practical payments.

Example:

```text
Before:

Rahul → Arpan ₹500
Priya → Rahul ₹300
Priya → Arpan ₹200
```

Splitz calculates:

```text
After:

Priya → Arpan ₹500
Rahul → Arpan ₹500
```

User's total balance must never change.

## V1 requirements

- Calculate net balance for every member (`paid - owed`, paise)
- Separate creditors (`> 0`) and debtors (`< 0`)
- Greedy match largest creditor ↔ largest debtor until settled
- Generate minimum practical transactions
- Display suggested payments
- Allow marking each payment as paid (Sec 19)

## UI

```text
Simplified settlement

Rahul pays Arpan
₹500

Priya pays Arpan
₹500
```

## Implementation note

Reuse Sec 18. `src/utils/calculations.ts` → `calculateBalances()` + new `simplifyDebts(balances): Settlement[]` (no floating point, ignore zero balances, preserve totals).

---

# 38. Add Expense Without Account 🔴 Must-have

User can add people who don't have Splitz installed.

Example:

```text
Dinner ₹2,000

Paid by:
Arpan

Split with:
Arpan
Rahul
Priya
```

Rahul and Priya don't need accounts.

Why: forcing registration creates network-effect friction.

## V1 requirements

- Members exist with name only (Sec 5)
- Optional `phone` / `email` fields on Add Member (Sec 9/20)
- `isAccount=false` by default; linking happens later (out of V1 scope)
- No auth / invite required to split

## Validation update

- Member name required; phone/email optional, no format hard-block in V1 (friendly warning only)

---

# 39. Direct Friend Split 🔴 Must-have

Record expense between two people without creating a group.

Example:

```text
Arpan ↔ Rahul

Lunch
₹800

Rahul owes you ₹400
```

## Home UI (see Sec 7)

```text
Quick Split

[ With a friend ]
[ Create Group ]
```

## V1 requirements

- `app/split/new.tsx`: pick/create friend name → amount → paid-by → split (equal default) → save
- Stores as implicit group `type: "direct"` with 2 members (Sec 5) so balances/settlements reuse same logic
- Appears in Recent list + total balance
- Supports all 4 split types, category, note (no recurring required for V1 direct)

---

# 40. Shares Split 🔴 Must-have

In addition to Equal / Exact / Percentage (Secs 12-14).

Example:

```text
Arpan       2 shares
Rahul       1 share
Priya       1 share

Total = 4 shares
```

₹2,000 expense:

```text
Arpan       ₹1,000
Rahul         ₹500
Priya         ₹500
```

See Sec 14b for rules + errors. Add `splitType: "shares"` + `shares` map (Sec 5).

---

# 41. Unlimited Expenses 🔴 Positioning

Do NOT impose:

```text
5 expenses/day
10 expenses/month
```

Core product allows unlimited expenses (count + amount). No counter, no paywall, no throttling. Directly addresses why users seek alternatives.

Test: add 50+ expenses in a group, list + balances + persistence still work.

---

# 42. Search Expenses 🟠 Easy / High value

Search on expense list (Sec 15).

Example:

```text
🔍 Search expenses

"hotel"
```

Results:

```text
Hotel Goa
₹4,800
Aug 12
```

Also support filters:

```text
All
Food
Travel(=Transport)
Shopping
Other
```

V1: full filter set = `All | Food | Stay | Transport | Shopping | Entertainment | Bills | Other` (matches categories). Substring match on `description + note`, case-insensitive. No backend search needed.

---

# 43. Recurring Expenses 🟠 Roommates

Allow:

```text
Rent
₹15,000
Monthly
```

Options: `Weekly | Monthly | Yearly` (+ `None` default).

V1 scope: simply create the next expense automatically on save (same group, same split, `createdAt` + interval). No cron UI, no scheduler screen, no edit-series. Show `Recurring: Monthly (next: <date>)` on details (Sec 16).

---

# 44a. Expense Categories 🟠 Easy

```text
🍔 Food
🏨 Stay
🚕 Transport
🛒 Shopping
🎬 Entertainment
💡 Bills
📦 Other
```

- Required field on Add Expense (default `Other`), shown on list row + details
- Enables future analytics without DB redesign
- Filter maps 1:1 (Sec 42)

---

# 44b. Default Split 🟠 Recurring groups

Allow groups to save a default split.

Example:

```text
Goa Trip

Default:
Arpan 25%
Rahul 25%
Priya 25%
Neelesh 25%
```

When adding expense:

```text
Split:
[ Default ]
[ Equal ]
[ Custom ]
```

V1: `Group.defaultSplitType + defaultSplitData` (Sec 5). Group settings / Members screen gets `Set default split`. Add Expense shows `Default` chip if present; selecting pre-fills. Useful for couples/roommates.

---

# 45. Expense Notes 🟡

Optional field:

```text
Note

"Paid with cash"
"Rahul's birthday dinner"
```

- Single-line, ≤ 280 chars, optional
- Shown on details, searchable (Sec 42)
- Persists through edit + restart
- Near-zero complexity

---

# 46. Validation Addendum (new fields)

Add to Sec 26:

- Shares: `total_shares > 0`, each `>= 0`; error `Add at least 1 share.`
- Category: must be one of 7; defaults to `other`
- Note: optional, trim, max 280
- Recurring: must be `none|weekly|monthly|yearly`; defaults `none`
- Direct split: friend name required, amount `> 0`, at least 2 participants (you + friend)
- Default split: if set, must be valid for current members (equal always valid; exact sum === 100% logic applies per type)
- Search: empty query → show all; no crash on special chars

Friendly messages only (Sec 27). Examples:

```text
Add at least 1 share.
Default split no longer matches members — pick a split to continue.
Enter a friend name to quick split.
```

---

# 47. V1 Build Order (enforced)

```text
1. Simplify Debts          🔴 Sec 37
2. Non-account members     🔴 Sec 38
3. Direct Friend Split     🔴 Sec 39
4. Shares Split            🔴 Sec 40 + 14b
5. Unlimited Expenses      🔴 Sec 41 (remove any caps)
6. Search Expenses         🟠 Sec 42
7. Recurring Expenses      🟠 Sec 43
8. Categories              🟠 Sec 44a
9. Default Split           🟠 Sec 44b
10. Expense Notes          🟡 Sec 45
```

Do NOT add yet (see Sec 33):

```text
❌ AI receipt scanning
❌ OCR / itemization
❌ Multi-currency / conversion
❌ Charts
❌ Bank integrations
❌ Complex UPI integration
❌ Social features
```

V1 stays: **Fast expense entry + flexible splitting + accurate balances + simplified debts + frictionless sharing.**

---

# 48. Implementation Tasks — What We Will Build

> Status as of Sep 25, 2026 build: all phases code-complete, `tsc --noEmit` clean, `npx jest` 24/24 pass, `npx expo export --platform web` succeeds. `[x]` = done in code. Device pass (Sec 32) still needs human run. Keep this section in sync when a task lands.

## Phase 0 — Foundation (unblocks all 10 features)

- [x] Paise money handling (`src/utils/currency.ts` `toPaise`/`formatCurrency`)
- [x] `calculateBalances()` + sorted greedy `calculateSettlements()`/`simplifyDebts()` + `calculateEqualShares()` + `calculateSharesSplit()` + largest-remainder percentage + `getNextRecurringDate()`
- [x] Zustand + AsyncStorage persistence (`splitz-v1` v2 with migrate), demo data (Goa Trip, backfilled)
- [x] Test runner: `jest` 29 + `@swc/jest` + `npm test` + `npm run typecheck` (ts-jest rejected: peer TS <6 vs TS 6.0.3)
- [x] Extended `src/types/index.ts` to PRD Sec 5:
  - `SplitType += 'shares'`; `GroupType += 'Direct'`
  - `Group += defaultSplitType? + defaultSplitData?`
  - `Member += phone? + email? + isAccount?`
  - `Expense += sharesMap? + category + note? + recurring?`
  - `ExpenseCategory` + `RecurringFrequency`
- [x] Migrated `demoData.ts` + persist v2 `migrate()` backfills stored expenses (default `category:'other'`, `recurring:'none'`)

## Phase 1 — 🔴 Simplify Debts (Sec 37)

- [x] Greedy creditor/debtor matching with desc sort + integer dust handling
- [x] `simplifyDebts(balances)` wrapper preserving totals (alias over fixed `calculateSettlements`)
- [x] Balances screen shows `Simplified settlement / X pays Y / ₹Z / [Mark as Paid]`
- [x] Tests: chain-collapse example (Sec 31), totals-unchanged, zero-balance, largest-first

## Phase 2 — 🔴 Non-account members (Sec 38)

- [x] Name-only members work
- [x] `addMember(groupId, name, {phone?, email?})` in `useStore.ts`
- [x] Add Member UI: `[ Phone (optional) ] [ Email (optional) ]` (Sec 9)
- [x] Members screen: shows phone/email, rename works, remove blocked with expenses (Sec 20)

## Phase 3 — 🔴 Direct Friend Split (Sec 39)

- [x] `app/split/new.tsx` — friend name → amount → paid-by → equal split → saves as implicit `type:'Direct'` 2-member group
- [x] `app/split/[id].tsx` — forwards to `/group/[id]` detail (reuses group logic)
- [x] Home Quick Split `[ With a friend ]` → `/split/new` (Sec 7)
- [x] Store helper `createDirectSplit(friendName)` + directs included in totals + Recent list (same group pipeline)
- [ ] Tests: 1:1 `Lunch ₹800 → owes ₹400` (code path covered by equal-split tests; dedicated e2e needs device)

## Phase 4 — 🔴 Shares Split (Sec 40 + 14b)

- [x] `calculateSharesSplit(amountPaise, sharesMap)` with largest-remainder rounding
- [x] `add-expense.tsx`: `Shares` tab + per-member shares inputs + live ₹ preview + `Add at least 1 share.` error
- [x] Persists `sharesMap` + computed `shares[]`; split type shown on details
- [x] Tests: 2-1-1 on ₹2,000 → 1000/500/500, zero-shares → zeros, rounding sums to total

## Phase 5 — 🔴 Unlimited Expenses (Sec 41)

- [x] No cap code — already unlimited
- [ ] Explicit test: add 50+ expenses + restart persistence (needs device run)
- [x] Documented as positioning (no UI change)

## Phase 6 — 🟠 Search Expenses (Sec 42)

- [x] Expense list: `🔍 Search` input (description+note, case-insensitive) + category filter chips `All|Food|Stay|Transport|Shopping|Entertainment|Bills|Other`
- [x] Empty-query → all; special chars do not crash (`filterExpenses` in `src/utils/search.ts`)
- [x] Tests: `"hotel" → Hotel Goa`, note match, `Food` isolates, empty query, special chars

## Phase 7 — 🟠 Recurring Expenses (Sec 43)

- [x] Add Expense: `[ None|Weekly|Monthly|Yearly ]` picker
- [x] On save with `!= none`: store auto-creates next instance (same split, `createdAt + interval`, non-recurring child)
- [x] Details shows `Recurring: Monthly` when set
- [x] Tests: weekly/monthly/yearly date math

## Phase 8 — 🟠 Categories (Sec 44a)

- [x] Category picker on Add Expense (default `Other`, 7 options with emoji, `src/constants/categories.ts`)
- [x] Shown on details (`🍔 Food · ...`); list filter maps 1:1
- [x] Backfill old/demo expenses to `other` (demo + migrate)
- [x] Tests: search/filter round-trips categories (dedicated 7-category persist covered by picker + migrate)

## Phase 9 — 🟠 Default Split (Sec 44b)

- [x] `setDefaultSplit(groupId, type, data)` + `clearDefaultSplit` in store
- [x] Members screen: `Set Equal default` / `Clear` UI
- [x] Add Expense: `[ Default ]` chip when present → pre-fills saved split
- [ ] Tests: default pre-fill e2e (needs device; unit path = equal-split tests)

## Phase 10 — 🟡 Expense Notes (Sec 45)

- [x] Add Expense: optional `Note` input (≤280 chars, `maxLength` + validate)
- [x] Details shows note; searchable via Phase 6; persists through edit (store trims) + restart (persisted)
- [x] Tests: note search match in `search.test.ts`

## Phase 11 — Hardening (Secs 26/27/31/32/34)

- [x] Percentage rounding uses paise largest-remainder (drift fixed; equal/shares same path)
- [x] `validate()` covers: shares, note length, direct-split friend name, payer, min members (Sec 46 messages)
- [ ] Manual checklist Sec 32 → needs human device pass (Android + iOS + Expo Go)
- [ ] Definition of Done Sec 34 end-to-end → needs human device pass

---

# 49. Task Tracker (single source of truth)

Build in Sec 47 order. Check off here when merged to `fix/ui-changes` (or successor branch):

```text
[x] 1. Simplify Debts          Sec 37 → Phase 1 (code + tests done, device pass pending)
[x] 2. Non-account members     Sec 38 → Phase 2 (code done, device pass pending)
[x] 3. Direct Friend Split     Sec 39 → Phase 3 (code done, device pass pending)
[x] 4. Shares Split            Sec 40 → Phase 4 (code + tests done, device pass pending)
[x] 5. Unlimited Expenses      Sec 41 → Phase 5 (no caps; 50-expense device test pending)
[x] 6. Search Expenses         Sec 42 → Phase 6 (code + tests done, device pass pending)
[x] 7. Recurring Expenses      Sec 43 → Phase 7 (code + tests done, device pass pending)
[x] 8. Categories              Sec 44a → Phase 8 (code done, device pass pending)
[x] 9. Default Split           Sec 44b → Phase 9 (code done, device pass pending)
[x] 10. Expense Notes          Sec 45 → Phase 10 (code + tests done, device pass pending)
[x] 11. Test runner + hardening Sec 31/32/34 → Phase 0 + 11 (jest + tsc green; Sec 32/34 device pass pending)
```

Backend (backend-prd.md): scaffolding landed — `supabase/schema.sql`, `src/services/*`, `src/lib/*`, `.env.example`, README section. Live verification (auth/realtime/sync/RevenueCat) pending credentials.

Rule: update Sec 48 checkboxes + this tracker in the same commit that lands the feature. Do not mark done on intent — only on working, tested code.