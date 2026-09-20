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
→ Add Members
→ Add Expense
→ Split Expense
→ View Balances
→ Settle Up
```

**Priority:** Working product > backend complexity > extra features.

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
  type: string
  memberIds: string[]
  createdAt: string
}
```

## Member

```ts
{
  id: string
  name: string
  groupId: string
}
```

## Expense

```ts
{
  id: string
  groupId: string
  description: string
  amount: number
  paidBy: string
  splitType: "equal" | "exact" | "percentage"
  createdAt: string
}
```

## Expense Share

```ts
{
  expenseId: string
  memberId: string
  amount: number
}
```

## Settlement

```ts
{
  id: string
  groupId: string
  fromMember: string
  toMember: string
  amount: number
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
Expenses
Balances
```

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

Display:

```text
Add people

[ Member name ]

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

[ Equal ]
```

Split options:

```text
Equal
Exact amount
Percentage
```

CTA:

```text
Save Expense
```

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

# 15. Expense List

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

Tap expense:

```text
→ Expense Details
```

---

# 16. Expense Details

Display:

```text
Dinner

₹2,000

Paid by Arpan

Arpan       ₹500
Neelesh     ₹500
Rahul       ₹500
Priya       ₹500
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

Generate simplified transactions.

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

Display:

```text
Settlement

Rahul owes Arpan

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
- Rounding
- Zero values

### Balance calculation

Test:

```text
1 payer
2 members

Multiple payers
Multiple expenses

Fully settled group
```

### Settlement

Test:

```text
Simple debt
Multiple debtors
Multiple creditors
Zero balance
```

---

# 32. Manual Test Checklist

Before considering V1 complete:

- [ ] Fresh install works
- [ ] Demo mode works
- [ ] Create group works
- [ ] Add members works
- [ ] Add equal expense works
- [ ] Exact split works
- [ ] Percentage split works
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
- Authentication
- Cloud sync
- UPI payments
- Push notifications
- AI
- Receipt scanning
- OCR
- Bank integrations
- Subscriptions
- Ads
- Multi-currency
- WhatsApp API
- Social features

These belong to later versions.

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
Add expense
↓
Change split
↓
View balances
↓
View settlement
↓
Mark settlement paid
↓
Close app
↓
Reopen app
↓
Data still exists
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