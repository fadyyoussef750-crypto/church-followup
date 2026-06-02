# ⛪ نظام الافتقاد الكنسي — Multi-Tenant

كل كاهن يسجّل أكونت منفصل، وبيئته معزولة تماماً عن باقي الكهنة.

---

## 🔑 طريقة عمل النظام

### أبونا (Admin)
1. يروح `/register` ويعمل أكونته الخاص
2. بعد الدخول على `/admin` يقدر يـ:
   - يضيف خدامه من صفحة الخدام
   - يعمل وزنات
   - يضيف مخدومين
   - يشوف التقارير
3. الخدام بتوعه **لا يشوفهم أي كاهن تاني**

### الخادم
1. **مش يقدر يسجّل بنفسه** — أبونا بس اللي يضيفه
2. أبونا بينشئ ليه إيميل وباسورد ويبعتهولو مع لينك `/login`
3. الخادم بيدخل ويشوف **وزنته بس** اللي أبونا بتاعه حطّه فيها

---

## 🚀 خطوات التشغيل

### 1. إعداد Supabase

- اعمل مشروع جديد على [supabase.com](https://supabase.com)
- روح **SQL Editor** وانسخ محتوى `supabase-schema.sql` وشغّله
- من **Project Settings → API** جيب:
  - `Project URL`
  - `anon public` key
  - `service_role` key (سري — متشاركوش)

### 2. ملف البيئة

انسخ الملف:
```bash
cp .env.local.example .env.local
```

وعبّيه:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 3. تشغيل محلي

```bash
npm install
npm run dev
```

افتح `http://localhost:3000`

---

## 📁 هيكل الملفات

```
app/
├── login/          # صفحة الدخول (كهنة + خدام)
├── register/       # تسجيل أبونا الجديد
├── admin/          # لوحة تحكم أبونا
│   ├── page.js           # الرئيسية + إحصائيات
│   ├── servants/         # إدارة الخدام
│   ├── groups/           # إدارة الوزنات
│   └── reports/          # التقارير
├── servant/        # صفحة الخادم
│   └── change-password/  # تغيير الباسورد
└── api/
    ├── create-servant/   # إنشاء خادم (مربوط بأبونا)
    └── delete-servant/   # حذف خادم (بعد التحقق)
```

---

## 🛡️ الأمان (Multi-Tenant)

- كل خادم عنده `admin_id` في الـ database بيربطه بأبونا بتاعه
- الـ RLS Policies بتمنع أي أبونا يشوف بيانات أبونا تاني
- حذف الخادم بيتحقق إن الخادم فعلاً تابع للأبونا اللي طالب الحذف
- الخدام مش يقدروا يسجّلوا — أبونا بس

---

## ⚙️ Supabase Auth Settings

في **Authentication → Settings**:
- **Confirm email**: يُفضّل تعطّله للتجربة
- **Site URL**: حط URL الـ deploy بتاعك
