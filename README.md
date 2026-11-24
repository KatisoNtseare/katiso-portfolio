# Katiso Ntseare — Personal Portfolio

A premium, responsive developer portfolio built with Next.js App Router, TypeScript, MongoDB, Cloudinary, and Resend. Project content is managed entirely through an authenticated Admin Dashboard without touching source code, and visitor enquiries are reliably delivered to your inbox with comprehensive diagnostics.

## Key Features

- **Public Portfolio**: Responsive homepage, About, Experience, Projects listing, and individual case studies (`/projects/[slug]`).
- **Admin Dashboard**: Full CRUD interface (`/admin`) for managing portfolio projects, draft/published status, featured status, sorting, category filtering, and real-time search.
- **Cloudinary Integration**: Mandatory server-side cover picture uploads directly to Cloudinary under the dedicated folder:
  `katiso-portfolio/project-pictures`
  with automatic metadata persistence (dimensions, format, secure URL, public ID), file-type validation via magic bytes (JPEG, PNG, WebP), 5 MB file size limit, and automated asset cleanup on image replacement or project deletion.
- **MongoDB Persistence**: Connection pooling, unique slug indexes (`uq_projects_slug`), composite ordering indexes (`ix_projects_public_order`), ObjectId validation, and draft privacy enforcement.
- **Contact Form & Resend Email Delivery**: Professional enquiry delivery with dual plain-text and escaped HTML bodies, visitor `replyTo` configuration, honeypot spam protection, rate-limiting, reference ID generation, and structured server-side failure diagnostics.
- **Authentication & Security**: Scrypt password hashing, HMAC-SHA256 session signing, HTTP-only SameSite=Strict cookies, server-side credential isolation, and independent authorization checks on all mutation and upload endpoints.
- **Integrations**: GitHub profile API, Resend email contact form, CV download, and interactive engineering demonstrations.

## Requirements

- Node.js 22.16 or newer.
- npm 10 or newer.
- MongoDB Atlas cluster or self-hosted MongoDB instance.
- Cloudinary account for project picture storage.
- Resend account for transactional contact form delivery.

---

## 1. Installation

Clone the repository and install dependencies:

```bash
npm install
```

---

## 2. Environment Configuration

Copy the example environment configuration to `.env.local`:

```bash
# On Linux / macOS / Git Bash:
cp .env.example .env.local

# On Windows PowerShell:
Copy-Item .env.example .env.local
```

### Required Configuration in `.env.local`:

```env
# Application URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# MongoDB Configuration
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/?retryWrites=true&w=majority
MONGODB_DB=katiso_portfolio

# Admin Authentication
ADMIN_USERNAME=katiso
ADMIN_PASSWORD_HASH=
SESSION_SECRET=replace-with-a-random-secret-at-least-32-characters-long

# Cloudinary Integration (Server-Side Only)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Contact Form & Resend Email Delivery
RESEND_API_KEY=re_your_api_key
CONTACT_TO_EMAIL=katisontseare@proit.dev
CONTACT_FROM_EMAIL="Katiso Ntseare <portfolio@proit.dev>"

# Optional Integrations
GITHUB_USERNAME=KatisoNtseare
GITHUB_TOKEN=
NEXT_PUBLIC_LINKEDIN_URL=
NEXT_PUBLIC_CV_URL=
```

> **Important**: Never prefix `RESEND_API_KEY`, `CLOUDINARY_API_SECRET`, `SESSION_SECRET`, or `MONGODB_URI` with `NEXT_PUBLIC_`. These credentials must remain strictly server-side.

---

## 3. Admin Login Setup

Generate an scrypt password hash for your chosen administrator password:

```bash
npm run admin:hash -- "Your-Secure-Password-At-Least-12-Characters"
```

Copy the printed `ADMIN_PASSWORD_HASH=...` line into `.env.local`.

Generate a 64-character random session secret:

```powershell
# PowerShell:
-join ((1..48 | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) }))
```

Set the generated string as `SESSION_SECRET`.

---

## 4. Cloudinary Setup

1. Sign up or log in to [Cloudinary](https://cloudinary.com/).
2. Copy your **Cloud Name**, **API Key**, and **API Secret** from the Cloudinary dashboard into `.env.local`.
3. The application will automatically create and organize all project pictures in the designated folder:
   `katiso-portfolio/project-pictures`
4. The system validates:
   - Supported image formats: JPEG, PNG, WebP (verified via magic byte inspection).
   - Maximum upload size: 5 MB.
   - Deletion safety: Only assets starting with `katiso-portfolio/project-pictures/` can ever be deleted through the portfolio to protect other assets.

---

## 5. Contact Form & Resend Email Delivery Setup

The portfolio uses [Resend](https://resend.com/) to route contact form submissions to your primary inbox (`katisontseare@proit.dev`).

### Sender domain

The configured sender is `portfolio@proit.dev`, so add and verify **`proit.dev`** in Resend. The sender address domain must match the domain verified in Resend; do not substitute a different or unverified sender domain.

### Step 1: Create Resend Account & API Key
1. Sign up at [resend.com](https://resend.com/).
2. Navigate to **API Keys** → **Create API Key**.
3. Choose the permission: **Sending access** (recommended) or Full access.
4. Set the generated key in `.env.local`:
   ```env
   RESEND_API_KEY=re_your_api_key
   ```

### Step 2: Add & Verify `proit.dev` in Resend
1. In the Resend Dashboard, go to **Domains** → **Add Domain**.
2. Enter `proit.dev` and follow the dashboard's domain verification instructions.
3. Add the sending-authentication DNS records Resend provides for `proit.dev`.
4. Preserve the existing Zoho MX records. Do not replace or redirect root-domain MX records as part of sender verification; if the dashboard requests a DNS change that would affect Zoho mail routing, confirm the impact with the domain administrator first.
5. Click **Verify DNS Records**. Production messages can be sent from `portfolio@proit.dev` after Resend verifies the domain.

### Step 3: Configure Sender and Recipient
```env
CONTACT_TO_EMAIL=katisontseare@proit.dev
CONTACT_FROM_EMAIL="Katiso Ntseare <portfolio@proit.dev>"
```

### Step 4: Run the Email Diagnostic Check
Verify your configuration without sending unnecessary emails:
```bash
npm run email:check
```
This utility inspects environment variables, validates API key permissions, checks sender and recipient formatting, and queries Resend for domain verification status.

### Step 5: Run an Explicit Test Send
To perform an intentional live test dispatch to your inbox:
```bash
npm run email:test -- katisontseare@proit.dev
```

---

## 6. MongoDB Verification & Seeding

Check the database connection and index initialization:

```bash
npm run db:check
```

Seed initial draft case studies (skipped automatically if projects already exist):

```bash
npm run db:seed
```

> Note: Legacy seed projects start as drafts without cover images and are clearly labeled as `Missing image` in the Admin Dashboard. A Cloudinary cover image must be uploaded before publishing any draft.

---

## 7. Running Locally

Start the Next.js development server:

```bash
npm run dev
```

- Public website: <http://localhost:3000>
- Contact page: <http://localhost:3000/contact>
- Admin login: <http://localhost:3000/admin/login>
- Admin dashboard: <http://localhost:3000/admin>

---

## 8. Testing & Quality Checks

Run the complete suite. It runs unit tests and then the integration test files; live-service tests are explicitly reported as skipped unless test-only credentials are supplied:

```bash
npm test
```

Run only unit tests (no live MongoDB, Cloudinary or Resend credentials required):

```bash
npm run test:unit
```

Run integration tests separately:

```bash
npm run test:integration
```

The MongoDB integration test requires `MONGODB_TEST_URI` and `MONGODB_TEST_DB=katiso_portfolio_test`. The Cloudinary/MongoDB integration test additionally requires `CLOUDINARY_TEST_CLOUD_NAME`, `CLOUDINARY_TEST_API_KEY`, and `CLOUDINARY_TEST_API_SECRET`. Tests use only the dedicated `katiso_portfolio_test` database and temporary Cloudinary images. They never fall back to `.env.local`, `MONGODB_URI`, or production Cloudinary credentials. When test-only credentials are absent, the relevant test reports itself as skipped.

Run static type checking:

```bash
npm run typecheck
```

Run ESLint:

```bash
npm run lint
```

Run the production build:

```bash
npm run build
```

---

## 9. Managing Projects (Admin Dashboard)

Log in to `/admin` to manage your portfolio:

1. **Add Project**: Click **Add project**, fill out the basic overview (title, slug, summary, category, technologies), case-study sections (problem, solution, contributions, architecture, outcomes), and upload a cover picture.
2. **Cloudinary Upload**: Under the **Media & links** tab, select a project picture. The picture is uploaded server-side to Cloudinary under `katiso-portfolio/project-pictures` and its metadata is saved with the project.
3. **Publishing**: Check **Publish publicly** or click the eye icon in the project row. Projects without a cover image cannot be published.
4. **Draft Privacy**: Draft and unpublished projects are never accessible on the public website or public URLs.
5. **Editing & Image Replacement**: Edit any field at any time. When replacing a cover image, the new asset is saved to MongoDB first; once confirmed, the old Cloudinary asset is automatically removed.
6. **Deletion**: Permanently removes the MongoDB project document and its corresponding Cloudinary image asset with safety checks.

Cloudinary deletion runs after the MongoDB change succeeds and checks that no project still references an image. Failed deletions are recorded in the MongoDB `cloudinary_cleanup` collection and retried on demand with `npm run cloudinary:cleanup` (configure the same MongoDB and Cloudinary environment variables first). Newly uploaded images are registered server-side so a failed project save can clean up only assets returned by this application's upload endpoint. If MongoDB is unavailable while recording a cleanup retry, the server logs the asset ID and error. After restoring connectivity, an operator must check that no project references that ID, then delete it from the Cloudinary console; this rare case cannot be retried automatically because the cleanup record could not be stored.

Google Drive videos are embedded from validated Drive sharing links. The video owner must set sharing permissions so the intended portfolio visitors can view the file; private Drive files will not play for visitors.

---

## 10. Deployment on Oracle Cloud / VPS

1. Configure the VPS firewall and ensure MongoDB Atlas allowlists the VPS egress IP.
2. Clone the repository and configure environment variables in `.env.local` or through systemd environment files.
3. Run `npm install --omit=dev` and `npm run build`.
4. Run the production server via PM2, systemd, or Docker:
   ```bash
   npm run start
   ```
5. Put Next.js behind an Nginx reverse proxy with HTTPS (Let's Encrypt SSL/TLS).
