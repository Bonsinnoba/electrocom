# EssentialsHub Backend

## Setup Instructions

1.  **Database Setup**:
    *   Create a MySQL database named `essentialshub`.
    *   Import the `schema.sql` file into your database (e.g., using phpMyAdmin or MySQL Workbench).
    *   **If you are updating an existing installation**, run the following SQL to add the new columns for Ghana card verification:

        ```sql
        ALTER TABLE users
          ADD COLUMN id_number VARCHAR(50) DEFAULT NULL,
          ADD COLUMN id_photo LONGTEXT DEFAULT NULL,
          ADD COLUMN id_verified TINYINT(1) DEFAULT 0,
          ADD COLUMN id_verified_at DATETIME DEFAULT NULL,
          ADD COLUMN id_verification_reason VARCHAR(255) DEFAULT NULL,
          ADD COLUMN id_verifier_id INT DEFAULT NULL;
        ```

        These fields store the submitted Ghana card number and a Base64-encoded image of the card. The additional `id_verified*` columns track administrative approval.
    *   **Encryption key configuration** – to keep ID photos secure, set a `DATA_ENCRYPTION_KEY` value in `.env.php` (32+ random characters). Photos are AES‑256‑CBC encrypted in the database and decrypted for admin views.
    *   **Government verification** – configure `GOV_API_URL` and `GOV_API_KEY` in `.env.php`. During registration, the server will call the government API to confirm the ID; if the external service reports invalid data the registration is rejected.
*   **Social login (optional, login-only)** – set up OAuth credentials for Google, Facebook, GitHub and/or LinkedIn in your provider consoles and add the corresponding keys/redirects to `.env.php` (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_CLIENT_ID`, `GITHUB_CLIENT_ID`, etc.).  
  The application uses the **`league/oauth2-client`** library to handle the OAuth flow.  
  **Important**: Social login is restricted to *existing* account holders only. New users must register via the Ghana card verification flow first. The `social_auth.php` endpoint will reject signup requests from emails without existing accounts.

2.  **Configuration**:
    *   Open `db.php` and update the `$user` and `$pass` variables with your MySQL credentials (default is usually `root` and empty/blank for local development).

3.  **Running the Server**:
    *   Ensure your PHP server (XAMPP, WAMP, or built-in) is running.
    *   The API endpoints will be accessible at:
        *   `http://localhost/essentialshub/backend/products.php`
        *   `http://localhost/essentialshub/backend/auth.php`
        *   `http://localhost/essentialshub/backend/orders.php`
    *   *Note: The exact URL depends on your server configuration and where you placed the project folder.*

## API Endpoints

### 1. Products (`GET /products.php`)
Returns a list of all products.

### 2. Authentication (`POST /auth.php`)
**Register:**
```json
{
  "action": "register",
  "name": "Your Name",
  "email": "email@example.com",
  "password": "yourpassword",
  "id_number": "GHA1234567890",
  "id_photo": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ..."  
}
```

The `id_number` and `id_photo` fields are required for new accounts. The photo should be a Base64-encoded image of the Ghana card front.

**Login:**
```json
{
  "action": "login",
  "email": "email@example.com",
  "password": "yourpassword"
}
```

### 3. Create Order (`POST /orders.php`)
Creates a new order.
```json
{
  "user_id": 1,
  "total_amount": 100.00,
  "items": [
    { "id": 1, "quantity": 2, "price": 50.00 }
  ],
  "shipping_address": "123 Main St",
  "payment_method": "card"
}
```
### 4. Ghana Card Verification (Admin only)

- **List pending verifications** (`GET /verify_id.php`)

  Response:
  ```json
  {
    "success": true,
    "data": [
      {"id":1,"name":"John Doe","email":"john@...","id_number":"GHA1234...","id_photo":"data:image/png;base64,..."},
      ...
    ]
  }
  ```

- **Approve or reject** (`POST /verify_id.php`)
  ```json
  {
    "action": "approve",          // or "reject"
    "user_id": 123,
    "reason": "Optional note"
  }
  ```

  Requires an admin token in `Authorization` header. Approval sets `id_verified` and timestamps; rejection records the reason.

### Database Migration

If you already have a database, run the migration script or execute:
```sql
ALTER TABLE users
  ADD COLUMN id_number VARCHAR(50) DEFAULT NULL,
  ADD COLUMN id_photo LONGTEXT DEFAULT NULL,
  ADD COLUMN id_verified TINYINT(1) DEFAULT 0,
  ADD COLUMN id_verified_at DATETIME DEFAULT NULL,
  ADD COLUMN id_verification_reason VARCHAR(255) DEFAULT NULL,
  ADD COLUMN id_verifier_id INT DEFAULT NULL;
```

Alternatively run `php migrate_verification.php` from the `api` folder.  The script now adds all of the above columns along with earlier verification fields.
