# Ghana Card Verification Implementation

This document outlines the changes made to support Ghana card-based user verification, what has already been implemented, what still needs to be done, and some recommendations for future work.

---

## ✅ What has been implemented

### Frontend (React/storefront)
- The sign-up modal (`AuthModal.jsx`) was converted into a four-step wizard.
- Steps now collect:
  1. Name and email
  2. Phone number and country (restricted to "Ghana")
  3. Ghana card number and a face scan taken via webcam
  4. Password and confirmation
- The modal only allows Ghana as the country and rejects non-Ghana numbers with a user-friendly message.
- Client-side validation ensures:
  * The card number matches a simple regex (`^[A-Z0-9]+(?:-[A-Z0-9]+)*$`) – Ghana card numbers are alphanumeric, may include hyphens, and typically look like `GHA-1234-5678`.
  * A photo has been captured using `navigator.mediaDevices.getUserMedia`.
- The form state includes `id_number` and `id_photo` which are sent when calling `registerUser()`.
- Styles were adjusted for compact layout, step dots, centralized text, and error handling within scrollable area.
- The social icons in the auth modal now link to `/social_auth.php?provider=<name>` on the API server, kicking off the OAuth flow for Google, Facebook, GitHub, or LinkedIn.
- **Social login is restricted to existing accounts only** – new user registrations must go through the Ghana card verification flow to preserve the security model.

### Backend (PHP/api)
- `register.php` was extended:
  * New helper `isValidGhanaCardNumber()` performs a basic format check (placeholder for real API integration).
  * Incoming JSON is sanitized and validated for non-empty `id_number` and `id_photo`.
  * Validates card format using helper and decodes the Base64 photo to ensure it is a valid image.
  * Checks that the card number isn't already used by another user.
  * If validation passes, inserts `id_number` and `id_photo` into the `users` table alongside the usual fields.
  * Appropriate HTTP status codes and error messages are returned for invalid input.
- The database schema (`api/schema.sql`) now defines two new columns:
  ```sql
  id_number VARCHAR(50) DEFAULT NULL,
  id_photo LONGTEXT       DEFAULT NULL
  ```
- `api/README.md` updated with migration commands and examples showing how to supply the new fields in a registration request.

---

## 🔧 What you need to do next

1. **Database migration** – if you’re upgrading an existing installation, run:
    ```sql
    ALTER TABLE users
      ADD COLUMN id_number VARCHAR(50) DEFAULT NULL,
      ADD COLUMN id_photo LONGTEXT DEFAULT NULL;
    ```
   Alternatively, import the updated `schema.sql` for a fresh database.

2. **Verification logic** – the current implementation only stores data, encrypts the photo and performs format/uniqueness checks. You should:
   * Integrate with a government or third-party Ghana card verification API, or
   * Implement a manual review process (already provided via `verify_id.php` and the admin UI) that inspects submissions and marks users as verified.
   * The backend now includes an endpoint (`verify_id.php`) for admins to approve/reject, setting `id_verified`, `id_verified_at`, `id_verification_reason` and `id_verifier_id`.

3. **Admin interface (implemented)**
   * `CustomerManager.jsx` now shows a "Verification" column with approve/reject buttons.
   * Clicking the eye icon opens a modal displaying the encrypted card photo (decrypted on the server).
   * Approvals and rejections are recorded with optional reason and verifier ID.
   * Role checks ensure only `admin`/`super` users have access.

4. **Security & privacy considerations**
   * ID photos are now **AES-256‑CBC encrypted** using a key defined in `.env.php` (`DATA_ENCRYPTION_KEY`). Be sure to set that value to a 32+ character random string and keep it secret.
   * Encryption helpers (`encryptData`/`decryptData`) live in `security.php` and are used during registration and verification retrieval.
   * Admin endpoints decrypt the photo for viewing; regular APIs never return it.
   * Backend sanitizes all inputs; remain mindful of SQL injection and XSS.
   * Comply with data protection regulations and purge data according to your retention policy.
   * If key is missing, encryption is bypassed (development convenience) – do not deploy without a key.

5. **Frontend polish**
   * The modal now detects camera support; on devices without a webcam it shows a file input so users can upload a photo instead.
   * A summary section (name/email/phone/ID # + image) appears on the password step so the user can confirm details before submitting.
   * Error messages from client validation and the server are surfaced in the modal.
   * Step dots, compact layout and scrollable error area improve the UX.

6. **Testing**
   * Write unit/integration tests for the new backend validation rules.
   * Test the full sign-up flow on various browsers and mobile devices.

---

## 💡 Recommendations

- **Use a dedicated verification service**: If a government API exists, call it synchronously during registration or queue the request.
- **Limit misuse**: rate‑limit registration attempts and verify that `id_photo` isn’t a stock image by comparing hashes.
- **User feedback**: after account creation, clearly state that verification is pending and may take time.
- **Data retention policy**: decide how long to keep ID photos and when to purge them.
- **Logging**: record events such as failed validations, duplicate card attempts, etc., to monitor abuse.
- **Error handling**: gracefully handle cases where camera access is denied; provide fallback instructions.
- **Social login policy**: Social OAuth (Google, Facebook, LinkedIn, GitHub) is restricted to *existing* account holders only. This ensures all users go through the Ghana card verification flow on first signup, maintaining your security posture. New users attempting social login will receive a message directing them to register via Ghana card first.

---

This implementation establishes a solid foundation for Ghana card verification; future work mostly revolves around connecting it to a verification authority or workflow and then extending the UI/UX around that process. Feel free to modify or extend any of the above to suit your project’s requirements.