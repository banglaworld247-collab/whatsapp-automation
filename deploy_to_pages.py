import urllib.request
import urllib.error
import json
import hashlib
import base64
import os
import mimetypes
import uuid
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

ACCOUNT_ID = "4b0e902f8ef98676a08cbcce5328ccb3"
API_TOKEN = "cfat_zrjVDIlms8HUQKqa6w6AffgF6Hn0X6hnx3Ot19EHd531fc3f"
PROJECT = "tsbd"

def main():
    print(">> Starting Cloudflare Pages deployment for TSBD...")
    
    # 1. Collect files
    files_to_deploy = {}
    for root, dirs, files in os.walk('.'):
        if any(ignored in root for ignored in ['.git', 'whatsapp-server', '.gemini', '.agents', '__pycache__']):
            continue
        for f in files:
            if f.endswith(('.html', '.js', '.css', '.json', '.rules', '.txt', '.png', '.jpg', '.svg', '.webp', '.ico')):
                full_path = os.path.join(root, f)
                rel_path = '/' + os.path.relpath(full_path, '.').replace('\\', '/').lstrip('./')
                files_to_deploy[rel_path] = full_path

    print(f"📦 Total files to deploy: {len(files_to_deploy)}")
    for p in files_to_deploy:
        print(f"  - {p}")

    # 2. Compute hashes and payloads
    manifest = {}
    upload_payload = []
    hashes = []

    for rel_path, full_path in files_to_deploy.items():
        with open(full_path, 'rb') as fp:
            content = fp.read()
        h = hashlib.md5(content).hexdigest()
        manifest[rel_path] = h
        hashes.append(h)
        
        ctype, _ = mimetypes.guess_type(full_path)
        if not ctype:
            if full_path.endswith('.js'):
                ctype = 'application/javascript'
            elif full_path.endswith('.html'):
                ctype = 'text/html'
            else:
                ctype = 'application/octet-stream'
            
        upload_payload.append({
            'key': h,
            'value': base64.b64encode(content).decode('ascii'),
            'metadata': {'contentType': ctype},
            'base64': True
        })

    # 3. Get JWT
    req = urllib.request.Request(
        f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/{PROJECT}/upload-token',
        headers={'Authorization': f'Bearer {API_TOKEN}'}
    )
    with urllib.request.urlopen(req) as r:
        jwt = json.loads(r.read().decode('utf-8'))['result']['jwt']

    print("🔑 Upload JWT obtained successfully.")

    # 4. Check missing
    req_missing = urllib.request.Request(
        'https://api.cloudflare.com/client/v4/pages/assets/check-missing',
        data=json.dumps({'hashes': hashes}).encode('utf-8'),
        headers={'Authorization': f'Bearer {jwt}', 'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req_missing) as r:
        missing = json.loads(r.read().decode('utf-8'))['result']
        
    print(f"Missing hashes at edge: {len(missing)} of {len(hashes)}")

    # 5. Upload missing
    if missing:
        to_upload = [item for item in upload_payload if item['key'] in missing]
        # Upload in chunks of 20 items if necessary
        chunk_size = 20
        for i in range(0, len(to_upload), chunk_size):
            chunk = to_upload[i:i + chunk_size]
            req_upload = urllib.request.Request(
                'https://api.cloudflare.com/client/v4/pages/assets/upload',
                data=json.dumps(chunk).encode('utf-8'),
                headers={'Authorization': f'Bearer {jwt}', 'Content-Type': 'application/json'},
                method='POST'
            )
            with urllib.request.urlopen(req_upload) as r:
                up_res = json.loads(r.read().decode('utf-8'))
                print(f"  Uploaded chunk {i // chunk_size + 1}: {up_res.get('result', {})}")

    # 6. Upsert hashes
    req_upsert = urllib.request.Request(
        'https://api.cloudflare.com/client/v4/pages/assets/upsert-hashes',
        data=json.dumps({'hashes': hashes}).encode('utf-8'),
        headers={'Authorization': f'Bearer {jwt}', 'Content-Type': 'application/json'},
        method='POST'
    )
    with urllib.request.urlopen(req_upsert) as r:
        print(f"Upsert hashes: {json.loads(r.read().decode('utf-8')).get('success')}")

    # 7. Create Deployment (Multipart form)
    boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
    
    parts = []
    parts.append(f"--{boundary}\r\n".encode('utf-8'))
    parts.append(b'Content-Disposition: form-data; name="manifest"\r\n\r\n')
    parts.append(json.dumps(manifest).encode('utf-8'))
    parts.append(b"\r\n")
    parts.append(f"--{boundary}--\r\n".encode('utf-8'))
    
    body = b"".join(parts)

    req_deploy = urllib.request.Request(
        f'https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects/{PROJECT}/deployments',
        data=body,
        headers={
            'Authorization': f'Bearer {API_TOKEN}',
            'Content-Type': f'multipart/form-data; boundary={boundary}'
        },
        method='POST'
    )

    try:
        with urllib.request.urlopen(req_deploy) as r:
            deploy_res = json.loads(r.read().decode('utf-8'))
            print("\n*** DEPLOYMENT SUCCESSFUL! ***")
            url = deploy_res.get('result', {}).get('url')
            aliases = deploy_res.get('result', {}).get('aliases', [])
            print(f"Deployment URL: {url}")
            print(f"Live Subdomain: https://{PROJECT}.pages.dev")
            if aliases:
                print(f"Aliases: {aliases}")
            return True
    except urllib.error.HTTPError as e:
        print(f"Deploy error ({e.code}): {e.read().decode('utf-8')}")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False

if __name__ == '__main__':
    main()
