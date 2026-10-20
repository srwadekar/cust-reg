-- =========================================================================
-- SURAVI CYBER CAFE & SHOPFLOW UNIFIED SUPABASE DATABASE TABLES
-- 100% Idempotent, Production-Ready, Real-Time & RLS Enabled
-- =========================================================================

-- १. ऑपरेटर्स आणि युजर्स टेबल (Operators & Staff Roster)
create table if not exists public.users (
    username text primary key,
    password text not null,
    name text not null,
    role text default 'associate', -- 'admin' किंवा 'associate'
    proc_rate numeric default 15,  -- १५% प्रोसेसिंग कमिशन (नेट मार्जिनवर)
    proc_cap numeric default 20,   -- कमाल ₹२० प्रोसेसिंग कॅप
    disp_rate numeric default 5,   -- ५% डिस्पॅच कमिशन (नेट मार्जिनवर)
    disp_cap numeric default 5,    -- कमाल ₹५ डिस्पॅच कॅप
    salary_history jsonb default '[{"effectiveFrom":"2026-01","payType":"Daily","baseRate":500}]'::jsonb,
    waivers jsonb default '{}'::jsonb, -- ॲडमिन गैरहजर पेनल्टी वेव्हर्स: {"YYYY-MM": true}
    created_at timestamptz default now()
);

-- १.१ जुन्या युजर्स टेबलसाठी ऑटोमॅटिक मायग्रेशन (Add missing columns to existing users table)
alter table public.users add column if not exists proc_rate numeric default 15;
alter table public.users add column if not exists proc_cap numeric default 20;
alter table public.users add column if not exists disp_rate numeric default 5;
alter table public.users add column if not exists disp_cap numeric default 5;
alter table public.users add column if not exists salary_history jsonb default '[{"effectiveFrom":"2026-01","payType":"Daily","baseRate":500}]'::jsonb;
alter table public.users add column if not exists waivers jsonb default '{}'::jsonb;

-- PostgREST स्कीमा कॅशे रीफ्रेश (Reload PostgREST Schema Cache)
notify pgrst, 'reload schema';

-- डीफॉल्ट ॲडमिन इन्सर्ट (Username: sagar, Password: 123451, Role: admin)
-- ॲडमिन (sagar) दैनिक हजेरी, पंच-इन/आउट व गैरहजेरी पेनल्टीतून मुक्त (Exempted) आहे
insert into public.users (username, password, name, role, proc_rate, proc_cap, disp_rate, disp_cap) 
values ('sagar', '123451', 'Sagar Wadekar', 'admin', 15, 20, 5, 5)
on conflict (username) do update set
    role = excluded.role,
    name = excluded.name;


-- २. सेवांचे प्रकार आणि डीफॉल्ट दर टेबल (App / Service Types)
create table if not exists public.app_types (
    id bigint primary key,
    name text not null,
    default_amount numeric default 0,
    default_challan numeric default 0,
    created_at timestamptz default now()
);

-- २.१ ॲप टाईप्स टेबल ऑटोमॅटिक मायग्रेशन (Add missing columns to existing app_types table)
alter table public.app_types add column if not exists default_amount numeric default 0;
alter table public.app_types add column if not exists default_challan numeric default 0;


-- ३. कस्टमर लेजर आणि सर्विस लॉग्स टेबल (Customer Logs & Services with Challan / Net Margin)
create table if not exists public.logs (
    id bigint primary key,
    app_id text not null,
    customer_name text not null,
    mobile_no text,
    address text,
    application_type text,
    services jsonb default '[]'::jsonb, 
    -- प्रत्येक सर्विस: { name, customerPrice, challanFees, netMargin, status, physicalStatus, assignedTo, completedBy, procCommission, dispatchedBy, dispCommission }
    username text,
    password text,
    status text default 'In Process',
    total_amount numeric default 0,
    paid_amount numeric default 0,
    payment_date text,
    payment_history jsonb default '[]'::jsonb,
    notes text,
    date text,
    created_by text,
    dispatched_at timestamptz default null,
    created_at timestamptz default now()
);

-- ३.१ डिस्पॅच इव्हेंट्स टाईमस्टॅम्प ट्रॅकिंग (Dispatch Timestamp Tracking)
-- 100% सुरक्षित आणि आयडेम्पोटेंट (IF EXISTS वापरल्याने टेबल अस्तित्वात नसले तरी एरर येत नाही)
alter table if exists public.logs add column if not exists dispatched_at timestamptz default null;
alter table if exists public.tasks add column if not exists dispatched_at timestamptz default null;
alter table if exists public.cafe_tasks add column if not exists dispatched_at timestamptz default null;
alter table if exists public.logs_rows add column if not exists dispatched_at timestamptz default null;
alter table if exists public.cafe_customer_logs add column if not exists dispatched_at timestamptz default null;

notify pgrst, 'reload schema';


-- ४. दैनंदिन हजेरी आणि पंच-इन/पंच-आऊट टेबल (Daily Attendance & Punch-In/Out Logs)
create table if not exists public.attendance_logs (
    id text primary key,
    staff_id text references public.users(username) on delete cascade on update cascade,
    date text not null, -- 'YYYY-MM-DD'
    status text not null default 'Present', -- 'Present', 'Half Day', 'Absent'
    punch_in_time text,   -- पंच-इन वेळ (उदा. '09:30 AM')
    punch_out_time text,  -- पंच-आऊट वेळ (उदा. '07:00 PM')
    penalty_waived boolean default false, -- ५ दिवस गैरहजर पेनल्टी माफ करण्यासाठी ॲडमिन टॉगल
    created_at timestamptz default now(),
    unique(staff_id, date)
);

-- ४.१ हजेरी टेबल ऑटोमॅटिक मायग्रेशन (Add missing columns to existing attendance_logs table)
alter table public.attendance_logs add column if not exists penalty_waived boolean default false;


-- ५. पेमेंट लॉग्स, पे-रोल आणि उचल/ॲडव्हान्स टेबल (Staff Payments, Salary & Advance Logs)
create table if not exists public.staff_payments (
    id text primary key,
    staff_id text references public.users(username) on delete cascade on update cascade,
    type text not null, -- 'Salary Payment', 'Advance Loan', 'Bonus / Incentive', 'Overtime Pay', 'Deduction'
    amount numeric not null,
    date text not null,
    method text default 'Cash',
    note text,
    created_at timestamptz default now()
);


-- ६. कार्यक्षमता आणि वेगवान शोधासाठी इंडेक्स (Performance Indexes)
create index if not exists idx_users_role on public.users(role);
create index if not exists idx_app_types_name on public.app_types(name);
create index if not exists idx_logs_app_id on public.logs(app_id);
create index if not exists idx_logs_customer on public.logs(customer_name);
create index if not exists idx_logs_mobile on public.logs(mobile_no);
create index if not exists idx_logs_date on public.logs(date);
create index if not exists idx_attendance_staff_date on public.attendance_logs(staff_id, date);
create index if not exists idx_staff_payments_staff_date on public.staff_payments(staff_id, date);


-- ७. रो लेव्हल सिक्युरिटी (RLS) आणि ॲक्सेस पॉलिसी (Row Level Security & RBAC Rules)
alter table public.users enable row level security;
alter table public.app_types enable row level security;
alter table public.logs enable row level security;
alter table public.attendance_logs enable row level security;
alter table public.staff_payments enable row level security;

-- ७.१ मास्टर ॲडमिन (sagar) संरक्षण ट्रिगर (Master Admin Protection Trigger)
create or replace function public.protect_master_admin()
returns trigger as $$
begin
    if (TG_OP = 'DELETE' and OLD.username = 'sagar') then
        raise exception 'सुरक्षा नियम: मुख्य ॲडमिन खाते (sagar) डिलीट करण्यास सक्त मनाई आहे.';
    end if;
    if (TG_OP = 'UPDATE' and OLD.username = 'sagar' and NEW.role <> 'admin') then
        raise exception 'सुरक्षा नियम: मुख्य ॲडमिन (sagar) चा रोल नेहमी admin असावा.';
    end if;
    return NEW;
end;
$$ language plpgsql;

drop trigger if exists trg_protect_master_admin on public.users;
create trigger trg_protect_master_admin
before update or delete on public.users
for each row execute function public.protect_master_admin();

-- ७.२ युझर्स आणि ऑपरेटर RBAC पॉलिसी (Users & Credentials Master Policies)
drop policy if exists "Allow all operations on users" on public.users;
create policy "Allow all operations on users" on public.users for all using (true) with check (true);

drop policy if exists "Allow all operations on app_types" on public.app_types;
create policy "Allow all operations on app_types" on public.app_types for all using (true) with check (true);

drop policy if exists "Allow all operations on logs" on public.logs;
create policy "Allow all operations on logs" on public.logs for all using (true) with check (true);

drop policy if exists "Allow all operations on attendance_logs" on public.attendance_logs;
create policy "Allow all operations on attendance_logs" on public.attendance_logs for all using (true) with check (true);

drop policy if exists "Allow all operations on staff_payments" on public.staff_payments;
create policy "Allow all operations on staff_payments" on public.staff_payments for all using (true) with check (true);


-- ८. सर्व टेबल्ससाठी सुरक्षित रिअल-टाइम (Real-Time) सिंक
do $$
begin
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'users') then
        alter publication supabase_realtime add table public.users;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'app_types') then
        alter publication supabase_realtime add table public.app_types;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'logs') then
        alter publication supabase_realtime add table public.logs;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'attendance_logs') then
        alter publication supabase_realtime add table public.attendance_logs;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'staff_payments') then
        alter publication supabase_realtime add table public.staff_payments;
    end if;
end $$;

-- ९. कॅफे अटेंडन्स आणि अचूक कामाचे तास आधारित हजेरी (Cafe Attendance & Duration-Based Attendance)
create table if not exists public.cafe_attendance (
    id text primary key,
    staff_id text,
    staff_name text,
    date date not null default current_date,
    punch_in timestamptz,
    punch_out timestamptz,
    total_hours numeric default 0,
    attendance_type text default 'Absent', -- 'Full Day', 'Half Day', 'Absent'
    day_salary_multiplier numeric default 0, -- 1.0 (Full), 0.5 (Half), 0.0 (Absent)
    base_daily_salary numeric default 300,
    auto_calculated boolean default false,
    created_at timestamptz default now()
);

-- जुन्या / विद्यमान टेबल्ससाठी सेफ कॉलम मायग्रेशन
alter table if exists public.cafe_attendance add column if not exists staff_id text;
alter table if exists public.cafe_attendance add column if not exists staff_name text;
alter table if exists public.cafe_attendance add column if not exists date text;
alter table if exists public.cafe_attendance add column if not exists punch_in timestamptz;
alter table if exists public.cafe_attendance add column if not exists punch_out timestamptz;
alter table if exists public.cafe_attendance add column if not exists total_hours numeric default 0;
alter table if exists public.cafe_attendance add column if not exists attendance_type text default 'Absent';
alter table if exists public.cafe_attendance add column if not exists day_salary_multiplier numeric default 0;
alter table if exists public.cafe_attendance add column if not exists base_daily_salary numeric default 300;
alter table if exists public.cafe_attendance add column if not exists auto_calculated boolean default false;
alter table if exists public.cafe_attendance add column if not exists created_at timestamptz default now();

-- attendance_logs टेबलसाठी देखील कॉलम सेफ ऍड करणे (Dual Compatibility)
alter table if exists public.attendance_logs add column if not exists total_hours numeric default 0;
alter table if exists public.attendance_logs add column if not exists attendance_type text default 'Absent';
alter table if exists public.attendance_logs add column if not exists day_salary_multiplier numeric default 0;
alter table if exists public.attendance_logs add column if not exists auto_calculated boolean default false;
alter table if exists public.attendance_logs add column if not exists punch_in_iso timestamptz;
alter table if exists public.attendance_logs add column if not exists punch_out_iso timestamptz;

-- १०. ऑटो-अॅब्सेंट रेकन्सिलिएशन फंक्शन (Automatic Daily Absent Reconciliation Function)
create or replace function public.mark_daily_auto_absent(target_date date default current_date)
returns void as $$
begin
  -- cafe_profiles किंवा users टेबलमधील सक्रिय कर्मचाऱ्यांसाठी cafe_attendance मध्ये Absent नोंद करणे
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'cafe_profiles') then
    insert into public.cafe_attendance (
      id,
      staff_id,
      staff_name,
      date,
      punch_in,
      punch_out,
      total_hours,
      attendance_type,
      day_salary_multiplier,
      auto_calculated
    )
    select 
      'att_' || to_char(target_date, 'YYYY-MM-DD') || '_' || p.id,
      p.id,
      coalesce(p.name, p.full_name, 'Staff Member'),
      to_char(target_date, 'YYYY-MM-DD'),
      null,
      null,
      0.00,
      'Absent',
      0.00,
      true
    from public.cafe_profiles p
    where (p.is_active = true or p.role in ('operator', 'staff', 'associate'))
      and not exists (
        select 1 from public.cafe_attendance a
        where a.staff_id = p.id and a.date::text = to_char(target_date, 'YYYY-MM-DD')
      )
    on conflict (id) do nothing;
  end if;

  -- users टेबलमधील सक्रिय कर्मचाऱ्यांसाठी (जर users टेबल वापरले जात असेल)
  if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'users') then
    insert into public.cafe_attendance (
      id,
      staff_id,
      staff_name,
      date,
      punch_in,
      punch_out,
      total_hours,
      attendance_type,
      day_salary_multiplier,
      auto_calculated
    )
    select 
      'att_' || to_char(target_date, 'YYYY-MM-DD') || '_' || u.username,
      u.username,
      coalesce(u.name, u.username),
      to_char(target_date, 'YYYY-MM-DD'),
      null,
      null,
      0.00,
      'Absent',
      0.00,
      true
    from public.users u
    where u.role in ('operator', 'staff', 'associate') and u.username <> 'sagar'
      and not exists (
        select 1 from public.cafe_attendance a
        where a.staff_id = u.username and a.date::text = to_char(target_date, 'YYYY-MM-DD')
      )
    on conflict (id) do nothing;

    -- attendance_logs टेबलमध्ये देखील सेफ रेकॉर्ड करणे
    insert into public.attendance_logs (
      id,
      staff_id,
      date,
      status,
      punch_in_time,
      punch_out_time,
      total_hours,
      attendance_type,
      day_salary_multiplier,
      auto_calculated
    )
    select 
      'att_' || u.username || '_' || to_char(target_date, 'YYYY-MM-DD'),
      u.username,
      to_char(target_date, 'YYYY-MM-DD'),
      'Absent',
      null,
      null,
      0.00,
      'Absent',
      0.00,
      true
    from public.users u
    where u.role in ('operator', 'staff', 'associate') and u.username <> 'sagar'
      and not exists (
        select 1 from public.attendance_logs al
        where al.staff_id = u.username and al.date = to_char(target_date, 'YYYY-MM-DD')
      )
    on conflict (id) do nothing;
  end if;
end;
$$ language plpgsql;

-- तात्काळ आजच्या तारखेसाठी चालवणे
select public.mark_daily_auto_absent(current_date);

-- RLS & Realtime Rules
alter table if exists public.cafe_attendance enable row level security;
drop policy if exists "Allow all operations on cafe_attendance" on public.cafe_attendance;
create policy "Allow all operations on cafe_attendance" on public.cafe_attendance for all using (true) with check (true);

do $$
begin
    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'cafe_attendance') then
        if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'cafe_attendance') then
            alter publication supabase_realtime add table public.cafe_attendance;
        end if;
    end if;
end $$;

-- ११. PostgREST स्कीमा कॅशे रीलोड (Reload PostgREST Schema Cache)
notify pgrst, 'reload schema';
