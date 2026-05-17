# ElectrCom: Technical Ecosystem & Development Guide

ElectrCom is a high-performance, decoupled retail ecosystem designed for electronics and tech-focused businesses. It consists of a lean PHP REST API and dual React frontend applications optimized for both customers and business operations.

---

## 🏗️ System Architecture

The project follows a **Decoupled Architecture**, allowing the backend and frontends to scale and evolve independently.

- **Backend API (`/api`)**: Built with Vanilla PHP 8.1+ for maximum execution speed and zero framework overhead.
- **Storefront (`/storefront`)**: A high-fidelity React application for customers, featuring code-splitting and lazy-loading for sub-second page transitions.
- **Admin Panel (`/admin-panel`)**: A comprehensive management suite for staff, pickers, and administrators, featuring real-time analytics and specialized operational workflows.

---

## 🚀 Key Capabilities

### 1. Advanced Inventory & Sales
- **Automated Stock Management**: Real-time stock status (Active/Out of Stock/Archived) synchronized via automated routines to maintain SEO visibility for sold-out items.
- **Loyalty Ecosystem**: Automated customer progression across **Starter**, **Elite**, and **VIP** levels based on lifetime spending thresholds.
- **Dynamic Pricing**: Support for percentage discounts, timed sales, and coupon validation.

### 2. Operational Workflows
- **Picker/Warehouse System**: Dedicated workflow for order picking, including "Missing Item" reporting and customer confirmation cycles.
- **Delivery Management**: OTP-verified delivery completion and delivery performance analytics.
- **Point of Sale (POS)**: Integrated interface for physical store transactions and returns.

### 3. Business Intelligence & Communication
- **Traffic Monitoring**: Built-in monitoring to track real-time visitor patterns and block suspicious IP ranges.
- **Unified Messaging**: Multi-channel notification engine supporting SMTP, Mailgun, SendGrid, and SMS (Hubtel).
- **Audit Trails**: Full accountability with detailed logs for every administrative action (price changes, role updates, deletions).

---

## 🛡️ Security Measures

The system implements a multi-layered security model focused on data integrity and session safety:

- **Password Security**: Implementation of **Argon2id** (the industry-standard hashing algorithm) combined with a unique server-side **Pepper** string.
- **Hardened JWT Sessions**: Custom JSON Web Token implementation with **IP Pinning** (preventing session hijacking) and **Signature Verification**.
- **Brute Force Protection**: Intelligent rate-limiting on sensitive endpoints (Login/Reset) with automated **SMS alerts** sent to administrators upon detection of an attack.
- **Session Isolation**: Use of `X-App-ID` headers and strictly isolated cookies to prevent session contamination between the Storefront and Admin applications.
- **Input Sanitization**: Global sanitization layer protecting against XSS and SQL Injection.

---

## ⚖️ Technical Trade-offs & Sacrifices

To achieve its performance and operational goals, the following strategic sacrifices were made:

1. **Vanilla PHP vs. Frameworks**: We opted for a framework-less backend to eliminate the overhead of thousands of vendor files. This ensures lightning-fast API responses but requires more manual security and routing maintenance.
2. **Custom Auth vs. Auth Providers**: By building a custom JWT system, we sacrificed the ease of third-party integration for **zero external dependencies** and the ability to implement specific features like IP-pinning.
3. **Optimized Frontend vs. Library Depth**: We prioritize code-splitting and minimal bundle sizes. While we use `react-quill` for its rich feature set, we mitigate its known vulnerabilities via backend sanitization rather than switching to a heavier, "more secure" editor that would bloat the customer experience.
4. **Manual Infrastructure Setup**: The project targets standard Linux/PHP environments over containerization (Docker) to remain accessible for rapid deployment on existing enterprise servers.

---

## ⚙️ Production Configuration

### 1. Backend (`/api`)
- **PHP Requirements**: Version 8.1+ with `pdo_mysql`, `openssl`, `json`, and `mbstring`.
- **Environment**: Rename `.env.example` to `.env` and configure:
  - `APP_ENV=production`
  - `JWT_SECRET` & `PASSWORD_PEPPER`: Use 64+ character random strings.
  - `ALLOWED_ORIGINS`: Comma-separated list of your production domains.
- **Permissions**: Ensure `api/logs`, `api/uploads`, and `api/data` are writable by the web user (`www-data`).

### 2. Frontends (`/storefront` & `/admin-panel`)
- **Build Configuration**: Edit `.env.production` to point `VITE_API_BASE_URL` to your live API.
- **Build Command**: Run `npm run build` locally and upload the `dist/` folder.
- **Server Routing**: Use the following SPA rewrite rules:
  - **Nginx**: `try_files $uri $uri/ /index.html;`
  - **Apache**: Enable `mod_rewrite` and use the `.htaccess` file provided in the repo.

---
*ElectrCom — Professional Retail Infrastructure.*
