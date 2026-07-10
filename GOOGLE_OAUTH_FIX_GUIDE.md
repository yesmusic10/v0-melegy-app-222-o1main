# Google OAuth - Fix redirect_uri_mismatch Error

## المشكلة
الخطأ: `Error 400: redirect_uri_mismatch`

هذا يعني أن رابط إعادة التوجيه (Redirect URI) المرسل من التطبيق لا يطابق ما هو مسجل في Google Cloud Console.

## الحل

### الخطوة 1: الحصول على الرابط الفعلي للتطبيق
في بيئة الإنتاج (Vercel)، الرابط يكون شيء مثل:
- `https://your-app.vercel.app/api/auth/google/callback`

في بيئة التطوير المحلية:
- `http://localhost:3000/api/auth/google/callback`

### الخطوة 2: تحديث Google Cloud Console

1. اذهب إلى [Google Cloud Console](https://console.cloud.google.com)
2. اختر مشروعك
3. اذهب إلى **APIs & Services** > **Credentials**
4. اختر OAuth 2.0 Client ID الخاص بك
5. في **Authorized redirect URIs**، أضف:
   - إذا كنت تختبر محلياً: `http://localhost:3000/api/auth/google/callback`
   - إذا كنت تستخدم Vercel: `https://your-app.vercel.app/api/auth/google/callback`
   - الدومين الإنتاج الفعلي الخاص بك

### الخطوة 3: تحديث متغيرات البيئة

في `Settings > Vars`، تأكد من تعيين:
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` - معرف عميل Google
- `GOOGLE_CLIENT_SECRET` - سر العميل من Google

لا تحتاج إلى تعيين `NEXT_PUBLIC_APP_URL` - الكود الآن يحصل على الرابط تلقائياً من الطلب.

### الخطوة 4: اختبر مرة أخرى

1. انتظر دقيقة واحدة بعد التحديث في Google Console
2. جرب تسجيل الدخول مرة أخرى عبر زر Google

## الملفات المحدثة

- `app/api/auth/google-oauth/route.ts` - الآن يحصل على الرابط من الطلب تلقائياً
- `app/api/auth/google/callback/route.ts` - الآن يحصل على الرابط من الطلب تلقائياً

## ملاحظات مهمة

- تأكد من أن OAuth consent screen مُعد بشكل صحيح في Google Console
- تأكد من أن التطبيق في "External" mode إذا كنت تختبر به بشكل عام
- الرابط يجب أن يطابق **بالضبط** - بما في ذلك البروتوكول (http/https)
