# Katiso Ntseare — Personal Portfolio

A premium, responsive developer portfolio built with Next.js App Router, TypeScript, MongoDB, and Cloudinary. Project content is managed entirely through an authenticated Admin Dashboard without touching source code.

## Key Features

- **Public Portfolio**: Responsive homepage, About, Experience, Projects listing, and individual case studies (`/projects/[slug]`).
- **Admin Dashboard**: Full CRUD interface (`/admin`) for managing portfolio projects, draft/published status, featured status, sorting, category filtering, and real-time search.
- **Cloudinary Integration**: Mandatory server-side cover picture uploads directly to Cloudinary under the dedicated folder:
  `katiso-portfolio/project-pictures`
  with automatic metadata persistence (dimensions, format, secure URL, public ID), file-type validation via magic bytes (JPEG, PNG, WebP), 5 MB file size limit, and automated asset cleanup on image replacement or project deletion.
- **MongoDB Persistence**: Connection pooling, unique slug indexes (`uq_projects_slug`), composite ordering indexes (`ix_projects_public_order`), ObjectId validation, and draft privacy enforcement.
- **Authentication & Security**: Scrypt password hashing, HMAC-SHA256 session signing, HTTP-only SameSite=Strict cookies, server-side credential isolation, and independent authorization checks on all mutation and upload endpoints.
- **Integrations**: GitHub profile API, Resend email contact form, CV download, and interactive engineering demonstrations.

## Requirements

- Node.js 22.16 or newer.
- npm 10 or newer.
- MongoDB Atlas cluster or self-hosted MongoDB instance.
- Cloudinary account for project picture storage.

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

# Optional Integrations
GITHUB_USERNAME=KatisoNtseare
GITHUB_TOKEN=
RESEND_API_KEY=
CONTACT_TO_EMAIL=
CONTACT_FROM_EMAIL=
NEXT_PUBLIC_CV_URL=
```

> **Important**: Never prefix `CLOUDINARY_API_SECRET`, `SESSION_SECRET`, or `MONGODB_URI` with `NEXT_PUBLIC_`. These credentials must remain strictly server-side.

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

## 5. MongoDB Verification & Seeding

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

## 6. Running Locally

Start the Next.js development server:

```bash
npm run dev
```

- Public website: <http://localhost:3000>
- Admin login: <http://localhost:3000/admin/login>
- Admin dashboard: <http://localhost:3000/admin>

---

## 7. Testing & Quality Checks

Run the automated test suite covering authentication, Cloudinary validation, image magic bytes, MongoDB CRUD operations, draft privacy, and live Cloudinary integration:

```bash
npm test
```

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

## 8. Managing Projects (Admin Dashboard)

Log in to `/admin` to manage your portfolio:

1. **Add Project**: Click **Add project**, fill out the basic overview (title, slug, summary, category, technologies), case-study sections (problem, solution, contributions, architecture, outcomes), and upload a cover picture.
2. **Cloudinary Upload**: Under the **Media & links** tab, select a project picture. The picture is uploaded server-side to Cloudinary under `katiso-portfolio/project-pictures` and its metadata is saved with the project.
3. **Publishing**: Check **Publish publicly** or click the eye icon in the project row. Projects without a cover image cannot be published.
4. **Draft Privacy**: Draft and unpublished projects are never accessible on the public website or public URLs.
5. **Editing & Image Replacement**: Edit any field at any time. When replacing a cover image, the new asset is saved to MongoDB first; once confirmed, the old Cloudinary asset is automatically removed.
6. **Deletion**: Permanently removes the MongoDB project document and its corresponding Cloudinary image asset with safety checks.

---

## 9. Deployment on Oracle Cloud / VPS

1. Configure the VPS firewall and ensure MongoDB Atlas allowlists the VPS egress IP.
2. Clone the repository and configure environment variables in `.env.local` or through systemd environment files.
3. Run `npm install --omit=dev` and `npm run build`.
4. Run the production server via PM2, systemd, or Docker:
   ```bash
   npm run start
   ```
5. Put Next.js behind an Nginx reverse proxy with HTTPS (Let's Encrypt SSL/TLS).
