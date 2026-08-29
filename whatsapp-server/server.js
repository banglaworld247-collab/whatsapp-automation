const express = require('express');
const cors = require('cors');
const QRCode = require('qrcode');
const pino = require('pino');
const path = require('path');
const fs = require('fs');

const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion
} = require('@whiskeysockets/baileys');

const app = express();
const PORT = process.env.PORT || 3000;
const AUTH_DIR = path.join(__dirname, 'auth_info_baileys');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let sock = null;
let currentQrCode = null;
let connectionStatus = 'initializing'; // 'connecting' | 'connected' | 'disconnected'
let connectionUser = null;

// Initialize WhatsApp connection
async function connectToWhatsApp() {
    try {
        if (!fs.existsSync(AUTH_DIR)) {
            fs.mkdirSync(AUTH_DIR, { recursive: true });
        }

        const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
        const { version } = await fetchLatestBaileysVersion();

        sock = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: true,
            auth: state,
            browser: ['JTS Tuition Portal', 'Chrome', '1.0.0'],
            syncFullHistory: false
        });

        sock.ev.on('creds.update', saveCreds);

        sock.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                currentQrCode = await QRCode.toDataURL(qr);
                connectionStatus = 'connecting';
                console.log('📌 নতুন QR কোড এসেছে! ব্রাউজারে স্ক্যান করুন: http://localhost:' + PORT);
            }

            if (connection === 'close') {
                const shouldReconnect = (lastDisconnect?.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                connectionStatus = 'disconnected';
                connectionUser = null;
                console.log('⚠️ WhatsApp সংযোগ বন্ধ হয়েছে। কারণ:', lastDisconnect?.error?.message || 'Unknown');

                if (shouldReconnect) {
                    console.log('🔄 পুনরায় সংযোগের চেষ্টা করা হচ্ছে (5 সেকেন্ড পর)...');
                    setTimeout(connectToWhatsApp, 5000);
                } else {
                    console.log('❌ লগআউট হয়েছে। পুনরায় কানেক্ট করতে কিউআর কোড স্ক্যান করুন।');
                    currentQrCode = null;
                    if (fs.existsSync(AUTH_DIR)) {
                        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
                    }
                    setTimeout(connectToWhatsApp, 3000);
                }
            } else if (connection === 'open') {
                connectionStatus = 'connected';
                currentQrCode = null;
                connectionUser = sock.user?.id || 'Connected';
                console.log('✅ WhatsApp সফলভাবে সংযুক্ত হয়েছে! ইউজার:', connectionUser);
            }
        });

    } catch (err) {
        console.error('WhatsApp কানেকশন এরর:', err);
        setTimeout(connectToWhatsApp, 5000);
    }
}

// Start connection
connectToWhatsApp();

// Helper: Format recipient number to WhatsApp JID format
function formatRecipientJid(rawNumber) {
    let clean = String(rawNumber || '').replace(/[^0-9@.a-zA-Z_-]/g, '').trim();

    // If it's already a group JID or full JID
    if (clean.includes('@g.us') || clean.includes('@s.whatsapp.net')) {
        return clean;
    }

    // BD Phone normalization (017... -> 88017...)
    clean = clean.replace(/[^0-9]/g, '');
    if (clean.startsWith('01')) {
        clean = '88' + clean;
    } else if (clean.startsWith('+8801')) {
        clean = clean.substring(1);
    }

    return `${clean}@s.whatsapp.net`;
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Status Check API
app.get('/status', (req, res) => {
    res.json({
        success: true,
        status: connectionStatus,
        user: connectionUser,
        hasQr: !!currentQrCode
    });
});

// 2. Send Message API (Used by tuition-details.html & admin-dashboard.html)
app.post('/send-message', async (req, res) => {
    try {
        const { to, message } = req.body;

        if (!to || !message) {
            return res.status(400).json({
                success: false,
                error: 'to (নম্বর বা গ্রুপ আইডি) এবং message উভয়টি প্রয়োজন।'
            });
        }

        if (connectionStatus !== 'connected' || !sock) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp বট এখনও কানেক্টেড হয়নি। দয়া করে QR কোড স্ক্যান করে লগইন করুন।'
            });
        }

        const jid = formatRecipientJid(to);

        // Send message via Baileys
        const result = await sock.sendMessage(jid, { text: String(message) });

        console.log(`✉️ মেসেজ পাঠানো হয়েছে: ${jid}`);
        return res.json({
            success: true,
            message: 'মেসেজ সফলভাবে পৌঁছেছে',
            msgId: result.key?.id
        });

    } catch (error) {
        console.error('মেসেজ পাঠাতে সমস্যা:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'মেসেজ পাঠানো ব্যর্থ হয়েছে'
        });
    }
});

// 3. Web Dashboard UI (Visit in browser to see status & scan QR)
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>JTS WhatsApp Bot Server</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --bg: #0A1A2F;
            --card: #13233D;
            --accent: #22C55E;
            --text: #F3F4F6;
            --muted: #9CA3AF;
            --border: #1E3A5F;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Noto Sans Bengali', sans-serif; }
        body { background: var(--bg); color: var(--text); display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
        .box { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 32px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .logo { font-size: 48px; color: #22C55E; margin-bottom: 12px; }
        h1 { font-size: 22px; margin-bottom: 8px; color: #FFF; }
        p { font-size: 14px; color: var(--muted); margin-bottom: 24px; line-height: 1.5; }
        .status-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; border-radius: 30px; font-weight: 700; font-size: 14px; margin-bottom: 24px; }
        .connected { background: rgba(34, 197, 94, 0.2); color: #4ADE80; border: 1px solid rgba(34, 197, 94, 0.4); }
        .connecting { background: rgba(245, 158, 11, 0.2); color: #FBBF24; border: 1px solid rgba(245, 158, 11, 0.4); }
        .disconnected { background: rgba(239, 68, 68, 0.2); color: #F87171; border: 1px solid rgba(239, 68, 68, 0.4); }
        .qr-wrapper { background: #FFF; padding: 16px; border-radius: 12px; display: inline-block; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
        .qr-wrapper img { width: 220px; height: 220px; display: block; }
        .test-box { background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 10px; padding: 16px; margin-top: 20px; text-align: left; }
        .test-box input, .test-box textarea { width: 100%; padding: 10px; border-radius: 6px; background: var(--bg); border: 1px solid var(--border); color: #FFF; margin-bottom: 10px; font-size: 13px; }
        .btn { background: #22C55E; color: #FFF; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; width: 100%; }
        .btn:hover { background: #16A34A; }
    </style>
</head>
<body>
    <div class="box">
        <div class="logo"><i class="fa-brands fa-whatsapp"></i></div>
        <h1>JTS WhatsApp Bot Server</h1>
        <p>২৪/৭ ফ্রিতে আনলিমিটেড টিউটর ও গ্রুপে মেসেজ অটোমেশন</p>

        <div id="statusWrap">
            ${connectionStatus === 'connected' ? `
                <div class="status-badge connected">
                    <i class="fa-solid fa-circle-check"></i> কানেক্টেড (${connectionUser || 'Active'})
                </div>
                <p style="color:#34D399;font-size:13px;"><i class="fa-solid fa-bolt"></i> বট সক্রিয় আছে এবং মেসেজ পাঠানোর জন্য প্রস্তুত!</p>
            ` : connectionStatus === 'connecting' && currentQrCode ? `
                <div class="status-badge connecting">
                    <i class="fa-solid fa-qrcode"></i> QR কোড স্ক্যান করুন
                </div>
                <div class="qr-wrapper">
                    <img src="${currentQrCode}" alt="WhatsApp QR Code">
                </div>
                <p style="font-size:12px;color:var(--muted)">আপনার ফোনের WhatsApp > Linked Devices-এ গিয়ে স্ক্যান করুন।</p>
            ` : `
                <div class="status-badge disconnected">
                    <i class="fa-solid fa-spinner fa-spin"></i> সংযোগ চালু হচ্ছে...
                </div>
            `}
        </div>

        <div class="test-box">
            <h4 style="font-size:14px;color:#38BDF8;margin-bottom:10px;"><i class="fa-solid fa-paper-plane"></i> টেস্ট মেসেজ পাঠান</h4>
            <input type="text" id="testTo" placeholder="নম্বর: 017XXXXXXXX">
            <textarea id="testMsg" rows="2" placeholder="টেস্ট মেসেজ লিখুন..."></textarea>
            <button type="button" class="btn" onclick="sendTest()"><i class="fa-solid fa-paper-plane"></i> মেসেজ পাঠান</button>
            <p id="testStatus" style="margin-top:8px;font-size:12px;display:none;"></p>
        </div>
    </div>

    <script>
        async function sendTest() {
            const to = document.getElementById('testTo').value.trim();
            const msg = document.getElementById('testMsg').value.trim();
            const status = document.getElementById('testStatus');
            if(!to || !msg) { alert('নম্বর ও মেসেজ দিন'); return; }
            status.style.display = 'block';
            status.style.color = '#93C5FD';
            status.innerText = 'পাঠানো হচ্ছে...';

            try {
                const res = await fetch('/send-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to, message: msg })
                });
                const data = await res.json();
                if(data.success) {
                    status.style.color = '#34D399';
                    status.innerText = '✅ মেসেজ সফলভাবে পাঠানো হয়েছে!';
                } else {
                    status.style.color = '#F87171';
                    status.innerText = '❌ এরর: ' + data.error;
                }
            } catch(e) {
                status.style.color = '#F87171';
                status.innerText = '❌ এরর: ' + e.message;
            }
        }

        // Auto refresh page if waiting for QR or status change
        setInterval(async () => {
            try {
                const res = await fetch('/status');
                const data = await res.json();
                if((data.status === 'connected' && document.querySelector('.connecting')) ||
                   (data.status === 'connecting' && document.querySelector('.disconnected'))) {
                    location.reload();
                }
            } catch(e) {}
        }, 4000);
    </script>
</body>
</html>
    `);
});

// Start Express Server
app.listen(PORT, () => {
    console.log(`🚀 JTS WhatsApp Bot সার্ভার চালু হয়েছে: http://localhost:${PORT}`);
});
