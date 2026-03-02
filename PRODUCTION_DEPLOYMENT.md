# Production Deployment Guide

Before deploying EssentialsHub to a live production environment, there are critical manual steps you must take to ensure the security, stability, and performance of the application. 

Follow this checklist carefully.

---

## 1. Secrets and Environment Variables

You must replace all default, placeholder, or "test" credentials with **strong, randomly generated secrets**.

### Backend (`api/.env.php`)
Open `api/.env.php` and update the following variables:
- **`DB_PASS` & `DB_USER`**: Do not use `root` in production. Create a dedicated MySQL user with privileges only for the `essentialshub` database.
- **`JWT_SECRET`**: Generate a strong 64+ character random string. If this is compromised, attackers can forge login sessions.
- **`PASSWORD_PEPPER`**: Generate a strong random string. This adds additional security to hashed passwords. *(Note: Changing this later will invalidate all existing user passwords!)*
- **`DATA_ENCRYPTION_KEY`**: Generate a 32+ character key. This is used to encrypt sensitive PII (like Ghana Card photos).
- **`PAYSTACK_SECRET`**: Replace the `sk_test_...` key with your live production secret key from the Paystack dashboard.
- **`FRONTEND_URL`**: Update this to the exact live domain of your storefront (e.g., `https://www.essentialshub.com`).
- **Social Login Keys**: Fill in your Client IDs and Secrets for Google, Facebook, etc., and update the Redirect URIs to match your live backend domain.

### Frontends (`.env.production`)
For **each** of your React applications (`storefront`, `admin-panel`, and `super-user`):
1. Create or edit the `.env.production` file.
2. Set `VITE_API_BASE_URL` to point to your live PHP backend (e.g., `VITE_API_BASE_URL=https://api.essentialshub.com`).

---

## 2. Server & Web Server Security

### Restrict API Access (CORS)
Currently, in your development environment, `api/cors_middleware.php` likely allows requests from any origin or `localhost`. 
1. Open `api/cors_middleware.php`.
2. Update the `Access-Control-Allow-Origin` headers to **explicitly allow only your exact frontend domains**. Never use `*` in production.

### Protect PHP Configuration (`php.ini`)
1. Turn **OFF** error displaying to prevent leaking sensitive variables on crashes.
   ```ini
   display_errors = Off
   log_errors = On
   error_log = /var/log/php_errors.log
   ```
2. Increase your upload limits if necessary (for large gallery images or PDFs).
   ```ini
   upload_max_filesize = 10M
   post_max_size = 12M
   ```

### Securing the Uploads Directory
Your users will upload files to `api/uploads`. You **must** prevent attackers from uploading malicious `.php` scripts and executing them.
1. Ensure the `uploads/` directory has proper write permissions (e.g., `chmod 755 uploads`).
2. If using Apache, create an `.htaccess` file inside the `uploads/` folder:
   ```apache
   # Disallow PHP execution in this directory
   <Files *.php>
       SetHandler none
       SetHandler default-handler
       Options -ExecCGI
       RemoveHandler .php
   </Files>
   ```
3. If using Nginx, prevent PHP execution in the block:
   ```nginx
   location /uploads/ {
       location ~ \.php$ {
           deny all;
       }
   }
   ```

### Securing `.env.php`
Ensure your web server (Nginx/Apache) is configured to deny all web requests directly to `.env.php` so your passwords cannot be downloaded from the browser. 

---

## 3. Database Hardening

1. **Remove Remote Access**: Ensure your MySQL server is only bound to `localhost` (or the specific internal IP if the DB is on a separate server).
2. **Setup Automated Backups**: Production databases crash. Setup a server cron job (e.g., using `mysqldump`) to back up your `products`, `orders`, and `users` tables daily to an external storage bucket.
3. **Execute Setup Scripts and Delete Them**:
   - If you use `create_admin.php` to bootstrap your first super admin account, **delete the file immediately after** running it. Leaving it on the server is an enormous security risk.
   - Run any database migrations safely in a staging environment before doing it against production.

---

## 4. Building the Frontends

You cannot run `npm run dev` in production. You must compile the React code into optimized, static HTML/JS/CSS.

For **each** frontend folder (`storefront`, `admin-panel`, `super-user`):
1. Open a terminal in that directory.
2. Run `npm install` to ensure dependencies are up to date.
3. Run `npm run build`.
4. This will generate a `dist/` folder. This folder contains your final website.

Copy the contents of the `dist/` folders to your web server (e.g., `/var/www/storefront`, `/var/www/admin`).

### SPA Routing (React Router)
Because React handles page changes locally, refreshing a specific page (like `https://essentialshub.com/cart`) will result in a 404 error on a live server unless you configure fallback routing.

**Nginx:**
```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

**Apache:**
Create an `.htaccess` inside the `dist/` folder:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 5. Enable HTTPS (SSL Certificates)

You **must** serve your API and frontends over HTTPS. 
- Passing login passwords, JWT tokens, and Paystack payment tokens over plain HTTP is highly insecure and will trigger browser security warnings.
- Use **Let's Encrypt** (Certbot) to easily provision free SSL certificates for your Nginx or Apache servers.

---

## 6. Scheduled Tasks (Cron Jobs)

If your backend relies on background maintenance operations (such as rotating slider images based on time via `check_slides_time.php`, parsing backend traffic logs, or database cleanup), you must set up Server Cron Jobs to trigger these PHP scripts periodically.

Example Cron Job (runs every 15 minutes):
```bash
*/15 * * * * /usr/bin/php /var/www/api/check_slides_time.php > /dev/null 2>&1
```

---

## Final Review
1. Are all default passwords and secrets changed?
2. Is the API connected over HTTPS?
3. Is your frontend pointing to the production API (not `localhost`)?
4. Are you serving the React applications out of the `dist/` build folders?
5. Did you delete or restrict developer scripts like `create_admin.php`?

If yes, you are ready to launch EssentialsHub!
