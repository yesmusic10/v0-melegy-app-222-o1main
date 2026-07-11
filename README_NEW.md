# 🎯 Melegy - نظام متكامل للدردشات والاشتراكات

> **نظام متقدم لإدارة الدردشات مع مصادقة آمنة وخطط اشتراك ديناميكية**

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-336791?style=flat-square&logo=postgresql)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?style=flat-square&logo=typescript)
![Better Auth](https://img.shields.io/badge/Better%20Auth-Latest-4F46E5?style=flat-square)

---

## 📖 المحتويات

- [المميزات](#-المميزات)
- [البدء السريع](#-البدء-السريع)
- [البنية](#-البنية)
- [قاعدة البيانات](#-قاعدة-البيانات)
- [المصادقة](#-المصادقة)
- [الاشتراكات](#-الاشتراكات)
- [الدردشات](#-الدردشات)
- [المتغيرات البيئية](#-متغيرات-البيئة)

---

## ✨ المميزات

### 🔐 المصادقة
- ✅ تسجيل عبر Email + Password
- ✅ تسجيل دخول عبر Google OAuth
- ✅ إدارة جلسات آمنة (7 أيام)
- ✅ توثيق البريد الإلكتروني
- ✅ توجيه تلقائي للصفحات المحمية

### 💳 الاشتراكات
- ✅ 4 خطط: Free, Starter, Pro, VIP
- ✅ حدود ديناميكية لكل خطة
- ✅ تتبع الاستخدام الشهري
- ✅ سهولة الترقية والتنزيل
- ✅ إدارة تلقائية للاشتراكات

### 💬 الدردشات
- ✅ إنشاء دردشات متعددة
- ✅ حفظ جميع الرسائل
- ✅ أرشفة الدردشات
- ✅ حذف آمن
- ✅ metadata للرسائل

### 🛡️ الأمان
- ✅ User scoping في جميع الاستعلامات
- ✅ جلسات محمية بـ encryption
- ✅ كوكيز آمنة (httpOnly, secure)
- ✅ Server Actions للعمليات الحساسة
- ✅ عدم تعريض بيانات حساسة

---

## 🚀 البدء السريع

### المتطلبات
- Node.js 18+ 
- npm أو yarn
- حساب Neon (اختياري - يمكن استخدام PostgreSQL محلي)
- حساب Google (للـ OAuth)

### التثبيت

```bash
# استنساخ المشروع
git clone https://github.com/yesmusic10/v0-melegy-app.git
cd v0-melegy-app

# تثبيت المتطلبات
npm install

# إضافة المتغيرات البيئية
cp .env.example .env.development.local
# احرر .env.development.local وأضف المتغيرات

# تشغيل خادم التطوير
npm run dev
```

سيكون التطبيق متاحاً على `http://localhost:3000`

---

## 📁 البنية

```
melegy/
├── lib/
│   ├── auth.ts                      # Better Auth config ⭐
│   ├── auth-client.ts               # React client
│   ├── db/
│   │   ├── index.ts                 # Drizzle setup
│   │   └── schema.ts                # Schema definitions
│   └── contexts/
│       ├── AuthContext.tsx          # Auth provider
│       └── AppContext.tsx           # App provider
│
├── app/
│   ├── sign-in/page.tsx             # Sign in page
│   ├── sign-up/page.tsx             # Sign up page
│   ├── app/
│   │   ├── page.tsx                 # Dashboard (protected)
│   │   └── chat/[id]/page.tsx       # Chat page
│   ├── api/auth/[...all]/           # Auth endpoints
│   ├── actions/
│   │   ├── users.ts                 # User & subscription ops
│   │   └── conversations.ts         # Chat operations
│   └── pricing/page.tsx             # Pricing page
│
├── components/
│   ├── auth-form.tsx                # Auth form
│   ├── chat-dashboard.tsx           # Dashboard
│   └── chat-window.tsx              # Chat UI
│
└── [config files]
```

---

## 🗄️ قاعدة البيانات

### الجداول

#### Better Auth (المصادقة)
```typescript
user          // بيانات المستخدمين
session       // الجلسات النشطة
account       // حسابات OAuth
verification  // توثيق البريد
```

#### التطبيق
```typescript
subscription  // الاشتراكات
conversation  // الدردشات
message       // الرسائل
userPreference // التفضيلات
```

### العلاقات
```
user ──→ session
user ──→ account
user ──→ subscription
user ──→ conversation
conversation ──→ message
user ──→ userPreference
```

---

## 🔐 المصادقة

### كيفية العمل

```typescript
// التسجيل
import { authClient } from '@/lib/auth-client'

const { data, error } = await authClient.signUp.email({
  email: 'user@example.com',
  password: 'password123',
  name: 'اسم المستخدم'
})

// تسجيل الدخول
const { data, error } = await authClient.signIn.email({
  email: 'user@example.com',
  password: 'password123'
})

// Google OAuth
await authClient.signIn.social({
  provider: 'google',
  callbackURL: '/'
})

// الحصول على الجلسة
const session = await auth.api.getSession({ headers })
```

### الحماية

```typescript
// محمي - يحتاج جلسة نشطة
export default async function ProtectedPage() {
  const session = await auth.api.getSession({ headers })
  
  if (!session?.user) {
    redirect('/sign-in')
  }
  
  return <Dashboard />
}
```

---

## 💳 الاشتراكات

### خطط الأسعار

| الخطة | الدردشات | الرسائل/اليوم | السعر |
|------|---------|-------------|------|
| **Free** | 5 | 20 | مجاني |
| **Starter** | 20 | 100 | 49 ج.م |
| **Pro** | 100 | 1000 | 129 ج.م |
| **VIP** | 1000 | 10000 | 299 ج.م |

### استخدام في الكود

```typescript
import { getOrCreateSubscription } from '@/app/actions/users'

// الحصول على الاشتراك الحالي
const subscription = await getOrCreateSubscription()

console.log(subscription.plan)        // 'free' | 'starter' | 'pro' | 'vip'
console.log(subscription.status)      // 'active' | 'cancelled' | 'expired'
console.log(subscription.currentMonthUsage)  // عدد الرسائل المستخدمة
```

---

## 💬 الدردشات

### العمليات الأساسية

```typescript
import {
  createConversation,
  getConversations,
  addMessage,
  deleteConversation,
  archiveConversation
} from '@/app/actions/conversations'

// إنشاء دردشة جديدة
const conv = await createConversation('عنوان الدردشة')

// الحصول على الدردشات
const conversations = await getConversations()

// إضافة رسالة
await addMessage(conv.id, 'user', 'مرحبا')
await addMessage(conv.id, 'assistant', 'مرحبا! كيف أساعدك؟')

// أرشفة
await archiveConversation(conv.id)

// حذف
await deleteConversation(conv.id)
```

---

## 🔧 متغيرات البيئة

### المطلوبة

```bash
# قاعدة البيانات (من Neon)
DATABASE_URL=postgresql://user:pass@host/db

# المصادقة (أنشئ واحد: openssl rand -base64 32)
BETTER_AUTH_SECRET=your_secret_here

# Google OAuth (من Google Cloud Console)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

### الاختيارية

```bash
# للـ production
BETTER_AUTH_URL=https://your-domain.com
VERCEL_PROJECT_PRODUCTION_URL=your-domain.com
```

---

## 📚 الملفات الإضافية

- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - دليل الإعداد التفصيلي
- [BUILD_SUMMARY.md](./BUILD_SUMMARY.md) - ملخص البناء
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - توثيق API كامل

---

## 🚦 تدفق المستخدم

```
الزائر
  ↓
[Sign Up] أو [Sign In]
  ↓
اختيار طريقة (Email/Google)
  ↓
تسجيل ناجح
  ↓
[Dashboard] (/app)
  ↓
[Create Conversation]
  ↓
[Chat Window]
  ↓
[View Pricing]
  ↓
[Upgrade Plan]
```

---

## 🐛 حل المشاكل الشائعة

### "DATABASE_URL is not set"
```bash
# تأكد من:
1. وجود Neon integration في Settings
2. أن المتغير موجود في environment
```

### "BETTER_AUTH_SECRET is missing"
```bash
# أنشئ واحد جديد:
openssl rand -base64 32

# أضفه إلى .env.development.local
```

### "Session not found"
```bash
# يعني:
- المستخدم لم يسجل دخول
- انتهت الجلسة
- الكوكيز محذوفة

# الحل: أعد تسجيل الدخول
```

### "You have reached the limit"
```bash
# يعني: المستخدم تجاوز حده
# الحل: اطلب الترقية
```

---

## 📊 الإحصائيات

| المتري | القيمة |
|-------|--------|
| عدد الجداول | 8 |
| Server Actions | 12 |
| مكونات React | 6+ |
| صفحات محمية | 2+ |
| خطط اشتراك | 4 |

---

## 🤝 المساهمة

1. Fork المشروع
2. أنشئ branch جديد (`git checkout -b feature/amazing`)
3. اعمل commit للتغييرات (`git commit -m 'Add amazing feature'`)
4. اعمل push للـ branch (`git push origin feature/amazing`)
5. افتح Pull Request

---

## 📄 الترخيص

MIT License - راجع [LICENSE](./LICENSE) للتفاصيل

---

## 🙏 الشكر والتقدير

- [Next.js](https://nextjs.org/) - الإطار الرئيسي
- [Better Auth](https://www.better-auth.com/) - نظام المصادقة
- [Neon](https://neon.tech/) - قاعدة البيانات
- [Drizzle ORM](https://orm.drizzle.team/) - مدير قاعدة البيانات
- [Tailwind CSS](https://tailwindcss.com/) - التصميم

---

## 📞 التواصل والدعم

- 📧 البريد الإلكتروني: [support@melegy.com](mailto:support@melegy.com)
- 💬 WhatsApp: [chat](https://wa.me/20)
- 🐙 GitHub Issues: [Report a bug](https://github.com/yesmusic10/v0-melegy-app/issues)

---

## 🗓️ التطوير المستقبلي

- [ ] إضافة API للدردشة الفعلية
- [ ] نظام الدفع (Stripe/Kashier)
- [ ] إشعارات البريد الإلكتروني
- [ ] تحليل الاستخدام
- [ ] تطبيق Mobile
- [ ] Dark Mode محسّن

---

**صُنع بـ ❤️ في مصر**

---

**آخر تحديث:** يوليو 2025 | **الإصدار:** 1.0.0
