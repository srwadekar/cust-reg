# `rules.md` — Suravi Cyber Cafe & ShopFlow (Token-Minimal Spec)

## 0. AI Token-Minimization Rules (STRICT)
- **Zero Fluff:** No greetings, meta-intros, explanations, or closing summaries. Output raw code/diffs only.
- **Diff-First:** For edits, output ONLY modified functions/blocks with `// ... existing code ...` markers unless full file is requested.
- **Concise Code:** Strip redundant comments. Reuse Alpine.js `x-for` and helper functions.
- **Single-File:** Keep all HTML, CSS, and JS in one `.html` file[cite: 1, 2].

## 1. Stack & Storage
- **CDNs:** Tailwind CSS, Alpine.js v3, Supabase JS v2, SheetJS (`xlsx` 0.18.5), FontAwesome 6.4.0, Inter font[cite: 1, 2].
- **Supabase Tables:** `logs`, `users`, `app_types` (realtime `postgres_changes`)[cite: 2] + optional `staff_roster`, `attendance_logs`, `staff_payments`.
- **LocalStorage Keys:** `suravi_sb_url`, `suravi_sb_key`, `suravi_custom_logo`, `suravi_wa_template`[cite: 2], `sf_roster_data`, `sf_logs_data`, `sf_payments_data`[cite: 1], `sf_commission_rules`.
- **SessionStorage:** `suravi_session` (default admin: `sagar` / `123451` / `role: 'admin'`, non-deletable)[cite: 2].

## 2. Role-Based Access Control (RBAC)
- **Admin (`role === 'admin'`):**
  - Full unrestricted access to all 5 tabs, Operator/Associate creation, custom commission overrides, salary revisions, app types, and deletions.
- **Associate / Operator (`role === 'operator' | 'associate'`):**
  - Can add new customer/task logs, view ALL assigned and unassigned tasks in the Associate Tab, claim unassigned tasks, and mark tasks `'Completed'`.
  - Restricted from: Editing commission formulas, modifying staff base salaries, deleting operators, or accessing Admin settings.

## 3. Workspaces (5 Main Tabs)
1. **Customer Ledger** (`index.html`)[cite: 2]
2. **Associate Tasks & Commission** (NEW — Task Pool, Assignment Form & Commission Wallet)
3. **Daily Roll-Call** (`salery.html` Tab 1)[cite: 1]
4. **Monthly Grid** (`salery.html` Tab 2)[cite: 1]
5. **Payroll & Payments** (`salery.html` Tab 3 — includes Associate Commission Payouts)[cite: 1]

## 4. Core Formulas & Logic

### A. Customer Ledger
- **App ID:** `SRV-YYYYMMDD-XX` (auto-increment `XX` per day, 2-digit zero-padded)[cite: 2].
- **Services Array:** `[{ name, amount, status: 'In Process'|'Pending'|'Completed', physicalStatus: 'Pending'|'Despatched'|'Come in Shop', assignedTo: username|null, completedBy: username|null, commission: Number }]`[cite: 2].
- **Overall Status:** All `'Completed'` -> `'Completed'`; Any `'Pending'` -> `'Pending'`; Else -> `'In Process'`[cite: 2].
- **Financials:** `totalAmount = sum(services.amount)`; `totalPaid = Number(paidAmount || 0) + sum(paymentHistory.amount)`; `dueAmount = Math.max(0, totalAmount - totalPaid)`[cite: 2].
- **Hotkeys:** `Alt+N` (New), `Alt+F` (Search), `Esc` (Close). Modal: `Alt+C` (Name), `Alt+M` (Mobile), `Alt+A` (Address), `Alt+S` (Service), `Alt+P` (Paid), `Alt+D` (Date), `Alt+R` (Notes)[cite: 2].

### B. Associate Tasks & Commission Engine (NEW)
- **Visibility Rule:** All tasks (both assigned to a specific associate and unassigned/`'All'` pool tasks) must be visible to all logged-in operators/associates in Tab 2 so any associate can pick up and complete pending work.
- **Default Commission Formula (20% with ₹20 Cap):**
  - `calcTaskCommission(taskAmount, customRate = 20, maxCap = 20)`:
  - `rawCommission = Number(taskAmount || 0) * (customRate / 100)`
  - `finalCommission = Math.min(maxCap, Math.round(rawCommission * 100) / 100)`
  - **Examples:**
    - Task Amount `₹50` -> 20% = `₹10` (Below ₹100, gets 20%).
    - Task Amount `₹100` -> 20% = `₹20`.
    - Task Amount `₹250` -> 20% is ₹50, capped at `₹20` (`maxCap`).
- **Admin Override:** Admin can configure custom `%` or `maxCap` per operator/associate or override commission on a specific task in the Task Form.
- **Account Crediting Trigger:**
  - Commission is `₹0` (Pending) while task status is `'In Process'` or `'Pending'`.
  - The moment an associate marks a task `'Completed'`, `completedBy` is set to that associate's `username`, and `finalCommission` is automatically credited to their Associate Commission Wallet & synced to Tab 5 (Payroll).

### C. Marathi WhatsApp Engine
- **Phone:** 10 digits -> prepend `'91'`[cite: 2].
- **Status Map:** `'In Process':'प्रक्रियेत (In Process)'`, `'Pending':'प्रलंबित (Pending)'`, `'Completed':'पूर्ण झाले (Completed)'`, `'Despatched':'पाठवले (Despatched)'`, `'Come in Shop':'दुकानात उपलब्ध (Available in Shop)'`[cite: 2].
- **Tags:** `{customerName}`, `{appId}`, `{status}`, `{services}`, `{totalAmount}`, `{paidAmount}`, `{dueAmount}`, `{address}`, `{date}`[cite: 2].
- **Bulk Send:** Stagger `window.open` by `index * 800` ms[cite: 2].

### D. Attendance & Historical Payroll
- **Salary History (`getSalaryInfoForMonth`):** `salaryHistory: [{ effectiveFrom: 'YYYY-MM', payType: 'Daily'|'Monthly', baseRate: Number }]`. Sort descending by `effectiveFrom`; pick first where `effectiveFrom <= targetMonth` (fallback to oldest)[cite: 1].
- **Worked Days:** `P + (0.5 * Half)`[cite: 1].
- **Total Payable (Salary + Commission):**
  - `Base Earned`: `Daily` = `baseRate * workedDays`; `Monthly` = `(baseRate / daysInMonth) * workedDays`[cite: 1].
  - `Commission Earned`: Sum of `commission` for all tasks where `status === 'Completed'` and `completedBy === emp.username` in the selected period.
  - `Total Earned = Base Earned + Commission Earned`.
  - `Net Balance Due = Math.round(Total Earned - Total Paid)`[cite: 1].

## 5. Bug-Prevention Guardrails
1. **Wand Bulk-Fill Scope:** In `executeBulkAction`, when `activeBulkTarget.type === 'employee'`, use `staffId: staffId` (never `emp.id`).
2. **Monthly Payment Scope:** Filter `paymentLogs` and `Commission Earned` by `selectedMonthIndex` and `selectedYear` (with Month/All-Time toggle).
3. **Commission Double-Count Guard:** If a `'Completed'` task is switched back to `'Pending'` or `'In Process'`, immediately revoke its credited commission from the associate's wallet.
4. **Date Filter Normalization:** Convert all dates to `YYYY-MM-DD` before comparing `startDate`/`endDate`[cite: 2].
5. **Password State:** Preserve `showPass` boolean across Supabase `pullDataFromCloud()` refreshes[cite: 2].