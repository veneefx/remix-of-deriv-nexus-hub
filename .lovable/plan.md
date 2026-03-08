

# Backend Assessment: Current Gaps and Hardening Plan

## Current State

Your backend has **3 layers**, but several critical gaps exist:

### What EXISTS
1. **Database (3 tables)**: `profiles`, `user_plans`, `global_strategy` -- with RLS policies and triggers
2. **Edge Functions (2)**: `deriv-proxy` (tick history, config, commission) and `trade-engine` (bot status, signal evaluation, strategy)
3. **Auth**: Supabase auth with auto-confirm, admin detection via `is_admin()` security definer function

### What's BROKEN or MISSING

**1. RLS Policies are RESTRICTIVE (using `WITH CHECK` instead of permissive)**
All your RLS policies are marked `Permissive: No` -- meaning they use restrictive mode. In Postgres, restrictive policies require ALL restrictive policies to pass. This means:
- Admin toggle premium on a user? The admin update policy on `profiles` only allows `auth.uid() = user_id` -- so **admin cannot update OTHER users' profiles**. The PATCH request from the network logs returned 204 but the data didn't actually change (veneefx254 still shows `is_premium: false` after the toggle).

**2. Trade Engine edge function is stateless -- `activeBots` Map resets every request**
Edge functions are stateless. The `activeBots` Map declared at the top is empty on every cold start. The `start-bot` action creates a session that immediately disappears. The bot status, signal evaluation, and stop actions all reference this empty map.

**3. No payment verification backend**
Payments (M-Pesa/USDT) are UI-only. No backend endpoint validates payments or updates `user_plans`.

**4. No admin update policy for profiles**
Admin can SELECT all profiles (via `is_admin()` function), but UPDATE policy only allows `auth.uid() = user_id` -- admin can't grant premium to others.

**5. Commission tracking is not persisted**
The 3% commission is calculated in `deriv-proxy` but never stored in any table.

**6. No trade logging table**
Trade results exist only in-memory on the frontend. No persistence for audit, analytics, or recovery.

---

## Plan: Backend Hardening

### 1. Fix Admin Update RLS Policy (Critical)
- Add a new UPDATE policy on `profiles` allowing admins to update any profile using `is_admin(auth.uid())`
- Add admin INSERT/UPDATE policies on `user_plans` using the same function

### 2. Create Trade Logs Table
- New `trade_logs` table: `user_id`, `contract_id`, `contract_type`, `symbol`, `stake`, `profit`, `won`, `executed_at`
- RLS: users can insert/view their own, admins can view all

### 3. Create Payments Table
- New `payments` table: `user_id`, `amount`, `currency`, `method` (mpesa/usdt), `status` (pending/confirmed/rejected), `plan_type`, `reference`, `created_at`
- Admin can update status; on confirmation, trigger updates `user_plans` and `profiles.is_premium`

### 4. Create Commission Ledger Table
- New `commission_ledger` table: `user_id`, `trade_id`, `amount`, `rate`, `created_at`
- Track every commission for revenue reporting

### 5. Fix Trade Engine Statefulness
- Remove the in-memory `activeBots` Map pretense
- Simplify trade-engine to be a pure signal evaluation + strategy lookup endpoint (which is how it's actually used from the frontend)
- Bot state lives on the frontend (which is the current reality)

### Files to modify
- **Database migration**: New tables (`trade_logs`, `payments`, `commission_ledger`) + fix RLS policies
- **`src/components/trading/AdminDashboard.tsx`**: Add payment approval UI, trade log viewer
- **`supabase/functions/trade-engine/index.ts`**: Remove dead `activeBots` code, clean up
- **`src/components/trading/TradingPanel.tsx`**: Log trades to `trade_logs` table after settlement
- **`src/components/trading/PaymentModal.tsx`**: Insert payment record on "I've Sent Payment"

