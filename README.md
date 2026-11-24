# Katiso Ntseare — Personal Portfolio

A premium, responsive developer portfolio built with Next.js App Router, TypeScript and Next.js Route Handlers. Project content is managed through an authenticated CRUD dashboard and stored in MongoDB.

## Included

- Responsive portfolio homepage, About, Experience, Projects and Contact pages.
- Refined light-first design system with an engineering-focused hero, image-first project cards and responsive layouts.
- Admin dashboard with project search, status filters, overview counts and a multi-step project editor.
- Full project CRUD: create, view, update, delete, feature, publish and unpublish.
- MongoDB persistence using the official MongoDB Node.js driver.
- MongoDB connection pooling, unique project-slug index and project listing index.
- Four optional, unpublished project drafts for ManorManager, Luminar Learning, Suburban Digs and Affinity Student Living.
- GitHub public profile and repository integration with caching and graceful fallbacks.
- Contact form endpoint using Resend (requires configuration).
- CV download slot (requires your PDF).
- Interactive sample demonstrations for SQL, data structures, API responses and workflows.
- SEO metadata, robots.txt, dynamic sitemap, privacy page, custom 404 and error states.

## Requirements

- Node.js 22.16 or newer.
- npm 10 or newer recommended.
- A MongoDB deployment. MongoDB Atlas is suitable, as is a secured self-hosted MongoDB server.

## 1. Install dependencies

```bash
npm install
```

## 2. Create a MongoDB database

You can use MongoDB Atlas or your own MongoDB server.

### MongoDB Atlas

1. Create a MongoDB Atlas project and database deployment.
2. Create a database user with read/write access to the portfolio database.
3. Add your development machine's IP address to the Atlas Network Access allowlist. For production, allow only the server's required outbound IPs where practical.
4. Select **Connect → Drivers → Node.js** and copy the connection string.
5. Replace the username, password and cluster host placeholders. URL-encode special characters in the database password.

The application uses the database name configured in `MONGODB_DB`, defaulting to `katiso_portfolio`, and the collection named `projects`.

## 3. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

Configure at least these values:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/?retryWrites=true&w=majority
MONGODB_DB=katiso_portfolio
ADMIN_USERNAME=katiso
ADMIN_PASSWORD_HASH=
SESSION_SECRET=replace-with-a-random-secret-at-least-32-characters-long
```

Do not prefix `MONGODB_URI` with `NEXT_PUBLIC_`. The connection string contains credentials and must only be available to server-side code. Never commit `.env.local`.

Generate a strong admin password hash:

```bash
npm run admin:hash -- "Use-a-strong-password-with-at-least-12-characters"
```

Copy the printed `ADMIN_PASSWORD_HASH=...` value into `.env.local`.

Generate a session secret.

Git Bash / Linux:

```bash
openssl rand -hex 32
```

PowerShell:

```powershell
-join ((1..48 | ForEach-Object { '{0:x2}' -f (Get-Random -Maximum 256) }))
```

Put the generated value in `SESSION_SECRET`. It must be at least 32 characters long.

## 4. Check MongoDB and seed draft projects

Check the connection and create the collection indexes:

```bash
npm run db:check
```

Optionally insert four unpublished draft projects:

```bash
npm run db:seed
```

The seed command only inserts records when the `projects` collection is empty. If records already exist, it skips seeding and does not modify them. The sample projects are drafts and are not visible to public visitors until you review and publish them in the admin dashboard.

The scripts load environment variables from `.env.local` using Node's `--env-file` option.

## 5. Run locally

```bash
npm run dev
```

Open <http://localhost:3000>.

Admin login: <http://localhost:3000/admin/login>

The site and admin dashboard need a reachable MongoDB database. If MongoDB is unavailable or `MONGODB_URI` is missing, database-backed pages and project operations cannot load; check the connection string, database user permissions and Atlas IP allowlist.

## 6. Manage projects (CRUD)

From `/admin` you can:

- Search projects and filter by all, published, drafts or featured.
- Review project totals and publishing status.
- Create and edit project overview and case-study content.
- Add technologies as comma-separated values.
- Add a project cover-image URL, live URL, demo URL and repository URL.
- Add an architecture flow by separating up to eight nodes with `->` (example: `Browser -> Next.js -> API -> MongoDB`).
- Feature a project on the homepage.
- Publish a project or return it to draft.
- Delete a project.
- Change display order.

Only published projects appear publicly. Each project has a case-study URL based on its slug, such as `/projects/manormanager`.

## 7. MongoDB collections and indexes

The application stores projects in:

```text
Database:   MONGODB_DB (default: katiso_portfolio)
Collection: projects
```

Project records use MongoDB `ObjectId` values internally. The API exposes the identifier as a string. The application ensures these indexes exist:

- `uq_projects_slug`: unique index on `slug`, preventing duplicate project URLs.
- `ix_projects_public_order`: index supporting published/featured/order queries.

The application does not create a public database endpoint. MongoDB access is only performed by server-side Next.js code and server scripts.

### Backups

For MongoDB Atlas, configure and verify Atlas backups appropriate to your plan and data importance. For self-hosted MongoDB, schedule and test `mongodump` backups. Do not assume that a database is backed up until a restore has been tested.

Example self-hosted backup command:

```bash
mongodump --uri="$MONGODB_URI" --db="$MONGODB_DB" --out="./backups"
```

Keep backup files out of Git and store them securely.

## 8. Configure GitHub integration

The default username is `KatisoNtseare`. Change it with `GITHUB_USERNAME` if needed.

`GITHUB_TOKEN` is optional. It raises the GitHub API rate limit; keep it server-side and never prefix it with `NEXT_PUBLIC_`. Set `NEXT_PUBLIC_LINKEDIN_URL` to your actual LinkedIn URL when ready.

The integration displays public repository data only and does not represent private contribution activity.

## 9. Configure the contact form

Configure a Resend API key and the recipient/sender addresses:

```env
RESEND_API_KEY=re_...
CONTACT_TO_EMAIL=your-inbox@example.com
CONTACT_FROM_EMAIL=Portfolio <contact@your-verified-domain.example>
```

Use a sender domain verified by your email provider in production. Until all three values are configured, the API returns a setup error rather than pretending a message was sent.

The current rate limiter is in-memory and intended as a basic single-instance safeguard. For a public production deployment, add a shared/edge rate limiter and an anti-abuse measure such as CAPTCHA when appropriate.

## 10. Add your CV

Place your final CV here:

```text
public/documents/katiso-ntseare-cv.pdf
```

Then configure:

```env
NEXT_PUBLIC_CV_URL=/documents/katiso-ntseare-cv.pdf
```

The CV button remains unavailable until a real CV path is configured.

## 11. Validate before deployment

```bash
npm run lint
npm run typecheck
npm run build
```

## Deployment notes

The portfolio uses MongoDB as an external data store, so the Next.js application can run on a Node.js VPS or a compatible hosting platform. The MongoDB server must be reachable from the application host.

For an Oracle Cloud VPS:

1. Configure the MongoDB Atlas allowlist for the VPS egress IP, or secure your own MongoDB deployment.
2. Set production environment variables outside the repository.
3. Run `npm install`, `npm run lint`, `npm run typecheck` and `npm run build`.
4. Run `npm run start` behind Nginx or another reverse proxy with HTTPS.
5. Do not expose the MongoDB port publicly. Do not expose the Next.js process port directly to the public internet.
6. Configure monitoring and a tested database backup/restore process.

## Important content checks before publishing

- Confirm your biography, availability and professional contact details.
- Verify each project's actual status (production, demo, prototype or concept).
- Describe your individual contributions accurately, especially for group projects.
- Add only authorised screenshots and public links.
- Do not publish client data, confidential architecture or screenshots without permission.
- Confirm the CV is current before enabling the download link.
- Replace the seed-project placeholder text with verified case-study content before publishing.

## Technical decisions

- Next.js App Router handles the website and server-side Route Handlers.
- The official MongoDB Node.js driver handles project persistence.
- No separate ASP.NET API or additional database service is introduced.
- The initial database model is intentionally small: a `projects` collection.
- No public registration is provided. Admin credentials are configured through environment variables.
- Admin sessions use an HttpOnly, SameSite=Strict cookie signed with `SESSION_SECRET`.
- Admin passwords are stored as scrypt hashes, not plaintext.

## Project layout

```text
src/
  app/                 Pages and API Route Handlers
  components/          Portfolio UI and admin components
  lib/                 MongoDB connection, authentication and validation
  types/               Shared TypeScript models
scripts/               MongoDB check/seed and admin password utilities
data/                  Optional unpublished project seed data
public/                Static assets and CV folder
```
