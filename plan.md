# Project Rules & Architectural Standards (`rules.md`)
**Project:** Suravi Cyber Cafe — Unified Customer Ledger, Attendance Register & Payroll Portal

---

## 1. Core Architecture & Stack Constraints
- **Single-File Deployment:** Maintain the entire application within a single standalone `.html` file unless explicitly instructed to split modules.
- **Approved Dependencies (via CDN):**
  - **Styling:** Tailwind CSS (`https://cdn.tailwindcss.com`)
  - **Reactivity:** Alpine.js v3.x (`https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js`)
  - **Backend / Sync:** Supabase JS v2 (`https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2`)
  - **Spreadsheet I/O:** SheetJS (`https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js`)
  - **Icons & Fonts:** FontAwesome 6.4.0 & Google Fonts (`Inter`)
- **Offline-First & Cloud Sync:**
  - Customer Ledger, Operators, and Application Types must sync in real-time with Supabase (`logs`, `users`, `app_types`) via `postgres_changes` subscriptions.
  - Attendance & Payroll data (`sf_roster_data`, `sf_logs_data`, `sf_payments_data`) must persist in `localStorage` with instant JSON/CSV backup export and optional Supabase table sync (`staff_roster`, `attendance_logs`, `staff_payments`).

---

## 2. Authentication & Role-Based Access Control (RBAC)
- **Supabase Configuration Gate:** If `suravi_sb_url` or `suravi_sb_key` are missing from `localStorage`, block access and render the Supabase Connection Modal.
- **Session Management:** Store active user state in `sessionStorage` (`suravi_session`).
- **Default Admin Fallback:** Ensure default admin (`username: 'sagar'`, `role: 'admin'`) cannot be deleted from the Operators manager.
- **Role Permissions:**
  - `admin`: Full read/write access to Customer Ledger, App Types Manager, Operators Manager, API Docs, Staff Roster/Salary Revisions, Monthly Attendance Grid, and Payroll Log.
  - `operator`: Full access to Customer Ledger and Daily Attendance Roll-Call; read-only or hidden access to Staff Salary Revisions, Payroll Balances, and Operator/App Type deletion.

---

## 3. Business Logic & Calculation Rules (Strict Enforcement)

### A. Customer Service Ledger Rules
1. **Sequential App ID Generation:**
   - Format: `SRV-YYYYMMDD-XX` (e.g., `SRV-20261015-01`).
   - Calculate `XX` by finding the maximum serial number among existing logs matching today's `SRV-YYYYMMDD-` prefix and incrementing by `1` (zero-padded to 2 digits).
2. **Multi-Service Status Derivation (`derivedOverallStatus`):**
   - Each customer log contains a `services` array where each item tracks `{ name, amount, status, physicalStatus }`.
   - `status` values: `'In Process' | 'Pending' | 'Completed'`.
   - `physicalStatus` values: `'Pending' | 'Despatched' | 'Come in Shop'`.
   - **Rule:**
     - If **all** services have `status === 'Completed'`, overall log status = `'Completed'`.
     - Else if **any** service has `status === 'Pending'`, overall log status = `'Pending'`.
     - Otherwise, overall log status = `'In Process'`.
3. **Customer Dues & Payment History Formula:**
   - `Total Amount` = Sum of all `srv.amount` in `log.services`.
   - `Total Paid` = `Number(log.paidAmount || 0)` + Sum of `Number(p.amount || 0)` in `log.paymentHistory`.
   - `Pending Due` = `Math.max(0, Total Amount - Total Paid)`. Never output negative dues.

### B. Marathi WhatsApp Engine Rules
1. **Phone Number Formatting:** Strip whitespace. If the mobile number is 10 digits, prepend `'91'`.
2. **Marathi Status Translation Map:**
   - `'In Process'` -> `'प्रक्रियेत (In Process)'`
   - `'Pending'` -> `'प्रलंबित (Pending)'`
   - `'Completed'` -> `'पूर्ण झाले (Completed)'`
   - `'Despatched'` -> `'पाठवले (Despatched)'`
   - `'Come in Shop'` -> `'दुकानात उपलब्ध (Available in Shop)'`
3. **Template Interpolation:** Support `{customerName}`, `{appId}`, `{status}`, `{services}`, `{totalAmount}`, `{paidAmount}`, `{dueAmount}`, `{address}`, and `{date}`.
4. **Bulk Dispatch Throttling:** When sending bulk WhatsApp messages for `selectedLogIds`, stagger `window.open()` calls by `800ms` (`index * 800`) to prevent browser popup-blocker drops.

### C. Attendance & Historical Payroll Rules
1. **Historical Salary Protection (`getSalaryInfoForMonth`):**
   - Never overwrite a single static salary field on an employee record.
   - Store salary rates in `emp.salaryHistory` as `[{ effectiveFrom: 'YYYY-MM', payType: 'Daily' | 'Monthly', baseRate: Number }]`.
   - When evaluating salary for target month `YYYY-MM`, sort `salaryHistory` descending by `effectiveFrom` and return the first entry where `effectiveFrom <= targetMonth` (fallback to the oldest entry if none match).
   - **Rule:** Revising an employee's salary for a new month must never alter calculated earnings for previous months.
2. **Attendance Storage & Net Worked Days:**
   - Valid statuses: `'Present'` (`1.0` day), `'Half Day'` (`0.5` day), `'Absent'` (`0.0` day).
   - Setting status to `'Unmarked'` (Clear) must remove the record from `attendanceLogs` rather than storing an `'Unmarked'` string.
   - `Net Worked Days` = `presentCount + (0.5 * halfDayCount)`.
3. **Monthly Payroll Formula:**
   - For `payType === 'Daily'`: `Total Earned = baseRate * workedDays`.
   - For `payType === 'Monthly'`: `Total Earned = (baseRate / daysInSelectedMonth) * workedDays`.
   - `Total Paid` = Sum of `paymentLogs` for that staff member within the active period (`Deduction` entries subtract from `Total Paid`; all other types add to `Total Paid`).
   - `Net Balance Due` = `Math.round(Total Earned - Total Paid)`.

---

## 4. Mandatory Bug-Prevention Guardrails
- **Guardrail 1 (Employee Bulk-Fill Scope):** In `executeBulkAction(status)` when `activeBulkTarget.type === 'employee'`, always reference `staffId: activeBulkTarget.id` (or local `const staffId`). Never reference an out-of-scope `emp.id` variable inside the day iteration loop.
- **Guardrail 2 (Payroll Period Alignment):** When rendering Monthly Payroll summaries, filter or clearly scope `paymentLogs` to match the selected month/year (`selectedMonthIndex` and `selectedYear`) or explicitly separate "Selected Month Paid" from "All-Time Paid" so historical payouts do not corrupt current monthly balances.
- **Guardrail 3 (Date Normalization):** Always normalize dates to ISO `YYYY-MM-DD` before comparing `startDate` and `endDate` filters. If `log.date` is formatted as `DD Mon YYYY`, fall back to `normalizeToISODate()` or parse the date segment from `SRV-YYYYMMDD-XX`.
- **Guardrail 4 (Password Visibility Preservation):** When `pullDataFromCloud()` refreshes `logs` from Supabase, preserve each row's local `showPass` boolean state so open password fields do not unexpectedly mask during real-time sync.

---

## 5. UI, UX & Keyboard Navigation Standards
- **Keyboard-First Operations:**
  - `Alt + N`: Open New Customer Log modal and auto-focus `customerNameInput`[cite: 2].
  - `Alt + F`: Focus main search input (`searchInput`)[cite: 2].
  - `Esc`: Close any open modal or floating popover (`cell-selector-popup`, `bulk-selector-popup`)[cite: 1, 2].
  - Inside Customer Modal: `Alt + C` (Name), `Alt + M` (Mobile), `Alt + A` (Address), `Alt + S` (Service Select), `Alt + P` (Paid Amount), `Alt + D` (Payment Date), `Alt + R` (Notes)[cite: 2].
- **Color Semantics:**
  - Primary Brand / Navigation: `slate-900`, `indigo-600` (Customer Ledger)[cite: 2], `amber-500` (Attendance/Payroll)[cite: 1].
  - Positive / Completed / Present / Paid: `emerald-600` / `emerald-100`[cite: 1, 2].
  - Warning / In Process / Half-Day: `amber-500` / `amber-100`[cite: 1, 2].
  - Danger / Absent / Pending Dues / Delete: `rose-600` / `rose-100`[cite: 1, 2].
- **Sticky Spreadsheet Columns:** In the Monthly Attendance Grid, the Employee Name column must remain sticky on horizontal scroll (`position: sticky; left: 0; z-index: 20;`)[cite: 1].
- **Print Styles:** Payment Vouchers must isolate printable receipt content and hide navigation/buttons using `@media print { .no-print { display: none !important; } }`[cite: 1].

---

## 6. Code Modification Checklist
Before finalizing any code update:
1. Verify all `localStorage` keys (`suravi_sb_url`, `suravi_sb_key`, `suravi_custom_logo`, `suravi_wa_template`, `sf_roster_data`, `sf_logs_data`, `sf_payments_data`) remain backward-compatible[cite: 1, 2].
2. Verify Supabase column mappings (`snake_case` in DB <-> `camelCase` in JS state) remain intact[cite: 2].
3. Test that adding, editing, or deleting a record updates both local UI state and cloud/storage state immediately without requiring a page reload[cite: 1, 2].