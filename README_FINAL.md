# 🚀 Melegy - نظام متكامل للدردشات والاشتراكات

تطبيق Next.js 16 كامل مع **مصادقة آمنة، قاعدة بيانات، ونظام اشتراكات ديناميكي**.

---

## ✅ الحالة الحالية

- ✓ **Build Status**: ✅ بناء ناجح
- ✓ **Production Ready**: جاهز للإنتاج
- ✓ **Database**: متصل مع Neon PostgreSQL
- ✓ **Authentication**: Better Auth مع Email + Password
- ✓ **Google OAuth**: معد (ينتظر credentials)
- ✓ **All Tests**: بدون أخطاء TypeScript

---

## 🎯 الميزات الرئيسية

### 1️⃣ **المصادقة المتقدمة**
- Email + Password (مفعل)
- Google OAuth (معد، في الانتظار)
- جلسات محمية (7 أيام)
- كوكيز آمنة (httpOnly)

### 2️⃣ **قاعدة بيانات Neon**
- 4 جداول رئيسية
- علاقات محمية
- Drizzle ORM للاستعلامات الآمنة

### 3️⃣ **نظام الاشتراكات**
```
Free       - 5 دردشات، 20 رسالة/يوم
Starter    - 20 دردشة، 100 رسالة/يوم
Pro        - 100 دردشة، 1000 رسالة/يوم
VIP        - 1000 دردشة، 10000 رسالة/يوم
```

### 4️⃣ **إدارة الدردشات**
- إنشاء/حذف/أرشفة
- حفظ تاريخ الرسائل
- حدود ديناميكية حسب الخطة

### 5️⃣ **API المصرية**
- بوت دردشة باللهجة المصرية
- مدعوم بـ Groq (مجاني)
- يرد مثل شخص مصري حقيقي

---

## 🏗️ البنية المعمارية

```
Melegy/
├── lib/
│   ├── auth.ts              # Better Auth server setup
│   ├── auth-client.ts       # Auth client for React
│   ├── utils.ts             # Helper functions
│   └── db/
│       ├── index.ts         # Drizzle + Neon Pool
│       └── schema.ts        # All database tables
├── app/
│   ├── sign-in/page.tsx     # Login page
│   ├── sign-up/page.tsx     # Register page
│   ├── app/
│   │   ├── page.tsx         # Protected dashboard
│   │   └── chat/[id]/       # Chat pages
│   ├── api/
│   │   ├── auth/            # Better Auth endpoints
│   │   └── chat-egyptian/   # Chatbot API
│   ├── actions/
│   │   ├── users.ts         # User operations
│   │   └── conversations.ts # Chat operations
│   └── pricing/page.tsx     # Pricing page
├── components/
│   ├── auth-form.tsx        # Auth UI component
│   ├── chat-window.tsx      # Chat UI component
│   ├── contexts/            # React contexts
│   └── ui/                  # shadcn/ui components
└── docs/
    ├── SETUP_GUIDE.md       # خطوات الإعداد
    ├── API_DOCUMENTATION.md # توثيق API
    ├── ARCHITECTURE.md      # البنية المعمارية
    └── ...
```

---

## 📋 متطلبات البيئة

### المتغيرات الضرورية

```env
# Auto-provisioned by Neon integration
DATABASE_URL=postgresql://...

# Generated and already set
BETTER_AUTH_SECRET=...

# Optional - for Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## 🚀 البدء السريع

### 1. البناء
```bash
npm run build
```

### 2. التشغيل
```bash
npm run dev
# سيبدأ على http://localhost:3000 أو 3001
```

### 3. الوصول إلى الصفحات
- **الرئيسية**: http://localhost:3000
- **التسجيل**: http://localhost:3000/sign-up
- **تسجيل الدخول**: http://localhost:3000/sign-in
- **اللوحة** (محمية): http://localhost:3000/app
- **الأسعار**: http://localhost:3000/pricing

### 4. إنشاء حساب
```
البريد: test@example.com
كلمة المرور: password123 (أي 8+ أحرف)
```

---

## 🔧 تغيير النظام

### إضافة حقل جديد في قاعدة البيانات

1. **حدث schema.ts**:
```typescript
export const myTable = pgTable('my_table', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  name: text('name'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})
```

2. **أنشئ الجدول في Neon**:
استخدم Neon MCP لتنفيذ SQL:
```sql
CREATE TABLE "my_table" (...)
```

3. **استخدم في الكود**:
```typescript
const results = await db.select().from(myTable).where(eq(myTable.userId, userId))
```

### إضافة Google OAuth

1. احصل على credentials من Google Cloud Console
2. أضفها للبيئة:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```
3. إعادة تشغيل الخادم

---

## 🔐 الأمان والحماية

✅ **كل استعلام مصفى حسب userId**
✅ **جلسات محمية بـ BETTER_AUTH_SECRET**
✅ **كوكيز httpOnly و Secure**
✅ **لا توجد بيانات حساسة في localStorage**
✅ **استخدام Server Actions للعمليات الحساسة**

---

## 📊 جداول قاعدة البيانات

### subscription
```sql
id, userId, plan, status, currentMonthUsage, createdAt, updatedAt, expiresAt
```

### conversation
```sql
id, userId, title, description, model, messageCount, isArchived, createdAt, updatedAt
```

### message
```sql
id, conversationId, userId, role, content, metadata, createdAt
```

### userPreference
```sql
id, userId (unique), theme, language, emailNotifications, createdAt, updatedAt
```

### Better Auth Tables
```sql
user, session, account, verification
```

---

## 🧪 الاختبار

### اختبر المصادقة
```bash
# التسجيل
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### اختبر الدردشة
```bash
curl -X POST http://localhost:3000/api/chat-egyptian \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "السلام عليكم"}]
  }'
```

---

## 📚 الوثائق

- **[دليل الإعداد](./SETUP_GUIDE.md)** - خطوات إعداد مفصلة
- **[توثيق API](./API_DOCUMENTATION.md)** - جميع نقاط الاتصال
- **[البنية](./ARCHITECTURE.md)** - شرح المعمارية
- **[الإصلاحات](./FIXES_APPLIED.md)** - المشاكل التي تم حلها

---

## 🚨 استكشاف الأخطاء

### "DATABASE_URL is not set"
✓ يجب توصيل Neon integration في Settings

### "BETTER_AUTH_SECRET is missing"
✓ المتغير موجود بالفعل، جرب إعادة تحميل

### خطأ في تسجيل الدخول
✓ تأكد من Email صحيح و Password على الأقل 8 أحرف

### Build failed
✓ تأكد من تشغيل `npm install` أولاً

---

## 📱 المتصفحات المدعومة

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers

---

## 📈 النمو المستقبلي

### Phase 2
- [ ] نظام الدفع (Stripe)
- [ ] إرسال البريد (Resend)
- [ ] لوحة إدارة مستخدمين
- [ ] إحصائيات الاستخدام

### Phase 3
- [ ] تطبيق mobile
- [ ] تطبيق desktop
- [ ] تصدير البيانات
- [ ] مزامنة السحابة

---

## 📞 الدعم

إذا واجهت مشاكل:

1. تحقق من [المشاكل الشائعة](./FIXES_APPLIED.md)
2. اقرأ [الوثائق](./SETUP_GUIDE.md)
3. افتح issue على GitHub

---

## 📄 الترخيص

MIT License - مفتوح للاستخدام التجاري

---

## 👨‍💻 المساهمة

يرحب بالمساهمات! تابع:
1. Fork المشروع
2. أنشئ فرع جديد
3. قدم Pull Request

---

صُنع بـ ❤️ مع Vercel و Next.js

**Melegy - Egyptian AI Assistant** 🇪🇬
