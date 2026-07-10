# Google OAuth Redirect Fix

## المشكلة (Problem)
بعد تسجيل الدخول عبر Google بنجاح، كان المستخدم يتم توجيهه إلى صفحة التسجيل `/signup` بدلاً من صفحة الدردشة `/chat`.

After successful Google login, users were being redirected to `/signup` instead of the chat page `/chat`.

## الحل (Solution)

### 1. تحديث Callback Route (`app/api/auth/google/callback/route.ts`)
- تم تغيير التوجيه من `/` إلى `/chat`
- إضافة كوكي إضافي `auth_token_client` (غير httpOnly) حتى يتمكن JavaScript من قراءة الـ token

```typescript
// تم التوجيه من:
NextResponse.redirect(new URL('/', request.url))

// إلى:
NextResponse.redirect(new URL('/chat', request.url))
```

### 2. تحديث AuthContext (`lib/contexts/AuthContext.tsx`)
- تم تحسين آلية تحميل الـ token عند بدء التطبيق
- الآن يقرأ من الكوكيز أولاً (الذي تم تعيينه بواسطة OAuth callback)
- ثم يعود إلى localStorage كحل بديل
- يحفظ الـ token في localStorage للدعم المرجعي

```typescript
const getCookie = (name: string): string | null => {
  if (typeof document === 'undefined') return null
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}
```

## الخطوات التالية (Next Steps)

1. اختبر تسجيل الدخول عبر Google
2. تأكد من أنك مُعاد التوجيه إلى `/chat` بعد النجاح
3. تحقق من أن بيانات المستخدم تظهر بشكل صحيح

## الملفات المعدّلة (Modified Files)
- `/app/api/auth/google/callback/route.ts` - تحديث التوجيه والكوكيز
- `/lib/contexts/AuthContext.tsx` - تحسين تحميل الـ token من الكوكيز
