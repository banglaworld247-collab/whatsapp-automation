/**
 * Cloudflare Worker for JTS Tutor Image & Document Uploads (Cloudflare R2)
 * 
 * Setup Instructions in Cloudflare Dashboard:
 * 1. Go to Cloudflare Dashboard -> R2 -> Create a Bucket (e.g. "jts-uploads").
 * 2. Go to Workers & Pages -> Create Application -> Create Worker (e.g. "jts-uploader").
 * 3. In the Worker settings -> Settings -> Variables -> R2 Bucket Bindings:
 *    - Variable Name: R2_BUCKET (or MY_BUCKET)
 *    - R2 Bucket: select "jts-uploads"
 * 4. (Optional) In Settings -> Variables -> Environment Variables:
 *    - PUBLIC_URL_PREFIX: (e.g. "https://pub-xxxx.r2.dev" or your custom domain, if public bucket is enabled).
 *      If not provided, the worker automatically serves files via its own URL: https://<worker-url>/file/<key>
 * 5. Paste this entire code into the Worker editor and click "Deploy".
 * 6. Copy your Worker URL (e.g. "https://jts-uploader.<your-subdomain>.workers.dev") 
 *    and paste it in CLOUDFLARE_UPLOAD_URL in `tutor-registration.html` and `tuition-details.html`.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const bucket = env.R2_BUCKET || env.MY_BUCKET;

    // 1. Handle CORS Preflight
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
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
          phone = (formData.get("phone") || "general").toString().trim();
          email = (formData.get("email") || "").toString().trim();

          const nidFile = formData.get("nid");
          const marksheetFile = formData.get("marksheet");
          const singleFile = formData.get("file");

          const timestamp = Date.now();

          // Upload NID
          if (nidFile && typeof nidFile === "object" && nidFile.name) {
            const ext = getExtension(nidFile.name, nidFile.type);
            const key = `tutors/${phone}/nid_${timestamp}.${ext}`;
            await bucket.put(key, nidFile.stream(), {
              httpMetadata: { contentType: nidFile.type || "application/octet-stream" },
              customMetadata: { phone, email, originalName: nidFile.name }
            });
            uploadedNidUrl = `${publicPrefix}/${key}`;
            results.push({ field: "nid", key, url: uploadedNidUrl });
          }

          // Upload Marksheet
          if (marksheetFile && typeof marksheetFile === "object" && marksheetFile.name) {
            const ext = getExtension(marksheetFile.name, marksheetFile.type);
            const key = `tutors/${phone}/marksheet_${timestamp}.${ext}`;
            await bucket.put(key, marksheetFile.stream(), {
              httpMetadata: { contentType: marksheetFile.type || "application/octet-stream" },
              customMetadata: { phone, email, originalName: marksheetFile.name }
            });
            uploadedMsUrl = `${publicPrefix}/${key}`;
            results.push({ field: "marksheet", key, url: uploadedMsUrl });
          }

          // Upload generic single file (if applicable)
          if (singleFile && typeof singleFile === "object" && singleFile.name) {
            const ext = getExtension(singleFile.name, singleFile.type);
            const key = `uploads/${phone}/${timestamp}_${sanitizeFileName(singleFile.name)}`;
            await bucket.put(key, singleFile.stream(), {
              httpMetadata: { contentType: singleFile.type || "application/octet-stream" },
              customMetadata: { phone, email, originalName: singleFile.name }
            });
            const singleUrl = `${publicPrefix}/${key}`;
            results.push({ field: "file", key, url: singleUrl });
          }
        } 
        // Case B: JSON Payload (with Base64 files)
        else {
          const body = await request.json();
          phone = (body.phone || "general").toString().trim();
          email = (body.email || "").toString().trim();
          const timestamp = Date.now();

          // NID Base64
          if (body.nidBase64) {
            const mime = body.nidMime || "image/jpeg";
            const ext = getExtension(body.nidName || "nid", mime);
            const key = `tutors/${phone}/nid_${timestamp}.${ext}`;
            const buffer = base64ToArrayBuffer(body.nidBase64);
            await bucket.put(key, buffer, {
              httpMetadata: { contentType: mime },
              customMetadata: { phone, email, originalName: body.nidName || "nid" }
            });
            uploadedNidUrl = `${publicPrefix}/${key}`;
            results.push({ field: "nid", key, url: uploadedNidUrl });
          }

          // Marksheet Base64
          if (body.msBase64) {
            const mime = body.msMime || "image/jpeg";
            const ext = getExtension(body.msName || "marksheet", mime);
            const key = `tutors/${phone}/marksheet_${timestamp}.${ext}`;
            const buffer = base64ToArrayBuffer(body.msBase64);
            await bucket.put(key, buffer, {
              httpMetadata: { contentType: mime },
              customMetadata: { phone, email, originalName: body.msName || "marksheet" }
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
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
          }
        );
      }
    }

    return new Response(
      JSON.stringify({ status: "ok", service: "JTS Cloudflare R2 Uploader" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
};

// Helpers
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
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
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
