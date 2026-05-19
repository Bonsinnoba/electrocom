# ElectrCom — Development Log

> **Purpose:** A living record of every feature built, every architectural decision made, and the reasoning behind it.
> **Format:** Newest entries at the top within each section.
> **Timezone:** All timestamps are UTC.

---

## 📋 Table of Contents

1. [POS & Admin Refund System](#pos--admin-refund-system)
2. [Registration UX](#registration-ux)
3. [Case Studies & Design Conversations](#case-studies--design-conversations)
4. [Pending / Future Work](#pending--future-work)
5. [Decisions Index](#decisions-index)

---

## POS & Admin Refund System

### ✅ Security & Performance Audit Fixes
**Completed:** 2026-05-19 · 00:58 UTC

**What was built:**
1. **Double-Return Fraud Guard:** Added an aggressive lock and validation check to `admin_returns.php` POST handler. It now ensures `SUM(quantity_returned)` never exceeds `quantity_purchased` for any line item, preventing staff from over-returning and artificially inflating the refundable ceiling.
2. **POS Orders Visibility:** Fixed a hard `JOIN` in `admin_returns.php` GET handler that caused POS orders (which lack user accounts) to disappear from the `ReturnManager` history.
3. **Refund Linking:** Updated `admin_returns.php` to return the newly generated `return_id`, allowing the frontend to correctly bind the subsequent financial refund back to the specific physical return that authorized it.
4. **Server-Side Order Search:** Updated `admin_orders.php` to accept a `search` parameter, and updated `ReturnManager.jsx` to use it instead of fetching the entire database to memory and filtering client-side.
5. **Database Indexing:** Applied missing SQL migrations to create the `order_returns` and `refunds` tables, and injected an index on `gateway_ref` to optimize webhook lookup speed.
6. **Template Variable Patch:** Fixed an undefined `$brandName` warning in the `refund_failed.php` template.

---

### ✅ Phase 4 — Customer Refund Failure Notification (Option C)
**Completed:** 2026-05-19 · 00:28 UTC

**What was built:**
- `api/email/templates/refund_failed.php` — New HTML+text email template sent to the customer when a Paystack refund bounces.
- `api/paystack_webhook.php` — Extended the `refund.failed` event handler to:
  1. Fetch the customer's name, email, and original payment method from the order.
  2. Queue the `refund_failed` email via `EmailEngine` (routes through SMTP / Mailgun / SendGrid depending on config).
  3. Push a ⚠ in-app notification to all `admin` / `super` users with order reference and customer contact.

**Email content:**
- Warm reassurance: *"Your money is safe with us."*
- Clear explanation of why it failed (prepaid/expired card).
- Three actionable alternatives: MoMo number, Bank Transfer, Cash at Store.
- Reply-based flow — no new UI required from the customer.

**Decision made:** *Option C — Automatic refund, customer notified only on failure.*

**Why:**
- Option A (staff decides entirely) is manual and error-prone at scale.
- Option B (customer always chooses) adds unnecessary friction to the 95% of refunds that succeed back to the original card.
- Option C is the industry standard (Stripe, Flutterwave, Paystack itself all use this). The customer is only interrupted when there is actually a problem, keeping the happy path frictionless.

---

### ✅ Webhook Refund Lifecycle Handlers
**Completed:** 2026-05-19 · 00:21 UTC

**What was built:**
- `api/paystack_webhook.php` — Added handlers for three Paystack refund events:
  - `refund.pending` → sets `refunds.status = 'pending'`
  - `refund.processed` → sets `refunds.status = 'processed'`, stamps `processed_at`
  - `refund.failed` → sets `refunds.status = 'failed'`, triggers customer email + admin alert (see Phase 4)

**Matching logic:**
1. Primary: `refunds.gateway_ref` = Paystack's numeric refund ID (stored at issue time).
2. Fallback: JOIN `orders.payment_reference` to catch older event formats that omit the refund ID.

**Why this matters — the prepaid card problem:**
Paystack's refund API call always returns `success: true` synchronously (the refund was *submitted*). Whether the money actually reaches the customer is determined asynchronously by the card network. For prepaid cards that have been closed or expired since purchase, the network rejects the credit and sends the funds back to the merchant's Paystack balance. Without the webhook handler, this failure is invisible — the `refunds` table would show `processed` when the customer never received anything.

---

### ✅ Phase 3 — Admin `ReturnManager` Full Rewrite
**Completed:** 2026-05-18 · 23:55 UTC

**What was built:**
- `admin-panel/src/pages/ReturnManager.jsx` — Complete rewrite:
  - Replaced all `alert()` calls with `addToast()`.
  - Added **Step 3 Refund Panel** — appears automatically after a return is authorized.
  - Fetches live refund info via `fetchRefundInfo()` and pre-fills amount as `qty × price_at_purchase`.
  - Auto-selects `paystack` if order's `payment_method` is paystack, otherwise defaults to `cash`.
  - Shows a warning banner if Paystack selected but no `payment_reference` on order.
  - "Issue Refund" → `POST admin_refund.php` → Paystack API or cash record.
  - "Skip Refund" → return recorded, refund deferred for later.
  - Return history table gains a `status` badge column.

---

### ✅ Security Hardening — `admin_refund.php` Legitimacy & Amount Cap
**Completed:** 2026-05-19 · 00:07 UTC

**What was fixed:**

Before this change, `admin_refund.php` only validated:
```
amount ≤ order_total − already_refunded
```
This allowed a manager to issue a refund against any order with no return ever filed, and to refund up to the full order total regardless of what was actually returned.

**Four-layer validation chain now enforced:**

| Layer | Check |
|---|---|
| 1 | Order exists in the database |
| 2 | At least one `order_returns` row with `status IN ('processed', 'inspected')` must exist — proof goods were physically returned before money goes out |
| 3 | If `return_id` is provided, it must belong to this order AND be confirmed |
| 4 | `amount ≤ SUM(returned qty × price_at_purchase) − already_refunded` — ceiling is based on *what was returned*, not full order total |

**GET endpoint also updated:** `refundable` field uses the same returns-based ceiling. Response now includes `returns[]` and `returned_value_total`.

**Decision:** The time window (48h POS / admin policy) is enforced at the **return submission stage**, not the refund stage. The return record is the audit proof.

---

### ✅ Phase 2 — POS Interface Refund UI
**Completed:** 2026-05-18 · 23:53 UTC

**What was built:**
- `admin-panel/src/pages/POSInterface.jsx` — After a return is confirmed, the right panel transitions to a **Refund Step** instead of immediately resetting.
- Pre-fills amount = `SUM(returned qty × price_at_purchase)`.
- Auto-selects `paystack` if `order.payment_method === 'momo'`, else `cash`.
- Staff can edit the amount (partial refunds supported).
- "ISSUE REFUND" → `POST admin_refund.php`.
- "SKIP REFUND" → return recorded, refund deferred.

---

### ✅ Phase 1 — Database, Backend & API Service
**Completed:** 2026-05-17 · (previous session)

**What was built:**

**Database** — `api/migrations/0010_create_refunds_table.sql`
- `refunds` table: `order_id`, `return_id`, `amount`, `method` (cash|paystack), `gateway_ref`, `status` (pending|processed|failed), `approved_by`, `note`, `processed_at`.

**Backend** — `api/admin_refund.php`
- `GET ?order_id=X` → refund history + refundable balance + linked returns.
- `POST` → processes refund via Paystack API or records cash. Failed gateway calls persisted as `status='failed'`.
- Auth: `super` and `store_manager` only.

**Frontend service** — `admin-panel/src/services/api.js`
- `fetchRefundInfo(orderId)` and `issueRefund(payload)` added.

**Decision:** Use Paystack for refunds (not direct MTN MoMo API).

**Why:** Paystack already processes all payments on this platform (card, MoMo, USSD). The Paystack Refund API reverses any transaction it processed using only the `payment_reference`. One integration covers all payment types. Direct MTN MoMo API requires separate registration, sandbox credentials, and Ghana-specific compliance steps — significant overhead for redundant coverage.

---

## Registration UX

### ✅ Disabled Registration — Locked State UI
**Completed:** 2026-05-17 · (previous session)

**What was built:**
- `storefront/src/components/AuthModal.jsx` — When `canRegister` is false, the sign-up form is replaced with a professional locked card.

**Copywriting (user-specified):**
> *"We're temporarily pausing new account creations while we upgrade a few things behind the scenes. We'll be back open shortly! If you're already part of the family, you can* **[Sign In here]**."

Inline "Sign In here" link switches the modal view. Overlay panel updated with maintenance message.

**Decision:** Show a branded maintenance message instead of a generic disabled form.

**Why:** A dead/empty form is confusing — customers don't know if the site is broken or if registration is intentionally paused. A clear, warm message with an alternative action reduces support contacts and maintains trust.

---

## Case Studies & Design Conversations

> Real-world scenarios raised during development that shaped architectural decisions.
> Each entry records the question, what was found, and what code it triggered.

---

### 🔎 CS-1 — Partial Refunds: Refunding One Item, Not the Whole Order
**Raised:** 2026-05-19 · ~00:00 UTC

**The question:**
> *"What if a user wants to refund an item from an order and not the whole order, what do we do?"*

**What was found:**
The system already supported this. `order_returns` records link to a specific `product_id` + `quantity`, not the whole order. The refund amount field is pre-filled with `qty × price_at_purchase` for that item only and is editable. The backend validates against returned-item value, not the full order total.

**Example:**
- Order total: GH₵ 300 (5 items)
- Customer returns 1 item worth GH₵ 80
- Refund panel opens pre-filled with **GH₵ 80** — not GH₵ 300
- Staff can reduce to GH₵ 50 if the item was partially used

**Code triggered:** Confirmed partial refund support; conversation directly led to the security hardening in CS-3.

---

### 🔎 CS-2 — Combining Refunds to Reduce Paystack Costs
**Raised:** 2026-05-19 · ~00:03 UTC

**The question:**
> *"Can we combine the two to reduce Paystack's cost?"*

**What was found:**
Paystack does **not** charge per refund API call. Refunds proportionally reverse the original transaction fee. The real benefit of batching is:
- Fewer API calls (less failure surface)
- Cleaner audit trail (1 refund record vs 3)
- Less noise in the Paystack dashboard

The backend already supports batched refunds natively — the `refundable` balance accumulates across multiple returns. Staff can skip the refund after each item and issue one combined refund at the end covering all of them.

**Pending:** The UI does not yet make this workflow explicit (🔴 High priority backlog item).

---

### 🔎 CS-3 — Legitimacy: Proving the Order and Time Window Are Valid
**Raised:** 2026-05-19 · ~00:06 UTC

**The question:**
> *"If the refund is not product-based, how do you confirm that the order is legit and the time hasn't expired?"*

**What was found:**
The original `admin_refund.php` only checked `amount ≤ order_total − already_refunded`. A manager could refund any order with no return record at all, or for more than what was actually returned.

**Design principles settled:**
1. The **48-hour window** is enforced at the *return submission* stage (`pos_return.php`) — not at the refund stage. Accounting may process refunds days later; that is fine.
2. The `order_returns` row (`status = 'processed'`) is the **audit proof** that goods came back before money went out.
3. The **refundable ceiling** must be `SUM(returned qty × price_at_purchase)` — not the order total.

**Code triggered:** Full 4-layer security hardening of `admin_refund.php` (completed 2026-05-19 · 00:07 UTC).

---

### 🔎 CS-4 — Does the Admin Panel Cover Online Order Refunds?
**Raised:** 2026-05-19 · ~00:11 UTC

**The question:**
> *"Does the online system also have the refund? / Can admins refund the online returns?"*

**What was found:**
`admin_returns.php` and `admin_refund.php` are order-type agnostic — they work on any order regardless of POS or online origin.

| | POS Returns | Online Returns |
|---|---|---|
| Who triggers | Cashier in POSInterface | Admin/Manager in ReturnManager |
| Time limit | Hard 48h (pos_return.php) | Manager discretion |
| Paystack refund | Works (POS MoMo orders have `payment_reference`) | Works (all online Paystack orders have `payment_reference`) |

**Code triggered:** None — confirmed the architecture was already correct.

---

### 🔎 CS-5 — Prepaid Cards and the Silent Failure Problem
**Raised:** 2026-05-19 · ~00:16 UTC

**The questions:**
> *"But does card transfer also work?" / "What of prepaid cards?"*

**What was found:**
Paystack's Refund API accepts only the `payment_reference` and handles routing internally — it works for all instruments (debit, credit, MoMo, USSD). However, prepaid cards introduce a silent failure mode:

| Prepaid card state | Outcome |
|---|---|
| Active | ✅ Refund lands normally |
| Expired | ⚠ Card network usually routes to issuing bank — some issuers drop it |
| Closed / depleted | ❌ Network rejects — amount bounces to merchant Paystack balance |
| One-time-use virtual | ❌ Almost always rejected — card destroyed after use |

**Critical gap:** Paystack's synchronous API response only confirms the refund was *submitted*. The actual failure arrives asynchronously via webhook — and without a handler, the `refunds` table would silently show `processed` while the customer never received anything.

**Code triggered:** Full webhook refund lifecycle handlers (`refund.pending`, `refund.processed`, `refund.failed`) added to `paystack_webhook.php` (completed 2026-05-19 · 00:21 UTC).

---

### 🔎 CS-6 — Should Customers Choose Where They Receive Refunds?
**Raised:** 2026-05-19 · ~00:22 UTC

**The question:**
> *"Do users get to choose where they want to receive their refunds?"*

**Three options evaluated:**

| Option | Mechanism | Verdict |
|---|---|---|
| **A** | Staff picks method entirely in admin panel | ❌ Manual, error-prone at scale |
| **B** | Customer always specifies preference upfront | ❌ Friction on the 95% happy path |
| **C** | Auto-refund to original method; notify customer only if it fails | ✅ **Selected** |

**Why Option C:**
This is the model used by Stripe, Flutterwave, and Paystack itself. On the happy path, the customer never sees extra steps. The email + admin alert are only triggered by an actual failure, at which point the customer genuinely needs to act.

**Decision made by user:** 2026-05-19 · ~00:26 UTC

**Code triggered:** `refund_failed.php` email template + webhook notification block (Phase 4, completed 2026-05-19 · 00:28 UTC).

---

## Pending / Future Work

---

## POS & Admin Refund System

### ✅ Phase 4 — Customer Refund Failure Notification (Option C)
**Completed:** 2026-05-19 · 00:28 UTC

**What was built:**
- `api/email/templates/refund_failed.php` — New HTML+text email template sent to the customer when a Paystack refund bounces.
- `api/paystack_webhook.php` — Extended the `refund.failed` event handler to:
  1. Fetch the customer's name, email, and original payment method from the order.
  2. Queue the `refund_failed` email via `EmailEngine` (routes through SMTP / Mailgun / SendGrid depending on config).
  3. Push a ⚠ in-app notification to all `admin` / `super` users with order reference and customer contact.

**Email content:**
- Warm reassurance: *"Your money is safe with us."*
- Clear explanation of why it failed (prepaid/expired card).
- Three actionable alternatives: MoMo number, Bank Transfer, Cash at Store.
- Reply-based flow — no new UI required from the customer.

**Decision made:** *Option C — Automatic refund, customer notified only on failure.*

**Why:**
- Option A (staff decides entirely) is manual and error-prone at scale.
- Option B (customer always chooses) adds unnecessary friction to the 95% of refunds that succeed back to the original card.
- Option C is the industry standard (Stripe, Flutterwave, Paystack itself all use this). The customer is only interrupted when there is actually a problem, keeping the happy path frictionless.

---

### ✅ Webhook Refund Lifecycle Handlers
**Completed:** 2026-05-19 · 00:21 UTC

**What was built:**
- `api/paystack_webhook.php` — Added handlers for three Paystack refund events:
  - `refund.pending` → sets `refunds.status = 'pending'`
  - `refund.processed` → sets `refunds.status = 'processed'`, stamps `processed_at`
  - `refund.failed` → sets `refunds.status = 'failed'`, triggers customer email + admin alert (see Phase 4)

**Matching logic:**
1. Primary: `refunds.gateway_ref` = Paystack's numeric refund ID (stored at issue time).
2. Fallback: JOIN `orders.payment_reference` to catch older event formats that omit the refund ID.

**Why this matters — the prepaid card problem:**
Paystack's refund API call always returns `success: true` synchronously (the refund was *submitted*). Whether the money actually reaches the customer is determined asynchronously by the card network. For prepaid cards that have been closed or expired since purchase, the network rejects the credit and sends the funds back to the merchant's Paystack balance. Without the webhook handler, this failure is invisible — the `refunds` table would show `processed` when the customer never received anything.

---

### ✅ Phase 3 — Admin `ReturnManager` Full Rewrite
**Completed:** 2026-05-18 · 23:55 UTC

**What was built:**
- `admin-panel/src/pages/ReturnManager.jsx` — Complete rewrite:
  - Replaced all `alert()` calls with `addToast()`.
  - Added **Step 3 Refund Panel** — appears automatically after a return is authorized.
  - Fetches live refund info via `fetchRefundInfo()` and pre-fills amount as `qty × price_at_purchase`.
  - Auto-selects `paystack` if order's `payment_method` is paystack, otherwise defaults to `cash`.
  - Shows a warning banner if Paystack selected but no `payment_reference` on order.
  - "Issue Refund" → `POST admin_refund.php` → Paystack API or cash record.
  - "Skip Refund" → return recorded, refund deferred for later.
  - Return history table gains a `status` badge column.

---

### ✅ Security Hardening — `admin_refund.php` Legitimacy & Amount Cap
**Completed:** 2026-05-19 · 00:07 UTC

**What was fixed:**

Before this change, `admin_refund.php` only validated:
```
amount ≤ order_total − already_refunded
```
This allowed a manager to issue a refund against any order with no return ever filed, and to refund up to the full order total regardless of what was actually returned.

**Four-layer validation chain now enforced:**

| Layer | Check |
|---|---|
| 1 | Order exists in the database |
| 2 | At least one `order_returns` row with `status IN ('processed', 'inspected')` must exist — proof goods were physically returned before money goes out |
| 3 | If `return_id` is provided, it must belong to this order AND be confirmed |
| 4 | `amount ≤ SUM(returned qty × price_at_purchase) − already_refunded` — ceiling is based on *what was returned*, not full order total |

**GET endpoint also updated:** `refundable` field uses the same returns-based ceiling. Response now includes `returns[]` and `returned_value_total`.

**Decision:** The time window (48h POS / admin policy) is enforced at the **return submission stage**, not the refund stage. The return record is the audit proof.

---

### ✅ Phase 2 — POS Interface Refund UI
**Completed:** 2026-05-18 · 23:53 UTC

**What was built:**
- `admin-panel/src/pages/POSInterface.jsx` — After a return is confirmed, the right panel transitions to a **Refund Step** instead of immediately resetting.
- Pre-fills amount = `SUM(returned qty × price_at_purchase)`.
- Auto-selects `paystack` if `order.payment_method === 'momo'`, else `cash`.
- Staff can edit the amount (partial refunds supported).
- "ISSUE REFUND" → `POST admin_refund.php`.
- "SKIP REFUND" → return recorded, refund deferred.

---

### ✅ Phase 1 — Database, Backend & API Service
**Completed:** 2026-05-17 · (previous session)

**What was built:**

**Database** — `api/migrations/0010_create_refunds_table.sql`
- `refunds` table: `order_id`, `return_id`, `amount`, `method` (cash|paystack), `gateway_ref`, `status` (pending|processed|failed), `approved_by`, `note`, `processed_at`.

**Backend** — `api/admin_refund.php`
- `GET ?order_id=X` → refund history + refundable balance + linked returns.
- `POST` → processes refund via Paystack API or records cash. Failed gateway calls persisted as `status='failed'`.
- Auth: `super` and `store_manager` only.

**Frontend service** — `admin-panel/src/services/api.js`
- `fetchRefundInfo(orderId)` and `issueRefund(payload)` added.

**Decision:** Use Paystack for refunds (not direct MTN MoMo API).

**Why:** Paystack already processes all payments on this platform (card, MoMo, USSD). The Paystack Refund API reverses any transaction it processed using only the `payment_reference`. One integration covers all payment types. Direct MTN MoMo API requires separate registration, sandbox credentials, and Ghana-specific compliance steps — significant overhead for redundant coverage.

---

## Registration UX

### ✅ Disabled Registration — Locked State UI
**Completed:** 2026-05-17 · (previous session)

**What was built:**
- `storefront/src/components/AuthModal.jsx` — When `canRegister` is false, the sign-up form is replaced with a professional locked card.

**Copywriting (user-specified):**
> *"We're temporarily pausing new account creations while we upgrade a few things behind the scenes. We'll be back open shortly! If you're already part of the family, you can* **[Sign In here]**."

Inline "Sign In here" link switches the modal view. Overlay panel updated with maintenance message.

**Decision:** Show a branded maintenance message instead of a generic disabled form.

**Why:** A dead/empty form is confusing — customers don't know if the site is broken or if registration is intentionally paused. A clear, warm message with an alternative action reduces support contacts and maintains trust.

---

## Pending / Future Work

| Priority | Feature | Description |
|---|---|---|
| 🔴 High | Multi-item admin returns | Upgrade `admin_returns.php` to accept `items[]` array (matching POS flow) |
| 🔴 High | Combined Paystack refund | Queue multiple return refunds and issue a single Paystack call to reduce API calls |
| 🟡 Medium | Customer return request flow | "Request Return" button on `Orders.jsx` for delivered orders; admin approval queue in `ReturnManager` |
| 🟡 Medium | Refund status on customer Orders page | Show "Refunded / Pending Refund" badge on order cards in the storefront |
| 🟢 Low | Store credit option | Allow customer to opt for loyalty points / store credit instead of a cash/card refund |

---

## Decisions Index

| Date (UTC) | Decision | Rationale |
|---|---|---|
| 2026-05-17 | Use Paystack for refunds, not direct MTN MoMo API | Single integration covers card + MoMo + USSD. No new credentials or compliance overhead. |
| 2026-05-17 | `refunds` table separate from `order_returns` | Returns = inventory event. Refunds = financial event. Separate concerns, separate tables. |
| 2026-05-18 | Refund panel appears *after* return confirmation | Can't issue a refund before goods are back. The return record is the legal proof that authorises the money movement. |
| 2026-05-19 | Refundable ceiling = returned item value, not order total | Prevents over-refunding. A customer returning one item from a 5-item order cannot receive the full order value. |
| 2026-05-19 | Time window enforced at return stage, not refund stage | Accounting may process refunds days after the return. The `order_returns.created_at` timestamp is the proof of legitimacy. |
| 2026-05-19 | Option C for failed refunds (auto-notify, no upfront preference) | Keeps the happy path frictionless. Only interrupts the customer when there is an actual problem. Industry standard used by Stripe, Flutterwave, and Paystack itself. |
| 2026-05-19 | Dual notification on refund failure (customer email + admin in-app alert) | Customer knows their money is safe and has a clear action. Admin has a visible task so the manual follow-up is not forgotten. |
