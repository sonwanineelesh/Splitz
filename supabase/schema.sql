-- Splitz backend schema (backend Sec 3-8, 16, 30).
-- Deploy in Supabase SQL editor. Supabase is the source of truth (Sec 33.1).
-- Money is BIGINT paise everywhere (Sec 9).

-- ============ Tables ============

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('trip','friends','roommates','couple','family','other','direct')),
  created_by uuid references profiles(id),
  invite_code text unique,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  user_id uuid references profiles(id),
  display_name text not null,
  role text not null default 'member' check (role in ('owner','member')),
  created_at timestamptz default now(),
  unique (group_id, user_id)
);

create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  description text not null,
  amount_paise bigint not null check (amount_paise > 0),
  paid_by uuid references group_members(id),
  category text not null default 'other'
    check (category in ('food','stay','transport','shopping','entertainment','bills','other')),
  notes text,
  split_type text not null check (split_type in ('equal','exact','percentage','shares')),
  created_by uuid references profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists expense_shares (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references expenses(id) on delete cascade,
  member_id uuid references group_members(id),
  amount_paise bigint not null check (amount_paise >= 0),
  percentage numeric,
  shares numeric,
  created_at timestamptz default now()
);

create table if not exists settlements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  from_member uuid references group_members(id),
  to_member uuid references group_members(id),
  amount_paise bigint not null check (amount_paise > 0),
  status text not null default 'pending' check (status in ('pending','paid','cancelled')),
  created_at timestamptz default now(),
  paid_at timestamptz
);

create table if not exists recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  description text not null,
  amount_paise bigint not null check (amount_paise > 0),
  paid_by uuid references group_members(id),
  split_type text not null check (split_type in ('equal','exact','percentage','shares')),
  frequency text not null check (frequency in ('weekly','monthly','yearly')),
  next_run_at timestamptz,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups(id) on delete cascade,
  code text unique not null,
  created_by uuid references profiles(id),
  expires_at timestamptz,
  created_at timestamptz default now()
);

-- ============ Indexes (Sec 30) ============

create index if not exists idx_groups_created_by on groups(created_by);
create index if not exists idx_group_members_group on group_members(group_id);
create index if not exists idx_group_members_user on group_members(user_id);
create index if not exists idx_expenses_group on expenses(group_id);
create index if not exists idx_expenses_created on expenses(created_at);
create index if not exists idx_shares_expense on expense_shares(expense_id);
create index if not exists idx_shares_member on expense_shares(member_id);
create index if not exists idx_settlements_group on settlements(group_id);
create index if not exists idx_invitations_code on invitations(code);

-- ============ Atomic expense creation (Sec 10) ============
-- Validates payer ∈ group and shares sum == amount, else rolls back.

create or replace function create_expense_with_shares(
  p_group_id uuid,
  p_description text,
  p_amount_paise bigint,
  p_paid_by uuid,
  p_category text,
  p_notes text,
  p_split_type text,
  p_created_by uuid,
  p_shares jsonb
) returns uuid language plpgsql as $$
declare
  v_expense_id uuid;
  v_sum bigint;
  v_payer uuid;
begin
  select id into v_payer from group_members where id = p_paid_by and group_id = p_group_id;
  if v_payer is null then
    raise exception 'PAYER_NOT_IN_GROUP';
  end if;

  select coalesce(sum((s->>'amount_paise')::bigint), 0) into v_sum
  from jsonb_array_elements(p_shares) s;
  if v_sum != p_amount_paise then
    raise exception 'SHARES_MISMATCH';
  end if;

  insert into expenses (group_id, description, amount_paise, paid_by, category, notes, split_type, created_by)
  values (p_group_id, p_description, p_amount_paise, p_paid_by, p_category, p_notes, p_split_type, p_created_by)
  returning id into v_expense_id;

  insert into expense_shares (expense_id, member_id, amount_paise, percentage, shares)
  select v_expense_id,
         (s->>'member_id')::uuid,
         (s->>'amount_paise')::bigint,
         nullif(s->>'percentage','')::numeric,
         nullif(s->>'shares','')::numeric
  from jsonb_array_elements(p_shares) s;

  return v_expense_id;
end;
$$;

-- ============ RLS (Sec 16, mandatory) ============

alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table expenses enable row level security;
alter table expense_shares enable row level security;
alter table settlements enable row level security;
alter table recurring_expenses enable row level security;
alter table invitations enable row level security;

create or replace function is_group_member(p_group_id uuid) returns boolean
language sql stable as $$
  select exists (
    select 1 from group_members
    where group_id = p_group_id and user_id = auth.uid()
  );
$$;

-- profiles: own row only
drop policy if exists profiles_own on profiles;
create policy profiles_own on profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

-- groups: members only
drop policy if exists groups_member_read on groups;
create policy groups_member_read on groups
  for select using (is_group_member(id));
drop policy if exists groups_member_write on groups;
create policy groups_member_write on groups
  for all using (is_group_member(id)) with check (is_group_member(id));

-- group_members: visible within own groups; inserts by members
drop policy if exists gm_read on group_members;
create policy gm_read on group_members
  for select using (is_group_member(group_id));
drop policy if exists gm_write on group_members;
create policy gm_write on group_members
  for insert with check (is_group_member(group_id));
drop policy if exists gm_update on group_members;
create policy gm_update on group_members
  for update using (is_group_member(group_id));

-- expenses / shares / settlements / recurring: group members only
drop policy if exists expenses_rw on expenses;
create policy expenses_rw on expenses
  for all using (is_group_member(group_id)) with check (is_group_member(group_id));

drop policy if exists shares_rw on expense_shares;
create policy shares_rw on expense_shares
  for all using (
    exists (select 1 from expenses e where e.id = expense_id and is_group_member(e.group_id))
  ) with check (
    exists (select 1 from expenses e where e.id = expense_id and is_group_member(e.group_id))
  );

drop policy if exists settlements_rw on settlements;
create policy settlements_rw on settlements
  for all using (is_group_member(group_id)) with check (is_group_member(group_id));

drop policy if exists recurring_rw on recurring_expenses;
create policy recurring_rw on recurring_expenses
  for all using (is_group_member(group_id)) with check (is_group_member(group_id));

-- invitations: members manage; join validated via code lookup by authenticated users
drop policy if exists invitations_rw on invitations;
create policy invitations_rw on invitations
  for all using (is_group_member(group_id)) with check (is_group_member(group_id));
