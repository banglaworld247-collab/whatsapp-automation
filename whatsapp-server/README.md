# 🤖 JTS WhatsApp Automation Server (100% Free Forever)

এই সার্ভারটি ব্যবহার করে আপনি প্রতি মাসে **আনলিমিটেড টিউটর এবং হোয়াটসঅ্যাপ গ্রুপে** সম্পূর্ণ বিনামূল্যে (০ টাকা খরচে) অটোমেটিক মেসেজ পাঠাতে পারবেন।

---

## 💻 ১. লোকাল পিসিতে চালানোর নিয়ম (Local Setup)

১. টার্মিনাল ওপেন করে `whatsapp-server` ফোল্ডারে যান:
```bash
cd whatsapp-server
```

২. প্যাকেজগুলো ইন্সটল করুন:
```bash
npm install
```

৩. সার্ভার চালু করুন:
```bash
npm start
```

৪. ব্রাউজারে `http://localhost:3000` ওপেন করুন।
৫. স্ক্রিনে আসা **QR কোডটি** আপনার ফোনের **WhatsApp > Linked Devices > Link a Device** দিয়ে স্ক্যান করুন।
৬. স্ক্যান সফল হলে স্ট্যাটাস দেখাবে **"কানেক্টেড"**! 🎉

---

## ☁️ ২. Render.com-এ ২৪/৭ ফ্রিতে ডিপ্লয় করার নিয়ম (Free Cloud Hosting)

Render.com-এ এটি ফ্রিতে ২৪/৭ ব্যাকগ্রাউন্ডে চলতে থাকবে:

১. [Render.com](https://render.com)-এ ফ্রি একাউন্ট খুলে লগইন করুন।
২. আপনার গিটহাব রিপোজিটরিতে `whatsapp-server` ফোল্ডারটি পুশ করুন।
3. Render ড্যাশবোর্ডে **New + > Web Service** সিলেক্ট করুন।
4. আপনার গিটহাব রিপোজিটরি সিলেক্ট করুন।
5. সেটিংস দিন:
   - **Root Directory**: `whatsapp-server`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
6. **Create Web Service** বাটনে ক্লিক করুন।
7. ডিপ্লয় শেষ হলে Render আপনাকে একটি লাইভ URL দেবে (যেমন: `https://jts-whatsapp-bot.onrender.com`)।
8. সেই URL ব্রাউজারে ওপেন করে কিউআর কোড স্ক্যান করে কানেক্ট করে নিন।

---

## 🔗 ৩. ওয়েবসাইটে যুক্ত করার নিয়ম

Render থেকে পাওয়া URL-এর সাথে `/send-message` যোগ করে:
`https://jts-whatsapp-bot.onrender.com/send-message`

এটি আপনার **`admin-dashboard.html`**-এর **"হোয়াটসঅ্যাপ অটোমেশন > Custom Webhook"** ফিল্ডে বসিয়ে সেভ করুন।
এরপর:
- অ্যাডমিন যখনই টিউশন পোস্ট করবে, গ্রুপে অটোমেটিক মেসেজ যাবে।
- কোনো টিউটর ১ম আবেদনকারী হলে সরাসরি তার হোয়াটসঅ্যাপ নম্বরে টিউশন ও গার্ডিয়ানের তথ্য চলে যাবে।

---

## 📡 API Endpoints

- `GET /` : ড্যাশবোর্ড ও QR কোড ভিউ
- `GET /status` : কানেকশন স্ট্যাটাস চেক
- `POST /send-message` : মেসেজ পাঠানোর API
  - **Body (JSON)**:
    ```json
    {
      "to": "017XXXXXXXX",
      "message": "আপনার মেসেজ এখানে"
    }
    ```
