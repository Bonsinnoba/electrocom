# ElectrCom Development & Architecture Log

## Project Name: ElectrCom (formerly EssentialsHub)
**Date:** May 19, 2026 (Updated)

---

## 1. Executive Summary
This document serves as the formal development log, architectural decision record (ADR), and technical case study reference for the ElectrCom platform. It outlines the key problems identified, decisions made by the stakeholders, and the technical implementations executed to resolve them.

## 2. Recent Development Phases & Decisions

### Phase 1: Security & Audit Hardening (May 18-19, 2026)
**Objective:** Secure the refund/return flow against exploitation and fix broken audit trails.

**Case Study Context:** 
During an audit, it was discovered that the `admin_returns.php` endpoint could process refunds for items that were already returned, allowing malicious actors to exploit the system by returning a single item multiple times for repeated refunds. Furthermore, physical POS returns were not visibly linked to digital records due to strict database joins (`JOIN` instead of `LEFT JOIN`), causing a loss of audit visibility.

**Decisions Made:**
1. **Enforce Strict Quantity Checks:** Implemented server-side validation to compare `purchased_qty` against `already_returned_qty` within an atomic transaction.
2. **Left Join Fallback for POS:** Switched to a `LEFT JOIN` on the `users` table so in-store customers (who lack accounts) don't break the query.
3. **Refund Failure Strategy (Option C):** Decided on a "Silent Failure Reactive Flow." If a Paystack refund fails, the system logs the failure, leaves the refund as "failed" in the database, and alerts the admin via email so they can manually handle the edge case (e.g., via MoMo or Cash).

### Phase 2: Performance Optimization (May 19, 2026)
**Objective:** Prevent frontend browser crashes due to massive DOM elements and large data payloads.

**Case Study Context:**
The `ReturnManager.jsx` component was fetching the entire history of orders into the browser memory just to allow the admin to search for a specific order. As the business scaled, this caused the frontend application to freeze and eventually crash.

**Decisions Made:**
1. **Server-Side Filtering:** Modified `admin_orders.php` to accept a `?search=ORD-123` parameter. 
2. **Targeted Fetching:** Upgraded the frontend `fetchOrders` service to only request orders matching the search query, completely eliminating client-side filtering lag.

### Phase 3: Multi-Item Returns Infrastructure (May 19, 2026)
**Objective:** Allow customers/admins to return multiple different items from a single order in one workflow, preventing duplicate refund fees.

**Case Study Context:**
The legacy system only allowed returning one item at a time. If a user bought a Laptop, Mouse, and Keyboard, and wanted to return the Mouse and Keyboard, the admin had to process two separate returns and issue two separate Paystack refunds. This cluttered the customer's bank statement and incurred extra API latency and potential transaction fees.

**Decisions Made:**
1. **Batch Item Processing:** Refactored `admin_returns.php` to accept an `items[]` array. It now iterates over all selected items, validating each against the maximum returnable quantity, and wrapping all `order_returns` inserts and stock replenishments into a single database transaction.
2. **Consolidated Financial Refunds:** Updated `admin_refund.php` to accept a `return_ids` array. It now calculates the total value of all returned items in the batch and issues a *single* API call to Paystack. 
3. **Frontend Upgrade:** Redesigned the `ReturnManager.jsx` UI from a single dropdown menu to an interactive table where admins can specify exact return quantities for multiple items simultaneously.
4. **Help Center Documentation Synchronization:** Updated both the storefront customer FAQ/support page (`Support.jsx`) and the administrator back-office `HelpCenter.jsx` to outline the new Multi-Item and consolidated refund workflows. This ensures all support representatives and customers are aligned on the new unified logistics flow.
5. **Accountant Financial Ledger & Auditing Upgrades:** Extended the `admin_analytics.php` API and the `AccountantDashboard.jsx` frontend to track returns and refunds. Added Net Revenue (Gross Revenue - Refunds), total refund amount, return count metrics, and a new double-ledger visual layout showcasing both Recent Order Inflow (revenue) and Recent Refund Outflow (reversals) for robust financial compliance and seamless CSV & Word document export auditing.

---

## 3. Database Schema Updates
To support the new audit flows, the following changes were implemented:
*   Added `gateway_ref` index to the `refunds` table for faster webhook lookups.
*   Enforced `return_id` tracking in the `refunds` table, ensuring every financial reversal is tied strictly to a physical inventory return.

## 4. Pending Tasks & Future Roadmap
1. **Email Notification Engine Optimization:** Continue refining the refund failure templates (`refund_failed.php`).
2. **End-to-End Testing:** Conduct full production tests of the Multi-Item refund workflow with live Paystack credentials.

*End of Log.*
