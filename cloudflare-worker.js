/**
 * Cloudflare Worker for TSBD Tutor Image & Document Uploads (Cloudflare R2)
 * 
 * Features:
 * - Direct stream upload to Cloudflare R2
 * - File size restriction (Max 10MB)
 * - Allowed MIME types (JPEG, PNG, WEBP, PDF)
 * - Path & filename sanitization
 * - Public direct file serving with immutable caching
 */

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Megabytes
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
  "application/pdf"
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const bucket = env.R2_BUCKET || env.MY_BUCKET;

    // 1. Handle CORS Preflight
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-Api-Key",
      "Access-Control-Max-Age": "86400",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (!bucket) {
      return new Response(
        JSON.stringify({ 
          status: "error", 
          message: "R2 bucket binding 'R2_BUCKET' is missing in Worker settings." 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // 2. Direct File Serving: GET /file/<key>
    if (request.method === "GET" && url.pathname.startsWith("/file/")) {
      const key = decodeURIComponent(url.pathname.replace("/file/", ""));
      const object = await bucket.get(key);

      if (!object) {
        return new Response("File not found", { status: 404, headers: corsHeaders });
      }

      const headers = new Headers(corsHeaders);
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("Cache-Control", "public, max-age=31536000, immutable");

      return new Response(object.body, { headers });
    }

    // 3. Upload Handling: POST /upload or POST /
    if (request.method === "POST") {
      try {
        const contentType = request.headers.get("content-type") || "";
        let phone = "general";
        let email = "";
        let uploadedNidUrl = "";
        let uploadedMsUrl = "";
        const results = [];

        const publicPrefix = env.PUBLIC_URL_PREFIX 
          ? env.PUBLIC_URL_PREFIX.replace(/\/$/, "") 
          : `${url.origin}/file`;

        // Case A: Multipart Form Data (Fast binary upload)
        if (contentType.includes("multipart/form-data")) {
          const formData = await request.formData();
          phone = sanitizeFileName((formData.get("phone") || "general").toString().trim());
          email = sanitizeFileName((formData.get("email") || "").toString().trim());

          const nidFile = formData.get("nid");
          const marksheetFile = formData.get("marksheet");
          const singleFile = formData.get("file");

          const timestamp = Date.now();

          // Upload NID
          if (nidFile && typeof nidFile === "object" && nidFile.name) {
            validateFile(nidFile);
            const ext = getExtension(nidFile.name, nidFile.type);
            const key = `tutors/${phone}/nid_${timestamp}.${ext}`;
            await bucket.put(key, nidFile.stream(), {
              httpMetadata: { contentType: nidFile.type || "application/octet-stream" },
              customMetadata: { phone, email, originalName: sanitizeFileName(nidFile.name) }
            });
            uploadedNidUrl = `${publicPrefix}/${key}`;
            results.push({ field: "nid", key, url: uploadedNidUrl });
          }

          // Upload Marksheet
          if (marksheetFile && typeof marksheetFile === "object" && marksheetFile.name) {
            validateFile(marksheetFile);
            const ext = getExtension(marksheetFile.name, marksheetFile.type);
            const key = `tutors/${phone}/marksheet_${timestamp}.${ext}`;
            await bucket.put(key, marksheetFile.stream(), {
              httpMetadata: { contentType: marksheetFile.type || "application/octet-stream" },
              customMetadata: { phone, email, originalName: sanitizeFileName(marksheetFile.name) }
            });
            uploadedMsUrl = `${publicPrefix}/${key}`;
            results.push({ field: "marksheet", key, url: uploadedMsUrl });
          }

          // Upload generic single file (if applicable)
          if (singleFile && typeof singleFile === "object" && singleFile.name) {
            validateFile(singleFile);
            const ext = getExtension(singleFile.name, singleFile.type);
            const key = `uploads/${phone}/${timestamp}_${sanitizeFileName(singleFile.name)}`;
            await bucket.put(key, singleFile.stream(), {
              httpMetadata: { contentType: singleFile.type || "application/octet-stream" },
              customMetadata: { phone, email, originalName: sanitizeFileName(singleFile.name) }
            });
            const singleUrl = `${publicPrefix}/${key}`;
            results.push({ field: "file", key, url: singleUrl });
          }
        } 
        // Case B: JSON Payload (with Base64 files)
        else {
          const body = await request.json();
          phone = sanitizeFileName((body.phone || "general").toString().trim());
          email = sanitizeFileName((body.email || "").toString().trim());
          const timestamp = Date.now();

          // NID Base64
          if (body.nidBase64) {
            const mime = body.nidMime || "image/jpeg";
            validateMime(mime);
            const ext = getExtension(body.nidName || "nid", mime);
            const key = `tutors/${phone}/nid_${timestamp}.${ext}`;
            const buffer = base64ToArrayBuffer(body.nidBase64);
            if (buffer.byteLength > MAX_FILE_SIZE) throw new Error("NID file size exceeds 10MB limit.");
            await bucket.put(key, buffer, {
              httpMetadata: { contentType: mime },
              customMetadata: { phone, email, originalName: sanitizeFileName(body.nidName || "nid") }
            });
            uploadedNidUrl = `${publicPrefix}/${key}`;
            results.push({ field: "nid", key, url: uploadedNidUrl });
          }

          // Marksheet Base64
          if (body.msBase64) {
            const mime = body.msMime || "image/jpeg";
            validateMime(mime);
            const ext = getExtension(body.msName || "marksheet", mime);
            const key = `tutors/${phone}/marksheet_${timestamp}.${ext}`;
            const buffer = base64ToArrayBuffer(body.msBase64);
            if (buffer.byteLength > MAX_FILE_SIZE) throw new Error("Marksheet file size exceeds 10MB limit.");
            await bucket.put(key, buffer, {
              httpMetadata: { contentType: mime },
              customMetadata: { phone, email, originalName: sanitizeFileName(body.msName || "marksheet") }
            });
            uploadedMsUrl = `${publicPrefix}/${key}`;
            results.push({ field: "marksheet", key, url: uploadedMsUrl });
          }
        }

        return new Response(
          JSON.stringify({
            status: "success",
            message: "Files uploaded successfully to Cloudflare R2.",
            nidUrl: uploadedNidUrl,
            msUrl: uploadedMsUrl,
            files: results
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );

      } catch (err) {
        return new Response(
          JSON.stringify({
            status: "error",
            message: err.message || "Upload to Cloudflare R2 failed."
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ status: "ok", service: "TSBD Cloudflare R2 Uploader (Secure v2)" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};

// Helper Validation
function validateFile(file) {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File "${file.name}" exceeds maximum allowed size of 10MB.`);
  }
  if (file.type && !ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
    throw new Error(`Unsupported file type: ${file.type}. Allowed types: JPEG, PNG, WebP, PDF.`);
  }
}

function validateMime(mime) {
  if (!ALLOWED_MIME_TYPES.includes(mime.toLowerCase())) {
    throw new Error(`Unsupported file type: ${mime}. Allowed types: JPEG, PNG, WebP, PDF.`);
  }
}

function getExtension(fileName = "", mimeType = "") {
  if (fileName.includes(".")) {
    const ext = fileName.split(".").pop().toLowerCase();
    if (ext && ext.length <= 4) return ext;
  }
  if (mimeType.includes("pdf")) return "pdf";
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  return "jpg";
}

function sanitizeFileName(name = "") {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 80);
}

function base64ToArrayBuffer(base64) {
  const cleanBase64 = base64.replace(/^data:[^;]+;base64,/, "");
  const binaryString = atob(cleanBase64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}
