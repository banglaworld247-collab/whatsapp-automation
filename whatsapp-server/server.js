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

// ==========================================
// ANTI-BAN MESSAGE QUEUE
// ==========================================
const messageQueue = [];
let isProcessingQueue = false;
let queueStats = { sent: 0, failed: 0, pending: 0 };

// ==========================================
// INBOUND CLICK-TO-WHATSAPP VERIFICATION ENGINE
// ==========================================
const pendingVerifications = new Map();
let verificationStats = { requested: 0, verified: 0 };

// Auto-cleanup expired verifications every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [code, entry] of pendingVerifications.entries()) {
        if (now > entry.expiresAt) {
            pendingVerifications.delete(code);
        }
    }
}, 5 * 60 * 1000);

function normalizePhone(rawNumber) {
    let clean = String(rawNumber || '').replace(/[^0-9]/g, '');
    if (clean.startsWith('01')) {
        clean = '88' + clean;
    } else if (clean.startsWith('+8801')) {
        clean = clean.substring(1);
    }
    return clean;
}

function getBotPhoneNumber() {
    if (sock && sock.user && sock.user.id) {
        return sock.user.id.split(':')[0].replace(/[^0-9]/g, '');
    }
    return process.env.BOT_PHONE || '8801735698076';
}

async function handleIncomingVerification(senderJid, text) {
    if (!text || !senderJid) return;
    const rawSender = senderJid.split('@')[0].replace(/[^0-9]/g, '');
    const normSender = normalizePhone(rawSender);
    const upperText = text.toUpperCase();

    // Look for 6-digit code or TSBD code in text
    // E.g. "TSBD-VERIFY 482910", "TSBD 482910", "482910", "VERIFY 482910"
    const codeMatch = text.match(/\b\d{6}\b/) || text.match(/TSBD[-\s]?(\d{6})/i);
    const codeFromText = codeMatch ? (codeMatch[1] || codeMatch[0]) : null;

    let matchedEntry = null;

    for (const [codeKey, entry] of pendingVerifications.entries()) {
        if (Date.now() > entry.expiresAt) {
            pendingVerifications.delete(codeKey);
            continue;
        }

        const phoneMatches = entry.phone === normSender ||
                             normSender.endsWith(entry.phone.slice(-10)) ||
                             entry.phone.endsWith(normSender.slice(-10));
        const codeMatches = codeFromText && entry.code === codeFromText;
        const keywordMatches = upperText.includes('TSBD') || upperText.includes('VERIFY');

        // Match if code is exact OR (phone matches AND keyword/code present)
        if (codeMatches || (phoneMatches && (keywordMatches || codeFromText))) {
            matchedEntry = entry;
            break;
        }
    }

    if (matchedEntry) {
        matchedEntry.verified = true;
        matchedEntry.verifiedAt = Date.now();
        matchedEntry.verifiedPhone = normSender;
        verificationStats.verified++;
        console.log(`🎉 [Click-to-WhatsApp ভেরিফিকেশন সফল] প্রেরক: ${normSender}, কোড: ${matchedEntry.code}`);

        // Safe reply (User-initiated conversation -> Zero ban risk)
        try {
            await sock.sendMessage(senderJid, {
                text: `✅ *TSBD ভেরিফিকেশন সফল হয়েছে!*\n\nআপনার WhatsApp নম্বর (+${normSender}) সফলভাবে নিশ্চিত করা হয়েছে।\n\nঅনুগ্রহ করে ব্রাউজারে রেজিস্ট্রেশন ফর্মে ফিরে গিয়ে আবেদন সম্পন্ন করুন। ধন্যবাদ! 🎉\n\n- *Tuition Service BD (TSBD)*`
            });
        } catch (replyErr) {
            console.warn('ভেরিফিকেশন রিপ্লাই পাঠানো যায়নি:', replyErr.message);
        }
    }
}

async function processQueue() {
    if (isProcessingQueue) return;
    isProcessingQueue = true;

    while (messageQueue.length > 0) {
        queueStats.pending = messageQueue.length;
        const task = messageQueue.shift();

        if (connectionStatus !== 'connected' || !sock) {
            console.warn(`⚠️ হোয়াটসঅ্যাপ ডিসকানেক্ট থাকায় মেসেজ হোল্ড করা হয়েছে (Queue length: ${messageQueue.length})`);
            messageQueue.unshift(task); // Re-insert at front
            break;
        }

        try {
            const jid = formatRecipientJid(task.to);
            const res = await sock.sendMessage(jid, { text: String(task.message) });
            queueStats.sent++;
            console.log(`✉️ [Queue] মেসেজ সফলভাবে পাঠানো হয়েছে: ${jid} (ID: ${res.key?.id})`);
            if (task.resolve) task.resolve({ success: true, msgId: res.key?.id });
        } catch (err) {
            queueStats.failed++;
            console.error(`❌ [Queue] মেসেজ পাঠাতে ব্যর্থ (${task.to}):`, err.message);
            if (task.reject) task.reject(err);
        }

        // Anti-ban delay: randomized 2.5s - 4.5s pause between messages
        const delayMs = Math.floor(Math.random() * 2000) + 2500;
        await new Promise(r => setTimeout(r, delayMs));
    }

    queueStats.pending = messageQueue.length;
    isProcessingQueue = false;
}

function queueMessage(to, message) {
    return new Promise((resolve, reject) => {
        messageQueue.push({ to, message, resolve, reject, time: Date.now() });
        queueStats.pending = messageQueue.length;
        processQueue();
    });
}

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
            browser: ['TSBD Tuition Portal', 'Chrome', '1.0.0'],
            syncFullHistory: false
        });

        sock.ev.on('creds.update', saveCreds);

        // Listen for incoming WhatsApp messages (Inbound Click-to-WhatsApp Verification)
        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            try {
                if (!messages || !messages.length) return;
                for (const msg of messages) {
                    if (msg.key?.fromMe) continue;
                    const senderJid = msg.key?.remoteJid || '';
                    if (!senderJid || senderJid === 'status@broadcast' || senderJid.endsWith('@g.us')) continue;

                    const text = (
                        msg.message?.conversation ||
                        msg.message?.extendedTextMessage?.text ||
                        msg.message?.imageMessage?.caption ||
                        ''
                    ).trim();

                    if (!text) continue;
                    console.log(`📩 [WhatsApp ইনকামিং] ${senderJid.split('@')[0]}: "${text}"`);
                    await handleIncomingVerification(senderJid, text);
                }
            } catch (err) {
                console.error('ইনকামিং মেসেজ প্রসেসিং এরর:', err);
            }
        });

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
                // Resume queued messages if any
                processQueue();
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
app.get(['/status', '/health', '/ping'], (req, res) => {
    res.json({
        success: true,
        status: connectionStatus,
        user: connectionUser,
        botPhone: getBotPhoneNumber(),
        hasQr: !!currentQrCode,
        queue: {
            pending: messageQueue.length,
            isProcessing: isProcessingQueue,
            stats: queueStats
        },
        verification: {
            pending: pendingVerifications.size,
            stats: verificationStats
        }
    });
});

// 1.1 Inbound Click-to-WhatsApp: Request Verification Token
app.post(['/api/request-verification', '/request-verification'], (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ success: false, error: 'ফোন নম্বর প্রয়োজন।' });
        }

        const normPhone = normalizePhone(phone);
        const code = String(Math.floor(100000 + Math.random() * 900000));
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
        const botPhone = getBotPhoneNumber();

        const prefilledText = `TSBD-VERIFY ${code}`;
        const waLink = `https://wa.me/${botPhone}?text=${encodeURIComponent(prefilledText)}`;

        pendingVerifications.set(code, {
            code,
            phone: normPhone,
            verified: false,
            createdAt: Date.now(),
            expiresAt
        });
        verificationStats.requested++;

        console.log(`📱 [ভেরিফিকেশন অনুরোধ] নম্বর: ${normPhone}, কোড: ${code}, বট নম্বর: ${botPhone}`);

        return res.json({
            success: true,
            code,
            botPhone,
            waLink,
            prefilledText,
            expiresInSeconds: 600
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// 1.2 Inbound Click-to-WhatsApp: Poll / Check Verification Status
app.get(['/api/check-verification', '/check-verification'], (req, res) => {
    try {
        const { code, phone } = req.query;
        if (!code && !phone) {
            return res.status(400).json({ success: false, error: 'code বা phone প্যারামিটার প্রয়োজন।' });
        }

        let entry = null;
        if (code && pendingVerifications.has(String(code).trim())) {
            entry = pendingVerifications.get(String(code).trim());
        } else if (phone) {
            const norm = normalizePhone(phone);
            for (const [k, v] of pendingVerifications.entries()) {
                if (v.phone === norm || norm.endsWith(v.phone.slice(-10)) || v.phone.endsWith(norm.slice(-10))) {
                    entry = v;
                    break;
                }
            }
        }

        if (!entry) {
            return res.json({
                success: true,
                verified: false,
                message: 'কোনো পেন্ডিং ভেরিফিকেশন পাওয়া যায়নি বা মেয়াদ উত্তীর্ণ।'
            });
        }

        return res.json({
            success: true,
            verified: !!entry.verified,
            phone: entry.verifiedPhone || entry.phone,
            code: entry.code,
            verifiedAt: entry.verifiedAt || null
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// 1.3 Check if phone exists on WhatsApp (Zero message sent - purely metadata lookup)
app.post(['/api/check-number', '/check-number', '/api/verify-number'], async (req, res) => {
    try {
        const { phone } = req.body;
        if (!phone) {
            return res.status(400).json({ success: false, error: 'phone নম্বর প্রয়োজন।' });
        }

        if (connectionStatus !== 'connected' || !sock) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp বট এখনও কানেক্টেড নয়।'
            });
        }

        const jid = formatRecipientJid(phone);
        const results = await sock.onWhatsApp(jid);
        const exists = Array.isArray(results) && results.length > 0 && results[0].exists;

        return res.json({
            success: true,
            exists: !!exists,
            jid: exists ? results[0].jid : null
        });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Single Message Send (Queued & Safe - supports multiple route aliases)
app.post(['/send-message', '/send', '/api/send-message', '/api/send'], async (req, res) => {
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
                error: 'WhatsApp বট এখনও কানেক্টেড হয়নি। Render ড্যাশবোর্ডে গিয়ে QR কোড স্ক্যান করে লগইন করুন।'
            });
        }

        // Add to anti-ban queue
        queueMessage(to, message).then().catch(() => {});

        return res.json({
            success: true,
            message: 'মেসেজ কিউ-তে যুক্ত হয়েছে এবং নিরাপদে পাঠানো হচ্ছে।',
            queuePosition: messageQueue.length
        });

    } catch (error) {
        console.error('মেসেজ পাঠাতে সমস্যা:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'মেসেজ পাঠানো ব্যর্থ হয়েছে'
        });
    }
});

// 2.1 Direct High-Priority OTP Send Endpoint (Immediate delivery for verification)
app.post(['/send-otp', '/api/send-otp'], async (req, res) => {
    try {
        const { to, otp, message } = req.body;

        if (!to || (!otp && !message)) {
            return res.status(400).json({
                success: false,
                error: 'to (মোবাইল নম্বর) এবং otp অথবা message প্রয়োজন।'
            });
        }

        if (connectionStatus !== 'connected' || !sock) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp বট এখনও কানেক্টেড নয়।'
            });
        }

        const otpText = message || `🔒 *TSBD টিউশন পোর্টাল (ভেরিফিকেশন)*\n\nআপনার WhatsApp ভেরিফিকেশন কোড (OTP) হলো:\n\n👉 *${otp}*\n\n⏱️ এটি ৫ মিনিটের জন্য কার্যকর থাকবে। অনুগ্রহ করে কাউকে এই কোডটি শেয়ার করবেন না।`;
        const jid = formatRecipientJid(to);
        const sendResult = await sock.sendMessage(jid, { text: otpText });

        console.log(`🔐 [OTP] ভেরিফিকেশন কোড পাঠানো হয়েছে: ${jid} (ID: ${sendResult.key?.id})`);

        return res.json({
            success: true,
            message: 'WhatsApp-এ OTP সফলভাবে পাঠানো হয়েছে!',
            msgId: sendResult.key?.id
        });

    } catch (error) {
        console.error('OTP পাঠাতে সমস্যা:', error);
        return res.status(500).json({
            success: false,
            error: error.message || 'OTP পাঠানো ব্যর্থ হয়েছে'
        });
    }
});

// 3. Bulk Message Send API (Broadcast with automated delays)
app.post('/send-bulk', async (req, res) => {
    try {
        const { recipients, message } = req.body;

        if (!Array.isArray(recipients) || recipients.length === 0 || !message) {
            return res.status(400).json({
                success: false,
                error: 'recipients (নম্বরের লিস্ট/Array) এবং message প্রয়োজন।'
            });
        }

        if (connectionStatus !== 'connected' || !sock) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp বট কানেক্টেড নয়।'
            });
        }

        recipients.forEach(to => {
            if (to) queueMessage(to, message).catch(() => {});
        });

        return res.json({
            success: true,
            message: `${recipients.length} টি নম্বরে ব্রডকাস্ট কিউ-তে পাঠানো হয়েছে।`,
            totalQueued: messageQueue.length
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            error: error.message || 'বাল্ক মেসেজ ব্যর্থ হয়েছে।'
        });
    }
});

// 4. Web Dashboard UI
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TSBD WhatsApp Bot Server (Anti-Ban Engine)</title>
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
        .box { background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 32px; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
        .logo { font-size: 48px; color: #22C55E; margin-bottom: 12px; }
        h1 { font-size: 22px; margin-bottom: 8px; color: #FFF; }
        p { font-size: 14px; color: var(--muted); margin-bottom: 24px; line-height: 1.5; }
        .status-badge { display: inline-flex; align-items: center; gap: 8px; padding: 8px 18px; border-radius: 30px; font-weight: 700; font-size: 14px; margin-bottom: 20px; }
        .connected { background: rgba(34, 197, 94, 0.2); color: #4ADE80; border: 1px solid rgba(34, 197, 94, 0.4); }
        .connecting { background: rgba(245, 158, 11, 0.2); color: #FBBF24; border: 1px solid rgba(245, 158, 11, 0.4); }
        .disconnected { background: rgba(239, 68, 68, 0.2); color: #F87171; border: 1px solid rgba(239, 68, 68, 0.4); }
        .qr-wrapper { background: #FFF; padding: 16px; border-radius: 12px; display: inline-block; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); }
        .qr-wrapper img { width: 220px; height: 220px; display: block; }
        .queue-box { display: flex; justify-content: space-around; background: rgba(0,0,0,0.25); border-radius: 10px; padding: 12px; margin-bottom: 20px; border: 1px solid var(--border); }
        .queue-item { font-size: 12px; color: var(--muted); }
        .queue-item span { display: block; font-size: 18px; font-weight: 700; color: #FFF; margin-top: 4px; }
        .test-box { background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius: 10px; padding: 16px; margin-top: 10px; text-align: left; }
        .test-box input, .test-box textarea { width: 100%; padding: 10px; border-radius: 6px; background: var(--bg); border: 1px solid var(--border); color: #FFF; margin-bottom: 10px; font-size: 13px; }
        .btn { background: #22C55E; color: #FFF; border: none; padding: 10px 16px; border-radius: 6px; font-weight: 700; cursor: pointer; width: 100%; }
        .btn:hover { background: #16A34A; }
    </style>
</head>
<body>
    <div class="box">
        <div class="logo"><i class="fa-brands fa-whatsapp"></i></div>
        <h1>TSBD WhatsApp Bot Server</h1>
        <p>Anti-Ban স্মার্ট কিউ সিস্টেম সহ অটোমেশন সার্ভার</p>

        <div id="statusWrap">
            ${connectionStatus === 'connected' ? `
                <div class="status-badge connected">
                    <i class="fa-solid fa-circle-check"></i> কানেক্টেড (${connectionUser || 'Active'})
                </div>
                <p style="color:#34D399;font-size:13px;"><i class="fa-solid fa-shield-halved"></i> অ্যান্টি-ব্যান সুরক্ষা ও মেসেজ কিউ সক্রিয় রয়েছে।</p>
            ` : connectionStatus === 'connecting' && currentQrCode ? `
                <div class="status-badge connecting">
                    <i class="fa-solid fa-qrcode"></i> QR কোড স্ক্যান করুন
                </div>
                <div class="qr-wrapper">
                    <img src="${currentQrCode}" alt="WhatsApp QR Code">
                </div>
                <p style="color:#FBBF24;font-size:13px;">হোয়াটসঅ্যাপ থেকে Linked Devices > Link a Device অপশনে স্ক্যান করুন।</p>
            ` : `
                <div class="status-badge disconnected">
                    <i class="fa-solid fa-circle-xmark"></i> ডিসকানেক্টেড
                </div>
                <p style="color:#F87171;font-size:13px;">সার্ভারে কিউআর কোড জেনারেট হচ্ছে... পৃষ্ঠা রিফ্রেশ করুন।</p>
            `}
        </div>

        <div class="queue-box">
            <div class="queue-item">পেন্ডিং কিউ <span id="qPending">${queueStats.pending}</span></div>
            <div class="queue-item">সফল মেসেজ <span id="qSent" style="color:#4ADE80;">${queueStats.sent}</span></div>
            <div class="queue-item">ব্যর্থ মেসেজ <span id="qFailed" style="color:#F87171;">${queueStats.failed}</span></div>
        </div>

        <div class="queue-box" style="margin-top: -10px; border-color: rgba(34, 197, 94, 0.3);">
            <div class="queue-item">ভেরিফাই অনুরোধ <span id="vReq" style="color:#38BDF8;">${verificationStats.requested}</span></div>
            <div class="queue-item">সফল ভেরিফাইড <span id="vDone" style="color:#4ADE80;">${verificationStats.verified}</span></div>
            <div class="queue-item">পেন্ডিং ভেরিফাই <span id="vPending" style="color:#FBBF24;">${pendingVerifications.size}</span></div>
        </div>

        <div class="test-box">
            <h4 style="font-size:14px;color:#38BDF8;margin-bottom:10px;"><i class="fa-solid fa-paper-plane"></i> টেস্ট মেসেজ পাঠান</h4>
            <input type="text" id="testTo" placeholder="নম্বর বা গ্রুপ আইডি: 017XXXXXXXX">
            <textarea id="testMsg" rows="2" placeholder="টেস্ট বার্তা লিখুন..."></textarea>
            <button type="button" class="btn" onclick="sendTest()"><i class="fa-solid fa-paper-plane"></i> কিউ-তে পাঠান</button>
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
            status.innerText = 'কিউ-তে যোগ হচ্ছে...';

            try {
                const res = await fetch('/send-message', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ to, message: msg })
                });
                const data = await res.json();
                if(data.success) {
                    status.style.color = '#34D399';
                    status.innerText = '✅ ' + data.message;
                } else {
                    status.style.color = '#F87171';
                    status.innerText = '❌ এরর: ' + data.error;
                }
            } catch(e) {
                status.style.color = '#F87171';
                status.innerText = '❌ এরর: ' + e.message;
            }
        }

        setInterval(async () => {
            try {
                const res = await fetch('/status');
                const data = await res.json();
                if (data.queue) {
                    document.getElementById('qPending').innerText = data.queue.pending;
                    document.getElementById('qSent').innerText = data.queue.stats.sent;
                    document.getElementById('qFailed').innerText = data.queue.stats.failed;
                }
                if (data.verification) {
                    if (document.getElementById('vReq')) document.getElementById('vReq').innerText = data.verification.stats.requested;
                    if (document.getElementById('vDone')) document.getElementById('vDone').innerText = data.verification.stats.verified;
                    if (document.getElementById('vPending')) document.getElementById('vPending').innerText = data.verification.pending;
                }
                if((data.status === 'connected' && document.querySelector('.connecting')) ||
                   (data.status === 'connecting' && document.querySelector('.disconnected'))) {
                    location.reload();
                }
            } catch(e) {}
        }, 3000);
    </script>
</body>
</html>
    `);
});

// Start Express Server
app.listen(PORT, () => {
    console.log(`🚀 TSBD WhatsApp Bot (Anti-Ban v2) চালু হয়েছে: http://localhost:${PORT}`);
});
