





# EssentialsHub Decoupled Project

This project is structured as a decoupled application with a PHP backend and separate React frontends for customers and administrators.

## Project Structure

```
/EssentialsHub-project
  ├── /api            (PHP Backend API)
  ├── /storefront     (React Customer Application)
  └── /admin-panel    (React Admin Application)
```

## Getting Started

### 1. Backend API (`/api`)
- Open a terminal in `/api`.
- Run: `php -S localhost:8000`
- Keep this terminal open while using the apps.
- Note: This currently connects to the database at `localhost:10017` as defined in `api/db.php`.

### 2. Storefront App (`/storefront`)
```bash
cd storefront
npm install
npm run dev
```

### 3. Admin Panel App (`/admin-panel`)
```bash
cd admin-panel
npm install
npm run dev
```

## Configuration

This project uses Vite environment variables to manage the API connection.

1. Navigate to the frontend directory (`/storefront`, `/admin-panel`, or `/super-user`).
2. You will see a `.env` file (for local development) and `.env.production` (for production builds).
3. Ensure the `VITE_API_BASE_URL` variable correctly points to your backend.

Example `.env` for local development:
`VITE_API_BASE_URL=http://essentialshub.local/api`

## Production Deployment & SPA Routing

When deploying the React frontends to a production server, it is critical to configure the web server to rewrite all requests to `index.html`. Because React Router manages routing dynamically on the client, refreshing the page on a sub-route (e.g. `/products`) will result in a `404 Not Found` error without this configuration.

### Nginx Example
Place this in your Server Block configuration:
```nginx
server {
    listen 80;
    server_name your-app.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### Apache Example
Create an `.htaccess` file in the root of your deployed `dist` folder:
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

