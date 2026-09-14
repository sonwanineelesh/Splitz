# Splitz MVP Design Spec
Date: 2026-09-14
Status: Draft

## 1. Product Overview
Splitz is a freemium, local-first Splitwise alternative. It allows users to track shared expenses in groups with a focus on simplicity and a "Pro" tier for unlimited expenses.

### Core Value Proposition
- Full feature set (receipt scanning, FX, recurring) available for free.
- Strictly local-first for MVP (no cloud sync, no accounts).
- Monetization via a per-group expense limit (5 expenses for free users).

## 2. Architecture

### 2.1 Layered Design
To ensure the app is "Sync-Ready" for future cloud integration, we implement a layered architecture:
`UI Components` $\rightarrow$ `State Store` $\rightarrow$ `Repository Interface` $\rightarrow$ `IndexedDB Implementation`

### 2.2 Technical Stack
- **Framework**: TanStack Start + Tailwind CSS
- **State Management**: TanStack Store
- **Persistence**: IndexedDB (via a repository layer)
- **AI Integration**: Lovable AI Gateway (Gemini Vision) for receipt scanning
- **Charts**: Recharts
- **PWA**: Basic manifest and icons

### 2.3 Data Model (Integer Minor Units)
All monetary values are stored as integers (e.g., cents) to avoid floating-point errors.

#### Entities
- **Group**: `{ id: UUID, name: string, homeCurrency: string, createdAt: timestamp }`
- **Member**: `{ id: UUID, groupId: UUID, name: string, isUser: boolean }`
- **Expense**: `{ id: UUID, groupId: UUID, paidByMemberId: UUID, amount: integer, currency: string, fxRateToHome: float, description: string, category: string, date: Date, isRecurring: boolean, recurringRule: string }`
- **Split**: `{ id: UUID, expenseId: UUID, memberId: UUID, amount: integer }`

## 3. Core Business Logic

### 3.1 Split Strategies
- **Equal**: Total amount divided by number of participants. Remainder distributed to first members.
- **Exact**: Manual entry, validated against total.
- **Percentage**: Validated to sum to 100%.
- **Shares**: Distributed based on a weight/share count.

### 3.2 Debt Simplification
Implemented via a greedy matching algorithm:
1. Calculate Net Balance for each member: $\sum \text{Paid} - \sum \text{Owed}$.
2. Create lists of Creditors (Net > 0) and Debtors (Net < 0).
3. Match the largest debtor with the largest creditor until all balances reach zero.

### 3.3 Settle Up
Handled as a special expense where the "Paid By" member is the person paying, and the "Split" is 100% allocated to the recipient.

## 4. Advanced Features

### 4.1 AI Receipt Scanning
- **Process**: Image $\rightarrow$ AI Gateway $\rightarrow$ Gemini Vision $\rightarrow$ Structured JSON.
- **Schema**: `{ merchant: string, total: number, currency: string, date: string }`.

### 4.2 Multi-Currency Support
- **Home Currency**: Defined at the group level.
- **Persistence**: The exchange rate is snapshotted on the expense object at creation time.
- **Conversion**: $\text{amountInHome} = \text{expenseAmount} \times \text{fxRateToHome}$.

### 4.3 Recurring Expenses
- **Implementation**: Store a `RecurringRule` (frequency, start date).
- **Lazy Execution**: On app launch, check `lastRunTimestamp` and generate new expense instances if the scheduled date has passed.

### 4.4 Free vs Pro Tier
- **Free Limit**: Maximum 5 expenses per group.
- **The Gate**: If limit is hit, replace "Add Expense" button with an "Upgrade to Pro" CTA.
- **Demo Mode**: Local `isPro` flag to bypass limits for showcasing.

## 5. Route Map
- `/`: Home (Groups list, overall balances, add group)
- `/group/$id`: Group feed, balance summary, settle-up
- `/group/$id/add`: Add/edit expense form (split modes, receipt scan)
- `/group/$id/insights`: Spending charts
- `/activity`: Global search across all expenses
- `/pro`: Pricing and upgrade
- `/settings`: Profile, default currency, data export/reset
