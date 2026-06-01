-- ============================================================
-- نظام الافتقاد - Full Database Schema
-- شغّل الكود ده كله في Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. جداول البيانات الأساسية
-- ============================================================

-- جدول البروفايل (الخدام وأبونا)
create table if not exists profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  role text not null check (role in ('admin', 'servant')),
  fcm_token text,
  created_at timestamp with time zone default now()
);

-- جدول الوزنات
create table if not exists groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  admin_id uuid references profiles(id) on delete cascade,
  deadline timestamp with time zone,
  created_at timestamp with time zone default now()
);

-- جدول المخدومين
create table if not exists members (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  phone text not null,
  group_id uuid references groups(id) on delete cascade,
  created_at timestamp with time zone default now()
);

-- جدول الجولات (rounds)
create table if not exists rounds (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade,
  name text not null,
  deadline timestamp with time zone,
  created_by uuid references profiles(id),
  created_at timestamp with time zone default now()
);

-- جدول سجل الافتقاد
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

-- جدول ربط الخدام بالوزنات (many-to-many)
create table if not exists servant_groups (
  servant_id uuid references profiles(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  primary key (servant_id, group_id)
);

-- ============================================================
-- 2. Row Level Security (RLS)
-- ============================================================

alter table profiles enable row level security;
alter table groups enable row level security;
alter table members enable row level security;
alter table rounds enable row level security;
alter table visits enable row level security;
alter table servant_groups enable row level security;

-- ============================================================
-- 3. Policies
-- ============================================================

-- Profiles: كل واحد يشوف بروفايله
create policy "profiles: read own"
  on profiles for select
  using (auth.uid() = id);

-- Profiles: الأدمين يشوف الكل
create policy "profiles: admin read all"
  on profiles for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Profiles: تحديث البروفايل الخاص
create policy "profiles: update own"
  on profiles for update
  using (auth.uid() = id);

-- Groups: الخادم يشوف وزنته، والأدمين يشوف الكل
create policy "groups: read"
  on groups for select
  using (
    admin_id = auth.uid()
    or exists (
      select 1 from servant_groups sg
      where sg.servant_id = auth.uid() and sg.group_id = groups.id
    )
  );

-- Groups: الأدمين فقط يكتب
create policy "groups: admin write"
  on groups for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Members: الخادم يشوف مخدومين وزنته، والأدمين يشوف الكل
create policy "members: read"
  on members for select
  using (
    exists (
      select 1 from groups g
      left join servant_groups sg on sg.group_id = g.id
      where g.id = members.group_id
        and (g.admin_id = auth.uid() or sg.servant_id = auth.uid())
    )
  );

-- Members: الأدمين فقط يكتب
create policy "members: admin write"
  on members for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Rounds: نفس منطق المخدومين
create policy "rounds: read"
  on rounds for select
  using (
    exists (
      select 1 from groups g
      left join servant_groups sg on sg.group_id = g.id
      where g.id = rounds.group_id
        and (g.admin_id = auth.uid() or sg.servant_id = auth.uid())
    )
  );

-- Rounds: الأدمين فقط يكتب
create policy "rounds: admin write"
  on rounds for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Visits: الخادم يقرأ ويكتب زياراته
create policy "visits: servant manage own"
  on visits for all
  using (servant_id = auth.uid());

-- Visits: الأدمين يقرأ الكل
create policy "visits: admin read all"
  on visits for select
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Servant Groups: الخادم يشوف وزنته، الأدمين يشوف الكل
create policy "servant_groups: read"
  on servant_groups for select
  using (
    servant_id = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Servant Groups: الأدمين فقط يكتب
create policy "servant_groups: admin write"
  on servant_groups for all
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- ============================================================
-- 4. Trigger: إنشاء profile تلقائياً عند تسجيل يوزر جديد
-- ============================================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', 'مستخدم جديد'),
    coalesce(new.raw_user_meta_data->>'role', 'servant')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- 5. إنشاء أكونت أبونا (عدّل البيانات قبل ما تشغّل)
-- ============================================================

-- خطوة 1: روح Authentication > Users > Add User في Supabase Dashboard
-- وعمل يوزر بإيميل وباسورد أبونا

-- خطوة 2: بعد ما تعمل اليوزر، جيب الـ UUID بتاعه وشغّل:
-- update profiles
-- set role = 'admin', name = 'أبونا [الاسم]'
-- where id = 'ضع-UUID-هنا';

-- ============================================================
-- تمت كل الإعدادات ✅
-- ============================================================

-- ============================================================
-- 6. Policy إضافية لصفحة الـ Setup
-- ============================================================

-- السماح بقراءة عدد الأدمين بدون تسجيل دخول (للـ setup check)
create policy "profiles: anon can count admins"
  on profiles for select
  to anon
  using (role = 'admin');

-- السماح للـ authenticated user بتحديث الـ role لنفسه (للـ setup فقط)
-- ملاحظة: ده بيشتغل فقط لما يكون مفيش أدمين تاني موجود
create policy "profiles: allow first admin setup"
  on profiles for update
  using (
    auth.uid() = id
    and not exists (
      select 1 from profiles p2
      where p2.role = 'admin' and p2.id != id
    )
  );
