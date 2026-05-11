## Backend (Cloudflare)

This folder contains the Cloudflare-first backend:

- **Runtime:** Cloudflare Workers
- **Object storage:** Cloudflare R2 (`RESEARCH_BUCKET`)
- **Metadata DB:** Cloudflare D1 (`DB`)

### Routes

- `POST /api/admin/uploads/presign` - returns a short-lived upload URL for the admin portal.
- `PUT /api/admin/uploads/object/:key` - consumes signed upload URL and writes to R2.
- `POST /api/files` - saves uploaded file metadata (admin/host only).
- `GET /api/files` - returns recent uploaded files for the public site.
- `GET /api/files/object/:key` - serves a stored file through the Worker from private R2.

### Required secrets/vars

- `CF_ACCESS_TEAM_DOMAIN` - your Access team domain, e.g. `your-team.cloudflareaccess.com`.
- `CF_ACCESS_AUDIENCE` - Access application audience (`aud`) for the host/admin app.
- `UPLOAD_SIGNING_SECRET` - signs temporary upload links.

Optional:

- `HOST_PORTAL_TOKEN` - temporary dev fallback header token (`x-host-token`) when Access is not in front of the Worker.
- `R2_PUBLIC_BASE_URL` - optional when using a public R2 domain directly instead of Worker-served file URLs.

### Quick start

1. Create your R2 bucket and D1 database.
2. Update `wrangler.toml` with your real `database_id`.
3. Apply schema:
   - `wrangler d1 execute econ-insight-d1 --file=./schema/uploaded-files.sql`
4. Set secrets:
   - `wrangler secret put CF_ACCESS_TEAM_DOMAIN`
   - `wrangler secret put CF_ACCESS_AUDIENCE`
   - `wrangler secret put UPLOAD_SIGNING_SECRET`
   - (optional) `wrangler secret put R2_PUBLIC_BASE_URL`
   - (optional) `wrangler secret put HOST_PORTAL_TOKEN`
5. Run locally:
   - `wrangler dev`
