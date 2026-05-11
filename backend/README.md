## Backend (Cloudflare)

This folder contains the Cloudflare-first backend:

- **Runtime:** Cloudflare Workers
- **Object storage:** Cloudflare R2 (`RESEARCH_BUCKET`)
- **Metadata DB:** Cloudflare D1 (`DB`)
- **View tracking cache:** Cloudflare KV (`VIEWS_KV`)

### Routes

- `POST /api/admin/uploads/presign` - returns a short-lived upload URL for the admin portal.
- `PUT /api/admin/uploads/object/:key` - consumes signed upload URL and writes to R2.
- `POST /api/files` - saves uploaded file metadata (admin/host only).
- `GET /api/files` - returns recent uploaded files for the public site.
- `GET /api/files/object/:key` - serves a stored file through the Worker from private R2.
- `POST /api/views` - records a view event for a post or file (increments KV counter).
- `POST /api/admin/posts` - creates a post (admin/host only).
- `GET /api/admin/posts` - retrieves all posts with stats (admin/host only).
- `GET /api/posts` - returns published posts, optionally filtered by type (`?type=blog` or `?type=article`).

### View Tracking System

Views are tracked using a hybrid KV + D1 approach:

1. **KV stores real-time counters** — every view increments a counter in KV (fast, edge-replicated).
2. **Cron syncs to D1** — every 5 minutes, counters are written to D1 for persistent reporting.
3. **GET endpoints return `viewCount`** — includes the synced value from D1.

**Frontend:** Call `recordView(resourceType, resourceId)` when users view a post or download a file.

**Backend:** See `recordView()` and `syncViewsToDatabase()` in `src/index.js`.

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
