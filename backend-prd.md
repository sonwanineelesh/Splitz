# Splitz — Backend Specification

**Version:** V1
**Backend:** Supabase
**Database:** PostgreSQL
**Auth:** Supabase Auth
**Client:** React Native + Expo
**State:** Zustand
**Offline Storage:** AsyncStorage

---

# 1. Backend Architecture

```text
React Native App
      │
      ├── Supabase Auth
      │
      ├── PostgreSQL
      │
      ├── Realtime
      │
      └── Storage
```

The **Supabase database is the source of truth**.

Client-side calculations are for UI only. Critical calculations must be reproducible from database data.

---

# 2. Authentication

Use Supabase Auth.

Supported:

- Email/password
- Google OAuth

Store only application-specific user information in `profiles`.

### Session

The app must:

- Persist sessions
- Restore session on launch
- Automatically refresh tokens
- Handle logout
- Handle expired sessions

Never store passwords manually.

---

# 3. Database Schema

## profiles

```sql
id uuid primary key references auth.users(id)
display_name text not null
avatar_url text
created_at timestamptz default now()
updated_at timestamptz default now()
```

---

## groups

```sql
id uuid primary key default gen_random_uuid()
name text not null
type text not null
created_by uuid references profiles(id)
invite_code text unique
created_at timestamptz default now()
updated_at timestamptz default now()
```

Group types:

```text
trip
friends
roommates
couple
family
other
```

---

## group_members

Supports both registered and non-registered members.

```sql
id uuid primary key default gen_random_uuid()
group_id uuid references groups(id) on delete cascade
user_id uuid references profiles(id)
display_name text not null
role text default 'member'
created_at timestamptz default now()
```

`user_id` can be `NULL`.

This allows:

```text
Arpan → registered user
Rahul → registered user
Priya → guest member
```

Unique constraint:

```text
(group_id, user_id)
```

for registered users.

---

# 4. Expenses

## expenses

```sql
id uuid primary key default gen_random_uuid()
group_id uuid references groups(id) on delete cascade
description text not null
amount_paise bigint not null
paid_by uuid references group_members(id)
category text default 'other'
notes text
split_type text not null
created_by uuid references profiles(id)
created_at timestamptz default now()
updated_at timestamptz default now()
```

### Split types

```text
equal
exact
percentage
shares
```

---

# 5. Expense Shares

## expense_shares

```sql
id uuid primary key default gen_random_uuid()
expense_id uuid references expenses(id) on delete cascade
member_id uuid references group_members(id)
amount_paise bigint not null
percentage numeric
shares numeric
created_at timestamptz default now()
```

Every expense must have one or more shares.

Validation:

```text
SUM(expense_shares.amount_paise)
=
expenses.amount_paise
```

---

# 6. Settlements

## settlements

```sql
id uuid primary key default gen_random_uuid()
group_id uuid references groups(id) on delete cascade
from_member uuid references group_members(id)
to_member uuid references group_members(id)
amount_paise bigint not null
status text default 'pending'
created_at timestamptz default now()
paid_at timestamptz
```

Status:

```text
pending
paid
cancelled
```

---

# 7. Recurring Expenses

## recurring_expenses

```sql
id uuid primary key default gen_random_uuid()
group_id uuid references groups(id) on delete cascade
description text not null
amount_paise bigint not null
paid_by uuid references group_members(id)
split_type text not null
frequency text not null
next_run_at timestamptz
active boolean default true
created_at timestamptz default now()
```

Frequency:

```text
weekly
monthly
yearly
```

---

# 8. Invitations

## invitations

```sql
id uuid primary key default gen_random_uuid()
group_id uuid references groups(id) on delete cascade
code text unique not null
created_by uuid references profiles(id)
expires_at timestamptz
created_at timestamptz default now()
```

Joining:

```text
Invite link
↓
Validate code
↓
Authenticate user if required
↓
Create group_members record
↓
Redirect to group
```

Never expose internal database IDs as invite tokens.

---

# 9. Money Handling

Never store money as floating-point numbers.

Use **paise**.

Example:

```text
₹100.50
↓
10050
```

Database:

```text
BIGINT
```

Client converts:

```text
10050 → ₹100.50
```

This prevents floating-point rounding problems.

---

# 10. Expense Creation

Expense creation must be atomic.

Recommended flow:

```text
BEGIN
 ↓
Create expense
 ↓
Validate payer belongs to group
 ↓
Calculate shares
 ↓
Validate shares = expense amount
 ↓
Create expense_shares
 ↓
COMMIT
```

If any step fails:

```text
ROLLBACK
```

No partially created expenses.

Use a Supabase RPC/database function when atomic multi-table operations are required.

---

# 11. Split Validation

## Equal

```text
amount / number_of_members
```

Handle remainder deterministically.

Example:

```text
₹10 / 3

Member A = ₹3.34
Member B = ₹3.33
Member C = ₹3.33
```

Total must always equal:

```text
₹10.00
```

---

## Exact

Require:

```text
SUM(shares) = expense.amount
```

Otherwise reject.

---

## Percentage

Require:

```text
SUM(percentages) = 100
```

Calculate paise values server-side.

---

## Shares

Example:

```text
A = 2 shares
B = 1 share
C = 1 share

Total = 4
```

Calculate each member's amount from total shares.

---

# 12. Balance Calculation

Never permanently store group balances.

Calculate them from:

```text
expenses
+
expense_shares
```

For each member:

```text
balance =
total_paid
-
total_owed
```

Result:

```text
positive → member should receive money
negative → member owes money
zero → settled
```

---

# 13. Simplify Debts

Input:

```text
Member balances
```

Example:

```text
Arpan  +₹2,000
Rahul  -₹1,000
Priya  -₹1,000
```

Output:

```text
Rahul → Arpan ₹1,000
Priya → Arpan ₹1,000
```

Algorithm:

1. Calculate all net balances.
2. Separate creditors and debtors.
3. Sort by absolute balance.
4. Match largest debtor with largest creditor.
5. Create transaction for minimum possible amount.
6. Reduce both balances.
7. Continue until all balances are zero.

The algorithm must preserve:

```text
SUM(all balances) = 0
```

---

# 14. Settlement Creation

When a user chooses:

```text
Rahul → Arpan ₹1,000
```

Create:

```text
settlement
status = pending
```

Do not create a fake expense.

When marked paid:

```text
status = paid
paid_at = now()
```

Settlement history remains immutable.

---

# 15. Realtime

Use Supabase Realtime for:

- New expenses
- Expense updates
- Expense deletion
- New members
- Settlement updates

Example:

```text
User A adds expense
        ↓
Supabase
        ↓
Realtime event
        ↓
User B receives update
        ↓
Dashboard refreshes
```

Do not refetch the entire application unnecessarily.

---

# 16. Row Level Security

RLS is mandatory.

### Profiles

Users can:

- Read their own profile
- Update their own profile

### Groups

Users can access a group only if they are members.

### Group Members

Users can:

- View members of their groups
- Add members to groups they have permission to modify
- Update permitted members

### Expenses

Users can access expenses only when they belong to the associated group.

### Settlements

Same rule as expenses.

### Invitations

Only appropriate group members can create/manage invitations.

Never rely solely on React Native UI permissions.

---

# 17. Group Permissions

V1 roles:

```text
owner
member
```

Owner can:

- Edit group
- Add/remove members
- Create invitations
- Delete group

Member can:

- View group
- Add expenses
- Edit their own expenses
- Create settlements

Keep permissions simple for V1.

---

# 18. Offline Strategy

Use AsyncStorage as a local cache.

Architecture:

```text
Supabase
   ↕
Sync Layer
   ↕
Zustand
   ↕
AsyncStorage
   ↕
React Native UI
```

When online:

```text
Write → Supabase → Update local cache
```

When offline:

```text
Write → Local cache
       ↓
Pending operation queue
       ↓
Sync when online
```

V1 should prioritize:

- Offline reading
- Offline expense creation
- Sync after reconnect

---

# 19. Sync Conflict Strategy

Keep V1 simple.

For conflicting edits:

```text
Server version wins
```

Except for new expenses, which should use unique IDs and sync independently.

Do not build a complex CRDT system for V1.

---

# 20. Invite Flow

```text
Create invitation
↓
Generate random code
↓
Share link
↓
User opens link
↓
Validate invitation
↓
Login/signup
↓
Join group
↓
Create group_members record
```

Invitation codes must be cryptographically random.

---

# 21. Non-Account Members

Guest members have:

```text
user_id = NULL
display_name = "Rahul"
```

They can participate in:

- Expenses
- Splits
- Balances
- Settlements

Later, a registered user can claim/link the member profile.

Do not automatically merge members based only on name.

---

# 22. Search

Expense search should query:

```text
description
notes
category
```

Filter by:

```text
member
category
date
```

For V1, PostgreSQL search is sufficient.

Do not add Elasticsearch.

---

# 23. Recurring Expenses

When a recurring expense becomes due:

```text
recurring_expense
↓
Create normal expense
↓
Calculate shares
↓
Update next_run_at
```

The resulting expense must behave exactly like a manually created expense.

---

# 24. UPI

UPI is **not a payment backend**.

Splitz only generates a payment intent.

Example:

```text
upi://pay?
pa=recipient@upi
&pn=Arpan
&am=840
&cu=INR
```

Never claim that Splitz has confirmed payment merely because the UPI app was opened.

Settlement confirmation remains:

```text
User → Mark as Paid
```

---

# 25. RevenueCat

RevenueCat is the source of truth for Pro entitlement.

App flow:

```text
User opens Pro
↓
RevenueCat offerings
↓
User purchases
↓
RevenueCat validates purchase
↓
Entitlement becomes active
↓
Splitz unlocks Pro
```

Do not store subscription status as a manually editable boolean.

Cache entitlement locally only for UI responsiveness.

---

# 26. Analytics Events

Track:

```text
signup
login
group_created
invite_created
invite_accepted
member_added
expense_created
expense_updated
expense_deleted
split_completed
balance_viewed
settlement_created
settlement_paid
upi_clicked
pro_viewed
paywall_viewed
purchase_started
purchase_completed
```

Never send sensitive expense descriptions or private financial information to analytics providers.

---

# 27. Error Handling

Backend errors should be converted into user-friendly messages.

Example:

```text
Database error
↓
"Couldn't save the expense. Please try again."
```

Do not expose:

- SQL errors
- Database IDs
- Stack traces
- Supabase internals

Log technical errors for development.

---

# 28. Security Requirements

Never commit:

```text
.env
service_role key
private API keys
RevenueCat secret keys
```

The React Native app may use only public client credentials intended for mobile clients.

Never put the Supabase `service_role` key inside the app.

---

# 29. Environment Variables

Provide:

```text
.env.example
```

Example:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_REVENUECAT_IOS_KEY=
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=
```

Real values must never be committed.

---

# 30. Database Indexes

Add indexes for common queries:

```text
groups.created_by
group_members.group_id
group_members.user_id
expenses.group_id
expenses.created_at
expense_shares.expense_id
expense_shares.member_id
settlements.group_id
invitations.code
```

---

# 31. Backend Testing

Test:

### Auth

- Signup
- Login
- Logout
- Session restoration

### Groups

- Create
- Join
- Leave
- Permission checks

### Expenses

- Equal
- Exact
- Percentage
- Shares
- Rounding
- Edit
- Delete

### Balances

- Single expense
- Multiple expenses
- Multiple payers
- Zero balance

### Simplification

- One debtor
- Multiple debtors
- Multiple creditors
- Complex groups

### Security

- User cannot access another group's data
- User cannot edit unauthorized expenses
- Invalid invite rejected

---

# 32. Backend Definition of Done

Backend V1 is complete when:

- [ ] Supabase Auth works
- [ ] Database schema deployed
- [ ] RLS enabled
- [ ] Groups work
- [ ] Members work
- [ ] Guest members work
- [ ] Invitations work
- [ ] Expenses work
- [ ] All split methods work
- [ ] Balances are accurate
- [ ] Debt simplification works
- [ ] Settlements work
- [ ] Realtime works
- [ ] Offline cache works
- [ ] Sync works
- [ ] RevenueCat entitlement works
- [ ] Security tests pass
- [ ] No secrets are committed

---

# 33. Backend Principles

1. **Supabase is the source of truth.**
2. **Never trust client-side financial calculations.**
3. **Store money as integer paise.**
4. **Use RLS for every user-owned resource.**
5. **Keep V1 architecture simple.**
6. **Do not add infrastructure unless required.**
7. **Every financial operation must be deterministic.**
8. **Never claim a payment succeeded unless the payment provider actually confirms it.**

---

# 34. Recommended Project Structure

```text
src/
├── components/
├── screens/
├── navigation/
├── store/
├── services/
│   ├── supabase.ts
│   ├── auth.ts
│   ├── groups.ts
│   ├── expenses.ts
│   ├── settlements.ts
│   └── invitations.ts
├── lib/
│   ├── calculations/
│   │   ├── split.ts
│   │   ├── balance.ts
│   │   └── simplifyDebts.ts
│   └── sync/
├── hooks/
├── types/
└── utils/
```

Business logic such as:

```text
split calculation
balance calculation
debt simplification
```

must be isolated from UI components and independently testable.

---

# 35. Final Architecture

```text
                 ┌──────────────────┐
                 │  React Native    │
                 │      Expo        │
                 └────────┬─────────┘
                          │
                 ┌────────▼─────────┐
                 │     Zustand      │
                 └────────┬─────────┘
                          │
              ┌───────────▼───────────┐
              │      Sync Layer       │
              └───────┬───────┬───────┘
                      │       │
             ┌────────▼──┐ ┌──▼─────────┐
             │AsyncStorage│ │  Supabase  │
             │   Cache    │ │            │
             └────────────┘ │ Auth       │
                            │ PostgreSQL │
                            │ Realtime   │
                            └─────┬──────┘
                                  │
                            ┌─────▼─────┐
                            │ RevenueCat│
                            └───────────┘
```

**Primary objective:**

> Make Splitz reliable enough that two people on different phones can create, split, synchronize and settle the same group without noticing the backend complexity.
