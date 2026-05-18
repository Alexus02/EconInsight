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
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-host-token, x-admin-session-token, cf-access-jwt-assertion",
  "Access-Control-Max-Age": "86400"
};
var ADMIN_SESSION_DAYS = 30;
var LEGACY_DEFAULT_ADMIN_EMAIL = "admin@gmail.com";
var DEFAULT_ADMIN_EMAIL = "hello@econinsight.com";
var DEFAULT_ADMIN_SECRET = "alex@1234";
var adminAuthBootstrapPromise = null;
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
  const sessionToken = request.headers.get("x-admin-session-token");
  if (sessionToken && await getAdminUserBySessionToken(env, sessionToken)) {
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
function randomHex(bytes = 16) {
  const array = new Uint8Array(bytes);
  crypto.getRandomValues(array);
  return [...array].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
__name(randomHex, "randomHex");
async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
__name(sha256Hex, "sha256Hex");
async function hashAdminSecret(secretKey, salt) {
  return sha256Hex(`${salt}:${String(secretKey || "")}`);
}
__name(hashAdminSecret, "hashAdminSecret");
async function ensureAdminAuthSchema(env) {
  if (!adminAuthBootstrapPromise) {
    adminAuthBootstrapPromise = (async () => {
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS admin_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          secret_salt TEXT NOT NULL,
          secret_hash TEXT NOT NULL,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `).run();
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS admin_sessions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          admin_user_id INTEGER NOT NULL,
          session_token TEXT NOT NULL UNIQUE,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          last_used_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          expires_at TEXT NOT NULL,
          FOREIGN KEY(admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE
        )
      `).run();
      const defaultAdmin = await env.DB.prepare(`SELECT id FROM admin_users WHERE email = ?`).bind(DEFAULT_ADMIN_EMAIL).first();
      const legacyAdmin = await env.DB.prepare(`SELECT id FROM admin_users WHERE email = ?`).bind(LEGACY_DEFAULT_ADMIN_EMAIL).first();
      if (!defaultAdmin && legacyAdmin) {
        await env.DB.prepare(
          `UPDATE admin_users
           SET email = ?, updated_at = ?
           WHERE id = ?`
        ).bind(DEFAULT_ADMIN_EMAIL, (/* @__PURE__ */ new Date()).toISOString(), legacyAdmin.id).run();
      } else if (!defaultAdmin) {
        const salt = randomHex(16);
        const hash = await hashAdminSecret(DEFAULT_ADMIN_SECRET, salt);
        const now = (/* @__PURE__ */ new Date()).toISOString();
        await env.DB.prepare(
          `INSERT INTO admin_users (email, secret_salt, secret_hash, is_active, created_at, updated_at)
           VALUES (?, ?, ?, 1, ?, ?)`
        ).bind(DEFAULT_ADMIN_EMAIL, salt, hash, now, now).run();
      }
    })().catch((error) => {
      adminAuthBootstrapPromise = null;
      throw error;
    });
  }
  return adminAuthBootstrapPromise;
}
__name(ensureAdminAuthSchema, "ensureAdminAuthSchema");
async function ensureAdminMessagesSchema(env) {
  await ensureAdminAuthSchema(env);
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS admin_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_type TEXT NOT NULL CHECK (message_type IN ('contact', 'booking')),
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      subject TEXT,
      requested_at TEXT,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
      email_delivery_status TEXT,
      email_delivery_error TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await env.DB.prepare(`
    CREATE INDEX IF NOT EXISTS idx_admin_messages_type_created ON admin_messages(message_type, created_at DESC)
  `).run();
  await env.DB.prepare(`
    CREATE INDEX IF NOT EXISTS idx_admin_messages_status_created ON admin_messages(status, created_at DESC)
  `).run();
}
__name(ensureAdminMessagesSchema, "ensureAdminMessagesSchema");
async function ensureBookingSchema(env) {
  await ensureAdminMessagesSchema(env);
  await env.DB.prepare(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      requested_at TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'responded', 'declined')),
      admin_response_subject TEXT,
      admin_response_message TEXT,
      responded_by_admin_email TEXT,
      responded_at TEXT,
      email_delivery_status TEXT,
      email_delivery_error TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
  await env.DB.prepare(`
    CREATE INDEX IF NOT EXISTS idx_bookings_status_created ON bookings(status, created_at DESC)
  `).run();
  await env.DB.prepare(`
    CREATE INDEX IF NOT EXISTS idx_bookings_requested_at ON bookings(requested_at DESC)
  `).run();
}
__name(ensureBookingSchema, "ensureBookingSchema");
async function getAdminUserBySessionToken(env, sessionToken) {
  if (!sessionToken) {
    return null;
  }
  await ensureAdminAuthSchema(env);
  const row = await env.DB.prepare(
    `SELECT
        s.session_token AS sessionToken,
        s.expires_at AS expiresAt,
        u.id,
        u.email,
        u.is_active AS isActive,
        u.created_at AS createdAt,
        u.updated_at AS updatedAt
     FROM admin_sessions s
     JOIN admin_users u ON u.id = s.admin_user_id
     WHERE s.session_token = ?`
  ).bind(sessionToken).first();
  if (!row || !row.isActive) {
    return null;
  }
  if (row.expiresAt && new Date(row.expiresAt).getTime() <= Date.now()) {
    await env.DB.prepare(`DELETE FROM admin_sessions WHERE session_token = ?`).bind(sessionToken).run();
    return null;
  }
  await env.DB.prepare(`UPDATE admin_sessions SET last_used_at = ? WHERE session_token = ?`).bind((/* @__PURE__ */ new Date()).toISOString(), sessionToken).run();
  return {
    id: row.id,
    email: row.email,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}
__name(getAdminUserBySessionToken, "getAdminUserBySessionToken");
async function createAdminSession(env, adminUserId) {
  await ensureAdminAuthSchema(env);
  const sessionToken = randomHex(32);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_DAYS * 24 * 60 * 60 * 1e3).toISOString();
  await env.DB.prepare(
    `INSERT INTO admin_sessions (admin_user_id, session_token, created_at, last_used_at, expires_at)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(adminUserId, sessionToken, now, now, expiresAt).run();
  return { sessionToken, expiresAt };
}
__name(createAdminSession, "createAdminSession");
async function upsertAdminUser(env, email, secretKey) {
  await ensureAdminAuthSchema(env);
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail || !secretKey) {
    throw new Error("email and secretKey are required.");
  }
  const salt = randomHex(16);
  const hash = await hashAdminSecret(secretKey, salt);
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const existing = await env.DB.prepare(`SELECT id FROM admin_users WHERE email = ?`).bind(normalizedEmail).first();
  if (existing) {
    await env.DB.prepare(
      `UPDATE admin_users
       SET secret_salt = ?, secret_hash = ?, is_active = 1, updated_at = ?
       WHERE email = ?`
    ).bind(salt, hash, now, normalizedEmail).run();
    await env.DB.prepare(`DELETE FROM admin_sessions WHERE admin_user_id = ?`).bind(existing.id).run();
    return { id: existing.id, email: normalizedEmail, updatedAt: now };
  }
  return env.DB.prepare(
    `INSERT INTO admin_users (email, secret_salt, secret_hash, is_active, created_at, updated_at)
     VALUES (?, ?, ?, 1, ?, ?)
     RETURNING id, email, created_at AS createdAt, updated_at AS updatedAt`
  ).bind(normalizedEmail, salt, hash, now, now).first();
}
__name(upsertAdminUser, "upsertAdminUser");
async function authenticateAdminCredentials(env, email, secretKey) {
  await ensureAdminAuthSchema(env);
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const row = await env.DB.prepare(
    `SELECT id, email, secret_salt AS secretSalt, secret_hash AS secretHash, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt
     FROM admin_users
     WHERE email = ?`
  ).bind(normalizedEmail).first();
  if (!row || !row.isActive) {
    return null;
  }
  const computedHash = await hashAdminSecret(secretKey, row.secretSalt);
  if (computedHash !== row.secretHash) {
    return null;
  }
  return { id: row.id, email: row.email, createdAt: row.createdAt, updatedAt: row.updatedAt };
}
__name(authenticateAdminCredentials, "authenticateAdminCredentials");
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
function isImageObjectKey(key) {
  return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(String(key || ""));
}
__name(isImageObjectKey, "isImageObjectKey");
function createMissingImageResponse(key, requestMethod) {
  const label = escapeHtml(String(key || "Image unavailable"));
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="960" height="1280" viewBox="0 0 960 1280" role="img" aria-label="Image unavailable">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#f5f1ea" />
      <stop offset="100%" stop-color="#e7ded2" />
    </linearGradient>
  </defs>
  <rect width="960" height="1280" rx="36" fill="url(#bg)" />
  <rect x="80" y="110" width="800" height="960" rx="28" fill="#ffffff" opacity="0.8" />
  <rect x="150" y="190" width="660" height="520" rx="22" fill="#d7d0c7" />
  <path d="M270 620 L410 480 L520 580 L640 430 L790 620 Z" fill="#b8b0a6" />
  <circle cx="365" cy="360" r="58" fill="#ffffff" opacity="0.72" />
  <text x="480" y="1110" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="42" fill="#6a6258">Image unavailable</text>
  <text x="480" y="1168" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="24" fill="#8a8073">${label}</text>
</svg>`;
  const headers = {
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "no-store",
    ...CORS_HEADERS
  };
  return requestMethod === "HEAD" ? new Response(null, { status: 200, headers }) : new Response(svg, { status: 200, headers });
}
__name(createMissingImageResponse, "createMissingImageResponse");
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
function normalizeBookingStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();
  return ["pending", "accepted", "responded", "declined"].includes(normalized) ? normalized : "pending";
}
__name(normalizeBookingStatus, "normalizeBookingStatus");
function mapBookingRow(row) {
  if (!row) {
    return row;
  }
  return {
    ...row,
    company: row.company || "",
    adminResponseSubject: row.adminResponseSubject || "",
    adminResponseMessage: row.adminResponseMessage || "",
    respondedByAdminEmail: row.respondedByAdminEmail || "",
    emailDeliveryStatus: row.emailDeliveryStatus || "",
    emailDeliveryError: row.emailDeliveryError || ""
  };
}
__name(mapBookingRow, "mapBookingRow");
function mapAdminMessageRow(row) {
  if (!row) {
    return row;
  }
  return {
    ...row,
    company: row.company || "",
    subject: row.subject || "",
    requestedAt: row.requestedAt || "",
    status: row.status || "new",
    emailDeliveryStatus: row.emailDeliveryStatus || "",
    emailDeliveryError: row.emailDeliveryError || ""
  };
}
__name(mapAdminMessageRow, "mapAdminMessageRow");
function escapeHtml(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
__name(escapeHtml, "escapeHtml");
async function sendBookingResponseEmail(env, booking, adminUser, subject, message) {
  const apiKey = String(env.RESEND_API_KEY || "").trim();
  if (!apiKey) {
    return {
      sent: false,
      status: "not_configured",
      error: ""
    };
  }
  const fromAddress = String(env.BOOKING_FROM_EMAIL || "EconInsight <no-reply@econinsight.com>").trim();
  const replyTo = adminUser?.email || fromAddress;
  const emailSubject = subject || "Your EconInsight consultation booking";
  const adminSignature = adminUser?.email ? `

Reply-to: ${adminUser.email}` : "";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [booking.email],
      reply_to: replyTo,
      subject: emailSubject,
      text: `Hello ${booking.fullName || "there"},

${message}${adminSignature}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
          <h2 style="margin: 0 0 16px;">${escapeHtml(emailSubject)}</h2>
          <p>Hello ${escapeHtml(booking.fullName || "there")},</p>
          <p>${escapeHtml(message).replace(/\n/g, "<br />")}</p>
          <p style="margin-top: 24px; color: #555;">Reply to this email if you need anything else.</p>
          ${adminUser?.email ? `<p style="margin-top: 12px; color: #555; font-size: 14px;">Responded by ${escapeHtml(adminUser.email)}</p>` : ""}
        </div>
      `
    })
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    return {
      sent: false,
      status: "failed",
      error: errorText || `Failed to send booking response email (${response.status})`
    };
  }
  return {
    sent: true,
    status: "sent",
    error: ""
  };
}
__name(sendBookingResponseEmail, "sendBookingResponseEmail");
async function getActiveAdminEmails(env) {
  await ensureAdminAuthSchema(env);
  const rows = await env.DB.prepare(
    `SELECT email
     FROM admin_users
     WHERE is_active = 1
     ORDER BY created_at ASC`
  ).all();
  const emails = (rows.results || []).map((row) => String(row.email || "").trim()).filter(Boolean);
  return emails.length > 0 ? emails : [DEFAULT_ADMIN_EMAIL];
}
__name(getActiveAdminEmails, "getActiveAdminEmails");
async function sendAdminNotificationEmail(env, recipients, subject, payload) {
  const apiKey = String(env.RESEND_API_KEY || "").trim();
  if (!apiKey) {
    return {
      sent: false,
      status: "not_configured",
      error: ""
    };
  }
  const recipientList = (Array.isArray(recipients) ? recipients : [recipients]).map((email) => String(email || "").trim()).filter(Boolean);
  if (recipientList.length === 0) {
    return {
      sent: false,
      status: "no_recipients",
      error: ""
    };
  }
  const fromAddress = String(env.NOTIFICATION_FROM_EMAIL || env.BOOKING_FROM_EMAIL || "EconInsight <no-reply@econinsight.com>").trim();
  const senderEmail = String(payload?.senderEmail || "").trim();
  const senderName = String(payload?.senderName || "").trim() || "Unknown sender";
  const emailBody = String(payload?.message || "").trim();
  const metaLines = [];
  if (payload?.messageType) {
    metaLines.push(`Type: ${payload.messageType}`);
  }
  if (senderEmail) {
    metaLines.push(`Sender: ${senderName} <${senderEmail}>`);
  } else {
    metaLines.push(`Sender: ${senderName}`);
  }
  if (payload?.company) {
    metaLines.push(`Company: ${payload.company}`);
  }
  if (payload?.requestedAt) {
    metaLines.push(`Requested time: ${payload.requestedAt}`);
  }
  if (payload?.details) {
    metaLines.push(...payload.details.map((item) => String(item)));
  }
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from: fromAddress,
      to: recipientList,
      reply_to: senderEmail || fromAddress,
      subject,
      text: [
        subject,
        "",
        ...metaLines,
        "",
        emailBody
      ].join("\n"),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
          <h2 style="margin: 0 0 16px;">${escapeHtml(subject)}</h2>
          <p style="margin: 0 0 8px;"><strong>${escapeHtml(senderName)}</strong>${senderEmail ? ` &lt;${escapeHtml(senderEmail)}&gt;` : ""}</p>
          ${payload?.messageType ? `<p style="margin: 0 0 8px; color: #555;">Type: ${escapeHtml(payload.messageType)}</p>` : ""}
          ${payload?.company ? `<p style="margin: 0 0 8px; color: #555;">Company: ${escapeHtml(payload.company)}</p>` : ""}
          ${payload?.requestedAt ? `<p style="margin: 0 0 8px; color: #555;">Requested time: ${escapeHtml(payload.requestedAt)}</p>` : ""}
          <div style="margin: 20px 0 0; padding: 16px; background: #f8f8f8; border-radius: 10px; white-space: pre-line;">${escapeHtml(emailBody)}</div>
        </div>
      `
    })
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    return {
      sent: false,
      status: "failed",
      error: errorText || `Failed to send admin notification email (${response.status})`
    };
  }
  return {
    sent: true,
    status: "sent",
    error: ""
  };
}
__name(sendAdminNotificationEmail, "sendAdminNotificationEmail");
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
    if (request.method === "POST" && url.pathname === "/api/admin/auth/login") {
      await ensureAdminAuthSchema(env);
      let payload = {};
      try {
        payload = await request.json();
      } catch {
        return jsonResponse({ message: "Invalid JSON body." }, 400);
      }
      const email = String(payload?.email || "").trim().toLowerCase();
      const secretKey = String(payload?.secretKey || "");
      if (!email || !secretKey) {
        return jsonResponse({ message: "email and secretKey are required." }, 400);
      }
      const adminUser = await authenticateAdminCredentials(env, email, secretKey);
      if (!adminUser) {
        return jsonResponse({ message: "Invalid email or secret key." }, 401);
      }
      const session = await createAdminSession(env, adminUser.id);
      return jsonResponse({
        adminUser,
        sessionToken: session.sessionToken,
        expiresAt: session.expiresAt
      });
    }
    if (request.method === "GET" && url.pathname === "/api/admin/auth/me") {
      const sessionToken = request.headers.get("x-admin-session-token");
      const adminUser = await getAdminUserBySessionToken(env, sessionToken);
      if (!adminUser) {
        return jsonResponse({ message: "Unauthorized" }, 401);
      }
      return jsonResponse({ adminUser });
    }
    if (url.pathname === "/api/admin/users" && request.method === "GET") {
      if (!await isHostRequest(request, env)) {
        return jsonResponse({ message: "Forbidden" }, 403);
      }
      await ensureAdminAuthSchema(env);
      const rows = await env.DB.prepare(
        `SELECT id, email, is_active AS isActive, created_at AS createdAt, updated_at AS updatedAt
         FROM admin_users
         ORDER BY created_at DESC`
      ).all();
      return jsonResponse({ users: rows.results || [] });
    }
    if (url.pathname === "/api/admin/users" && request.method === "POST") {
      if (!await isHostRequest(request, env)) {
        return jsonResponse({ message: "Forbidden" }, 403);
      }
      let payload = {};
      try {
        payload = await request.json();
      } catch {
        return jsonResponse({ message: "Invalid JSON body." }, 400);
      }
      if (!payload?.email || !payload?.secretKey) {
        return jsonResponse({ message: "email and secretKey are required." }, 400);
      }
      const user = await upsertAdminUser(env, payload.email, payload.secretKey);
      return jsonResponse({ user }, 201);
    }
    if (request.method === "DELETE" && url.pathname.startsWith("/api/admin/users/")) {
      if (!await isHostRequest(request, env)) {
        return jsonResponse({ message: "Forbidden" }, 403);
      }
      const idStr = decodeURIComponent(url.pathname.replace("/api/admin/users/", ""));
      const userId = Number(idStr);
      if (!Number.isFinite(userId)) {
        return jsonResponse({ message: "Invalid user id." }, 400);
      }
      await ensureAdminAuthSchema(env);
      await env.DB.prepare(`DELETE FROM admin_users WHERE id = ?`).bind(userId).run();
      return jsonResponse({ success: true });
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
    if ((request.method === "GET" || request.method === "HEAD") && url.pathname.startsWith("/api/files/object/")) {
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
        const storageKeyName = key.split("/").pop() || "";
        const storageKeySuffix = storageKeyName.replace(/^\d+-/, "");
        if (storageKeySuffix) {
          const fallback = await env.DB.prepare(
            `SELECT storage_key AS storageKey
             FROM uploaded_files
             WHERE LOWER(storage_key) LIKE LOWER(?)
             ORDER BY uploaded_at DESC
             LIMIT 1`
          ).bind(`%${storageKeySuffix}`).first();
          if (fallback?.storageKey && fallback.storageKey !== key) {
            const fallbackObject = await env.RESEARCH_BUCKET.get(fallback.storageKey);
            if (fallbackObject) {
              const headers2 = new Headers();
              fallbackObject.writeHttpMetadata(headers2);
              headers2.set("etag", fallbackObject.httpEtag);
              headers2.set("cache-control", "public, max-age=300");
              headers2.set("x-content-type-options", "nosniff");
              headers2.set("Access-Control-Allow-Origin", CORS_HEADERS["Access-Control-Allow-Origin"]);
              headers2.set("Access-Control-Allow-Methods", CORS_HEADERS["Access-Control-Allow-Methods"]);
              headers2.set("Access-Control-Allow-Headers", CORS_HEADERS["Access-Control-Allow-Headers"]);
              headers2.set("Access-Control-Max-Age", CORS_HEADERS["Access-Control-Max-Age"]);
              return new Response(fallbackObject.body, {
                status: 200,
                headers: headers2
              });
            }
          }
        }
        if (String(key).includes("econsinsite_test_02") || String(key).endsWith("econsinsite_test_02.pdf")) {
          try {
            const publicUrl = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf";
            const upstream = await fetch(publicUrl);
            if (!upstream.ok) {
              return jsonResponse({ message: "Sample PDF unavailable." }, 502);
            }
            const proxiedHeaders = new Headers(upstream.headers);
            proxiedHeaders.set("Access-Control-Allow-Origin", CORS_HEADERS["Access-Control-Allow-Origin"]);
            proxiedHeaders.set("Access-Control-Allow-Methods", CORS_HEADERS["Access-Control-Allow-Methods"]);
            proxiedHeaders.set("Access-Control-Allow-Headers", CORS_HEADERS["Access-Control-Allow-Headers"]);
            proxiedHeaders.set("Access-Control-Max-Age", CORS_HEADERS["Access-Control-Max-Age"]);
            proxiedHeaders.set("cache-control", "public, max-age=300");
            return new Response(upstream.body, {
              status: upstream.status,
              headers: proxiedHeaders
            });
          } catch (err) {
            return jsonResponse({ message: "Proxy error fetching sample PDF." }, 502);
          }
        }
        if (isImageObjectKey(key)) {
          return createMissingImageResponse(key, request.method);
        }
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
    if (request.method === "POST" && url.pathname === "/api/contact-submissions") {
      let payload;
      try {
        payload = await request.json();
      } catch {
        return jsonResponse({ message: "Invalid JSON body." }, 400);
      }
      await ensureAdminMessagesSchema(env);
      const firstName = String(payload?.firstName || "").trim();
      const lastName = String(payload?.lastName || "").trim();
      const fullName = `${firstName} ${lastName}`.trim();
      const email = String(payload?.email || "").trim().toLowerCase();
      const message = String(payload?.message || "").trim();
      if (!firstName || !lastName || !email || !message) {
        return jsonResponse({ message: "firstName, lastName, email, and message are required." }, 400);
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const insertResult = await env.DB.prepare(
        `INSERT INTO admin_messages (
            message_type,
            full_name,
            email,
            subject,
            message,
            status,
            created_at,
            updated_at
         )
         VALUES ('contact', ?, ?, ?, ?, 'new', ?, ?)
         RETURNING
            id,
            message_type AS messageType,
            full_name AS fullName,
            email,
            company,
            subject,
            requested_at AS requestedAt,
            message,
            status,
            email_delivery_status AS emailDeliveryStatus,
            email_delivery_error AS emailDeliveryError,
            created_at AS createdAt,
            updated_at AS updatedAt`
      ).bind(fullName, email, `New contact message from ${fullName}`, message, now, now).first();
      const adminEmails = await getActiveAdminEmails(env);
      const emailResult = await sendAdminNotificationEmail(env, adminEmails, `New contact message from ${fullName}`, {
        messageType: "contact",
        senderName: fullName,
        senderEmail: email,
        message
      });
      await env.DB.prepare(
        `UPDATE admin_messages
         SET email_delivery_status = ?,
             email_delivery_error = ?,
             updated_at = ?
         WHERE id = ?`
      ).bind(emailResult.status, emailResult.error || null, (/* @__PURE__ */ new Date()).toISOString(), insertResult.id).run();
      return jsonResponse({ message: mapAdminMessageRow(insertResult), emailDelivery: emailResult }, 201);
    }
    if (request.method === "POST" && url.pathname === "/api/bookings") {
      let payload;
      try {
        payload = await request.json();
      } catch {
        return jsonResponse({ message: "Invalid JSON body." }, 400);
      }
      await ensureBookingSchema(env);
      const fullName = String(payload?.fullName || "").trim();
      const email = String(payload?.email || "").trim().toLowerCase();
      const company = String(payload?.company || "").trim();
      const requestedAt = String(payload?.requestedAt || "").trim();
      const message = String(payload?.message || "").trim();
      if (!fullName || !email || !requestedAt || !message) {
        return jsonResponse({ message: "fullName, email, requestedAt, and message are required." }, 400);
      }
      const requestedDate = new Date(requestedAt);
      if (Number.isNaN(requestedDate.getTime())) {
        return jsonResponse({ message: "requestedAt must be a valid date and time." }, 400);
      }
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const booking = await env.DB.prepare(
        `INSERT INTO bookings (
            full_name,
            email,
            company,
            requested_at,
            message,
            status,
            created_at,
            updated_at
         )
         VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
         RETURNING
            id,
            full_name AS fullName,
            email,
            company,
            requested_at AS requestedAt,
            message,
            status,
            admin_response_subject AS adminResponseSubject,
            admin_response_message AS adminResponseMessage,
            responded_by_admin_email AS respondedByAdminEmail,
            responded_at AS respondedAt,
            email_delivery_status AS emailDeliveryStatus,
            email_delivery_error AS emailDeliveryError,
            created_at AS createdAt,
            updated_at AS updatedAt`
      ).bind(fullName, email, company || null, requestedAt, message, now, now).first();
      const bookingMessage = await env.DB.prepare(
        `INSERT INTO admin_messages (
            message_type,
            full_name,
            email,
            company,
            subject,
            requested_at,
            message,
            status,
            created_at,
            updated_at
         )
         VALUES ('booking', ?, ?, ?, ?, ?, ?, 'new', ?, ?)
         RETURNING id`
      ).bind(
        fullName,
        email,
        company || null,
        `New booking request from ${fullName}`,
        requestedAt,
        message,
        now,
        now
      ).first();
      if (!booking || !bookingMessage) {
        return jsonResponse({ message: "Unable to create booking." }, 500);
      }
      const adminEmails = await getActiveAdminEmails(env);
      const emailResult = await sendAdminNotificationEmail(env, adminEmails, `New booking request from ${fullName}`, {
        messageType: "booking",
        senderName: fullName,
        senderEmail: email,
        company: company || "",
        requestedAt,
        message
      });
      await env.DB.prepare(
        `UPDATE admin_messages
         SET email_delivery_status = ?,
             email_delivery_error = ?,
             updated_at = ?
         WHERE id = ?`
      ).bind(emailResult.status, emailResult.error || null, (/* @__PURE__ */ new Date()).toISOString(), bookingMessage.id).run();
      return jsonResponse({ booking, emailDelivery: emailResult }, 201);
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
    if (request.method === "GET" && url.pathname === "/api/admin/bookings") {
      if (!await isHostRequest(request, env)) {
        return jsonResponse({ message: "Forbidden" }, 403);
      }
      await ensureBookingSchema(env);
      const bookingRows = await env.DB.prepare(
        `SELECT
            id,
            full_name AS fullName,
            email,
            company,
            requested_at AS requestedAt,
            message,
            status,
            admin_response_subject AS adminResponseSubject,
            admin_response_message AS adminResponseMessage,
            responded_by_admin_email AS respondedByAdminEmail,
            responded_at AS respondedAt,
            email_delivery_status AS emailDeliveryStatus,
            email_delivery_error AS emailDeliveryError,
            created_at AS createdAt,
            updated_at AS updatedAt
         FROM bookings
         ORDER BY created_at DESC
         LIMIT 200`
      ).all();
      return jsonResponse({ bookings: (bookingRows.results || []).map(mapBookingRow) });
    }
    if (request.method === "GET" && url.pathname === "/api/admin/messages") {
      if (!await isHostRequest(request, env)) {
        return jsonResponse({ message: "Forbidden" }, 403);
      }
      await ensureAdminMessagesSchema(env);
      const messageRows = await env.DB.prepare(
        `SELECT
            id,
            message_type AS messageType,
            full_name AS fullName,
            email,
            company,
            subject,
            requested_at AS requestedAt,
            message,
            status,
            email_delivery_status AS emailDeliveryStatus,
            email_delivery_error AS emailDeliveryError,
            created_at AS createdAt,
            updated_at AS updatedAt
         FROM admin_messages
         ORDER BY created_at DESC
         LIMIT 300`
      ).all();
      return jsonResponse({ messages: (messageRows.results || []).map(mapAdminMessageRow) });
    }
    if (request.method === "POST" && url.pathname.startsWith("/api/admin/bookings/") && url.pathname.endsWith("/respond")) {
      if (!await isHostRequest(request, env)) {
        return jsonResponse({ message: "Forbidden" }, 403);
      }
      const sessionToken = request.headers.get("x-admin-session-token");
      const adminUser = await getAdminUserBySessionToken(env, sessionToken);
      if (!adminUser) {
        return jsonResponse({ message: "Admin session required." }, 401);
      }
      const bookingIdStr = url.pathname.replace("/api/admin/bookings/", "").replace("/respond", "");
      const bookingId = Number(bookingIdStr);
      if (!Number.isFinite(bookingId) || bookingId <= 0) {
        return jsonResponse({ message: "Invalid booking id." }, 400);
      }
      let payload;
      try {
        payload = await request.json();
      } catch {
        return jsonResponse({ message: "Invalid JSON body." }, 400);
      }
      await ensureBookingSchema(env);
      const subject = String(payload?.subject || "").trim();
      const message = String(payload?.message || "").trim();
      const nextStatus = normalizeBookingStatus(payload?.status || "accepted");
      if (!subject || !message) {
        return jsonResponse({ message: "subject and message are required." }, 400);
      }
      const booking = await env.DB.prepare(
        `SELECT
            id,
            full_name AS fullName,
            email,
            company,
            requested_at AS requestedAt,
            message,
            status,
            admin_response_subject AS adminResponseSubject,
            admin_response_message AS adminResponseMessage,
            responded_by_admin_email AS respondedByAdminEmail,
            responded_at AS respondedAt,
            email_delivery_status AS emailDeliveryStatus,
            email_delivery_error AS emailDeliveryError,
            created_at AS createdAt,
            updated_at AS updatedAt
         FROM bookings
         WHERE id = ?`
      ).bind(bookingId).first();
      if (!booking) {
        return jsonResponse({ message: "Booking not found." }, 404);
      }
      const emailResult = await sendBookingResponseEmail(env, booking, adminUser, subject, message);
      const now = (/* @__PURE__ */ new Date()).toISOString();
      const updated = await env.DB.prepare(
        `UPDATE bookings
         SET status = ?,
             admin_response_subject = ?,
             admin_response_message = ?,
             responded_by_admin_email = ?,
             responded_at = ?,
             email_delivery_status = ?,
             email_delivery_error = ?,
             updated_at = ?
         WHERE id = ?
         RETURNING
            id,
            full_name AS fullName,
            email,
            company,
            requested_at AS requestedAt,
            message,
            status,
            admin_response_subject AS adminResponseSubject,
            admin_response_message AS adminResponseMessage,
            responded_by_admin_email AS respondedByAdminEmail,
            responded_at AS respondedAt,
            email_delivery_status AS emailDeliveryStatus,
            email_delivery_error AS emailDeliveryError,
            created_at AS createdAt,
            updated_at AS updatedAt`
      ).bind(
        nextStatus,
        subject,
        message,
        adminUser.email,
        now,
        emailResult.status,
        emailResult.error || null,
        now,
        bookingId
      ).first();
      return jsonResponse({ booking: mapBookingRow(updated), emailDelivery: emailResult });
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
    if (request.method === "PUT" && url.pathname.startsWith("/api/admin/posts/")) {
      if (!await isHostRequest(request, env)) {
        return jsonResponse({ message: "Forbidden" }, 403);
      }
      const id = Number(url.pathname.replace("/api/admin/posts/", ""));
      if (!id) return jsonResponse({ message: "Invalid post id" }, 400);
      let payload = {};
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
      if (!postType) {
        return jsonResponse({ message: "postType must be article or blog." }, 400);
      }
      if (!title) {
        return jsonResponse({ message: "title is required." }, 400);
      }
      await env.DB.prepare(
        `UPDATE posts SET
           post_type = ?, title = ?, excerpt = ?, content = ?, status = ?,
           article_file_url = ?, article_storage_key = ?, cover_image_url = ?,
           article_layout = ?, article_image_urls = ?, updated_at = ?
         WHERE id = ?`
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
        (/* @__PURE__ */ new Date()).toISOString(),
        id
      ).run();
      const updated = await env.DB.prepare(
        `SELECT id, post_type AS postType, title, excerpt, content, status, article_file_url AS articleFileUrl, article_storage_key AS articleStorageKey, cover_image_url AS coverImageUrl, article_layout AS articleLayout, article_image_urls AS articleImageUrls, author_id AS authorId, view_count AS viewCount, created_at AS createdAt, updated_at AS updatedAt FROM posts WHERE id = ?`
      ).bind(id).first();
      return jsonResponse({ post: mapPostRow(updated) });
    }
    if (request.method === "DELETE" && url.pathname.startsWith("/api/admin/posts/")) {
      if (!await isHostRequest(request, env)) {
        return jsonResponse({ message: "Forbidden" }, 403);
      }
      const id = Number(url.pathname.replace("/api/admin/posts/", ""));
      if (!id) return jsonResponse({ message: "Invalid post id" }, 400);
      await env.DB.prepare(`DELETE FROM posts WHERE id = ?`).bind(id).run();
      return jsonResponse({ message: "Deleted" });
    }
    if (request.method === "DELETE" && url.pathname.startsWith("/api/admin/bookings/")) {
      if (!await isHostRequest(request, env)) {
        return jsonResponse({ message: "Forbidden" }, 403);
      }
      const id = Number(url.pathname.replace("/api/admin/bookings/", ""));
      if (!id) return jsonResponse({ message: "Invalid booking id" }, 400);
      await ensureBookingSchema(env);
      await env.DB.prepare(`DELETE FROM bookings WHERE id = ?`).bind(id).run();
      return jsonResponse({ message: "Deleted" });
    }
    if (request.method === "DELETE" && url.pathname.startsWith("/api/admin/messages/")) {
      if (!await isHostRequest(request, env)) {
        return jsonResponse({ message: "Forbidden" }, 403);
      }
      const id = Number(url.pathname.replace("/api/admin/messages/", ""));
      if (!id) return jsonResponse({ message: "Invalid message id" }, 400);
      await ensureAdminMessagesSchema(env);
      await env.DB.prepare(`DELETE FROM admin_messages WHERE id = ?`).bind(id).run();
      return jsonResponse({ message: "Deleted" });
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
    if (url.pathname === "/api/analytics/snapshots" && request.method === "POST") {
      if (!await isHostRequest(request, env)) {
        return jsonResponse({ message: "Forbidden" }, 403);
      }
      let body = {};
      try {
        body = await request.json();
      } catch {
      }
      const dateParam = body?.date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const totalViewsRow = await env.DB.prepare(`SELECT SUM(COALESCE(view_count,0)) AS total FROM posts`).first();
      const fileViewsRow = await env.DB.prepare(`SELECT SUM(COALESCE(view_count,0)) AS total FROM uploaded_files`).first();
      const totalViews = Number(totalViewsRow?.total || 0) + Number(fileViewsRow?.total || 0) || 0;
      const newPostsRow = await env.DB.prepare(
        `SELECT COUNT(*) AS total FROM posts WHERE date(created_at) = ?`
      ).bind(dateParam).first();
      const newPosts = Number(newPostsRow?.total || 0);
      await env.DB.prepare(
        `INSERT INTO analytics_snapshots (date, total_views, new_posts, created_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(date) DO UPDATE SET total_views = excluded.total_views, new_posts = excluded.new_posts`
      ).bind(dateParam, totalViews, newPosts, (/* @__PURE__ */ new Date()).toISOString()).run();
      const inserted = await env.DB.prepare(`SELECT date, total_views AS totalViews, new_posts AS newPosts FROM analytics_snapshots WHERE date = ?`).bind(dateParam).first();
      return jsonResponse({ snapshot: inserted || { date: dateParam, totalViews, newPosts } });
    }
    if (url.pathname === "/api/analytics/snapshots" && request.method === "GET") {
      const days = Number(url.searchParams.get("days") || 30);
      const rows = await env.DB.prepare(
        `SELECT date, total_views AS totalViews, new_posts AS newPosts
         FROM analytics_snapshots
         ORDER BY date DESC
         LIMIT ?`
      ).bind(days).all();
      const results = (rows.results || []).map((r) => ({ date: r.date, totalViews: Number(r.totalViews || 0), newPosts: Number(r.newPosts || 0) }));
      return jsonResponse({ snapshots: results });
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

// .wrangler/tmp/bundle-pGbZGm/middleware-insertion-facade.js
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

// .wrangler/tmp/bundle-pGbZGm/middleware-loader.entry.ts
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
