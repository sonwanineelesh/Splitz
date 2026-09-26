# Splitz — Decisions & Daily Log

> Single source of truth for **why** we chose things and **what** we did each day.
> PRD / what-to-build lives in `project_roadmap.md`. This file tracks **decisions + progress**.
> Rule: append a `Daily Log` entry every working day. Update `Active / Next Up` in the same commit.

## Conventions

- Date format: `YYYY-MM-DD`.
- Each decision: `Context → Decision → Consequence`.
- Each daily entry: `Did / Decided / Blocked / Next`.
- Reference roadmap sections like `(PRD Sec 37)` instead of duplicating specs.
- Never mark a task done on intent — only on working, tested code.

---

## 1. Architecture Decisions

### AD-01 — Expo SDK 57 + React Native + TypeScript (2026-09-21)
- Context: Need iOS + Android MVP, fast testing via Expo Go.
- Decision: Expo ~57.0.24, React 19.2.3, RN 0.86.3, TypeScript, Expo Router file-based nav.
- Consequence: Run = `npm install` → `npx expo start`. Must follow https://docs.expo.dev/versions/v57.0.0/ (see `AGENTS.md`).

### AD-02 — Local-first, no backend for V1 (2026-09-21, PRD Sec 2/4)
- Context: Easy setup, offline, no keys/auth for internal testing.
- Decision: Zustand + AsyncStorage only, persist key `splitz-v1`. Persist groups / members / expenses / settlements / settings. No server, no auth, no sync.
- Consequence: Members work without accounts (PRD Sec 38). Cloud sync explicitly out of scope.

### AD-03 — Paise-integer money handling (2026-09-21, PRD Sec 25)
- Context: Float math causes rounding errors in splits.
- Decision: Store `amountPaise` integers. `toPaise()` / `formatCurrency()` in `src/utils/currency.ts`. Largest-remainder for splits.
- Consequence: Known gap — percentage path in `add-expense.tsx` still uses per-share `Math.round` (drift). Fix tracked in PRD Sec 48 Phase 11.
- Update (2026-09-25): FIXED — percentage/shares/equal all use largest-remainder `distributeByWeights()`; covered by tests.

### AD-04 — State shape: normalized maps (2026-09-21)
- Context: Simple lookups for groups/members/expenses.
- Decision: `Record<string, T>` maps in `src/store/useStore.ts` + `generateId()` in `src/utils/helpers.ts`.
- Consequence: Balances always derived via `calculateBalances()` — never stored as source of truth (PRD Sec 17).

### AD-05 — Custom components over React Native Paper (2026-09-21, PRD Sec 29/30)
- Context: PRD allowed Paper OR custom.
- Decision: Custom `Button, Avatar, EmptyState` + `useTheme` + `src/theme/colors.ts`. Dark green / off-white, Geist font, Lucide icons.
- Consequence: No Paper dependency in `package.json`. Don't introduce new visual patterns without reason.

### AD-06 — Hybrid nav: bottom tabs + hamburger (2026-09-21, `2684ccf`)
- Context: Needed Home / Groups / Settings plus overflow without clutter.
- Decision: `app/(tabs)/_layout.tsx` tabs + `app/menu.tsx` hamburger. Cleaned folder structure (`app/(tabs)`, `app/group`, `app/groups`, `src/*`), removed `.bat` files.
- Consequence: Follow-up import fix in `(tabs)/settings.tsx` (`259855f`). Quick Split route `app/split/new.tsx` reserved (PRD Sec 39) but not built yet.
- Update (2026-09-25): Quick Split BUILT (`app/split/new.tsx` + `[id].tsx`, store `createDirectSplit`, Home entry). Hybrid hamburger menu retained; floating pill tab bar replaced by standard tabs (see AD-14).

### AD-07 — Demo-first onboarding (2026-09-21, PRD Sec 22/23)
- Context: Showcase without manual entry.
- Decision: `src/utils/demoData.ts` Goa Trip (Arpan, Neelesh, Rahul, Priya; Hotel/Dinner/Taxi/Breakfast). `welcome.tsx` → `[ Try Demo ] [ Create Group ]`. `loadDemo()` / `clearDemoData()` / `clearAllData()` in store.
- Consequence: Demo backfill needed when types extend (category/recurring) — tracked PRD Sec 48 Phase 0.
- Update (2026-09-25): DONE — demo expenses carry category/note/recurring; group has `defaultSplitType: 'equal'`; persist v2 `migrate()` backfills old stored records.

### AD-08 — Positioning: unlimited core, no paywall (2026-09-25, PRD Sec 41)
- Context: Users seek alternatives because competitors paywall unlimited expenses / search / default splits.
- Decision: Unlimited expenses + search + saved default splits are IN V1 scope even though competitors charge. Explicit test: 50+ expenses must work.
- Consequence: No counters, no throttling, no subscription code in V1.

### AD-09 — Out of scope locked (2026-09-25, PRD Sec 33/47)
- Context: Avoid scope creep into low-usage advanced features.
- Decision: No AI receipt scanning, OCR/itemization, charts, multi-currency/conversion, bank integrations, complex UPI, social features in V1. Categories exist to enable analytics later — no charts UI now.
- Consequence: Reject PRs adding these to V1; park in backlog.

### AD-10 — PRD extension: 10 must-haves in fixed build order (2026-09-25, PRD Sec 37-47)
- Context: Original PRD only had equal/exact/percentage, no simplify/direct/shares/search/recurring/categories/default/notes.
- Decision: Added Sec 37–47 + Sec 14b + Sec 46 + Sec 48 (phased tasks) + Sec 49 (tracker). Build order: Simplify → Non-account → Direct → Shares → Unlimited → Search → Recurring → Categories → Default → Notes.
- Consequence: `src/types` gap acknowledged (no shares/category/note/recurring/default/direct yet). Implementation tasks in PRD Sec 48 are the build checklist.

### AD-11 — Greedy simplify as V1 settlement (2026-09-25, PRD Sec 18/37)
- Context: `calculateSettlements()` exists but unsorted; need minimum practical payments with totals unchanged.
- Decision: Keep greedy creditor/debtor matching, add desc-sort + dust-skip, expose as `simplifyDebts()`. Reuse for group + direct splits.
- Consequence: Chain-collapse test required (Rahul→Arpan 500, Priya→Rahul 300, Priya→Arpan 200 → Priya→Arpan 500, Rahul→Arpan 500).

### AD-12 — No test runner yet (2026-09-25, gap)
- Context: PRD Sec 31/36 require `npm test`, but `package.json` has no test script / no jest.
- Decision: Phase 0 task — add jest + `npm test` before claiming any feature done.
- Consequence: Until then, Sec 32 manual checklist is the only gate.
- Update (2026-09-25): DONE — jest 29 + @swc/jest + `npm test`, 24 tests green. ts-jest was rejected (peer TS <6 vs project TS 6.0.3); @swc/jest avoids the TS-version peer entirely.

### AD-13 — Frontend/backend conflict reconciliation (2026-09-25)
- Context: Frontend PRD Sec 33 says NO backend/Auth/sync for V1; backend PRD says Supabase is the source of truth with Auth/RLS/Realtime/sync.
- Decision: Ship offline-first V1 that runs with zero config (Zustand + AsyncStorage remain the runtime store; `npm install → npx expo start` works with no keys) PLUS a backend-ready layer that activates only when `EXPO_PUBLIC_SUPABASE_URL/_ANON_KEY` exist: `supabase/schema.sql` (tables + atomic RPC + RLS + indexes), `src/services/` (supabase/auth/groups/expenses/settlements/invitations/upi/analytics/entitlements), `src/lib/calculations/` re-exports, `src/lib/sync/` queue + server-wins conflicts.
- Consequence: Frontend DoD holds without credentials. Backend items needing live secrets (Auth sessions, Realtime, RevenueCat purchases, Google OAuth) are code-complete but unverified — pending Supabase project + store keys. No `service_role` key anywhere near the app (backend Sec 28).

### AD-14 — Standard tab bar + pull-sync scope (2026-09-25)
- Context: Floating pill tab bar (no labels, heavy shadow, content overlap) violated design Sec 8/9/14; double Stack headers on groups/members screens; backend realtime/queue code was unwired.
- Decision: Standard bottom tabs (Home, Groups, Activity, Settings — satisfies PRD Sec 6 + design Sec 14 max-4), icon 22px stroke 2, green active + label, safe-area height; `headerShown:false` everywhere a screen renders its own header; registered `split/*` routes. UX: time greeting, expo-haptics (in Expo Go, no rebuild), global Toast, 44px tab targets, settings scroll clearance. Sync: pull-only realtime (`useGroupSync` + `pullAllGroups`/Sync Now, merge by `backendId`, server wins); local→server push deferred until auth gives stable identity — queue infra stays for that phase.
- Consequence: Metro hot-reloads into the running Expo Go session; no store migration needed (toast/backendId are additive; persist v2 migrate untouched).

### AD-15 — Backend spec saved + implemented as specified (2026-09-25)
- Context: User pasted a full Supabase backend spec (35 sections) and asked for it as a doc plus implementation.
- Decision: Saved verbatim as `backend-prd.md`; implemented exactly its Sec 3–8 schema in `supabase/schema.sql` (8 tables, `amount_paise BIGINT`, atomic `create_expense_with_shares` RPC with PAYER_NOT_IN_GROUP/SHARES_MISMATCH guards, RLS on every table via `is_group_member()`, Sec 30 indexes); service layer mirrors its Sec 34 layout (`services/supabase|auth|groups|expenses|settlements|invitations|upi|analytics|entitlements`, `lib/calculations/*`, `lib/sync/*`); added `@supabase/supabase-js` + `.env.example` (Sec 28/29, anon key only, never `service_role`); UPI is intent-only, RevenueCat is entitlement source-of-truth stub, analytics is an allowlist that never carries descriptions/amounts.
- Consequence: Any deviation from `backend-prd.md` must be logged here with a new AD number. Live verification still pending credentials (tracked in Sec 3).

---

## 2. Daily Log (newest first)

### 2026-09-26 — Dashboard insights + dynamic greeting (user-approved plan)
- Did:
  - Greeting fix (direct request): new `utils/greeting.ts` — daypart (morning/afternoon/evening/night), daily-rotating templates, live balance suffix (`you're owed ₹X` / `₹X to settle` / `all settled up` / `let's split something`); wired into Home; `__tests__/greeting.test.ts` (3 tests).
  - Dashboard (approved plan A–D, "Approve — build all"): breakdown strip (owed-to-you / you-owe), pending-payments row → first unsettled group, Needs-attention card (largest debt → Balances), This-month spend + top category, Recent-activity teaser (3 latest → detail). All local compute, theme tokens, 16px cards; empty state unchanged.
  - Verified: `tsc` clean, `jest` 30/30 pass. Hot-reloaded to running Expo Go session.
  - Web-warning fixes from user-pasted logs: balance card `shadow*` → `boxShadow` (RN 0.86 cross-platform; `elevation` kept for Android), Toast `useNativeDriver` gated to non-web via `Platform.OS`. DevTools/performance lines are dev-mode noise, ignored.
- Decided: Dashboard order Hero → strip → Quick Split → attention → Recent Groups → This month → Recent activity (less-is-more per design Sec 34; no charts per non-goals).
- Blocked: Visual sign-off on device.
- Next: User review → Sec 32 device checklist → Supabase provision.

### 2026-09-25 — Nav/UX fix + backend wiring (user testing on Expo Go)
- Did:
  - Rebuilt `(tabs)/_layout.tsx`: standard bottom nav, 4 tabs (Home/Groups/Activity/Settings) with labels, safe-area height; new `(tabs)/groups.tsx` reusing list screen; menu points at the tab.
  - Fixed double headers (`groups/index`, `groups/create`, `members` → `headerShown:false`; registered `split/new` modal + `split/[id]`); settings scroll clearance 40→100.
  - UX: time-based greeting, `expo-haptics` + `utils/feedback.ts`, global `Toast` in root layout, toasts on save/settle/member-add/sync; 44px tab targets.
  - Backend into app: `backendId` on Expense/Member, `utils/remoteMerge.ts` (pure, server-wins), `services/sync.ts` pull, `hooks/useGroupSync.ts` realtime refresh, Settings Sync Now (backend-gated).
  - Verified: `tsc` clean, `jest` 27/27 pass (new `sync.test.ts`), `expo export --platform web` succeeds. Dev server left running (detached, :8081).
- Decided: AD-14 (pull-only sync scope; push deferred to auth phase).
- Blocked: Visual sign-off needs user on Expo Go; live-backend check needs Supabase project.
- Next: User UX review → fix follow-ups → device checklist Sec 32 → Supabase provision.

### 2026-09-25 — Full V1 build (frontend 10 features + backend scaffolding)
- Did:
  - Phase 0: extended `src/types` (shares/category/note/recurring/defaultSplit/phone/email/Direct), rewrote `calculations.ts` (sorted greedy `simplifyDebts`, `calculateSharesSplit`, largest-remainder percentage, `getNextRecurringDate`), backfilled `demoData.ts`, new `constants/categories.ts` + `utils/search.ts`, jest 29 + @swc/jest + `npm test` + `typecheck` (24 tests green, `tsc --noEmit` clean).
  - Phases 1–10: rewrote `add-expense.tsx` (Shares tab + live preview, category picker, note ≤280, recurring picker, Default chip, fixed percentage drift); `group/[id].tsx` (search + category filters, `simplifyDebts`, "Simplified settlement"/"X pays Y"); expense details (category/note/recurring); members (phone/email, remove blocked with expenses, default-split set/clear); Home Quick Split; `app/split/new.tsx` + `app/split/[id].tsx` (Direct reuses group screen); store (`addMember` opts, `setDefaultSplit`, `createDirectSplit`, recurring auto-child, persist v2 migrate).
  - Backend: `.env.example`, `supabase/schema.sql` (8 tables + RPC + RLS + indexes), `services/` (supabase/auth/groups/expenses/settlements/invitations/upi/analytics/entitlements), `lib/calculations/` + `lib/sync/`, README backend section.
  - Verified: `tsc --noEmit` clean, `npx jest` 24/24 pass, `npx expo export --platform web` succeeds.
- Decided: AD-13 (offline-first runtime + backend-ready layer gated on env keys).
- Blocked: Device testing (Android/iOS/Expo Go Sec 32 boxes) + live-backend verification (needs Supabase project, Google OAuth, RevenueCat keys) — cannot do headless.
- Next: `npx expo start` on a device → run PRD Sec 32 checklist + Sec 34 end-to-end → provision Supabase → deploy schema → verify auth/realtime/sync.

### 2026-09-25 — Roadmap sync + task breakdown
- Did:
  - Extended `project_roadmap.md` Sec 1/5/6/7/9/11/14b/15/16/18/31/32/33/34 with 10 must-haves (Secs 37–47).
  - Audited `src/types`, `calculations.ts`, `useStore.ts`, `add-expense.tsx`, `demoData.ts`, `package.json`.
  - Added PRD Sec 48 (Phase 0–11 file-level tasks with `[ ]`) + Sec 49 tracker. Roadmap changes uncommitted on `fix/ui-changes`.
  - Created this `DECISIONS_LOG.md`.
- Decided: AD-08 through AD-12 (positioning, non-goals lock, build order, greedy simplify, test-runner gap).
- Blocked: None. Awaiting user confirmation to start Phase 0 (types + jest).
- Next: Extend `src/types/index.ts` per Sec 5 → add jest → Phase 1 Simplify Debts.

### 2026-09-21 — Scaffold + nav + Home UI
- Did:
  - `48d8727` Initial commit (Expo scaffold, store, calculations, demo data, design system).
  - `2684ccf` Hybrid nav (tabs + hamburger), clean folder structure, remove bat files.
  - `259855f` Fix import paths in `(tabs)/settings.tsx` after folder move.
  - `f8fe870` Home screen UI to match PRD (`app/(tabs)/index.tsx`, `app.json`, `eas.json`).
- Decided: AD-01 through AD-07.
- Blocked: None recorded.
- Next (carried): Build 10 must-have features in Sec 47 order.

---

## 3. Active / Next Up

- Branch: `fix/ui-changes` (pushing to GitHub this session; see log entry below).
- Active: All 10 frontend features + nav/UX pass + backend scaffolding/wiring landed. `tsc` clean, 27/27 tests pass, web export succeeds. Decisions AD-01–AD-15 current; stale notes in AD-03/06/07 closed out.
- Next (in order):
  1. Push `fix/ui-changes` to origin (verify branch first — user instruction).
  2. User UX review on Expo Go → fix follow-ups.
  3. Device run: PRD Sec 32 manual checklist + Sec 34 end-to-end.
  4. Backend live: provision Supabase → deploy `supabase/schema.sql` → set `.env` → verify auth/realtime/sync + backend Sec 32 DoD.
- Tracker: PRD Sec 49 boxes flip to checked once device pass confirms each item.

---

## 4. Template (copy for new day)

```md
### YYYY-MM-DD — <focus>
- Did:
  - ...
- Decided: ...
- Blocked: ...
- Next: ...
```
