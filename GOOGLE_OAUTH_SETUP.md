# Google OAuth Setup Guide - دليل إعداد Google OAuth

## ما تم إضافته
تم إضافة خيارات Google Sign-In (OAuth) الكاملة إلى التطبيق على صفحتي تسجيل الدخول والاشتراك.

## البيانات المطلوبة
لقد قمت بتعيين متغيرات البيئة التالية:
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - معرّف عميل Google (يستخدم في الواجهة الأمامية والخادم)
- `GOOGLE_CLIENT_SECRET` - مفتاح سر Google (يستخدم فقط على الخادم)

## خطوات الإعداد النهائي

### 1. الحصول على بيانات Google OAuth
إذا لم تكن قد أضفت Client ID و Secret بعد، اتبع هذه الخطوات:

1. ذهب إلى [Google Cloud Console](https://console.cloud.google.com/)
2. أنشئ مشروع جديد (أو استخدم مشروع موجود)
3. فعّل Google+ API
4. اذهب إلى "Credentials" وأنشئ "OAuth 2.0 Client ID" من نوع "Web Application"
5. أضف Redirect URI: 
   - Local: `http://localhost:3000/api/auth/google/callback`
   - Production: `https://yourdomain.com/api/auth/google/callback`
6. احفظ Client ID و Client Secret

### 2. إضافة البيانات إلى المشروع
1. اذهب إلى project settings (الزر في الزاوية العلوية اليمنى)
2. انقر على "Vars"
3. أضف المتغيرات التالية:
   - **NEXT_PUBLIC_GOOGLE_CLIENT_ID**: [ضع Client ID هنا]
   - **GOOGLE_CLIENT_SECRET**: [ضع Client Secret هنا]

### 3. التحقق من الإعداد
بعد إضافة المتغيرات:
1. عد إلى الصفحة الرئيسية (يجب أن تُحدَّث تلقائياً)
2. اذهب إلى `/login` أو `/signup`
3. يجب أن ترى زر "تسجيل الدخول عبر Google" / "إنشاء حساب عبر Gmail"
4. انقر على الزر للاختبار

## كيفية العمل

### صفحة تسجيل الدخول (`/login`)
- يعرض نموذج تسجيل دخول عادي برسائل البريد الإلكتروني وكلمة المرور
- يعرض زر "تسجيل الدخول عبر Google"
- عند النقر على الزر:
  1. يتم توجيهك إلى Google للمصادقة
  2. بعد الموافقة، يتم توجيهك إلى `/api/auth/google/callback`
  3. يتم إنشاء حسابك أو تسجيل دخولك تلقائياً
  4. يتم حفظ جلسة العمل في ملف Cookie
  5. يتم توجيهك إلى الصفحة الرئيسية

### صفحة الاشتراك (`/signup`)
- يعرض نموذج إنشاء حساب برسائل اسم والبريد الإلكتروني وكلمة المرور
- يعرض زر "إنشاء حساب عبر Gmail"
- العملية نفسها كما في تسجيل الدخول

## المسارات المستخدمة

### مسارات الواجهة
- `GET /login` - صفحة تسجيل الدخول
- `GET /signup` - صفحة الاشتراك

### مسارات الخادم (API)
- `GET /api/auth/google-oauth` - بدء عملية OAuth (إنشاء رابط المصادقة)
- `POST/GET /api/auth/google/callback` - استقبال وتبديل الكود وإنشاء الحساب/الجلسة
- `POST /api/auth/google/callback` - تسجيل الدخول عبر JWT (البديل)

## قاعدة البيانات

عند تسجيل دخول مستخدم عبر Google:
1. يتم البحث عن المستخدم باستخدام Google ID الخاص به
2. إذا لم يوجد:
   - البحث عن المستخدم باستخدام البريد الإلكتروني
   - إذا وجد: ربط Google ID بالحساب الموجود
   - إذا لم يوجد: إنشاء حساب جديد مع بيانات Google
3. إنشاء جلسة عمل مع رمز (token) بصلاحية 30 يوم

## معالجة الأخطاء

التطبيق يتعامل مع الأخطاء التالية:
- عدم توفر Client ID أو Client Secret
- فشل في الحصول على رمز الوصول (Access Token)
- فشل في الحصول على بيانات المستخدم
- مشاكل في قاعدة البيانات

جميع الأخطاء تُظهر رسائل صديقة للمستخدم بالعربية.

## الأمان

- جميع الرموز السرية (Secrets) محفوظة على الخادم فقط
- الاتصالات محمية بـ HTTPS
- الجلسات محفوظة في HttpOnly Cookies
- يتم التحقق من حالة CORS

## الاختبار المحلي

عند الاختبار محلياً:
1. استخدم `http://localhost:3000/api/auth/google/callback` كـ Redirect URI في Google Console
2. تأكد من إضافة المتغيرات البيئية محلياً
3. أعد تشغيل خادم التطوير بعد إضافة المتغيرات

## النشر على Vercel

عند النشر على Vercel:
1. أضف المتغيرات في Vercel Project Settings
2. استخدم `https://yourdomain.com/api/auth/google/callback` كـ Redirect URI
3. احرص على أن تكون النطاقات محملة في Google OAuth Allowed Domains

## المراجع

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Next.js Authentication Best Practices](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns#authentication)
