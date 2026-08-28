import json, urllib.request, urllib.error, os, sys

ACCOUNT_ID  = "4b0e902f8ef98676a08cbcce5328ccb3"
API_TOKEN   = "cfat_zrjVDIlms8HUQKqa6w6AffgF6Hn0X6hnx3Ot19EHd531fc3f"
WORKER_NAME = "jts-uploader"
BUCKET_NAME = "jts-uploads"
BASE        = "https://api.cloudflare.com/client/v4"

def cf(url, method="GET", data=None, extra_headers=None):
    hdrs = {"Authorization": f"Bearer {API_TOKEN}"}
    if extra_headers:
        hdrs.update(extra_headers)
    body = None
    if data is not None:
        if isinstance(data, (dict, list)):
            body = json.dumps(data).encode("utf-8")
            hdrs["Content-Type"] = "application/json"
        else:
            body = data
    req = urllib.request.Request(url, data=body, headers=hdrs, method=method)
    try:
        with urllib.request.urlopen(req) as r:
            text = r.read().decode("utf-8")
            return json.loads(text) if text.strip() else {"success": True}
    except urllib.error.HTTPError as e:
        text = e.read().decode("utf-8")
        try:
            return json.loads(text)
        except Exception:
            return {"success": False, "error": text, "status": e.code}
    except Exception as e:
        return {"success": False, "error": str(e)}

CRLF = b"\r\n"

def mp_field(bnd, name, value, content_type, filename=None):
    cd = f'Content-Disposition: form-data; name="{name}"'
    if filename:
        cd += f'; filename="{filename}"'
    val_bytes = value.encode("utf-8") if isinstance(value, str) else value
    return (
        f"--{bnd}\r\n".encode("utf-8") +
        cd.encode("utf-8") + CRLF +
        f"Content-Type: {content_type}\r\n\r\n".encode("utf-8") +
        val_bytes + CRLF
    )

# 1. Verify account
print("1. Verifying account...")
res = cf(f"{BASE}/accounts/{ACCOUNT_ID}")
if not res.get("success"):
    print("   ERROR:", res)
    sys.exit(1)
print(f"   [OK] {res['result']['name']}")

# 2. Create R2 bucket
print(f"\n2. Creating R2 bucket '{BUCKET_NAME}'...")
res = cf(f"{BASE}/accounts/{ACCOUNT_ID}/r2/buckets", method="POST", data={"name": BUCKET_NAME})
if res.get("success"):
    print(f"   [OK] Bucket created.")
else:
    errs = res.get("errors", [])
    codes = [e.get("code") for e in errs]
    if 10006 in codes:
        print(f"   [OK] Bucket already exists.")
    elif 10042 in codes:
        print("   [SKIP] R2 needs to be enabled in your Cloudflare Dashboard first.")
        print("          Go to: https://dash.cloudflare.com -> R2 -> Get Started")
    else:
        print("   [WARN] Bucket issue:", res)

# 3. Deploy Worker (ES Module via multipart)
print(f"\n3. Deploying Worker '{WORKER_NAME}' (ES Module)...")
with open("cloudflare-worker.js", "r", encoding="utf-8") as f:
    worker_js = f.read()

metadata = {
    "main_module": "worker.js",
    "bindings": [
        {"type": "r2_bucket", "name": "R2_BUCKET", "bucket_name": BUCKET_NAME}
    ],
    "compatibility_date": "2024-03-01"
}

bnd = "workerbound" + os.urandom(6).hex()
body = bytearray()
body += mp_field(bnd, "metadata", json.dumps(metadata), "application/json")
body += mp_field(bnd, "worker.js", worker_js, "application/javascript+module", "worker.js")
body += f"--{bnd}--\r\n".encode("utf-8")
body_bytes = bytes(body)

res = cf(
    f"{BASE}/accounts/{ACCOUNT_ID}/workers/scripts/{WORKER_NAME}",
    method="PUT",
    data=body_bytes,
    extra_headers={"Content-Type": f"multipart/form-data; boundary={bnd}"}
)
if res.get("success"):
    print(f"   [OK] Worker deployed successfully!")
else:
    print("   ERROR:", json.dumps(res, indent=2))
    sys.exit(1)

# 4. Enable workers.dev subdomain
print("\n4. Enabling workers.dev route...")
res = cf(
    f"{BASE}/accounts/{ACCOUNT_ID}/workers/scripts/{WORKER_NAME}/subdomain",
    method="POST",
    data={"enabled": True}
)
if res.get("success") or "already" in str(res).lower():
    print("   [OK] Subdomain enabled.")
else:
    print("   Note:", json.dumps(res, indent=2)[:200])

# 5. Get subdomain
print("\n5. Getting worker URL...")
res = cf(f"{BASE}/accounts/{ACCOUNT_ID}/workers/subdomain")
subdomain = (res.get("result") or {}).get("subdomain", "")

if subdomain:
    worker_url = f"https://{WORKER_NAME}.{subdomain}.workers.dev"
    print("\n" + "="*60)
    print("DEPLOYMENT COMPLETE!")
    print(f"  Worker URL : {worker_url}")
    print(f"  R2 Bucket  : {BUCKET_NAME}")
    print("="*60)

    # 6. Patch HTML files
    print("\n6. Patching HTML files...")
    files_to_patch = [
        "tutor-registration.html",
        "tutor-registration(1).html",
        "tuition-details.html",
    ]
    old = 'const CLOUDFLARE_WORKER_URL = "";'
    new = f'const CLOUDFLARE_WORKER_URL = "{worker_url}";'
    for fname in files_to_patch:
        if not os.path.exists(fname):
            continue
        with open(fname, "r", encoding="utf-8") as f:
            content = f.read()
        if old in content:
            with open(fname, "w", encoding="utf-8") as f:
                f.write(content.replace(old, new))
            print(f"   [OK] Patched {fname}")
        elif worker_url in content:
            print(f"   [OK] {fname} already up to date.")
        else:
            print(f"   [WARN] {fname} - could not find placeholder, patch manually.")
    print(f"\nWorker URL to paste if needed: {worker_url}")
else:
    print("Could not determine subdomain. Response:", json.dumps(res, indent=2))
