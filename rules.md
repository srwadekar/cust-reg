# `rules.md` — Suravi Cyber Cafe & ShopFlow (Token-Minimal Spec)

## 0. AI Token-Minimization Rules (STRICT)
- **Zero Fluff:** No greetings, meta-intros, explanations, or closing summaries. Output raw code/diffs only.
- **Diff-First:** For edits, output ONLY modified functions/blocks with `// ... existing code ...` markers unless full file is requested.
- **Concise Code:** Strip redundant comments. Reuse Alpine.js `x-for` and helper functions instead of duplicating DOM nodes.
- **Single-File:** Keep all HTML, CSS, and JS in one `.html` file[cite: 1, 2].

## 1. Stack & Storage
- **CDNs:** Tailwind CSS, Alpine.js v3, Supabase JS v2, SheetJS (`xlsx` 0.18.5), FontAwesome 6.4.0, Inter font[cite: 1, 2].
- **Supabase Tables:** `logs`, `users`, `app_types` (realtime `postgres_changes`)[cite: 2] + optional `staff_roster`, `attendance_logs`, `staff_payments`.
- **LocalStorage Keys:** `suravi_sb_url`, `suravi_sb_key`, `suravi_custom_logo`, `suravi_wa_template`[cite: 2], `sf_roster_data`, `sf_logs_data`, `sf_payments_data`[cite: 1].
- **SessionStorage:** `suravi_session` (default admin: `sagar` / `123451` / `role: 'admin'`, non-deletable)[cite: 2].

## 2. Workspaces (4 Main Tabs)
1. **Customer Ledger** (`index.html`)[cite: 2]
2. **Daily Roll-Call** (`salery.html` Tab 1)[cite: 1]
3. **Monthly Grid** (`salery.html` Tab 2)[cite: 1]
4. **Payroll & Payments** (`salery.html` Tab 3)[cite: 1]

## 3. Core Formulas & Logic

### A. Customer Ledger
- **App ID:** `SRV-YYYYMMDD-XX` (auto-increment `XX` per day, 2-digit zero-padded)[cite: 2].
- **Services Array:** `[{ name, amount, status: 'In Process'|'Pending'|'Completed', physicalStatus: 'Pending'|'Despatched'|'Come in Shop' }]`[cite: 2].
- **Overall Status:** All `'Completed'` -> `'Completed'`; Any `'Pending'` -> `'Pending'`; Else -> `'In Process'`[cite: 2].
- **Financials:**
  - `totalAmount = sum(services.amount)`[cite: 2]
  - `totalPaid = Number(paidAmount || 0) + sum(paymentHistory.amount)`[cite: 2]
  - `dueAmount = Math.max(0, totalAmount - totalPaid)`[cite: 2]
- **Hotkeys:** `Alt+N` (New), `Alt+F` (Search), `Esc` (Close). Modal: `Alt+C` (Name), `Alt+M` (Mobile), `Alt+A` (Address), `Alt+S` (Service), `Alt+P` (Paid), `Alt+D` (Date), `Alt+R` (Notes)[cite: 2].

### B. Marathi WhatsApp Engine
- **Phone:** 10 digits -> prepend `'91'`[cite: 2].
- **Status Map:** `'In Process':'प्रक्रियेत (In Process)'`, `'Pending':'प्रलंबित (Pending)'`, `'Completed':'पूर्ण झाले (Completed)'`, `'Despatched':'पाठवले (Despatched)'`, `'Come in Shop':'दुकानात उपलब्ध (Available in Shop)'`[cite: 2].
- **Tags:** `{customerName}`, `{appId}`, `{status}`, `{services}`, `{totalAmount}`, `{paidAmount}`, `{dueAmount}`, `{address}`, `{date}`[cite: 2].
- **Bulk Send:** Stagger `window.open` by `index * 800` ms[cite: 2].

### C. Attendance & Historical Payroll
- **Salary History (`getSalaryInfoForMonth`):** `salaryHistory: [{ effectiveFrom: 'YYYY-MM', payType: 'Daily'|'Monthly', baseRate: Number }]`. Sort descending by `effectiveFrom`; pick first where `effectiveFrom <= targetMonth` (fallback to oldest). Never overwrite past months' rates[cite: 1].
- **Attendance Status:** `'Present'` (`1`), `'Half Day'` (`0.5`), `'Absent'` (`0`). `'Unmarked'` deletes the log entry[cite: 1].
- **Worked Days:** `P + (0.5 * Half)`[cite: 1].
- **Earnings:**
  - `Daily`: `baseRate * workedDays`[cite: 1]
  - `Monthly`: `(baseRate / daysInMonth) * workedDays`[cite: 1]
- **Paid & Balance:** `totalPaid = sum(payments) - sum(deductions)`. `netBalance = Math.round(totalEarned - totalPaid)`[cite: 1].

## 4. Bug-Prevention Guardrails
1. **Wand Bulk-Fill Scope:** In `executeBulkAction`, when `activeBulkTarget.type === 'employee'`, use `staffId: staffId` (never `emp.id`).
2. **Monthly Payment Scope:** Filter `paymentLogs` by `selectedMonthIndex` and `selectedYear` (or provide a Month/All-Time toggle) so past payouts do not distort current month balance.
3. **Date Filter Normalization:** Convert all dates to `YYYY-MM-DD` before comparing `startDate`/`endDate` (fallback to `SRV-YYYYMMDD` parsing)[cite: 2].
4. **Password State:** Preserve `showPass` boolean across Supabase `pullDataFromCloud()` refreshes[cite: 2].
5. **Sticky & Print CSS:** Keep `.sticky-name` (`left: 0; z-index: 20`) for grid scroll and `@media print { .no-print { display: none !important; } }` for vouchers[cite: 1].