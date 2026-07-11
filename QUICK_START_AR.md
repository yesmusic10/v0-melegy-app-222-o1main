# 🚀 البدء السريع - Melegy

## في 5 دقائق!

### ✅ قبل البدء
```bash
✓ Node.js 18+ مثبت
✓ DATABASE_URL و BETTER_AUTH_SECRET موجودان
```

### 1️⃣ التشغيل
```bash
npm run dev
# سيبدأ على http://localhost:3000
```

### 2️⃣ إنشاء حساب
```
اذهب إلى http://localhost:3000/sign-up
البريد: test@example.com
كلمة المرور: password123
انقر: Sign Up
```

### 3️⃣ ستُؤخذ تلقائياً إلى /app
```
تهانينا! 🎉
سترى لوحة التحكم
```

### 4️⃣ أنشئ دردشة
```
اكتب عنوان: "دردشتي الأولى"
انقر: New Conversation
```

### 5️⃣ أضف رسائل
```
افتح الدردشة
اكتب: "مرحبا"
انقر: Send
تأكد من الحفظ ✓
```

---

## 📁 الملفات المهمة

```
lib/auth.ts              ← إعداد المصادقة
app/actions/             ← العمليات
components/              ← المكونات
app/sign-in/             ← الدخول
app/sign-up/             ← التسجيل
app/app/                 ← اللوحة الرئيسية
```

---

## 🔑 المتغيرات (في .env.development.local)

```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=U1c+wmYRdyMcvHx/...
```

---

## ⏭️ الخطوات التالية

### Google Login (اختياري)
1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com)
2. أنشئ OAuth Client ID
3. أضف المتغيرات:
   ```
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx
   GOOGLE_CLIENT_SECRET=xxx
   ```

### إضافة الدردشة الفعلية
- أنشئ `app/api/chat/route.ts`
- استدعِ OpenAI أو Groq API
- احفظ الرسالة بـ `addMessage()`

---

## 📚 المزيد من التفاصيل

- `README_NEW.md` - شامل
- `SETUP_GUIDE.md` - إعداد
- `API_DOCUMENTATION.md` - API

---

## 🆘 مشكلة؟

### "DATABASE_URL is not set"
→ تأكد من Neon integration في Settings

### "Session not found"
→ سجل دخول من جديد

### "Port 3000 in use"
→ الخادم سيستخدم 3001 تلقائياً

---

**✅ جاهز للبدء! شغّل التطبيق الآن!**
