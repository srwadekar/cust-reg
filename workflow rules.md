# `rules.md` — Suravi Cyber Cafe Unified Cloud ERP (Token-Minimal Spec)

## 0. AI Token-Minimization Rules (STRICT)
- **Zero Fluff:** Output raw code/diffs only. No intro/outro text.
- **Diff-First:** Output ONLY modified blocks with `// ... existing code ...` unless full file is requested.
- **Single-File Reactive State:** Keep all HTML, CSS, and Alpine.js (`x-data="suraviApp()"`) in one `.html` file so all 5 tabs share a single reactive memory state[cite: 1, 2].

## 1. Unified Supabase & LocalStorage Architecture
- **Supabase Tables (Realtime `postgres_changes` on ALL 5):**
  1. `users`: `{ username (PK), password, name, role: 'admin'|'associate', comm_rate: 20, comm_cap: 20, salary_history: [{ effectiveFrom, payType, baseRate }] }`[cite: 1, 2].
  2. `app_types`: `{ id (PK), name, default_amount }`[cite: 2].
  3. `logs`: `{ id (PK), app_id, customer_name, mobile_no, address, application_type, services: [], username, password, status, total_amount, paid_amount, payment_date, payment_history: [], notes, date, created_by, created_at }`[cite: 2].
  4. `attendance_logs`: `{ id (PK), staff_id (FK -> users.username), date: 'YYYY-MM-DD', status: 'Present'|'Half Day'|'Absent' }`[cite: 1].
  5. `staff_payments`: `{ id (PK), staff_id (FK -> users.username), type, amount, date: 'YYYY-MM-DD', method, note }`[cite: 1].
- **LocalStorage Fallback:** Mirror state to `suravi_sb_url`, `suravi_sb_key`, `suravi_custom_logo`, `suravi_wa_template`[cite: 2], `sf_roster_data`, `sf_logs_data`, `sf_payments_data`[cite: 1].

## 2. Cross-Tab Reactive Data Flow (MANDATORY)
- **Rule 1 (Unified Staff/Users):** Adding an Associate/Operator in Tab 2 or Operators Modal inserts into `this.users` (and `public.users`). This single array drives Login[cite: 2], Task Assignment, Daily Roll-Call[cite: 1], Monthly Grid[cite: 1], and Payroll[cite: 1].
- **Rule 2 (Customer Log <-> Associate Task Board):**
  - Tab 2 (Associate Task Board) does NOT use a separate array. It is a reactive computed view (`get allServiceTasks()`) flattened directly from `this.logs[].services[]`[cite: 2].
  - Adding a customer log in Tab 1 immediately populates each service inside Tab 2 for all operators.
  - Updating a task status in Tab 2 calls `updateServiceStatus(log, sIndex, newStatus)`[cite: 2], which mutates `this.logs`, recalculates overall `log.status`[cite: 2], credits commission, and upserts `public.logs` in Supabase[cite: 2].
- **Rule 3 (Commission <-> Payroll Sync):**
  - Tab 5 (Payroll) dynamically computes each user's `commissionEarned` directly from `this.logs` where `srv.status === 'Completed'` and `srv.completedBy === user.username` within the selected month/year.
  - `Total Payable = Base Attendance Salary + Commission Earned - Total Paid