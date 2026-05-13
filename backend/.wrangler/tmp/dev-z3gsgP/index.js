var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var ALLOWED_MIME_TYPES = /* @__PURE__ */ new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
]);
var MAX_UPLOAD_SIZE_BYTES = 20 * 1024 * 1024;
var accessKeyCache = /* @__PURE__ */ new Map();
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-host-token, cf-access-jwt-assertion",
  "Access-Control-Max-Age": "86400"
};
function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS
    }
  });
}
__name(jsonResponse, "jsonResponse");
function normalizeUrl(rawUrl) {
  try {
    return new URL(rawUrl);
  } catch {
    return null;
  }
}
__name(normalizeUrl, "normalizeUrl");
function sanitizeFileName(filename) {
  return String(filename || "file").trim().replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}
__name(sanitizeFileName, "sanitizeFileName");
function inferContentType(filename, explicitContentType) {
  if (explicitContentType) {
    return explicitContentType;
  }
  const lowerName = String(filename || "").toLowerCase();
  if (lowerName.endsWith(".pdf")) return "application/pdf";
  if (lowerName.endsWith(".png")) return "image/png";
  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) return "image/jpeg";
  if (lowerName.endsWith(".doc")) return "application/msword";
  if (lowerName.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  return "";
}
__name(inferContentType, "inferContentType");
function decodeBase64Url(input) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  return atob(padded);
}
__name(decodeBase64Url, "decodeBase64Url");
function parseJwt(token) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("JWT must have three parts.");
  }
  const header = JSON.parse(decodeBase64Url(parts[0]));
  const payload = JSON.parse(decodeBase64Url(parts[1]));
  const signatureBytes = Uint8Array.from(decodeBase64Url(parts[2]), (char) => char.charCodeAt(0));
  const signedContent = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  return { header, payload, signatureBytes, signedContent };
}
__name(parseJwt, "parseJwt");
async function importSpkiKey(spkiPem) {
  const body = spkiPem.replace("-----BEGIN PUBLIC KEY-----", "").replace("-----END PUBLIC KEY-----", "").replace(/\s+/g, "");
  const binary = Uint8Array.from(atob(body), (char) => char.charCodeAt(0));
  return crypto.subtle.importKey(
    "spki",
    binary.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
}
__name(importSpkiKey, "importSpkiKey");
async function getAccessPublicKey(env, kid) {
  if (!env.CF_ACCESS_TEAM_DOMAIN) {
    return null;
  }
  const cached = accessKeyCache.get(kid);
  if (cached) {
    return cached;
  }
  const certsUrl = `https://${env.CF_ACCESS_TEAM_DOMAIN}/cdn-cgi/access/certs`;
  const certsResponse = await fetch(certsUrl);
  if (!certsResponse.ok) {
    throw new Error("Failed to fetch Cloudflare Access certificates.");
  }
  const certs = await certsResponse.json();
  const keyEntry = certs?.keys?.find((item) => item.kid === kid && item.cert);
  if (!keyEntry) {
    throw new Error("No matching Access certificate key found.");
  }
  const cryptoKey = await importSpkiKey(keyEntry.cert);
  accessKeyCache.set(kid, cryptoKey);
  return cryptoKey;
}
__name(getAccessPublicKey, "getAccessPublicKey");
function isExpectedAudience(claimAud, expectedAud) {
  if (!expectedAud) {
    return true;
  }
  if (Array.isArray(claimAud)) {
    return claimAud.includes(expectedAud);
  }
  return claimAud === expectedAud;
}
__name(isExpectedAudience, "isExpectedAudience");
async function isHostRequest(request, env) {
  const fallbackToken = env.HOST_PORTAL_TOKEN;
  if (fallbackToken && request.headers.get("x-host-token") === fallbackToken) {
    return true;
  }
  const jwtAssertion = request.headers.get("cf-access-jwt-assertion");
  if (!jwtAssertion || !env.CF_ACCESS_TEAM_DOMAIN || !env.CF_ACCESS_AUDIENCE) {
    return false;
  }
  try {
    const { header, payload, signatureBytes, signedContent } = parseJwt(jwtAssertion);
    const key = await getAccessPublicKey(env, header.kid);
    if (!key) {
      return false;
    }
    const isValidSignature = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      signatureBytes,
      signedContent
    );
    if (!isValidSignature) {
      return false;
    }
    const nowInSeconds = Math.floor(Date.now() / 1e3);
    if (payload.exp && nowInSeconds >= payload.exp) {
      return false;
    }
    if (!isExpectedAudience(payload.aud, env.CF_ACCESS_AUDIENCE)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
__name(isHostRequest, "isHostRequest");
async function digestHmac(secret, payload) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(digestHmac, "digestHmac");
async function signUploadToken(secret, key, contentType, expiresAt) {
  const payload = `${key}:${contentType}:${expiresAt}`;
  return digestHmac(secret, payload);
}
__name(signUploadToken, "signUploadToken");
function toPublicFileUrl(requestUrl, env, key) {
  if (env.R2_PUBLIC_BASE_URL) {
    return `${env.R2_PUBLIC_BASE_URL.replace(/\/$/, "")}/${key}`;
  }
  return `${requestUrl.origin}/api/files/object/${encodeURIComponent(key)}`;
}
__name(toPublicFileUrl, "toPublicFileUrl");
function normalizePostType(postType) {
  return postType === "article" || postType === "blog" ? postType : null;
}
__name(normalizePostType, "normalizePostType");
function normalizePostStatus(status) {
  return status === "published" ? "published" : "draft";
}
__name(normalizePostStatus, "normalizePostStatus");
function normalizeArticleLayout(layout) {
  if (!layout || layout === "default") {
    return "single-column";
  }
  return ["single-column", "two-columns", "paginated", "carousel"].includes(layout) ? layout : "single-column";
}
__name(normalizeArticleLayout, "normalizeArticleLayout");
function parseJsonArray(value) {
  if (!value) {
    return [];
  }
  if (Array.isArray(value)) {
    return value.filter(Boolean).map(String);
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean).map(String) : [];
  } catch {
    return [];
  }
}
__name(parseJsonArray, "parseJsonArray");
function mapPostRow(row) {
  if (!row) {
    return row;
  }
  return {
    ...row,
    articleImageUrls: parseJsonArray(row.articleImageUrls)
  };
}
__name(mapPostRow, "mapPostRow");
async function recordView(env, resourceType, resourceId) {
  const table = resourceType === "post" ? "posts" : "uploaded_files";
  if (!env.VIEWS_KV) {
    await env.DB.prepare(`UPDATE ${table} SET view_count = COALESCE(view_count, 0) + 1 WHERE id = ?`).bind(resourceId).run();
    return;
  }
  const key = `view:${resourceType}:${resourceId}`;
  const current = await env.VIEWS_KV.get(key);
  const count = current ? parseInt(current, 10) + 1 : 1;
  await env.VIEWS_KV.put(key, String(count));
  await env.DB.prepare(`UPDATE ${table} SET view_count = ? WHERE id = ?`).bind(count, resourceId).run();
}
__name(recordView, "recordView");
async function syncViewsToDatabase(env) {
  if (!env.VIEWS_KV) {
    return;
  }
  const keys = await env.VIEWS_KV.list();
  const updates = [];
  for (const { name } of keys.keys) {
    const viewCount = await env.VIEWS_KV.get(name);
    const [, resourceType, resourceId] = name.split(":");
    if (!resourceType || !resourceId || !viewCount) {
      continue;
    }
    updates.push({ key: name, resourceType, resourceId, count: parseInt(viewCount, 10) });
  }
  if (updates.length === 0) {
    return;
  }
  for (const update of updates) {
    const table = update.resourceType === "post" ? "posts" : "uploaded_files";
    const idColumn = update.resourceType === "post" ? "id" : "id";
    const whereColumn = update.resourceType === "post" ? "id" : "id";
    await env.DB.prepare(
      `UPDATE ${table}
       SET view_count = ?
       WHERE ${whereColumn} = ?`
    ).bind(update.count, parseInt(update.resourceId, 10)).run();
  }
}
__name(syncViewsToDatabase, "syncViewsToDatabase");
var src_default = {
  async fetch(request, env) {
    const url = normalizeUrl(request.url);
    if (!url) {
      return jsonResponse({ message: "Invalid request URL." }, 400);
    }
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }
    if (request.method === "POST" && url.pathname === "/api/admin/uploads/presign") {
      if (!await isHostRequest(request, env)) {
        return jsonResponse({ message: "Forbidden" }, 403);
      }
      let body;
      try {
        body = await request.json();
      } catch {
        return jsonResponse({ message: "Invalid JSON body." }, 400);
      }
      const { filename, contentType, size, uploaderId } = body || {};
      const resolvedContentType = inferContentType(filename, contentType);
      if (!filename || !resolvedContentType || !Number.isFinite(size)) {
        return jsonResponse({ message: "filename, contentType, and size are required." }, 400);
      }
      if (!ALLOWED_MIME_TYPES.has(resolvedContentType)) {
        return jsonResponse({ message: "Only PDF, DOC, DOCX, PNG, and JPG files are allowed." }, 400);
      }
      if (size > MAX_UPLOAD_SIZE_BYTES) {
        return jsonResponse({ message: "Files must be 20MB or smaller." }, 400);
      }
      if (!env.UPLOAD_SIGNING_SECRET) {
        return jsonResponse({ message: "UPLOAD_SIGNING_SECRET is missing." }, 500);
      }
      const safeName = sanitizeFileName(filename);
      const key = `research-files/${uploaderId || "anonymous"}/${Date.now()}-${safeName}`;
      const expiresAt = Date.now() + 5 * 60 * 1e3;
      const token = await signUploadToken(env.UPLOAD_SIGNING_SECRET, key, resolvedContentType, expiresAt);
      return jsonResponse({
        uploadUrl: `/api/admin/uploads/object/${encodeURIComponent(key)}?expiresAt=${expiresAt}&token=${token}&contentType=${encodeURIComponent(resolvedContentType)}`,
        publicUrl: toPublicFileUrl(url, env, key),
        storageKey: key,
        expiresIn: 300
      });
    }
    if (request.method === "PUT" && url.pathname.startsWith("/api/admin/uploads/object/")) {
      const key = decodeURIComponent(url.pathname.replace("/api/admin/uploads/object/", ""));
      const expiresAt = Number(url.searchParams.get("expiresAt") || 0);
      const token = url.searchParams.get("token") || "";
      const contentType = url.searchParams.get("contentType") || "";
      const expectedToken = await signUploadToken(env.UPLOAD_SIGNING_SECRET || "", key, contentType, expiresAt);
      if (!expiresAt || Date.now() > expiresAt || !token || token !== expectedToken) {
        return jsonResponse({ message: "Upload link expired or invalid." }, 403);
      }
      if (!ALLOWED_MIME_TYPES.has(contentType)) {
        return jsonResponse({ message: "Invalid content type." }, 400);
      }
      await env.RESEARCH_BUCKET.put(key, request.body, {
        httpMetadata: {
          contentType
        }
      });
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS
      });
    }
    if (request.method === "POST" && url.pathname === "/api/files") {
      if (!await isHostRequest(request, env)) {
        return jsonResponse({ message: "Forbidden" }, 403);
      }
      let payload;
      try {
        payload = await request.json();
      } catch {
        return jsonResponse({ message: "Invalid JSON body." }, 400);
      }
      const {
        url: fileUrl,
        filename,
        uploaderId = "anonymous",
        storageKey,
        contentType = null,
        fileSize = null,
        uploadedAt = (/* @__PURE__ */ new Date()).toISOString()
      } = payload || {};
      if (!fileUrl || !filename || !storageKey) {
        return jsonResponse({ message: "url, filename, and storageKey are required." }, 400);
      }
      const result = await env.DB.prepare(
        `INSERT INTO uploaded_files (url, filename, uploader_id, storage_key, content_type, file_size, uploaded_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         RETURNING id, url, filename, uploader_id AS uploaderId, storage_key AS storageKey, content_type AS contentType, file_size AS fileSize, uploaded_at AS uploadedAt`
      ).bind(fileUrl, filename, uploaderId, storageKey, contentType, fileSize, uploadedAt).first();
      return jsonResponse({ file: result }, 201);
    }
    if (request.method === "GET" && url.pathname.startsWith("/api/files/object/")) {
      const key = decodeURIComponent(url.pathname.replace("/api/files/object/", ""));
      if (!key) {
        return jsonResponse({ message: "Missing object key." }, 400);
      }
      const storageKeyMatch = await env.DB.prepare(
        "SELECT id FROM uploaded_files WHERE storage_key = ?"
      ).bind(key).first();
      if (storageKeyMatch) {
        await recordView(env, "file", String(storageKeyMatch.id));
      }
      const object = await env.RESEARCH_BUCKET.get(key);
      if (!object) {
        return jsonResponse({ message: "File not found." }, 404);
      }
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("cache-control", "public, max-age=300");
      headers.set("x-content-type-options", "nosniff");
      headers.set("Access-Control-Allow-Origin", CORS_HEADERS["Access-Control-Allow-Origin"]);
      headers.set("Access-Control-Allow-Methods", CORS_HEADERS["Access-Control-Allow-Methods"]);
      headers.set("Access-Control-Allow-Headers", CORS_HEADERS["Access-Control-Allow-Headers"]);
      headers.set("Access-Control-Max-Age", CORS_HEADERS["Access-Control-Max-Age"]);
      return new Response(object.body, {
        status: 200,
        headers
      });
    }
    if (request.method === "POST" && url.pathname === "/api/views") {
      let payload;
      try {
        payload = await request.json();
      } catch {
        return jsonResponse({ message: "Invalid JSON body." }, 400);
      }
      const { resourceType, resourceId } = payload || {};
      if (!resourceType || !resourceId) {
        return jsonResponse({ message: "resourceType and resourceId are required." }, 400);
      }
      if (!["post", "file"].includes(resourceType)) {
        return jsonResponse({ message: "resourceType must be post or file." }, 400);
      }
      await recordView(env, resourceType, resourceId);
      return jsonResponse({ message: "View recorded." });
    }
    if (request.method === "GET" && url.pathname === "/api/files") {
      const rows = await env.DB.prepare(
        `SELECT
            id,
            url,
            filename,
            uploader_id AS uploaderId,
            storage_key AS storageKey,
            content_type AS contentType,
            file_size AS fileSize,
            view_count AS viewCount,
            uploaded_at AS uploadedAt
         FROM uploaded_files
         ORDER BY uploaded_at DESC
         LIMIT 50`
      ).all();
      return jsonResponse({ files: rows.results || [] });
    }
    if (request.method === "GET" && url.pathname === "/api/admin/posts") {
      if (!await isHostRequest(request, env)) {
        return jsonResponse({ message: "Forbidden" }, 403);
      }
      const postRows = await env.DB.prepare(
        `SELECT
            id,
            post_type AS postType,
            title,
            excerpt,
            content,
            status,
            article_file_url AS articleFileUrl,
            article_storage_key AS articleStorageKey,
            cover_image_url AS coverImageUrl,
            author_id AS authorId,
            view_count AS viewCount,
            created_at AS createdAt,
            updated_at AS updatedAt
         FROM posts
         ORDER BY created_at DESC
         LIMIT 100`
      ).all();
      const statsRows = await env.DB.prepare(
        `SELECT post_type AS postType, status, COUNT(*) AS total
         FROM posts
         GROUP BY post_type, status`
      ).all();
      const stats = {
        totalPosts: 0,
        blogPosts: 0,
        articlePosts: 0,
        drafts: 0
      };
      for (const row of statsRows.results || []) {
        const count = Number(row.total || 0);
        stats.totalPosts += count;
        if (row.postType === "blog") {
          stats.blogPosts += count;
        }
        if (row.postType === "article") {
          stats.articlePosts += count;
        }
        if (row.status === "draft") {
          stats.drafts += count;
        }
      }
      return jsonResponse({
        posts: (postRows.results || []).map(mapPostRow),
        stats
      });
    }
    if (request.method === "POST" && url.pathname === "/api/admin/posts") {
      if (!await isHostRequest(request, env)) {
        return jsonResponse({ message: "Forbidden" }, 403);
      }
      let payload;
      try {
        payload = await request.json();
      } catch {
        return jsonResponse({ message: "Invalid JSON body." }, 400);
      }
      const postType = normalizePostType(payload?.postType);
      const title = String(payload?.title || "").trim();
      const excerpt = String(payload?.excerpt || "").trim();
      const content = String(payload?.content || "").trim();
      const status = normalizePostStatus(payload?.status);
      const articleFileUrl = payload?.articleFileUrl ? String(payload.articleFileUrl) : null;
      const articleStorageKey = payload?.articleStorageKey ? String(payload.articleStorageKey) : null;
      const coverImageUrl = payload?.coverImageUrl ? String(payload.coverImageUrl) : null;
      const articleLayout = normalizeArticleLayout(payload?.articleLayout);
      const articleImageUrls = parseJsonArray(payload?.articleImageUrls);
      const authorId = payload?.authorId ? String(payload.authorId) : "host";
      if (!postType) {
        return jsonResponse({ message: "postType must be article or blog." }, 400);
      }
      if (!title) {
        return jsonResponse({ message: "title is required." }, 400);
      }
      const result = await env.DB.prepare(
        `INSERT INTO posts (
            post_type,
            title,
            excerpt,
            content,
            status,
            article_file_url,
            article_storage_key,
            cover_image_url,
            article_layout,
            article_image_urls,
            author_id,
            created_at,
            updated_at
         )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING
            id,
            post_type AS postType,
            title,
            excerpt,
            content,
            status,
            article_file_url AS articleFileUrl,
            article_storage_key AS articleStorageKey,
            cover_image_url AS coverImageUrl,
              article_layout AS articleLayout,
              article_image_urls AS articleImageUrls,
            author_id AS authorId,
            created_at AS createdAt,
            updated_at AS updatedAt`
      ).bind(
        postType,
        title,
        excerpt || null,
        content || null,
        status,
        articleFileUrl,
        articleStorageKey,
        coverImageUrl,
        articleLayout,
        JSON.stringify(articleImageUrls),
        authorId,
        (/* @__PURE__ */ new Date()).toISOString(),
        (/* @__PURE__ */ new Date()).toISOString()
      ).first();
      return jsonResponse({ post: mapPostRow(result) }, 201);
    }
    if (request.method === "GET" && url.pathname === "/api/posts") {
      const typeFilter = normalizePostType(url.searchParams.get("type"));
      const query = typeFilter ? `SELECT
            id,
            post_type AS postType,
            title,
            excerpt,
            content,
            status,
            article_file_url AS articleFileUrl,
            article_storage_key AS articleStorageKey,
            cover_image_url AS coverImageUrl,
            article_layout AS articleLayout,
            article_image_urls AS articleImageUrls,
            author_id AS authorId,
            view_count AS viewCount,
            created_at AS createdAt,
            updated_at AS updatedAt
           FROM posts
           WHERE status = 'published' AND post_type = ?
           ORDER BY created_at DESC
           LIMIT 100` : `SELECT
            id,
            post_type AS postType,
            title,
            excerpt,
            content,
            status,
            article_file_url AS articleFileUrl,
            article_storage_key AS articleStorageKey,
            cover_image_url AS coverImageUrl,
            article_layout AS articleLayout,
            article_image_urls AS articleImageUrls,
            author_id AS authorId,
            view_count AS viewCount,
            created_at AS createdAt,
            updated_at AS updatedAt
           FROM posts
           WHERE status = 'published'
           ORDER BY created_at DESC
           LIMIT 100`;
      const rows = typeFilter ? await env.DB.prepare(query).bind(typeFilter).all() : await env.DB.prepare(query).all();
      return jsonResponse({ posts: (rows.results || []).map(mapPostRow) });
    }
    return jsonResponse({ message: "Not found" }, 404);
  },
  async scheduled(event, env) {
    await syncViewsToDatabase(env);
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-6imMid/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-6imMid/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
