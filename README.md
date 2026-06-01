# ⛪ نظام الافتقاد — Church Followup System

تطبيق ويب متكامل لمتابعة افتقاد الخدمة الكنسية، مبني بـ Next.js + Supabase.

---

## 🚀 خطوات الإعداد الكاملة

### الخطوة 1: تثبيت الـ packages

```bash
npm install
```

---

### الخطوة 2: إنشاء مشروع Supabase

1. روح [supabase.com](https://supabase.com) وعمل أكونت مجاني
2. اضغط **New Project**
3. اختار:
   - اسم المشروع: `church-followup`
   - Region: **Europe (Frankfurt)** — الأقرب لمصر
4. استنى 2 دقيقة لحد ما المشروع يتعمل

---

### الخطوة 3: إعداد قاعدة البيانات

1. في Supabase Dashboard، روح **SQL Editor**
2. افتح ملف `supabase-schema.sql` من المشروع
3. الصق محتواه في SQL Editor واضغط **Run**

---

### الخطوة 4: إنشاء أكونت أبونا

1. في Supabase Dashboard، روح **Authentication → Users → Add User**
2. ادخل إيميل وباسورد أبونا
3. بعد ما اليوزر يتعمل، جيب الـ UUID بتاعه من نفس الصفحة
4. شغّل في SQL Editor:

```sql
update profiles
set role = 'admin', name = 'أبونا [الاسم هنا]'
where id = 'ضع-UUID-هنا';
```

---

### الخطوة 5: متغيرات البيئة

1. روح Supabase → **Settings → API**
2. عمل ملف `.env.local` في root المشروع:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

> ⚠️ الـ Service Role Key موجود في نفس الصفحة — لا تشاركه مع حد

---

### الخطوة 6 (اختياري): إعداد Firebase للإشعارات

1. روح [console.firebase.google.com](https://console.firebase.google.com)
2. عمل مشروع جديد
3. روح **Project Settings → Cloud Messaging**
4. خد الـ VAPID Key والـ Server Key
5. ضيف في `.env.local`:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=xxx
NEXT_PUBLIC_FIREBASE_APP_ID=xxx
NEXT_PUBLIC_FIREBASE_VAPID_KEY=xxx
FIREBASE_SERVER_KEY=xxx
```

6. في `public/firebase-messaging-sw.js`، عدّل القيم بنفس القيم من Firebase Console

---

### الخطوة 7: تشغيل المشروع

```bash
npm run dev
```

افتح المتصفح على `http://localhost:3000`

---

### الخطوة 8: Deploy على Vercel

```bash
npm install -g vercel
vercel
```

في Vercel Dashboard → **Settings → Environment Variables** ضيف كل الـ variables من `.env.local`.

---

## 📱 كيفية الاستخدام

### أبونا (Admin)
1. سجّل دخول بأكونت أبونا
2. من **الوزنات**: عمل وزنة وحدد ديدلاين وعيّن الخدام
3. من **إدارة المخدومين**: ضيف أسماء وأرقام المخدومين
4. من **الخدام**: عمل أكونتات للخدام وادّيهم الإيميل والباسورد
5. من **التقارير**: تابع تقدم الافتقاد وصدّر PDF/Excel

### الخادم (Servant)
1. سجّل دخول بالأكونت اللي عمله أبونا
2. هيظهرله قائمة مخدوميه
3. يضغط 📞 على اسم كل مخدوم → الموبايل يتصل تلقائياً
4. بعد المكالمة: يختار "رد عليّ ✅" أو "ما ردش ❌"
5. ممكن يكتب ملاحظة (مثلاً: مريض، سافر)

---

## 🗂️ هيكل المشروع

```
church-followup/
├── app/
│   ├── login/page.js              # صفحة الدخول
│   ├── servant/
│   │   ├── layout.js              # layout الخادم
│   │   ├── page.js                # قائمة الوزنة + زرار الاتصال
│   │   └── change-password/page.js
│   ├── admin/
│   │   ├── layout.js              # layout أبونا + bottom nav
│   │   ├── page.js                # الداشبورد + الإحصائيات
│   │   ├── servants/page.js       # إدارة الخدام
│   │   ├── groups/
│   │   │   ├── page.js            # إدارة الوزنات
│   │   │   └── [groupId]/members/page.js
│   │   └── reports/page.js        # التقارير + الجولات + التصدير
│   └── api/
│       ├── create-servant/route.js
│       ├── delete-servant/route.js
│       └── send-notification/route.js
├── components/
│   └── VisitChart.js              # رسم بياني recharts
├── lib/
│   ├── supabase.js                # Supabase browser client
│   ├── supabase-server.js         # Supabase server client
│   ├── firebase.js                # Firebase notifications
│   ├── utils.js                   # helper functions
│   ├── export.js                  # PDF + Excel export
│   ├── useDarkMode.js             # dark mode hook
│   └── useNotifications.js        # push notifications hook
├── public/
│   ├── manifest.json              # PWA manifest
│   └── firebase-messaging-sw.js   # Firebase service worker
├── middleware.js                  # Auth routing
├── supabase-schema.sql            # Database schema
└── .env.local.example             # Template للـ environment variables
```

---

## ✅ الـ Features الموجودة

| Feature | الوصف |
|---------|-------|
| 🔐 Authentication | لوجين منفصل لأبونا والخدام مع redirect تلقائي |
| 👥 إدارة الخدام | أبونا يعمل ويحذف أكونتات الخدام |
| 📋 إدارة الوزنات | إنشاء وتعديل الوزنات مع تعيين الخدام والديدلاين |
| 👤 إدارة المخدومين | إضافة وتعديل وحذف المخدومين مع بحث |
| 📞 زرار الاتصال | يفتح مكالمة عادية من موبايل الخادم |
| 💬 بوب أب بعد المكالمة | تسجيل "رد / ما ردش" + ملاحظة اختيارية |
| 🔒 الديدلاين | بعد الوقت المحدد زرار الاتصال بيتقفل |
| 📊 الداشبورد | إحصائيات شاملة + رسم بياني لكل الوزنات |
| 📈 التقارير | تقارير تفصيلية مع نظام الجولات |
| 📄 تصدير PDF/Excel | تصدير التقارير بضغطة زرار |
| 🔔 إشعارات Push | إشعار للخدام لما أبونا يحدد ديدلاين |
| 🌙 Dark Mode | الوضع الداكن مع حفظ الإعداد |
| 🔄 Multi-Group | الخادم ممكن يكون في أكتر من وزنة |
| 🔑 تغيير الباسورد | الخادم يغيّر باسورده من جوه الأبليكيشن |
| 📱 PWA | التطبيق يتنزّل على الهاتف زي app حقيقية |

---

## 🛠️ التقنيات المستخدمة

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL + Auth + RLS)
- **Charts**: Recharts
- **Export**: jsPDF + jspdf-autotable + SheetJS
- **Notifications**: Firebase Cloud Messaging
- **PWA**: next-pwa
- **Deploy**: Vercel (مجاني)

---

## 🆘 مشاكل شائعة وحلولها

**مشكلة: "الإيميل أو الباسورد غلط"**
- تأكد إنك شغّلت SQL Schema كامل
- تأكد إنك غيّرت role أبونا لـ `admin` في SQL

**مشكلة: "لسه مش متعيّن لك وزنة"**
- تأكد إن الخادم موجود في جدول `servant_groups`
- روح admin وعيّن الخادم لوزنة من صفحة الوزنات

**مشكلة: الإشعارات مش شغالة**
- تأكد إن Firebase variables موجودة في `.env.local`
- تأكد إنك عدّلت `firebase-messaging-sw.js` بالقيم الحقيقية
- الإشعارات بتشتغل على HTTPS بس (مش localhost)

**مشكلة: تصدير PDF/Excel مش شغال**
- تأكد إن `jspdf` و `xlsx` متثبتين
- جرب تعمل `npm install` تاني
