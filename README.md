# EconInsight

Cloudflare-first research platform with separated frontend and backend concerns.

## Project layout

- `src/` - frontend React app (user site + host upload UI).
- `backend/` - Cloudflare Worker API, R2 upload handling, D1 metadata storage.

## Frontend setup

From repo root:

1. `npm install`
2. Optional env values in `.env`:
   - `VITE_API_BASE_URL` (example: `http://127.0.0.1:8787`)
   - `VITE_HOST_PORTAL_TOKEN` (must match backend `HOST_PORTAL_TOKEN`)
3. `npm run dev`

### Frontend routes

- Public library: `/library` (read-only file feed for users)
- Admin upload portal: `/internal-access-only` (host upload + file management view)

## Backend setup (Cloudflare)

In `backend/`:

1. `npm install`
2. Update `wrangler.toml` values:
   - `bucket_name`
   - `database_name`
   - `database_id`
3. Apply D1 schema:
   - `npm run d1:migrate`
4. Configure Worker secrets:
   - `CF_ACCESS_TEAM_DOMAIN`
   - `CF_ACCESS_AUDIENCE`
   - `UPLOAD_SIGNING_SECRET`
   - (optional) `HOST_PORTAL_TOKEN` (dev fallback)
   - (optional) `R2_PUBLIC_BASE_URL` (only if serving directly from public R2 domain)
5. `npm run dev`

See `backend/README.md` for route details.
