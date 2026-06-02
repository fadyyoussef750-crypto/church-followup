-- ============================================================
-- نظام الافتقاد - Full Database Schema v3 (Multi-Tenant)
-- شغّل الكود ده كله في Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. جداول البيانات الأساسية
-- ============================================================

create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role text not null check (role in ('admin', 'servant')),
  admin_id uuid references profiles(id) on delete cascade,
  fcm_token text,
  created_at timestamp with time zone default now()
);

create table if not exists servant_classes (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  admin_id uuid references profiles(id) on delete cascade,
  created_at timestamp with time zone default now()
);

create table if not exists groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  admin_id uuid references profiles(id) on delete cascade,
  class_id uuid references servant_classes(id) on delete set null,
  deadline timestamp with time zone,
  created_at timestamp with time zone default now()
);

create table if not exists members (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text not null,
  birthdate date,
  address text,
  group_id uuid references groups(id) on delete cascade,
  created_at timestamp with time zone default now()
);

create table if not exists rounds (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade,
  name text not null,
  deadline timestamp with time zone,
  created_by uuid references profiles(id),
  created_at timestamp with time zone default now()
);

create table if not exists visits (
  id uuid default gen_random_uuid() primary key,
  servant_id uuid references profiles(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  round_id uuid references rounds(id) on delete set null,
  status text not null check (status in ('visited', 'no_answer', 'not_visited')),
  note text,
  called_at timestamp with time zone default now(),
  unique(servant_id, member_id)
);

create table if not exists servant_groups (
  servant_id uuid references profiles(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  primary key (servant_id, group_id)
);

create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  admin_id uuid references profiles(id) on delete cascade,
  servant_id uuid references profiles(id) on delete cascade,
  content text not null,
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- ============================================================
-- 2. Row Level Security
-- ============================================================

alter table profiles enable row level security;
alter table servant_classes enable row level security;
alter table groups enable row level security;
alter table members enable row level security;
alter table rounds enable row level security;
alter table visits enable row level security;
alter table servant_groups enable row level security;
alter table messages enable row level security;

-- drop old policies if exist
do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on %I', r.policyname, r.tablename);
  end loop;
end $$;

-- profiles
create policy "profiles_read_own" on profiles for select using (
  auth.uid() = id or admin_id = auth.uid()
);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);

-- servant_classes
create policy "classes_read" on servant_classes for select using (
  admin_id = auth.uid() or
  exists (select 1 from profiles where id = auth.uid() and admin_id = servant_classes.admin_id)
);
create policy "classes_write" on servant_classes for all using (admin_id = auth.uid());

-- groups
create policy "groups_read" on groups for select using (
  admin_id = auth.uid() or
  exists (select 1 from servant_groups sg where sg.servant_id = auth.uid() and sg.group_id = groups.id)
);
create policy "groups_write" on groups for all using (admin_id = auth.uid());

-- members
create policy "members_read" on members for select using (
  exists (
    select 1 from groups g
    left join servant_groups sg on sg.group_id = g.id
    where g.id = members.group_id and (g.admin_id = auth.uid() or sg.servant_id = auth.uid())
  )
);
create policy "members_admin_write" on members for all using (
  exists (
    select 1 from groups g where g.id = members.group_id and g.admin_id = auth.uid()
  )
);
create policy "members_servant_write" on members for insert with check (
  exists (
    select 1 from servant_groups sg
    join groups g on g.id = sg.group_id
    where sg.servant_id = auth.uid() and g.id = members.group_id
  )
);
create policy "members_servant_update" on members for update using (
  exists (
    select 1 from servant_groups sg where sg.servant_id = auth.uid() and sg.group_id = members.group_id
  )
);
create policy "members_servant_delete" on members for delete using (
  exists (
    select 1 from servant_groups sg where sg.servant_id = auth.uid() and sg.group_id = members.group_id
  )
);

-- rounds
create policy "rounds_read" on rounds for select using (
  exists (
    select 1 from groups g
    left join servant_groups sg on sg.group_id = g.id
    where g.id = rounds.group_id and (g.admin_id = auth.uid() or sg.servant_id = auth.uid())
  )
);
create policy "rounds_write" on rounds for all using (
  exists (select 1 from groups g where g.id = rounds.group_id and g.admin_id = auth.uid())
);

-- visits
create policy "visits_servant_own" on visits for all using (servant_id = auth.uid());
create policy "visits_admin_read" on visits for select using (
  exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
  ) and
  exists (
    select 1 from profiles s where s.id = visits.servant_id and s.admin_id = auth.uid()
  )
);

-- servant_groups
create policy "sg_read" on servant_groups for select using (
  servant_id = auth.uid() or
  exists (select 1 from groups g where g.id = servant_groups.group_id and g.admin_id = auth.uid())
);
create policy "sg_write" on servant_groups for all using (
  exists (select 1 from groups g where g.id = servant_groups.group_id and g.admin_id = auth.uid())
);

-- messages
create policy "messages_admin_all" on messages for all using (admin_id = auth.uid());
create policy "messages_servant_read" on messages for select using (servant_id = auth.uid());
create policy "messages_servant_update" on messages for update using (servant_id = auth.uid());

-- ============================================================
-- 3. Trigger إنشاء profile تلقائياً
-- ============================================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, role, admin_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'مستخدم جديد'),
    coalesce(new.raw_user_meta_data->>'role', 'servant'),
    case
      when (new.raw_user_meta_data->>'role') = 'admin' then null
      else (new.raw_user_meta_data->>'admin_id')::uuid
    end
  )
  on conflict (id) do update set
    name = excluded.name,
    role = excluded.role,
    admin_id = excluded.admin_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- 4. Function لإرسال تحديث كلمة السر لأبونا
-- ============================================================

create or replace function notify_admin_password_change(servant_id uuid, new_password text)
returns void as $$
begin
  insert into messages (admin_id, servant_id, content)
  select p.admin_id, p.id,
    '🔑 الخادم ' || p.name || ' غيّر كلمة السر الجديدة هي: ' || new_password
  from profiles p where p.id = servant_id and p.role = 'servant';
end;
$$ language plpgsql security definer;

-- ============================================================
-- تمت كل الإعدادات ✅
-- ============================================================
