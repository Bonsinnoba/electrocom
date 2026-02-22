





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

If your local API URL is different from `http://localhost:8000`, you must update the `API_BASE_URL` in:
- `storefront/src/services/api.js`
- `admin-panel/src/services/api.js`
