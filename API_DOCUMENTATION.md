# Melegy - API Documentation

## المصادقة API (Better Auth)

### نقاط نهاية المصادقة
```
POST   /api/auth/sign-up/email
POST   /api/auth/sign-in/email
POST   /api/auth/sign-out
GET    /api/auth/session
POST   /api/auth/callback/google
```

### مثال: التسجيل عبر البريد
```typescript
const { data, error } = await authClient.signUp.email({
  email: "user@example.com",
  password: "password123",
  name: "أحمد"
})
```

### مثال: تسجيل الدخول عبر Google
```typescript
await authClient.signIn.social({
  provider: "google",
  callbackURL: "/"
})
```

---

## Server Actions API

### إدارة الاشتراكات (في `app/actions/users.ts`)

#### `getOrCreateSubscription()`
```typescript
export async function getOrCreateSubscription() {
  // يحصل على اشتراك المستخدم
  // أو ينشئ واحد جديد من نوع "free" إذا لم يكن موجوداً
  // يتطلب جلسة نشطة
  
  return {
    id: "sub_...",
    userId: "user_...",
    plan: "free",  // 'free' | 'starter' | 'pro' | 'vip'
    status: "active",
    currentMonthUsage: 0,
    createdAt: Date,
    updatedAt: Date
  }
}
```

#### `getOrCreateUserPreference()`
```typescript
export async function getOrCreateUserPreference() {
  // يحصل على تفضيلات المستخدم
  // أو ينشئ تفضيلات افتراضية
  
  return {
    id: "pref_...",
    userId: "user_...",
    theme: "light",
    language: "ar",
    emailNotifications: true,
    createdAt: Date,
    updatedAt: Date
  }
}
```

#### `getCurrentUser()`
```typescript
export async function getCurrentUser() {
  // يحصل على بيانات المستخدم الحالي
  // يتطلب جلسة نشطة
  
  return {
    id: "user_...",
    email: "user@example.com",
    emailVerified: true,
    name: "أحمد",
    image: null,
    createdAt: Date,
    updatedAt: Date
  }
}
```

---

### إدارة الدردشات (في `app/actions/conversations.ts`)

#### `createConversation(title?: string)`
```typescript
const result = await createConversation("نقاش جديد")
// {
//   id: "conv_...",
//   title: "نقاش جديد"
// }

// يتحقق من:
// 1. وجود الاشتراك
// 2. عدم تجاوز حد الدردشات المسموح
// يرفع الخطأ إذا تجاوز الحد
```

#### `getConversations()`
```typescript
const conversations = await getConversations()
// [
//   {
//     id: "conv_...",
//     userId: "user_...",
//     title: "نقاش جديد",
//     messageCount: 5,
//     isArchived: false,
//     createdAt: Date,
//     updatedAt: Date
//   }
// ]

// يحصل على الدردشات غير المؤرشفة فقط
// مرتبة حسب آخر تحديث
```

#### `getConversationMessages(conversationId: string)`
```typescript
const messages = await getConversationMessages("conv_123")
// [
//   {
//     id: "msg_...",
//     conversationId: "conv_123",
//     userId: "user_...",
//     role: "user",
//     content: "مرحبا",
//     metadata: null,
//     createdAt: Date
//   }
// ]

// يتحقق:
// 1. أن الدردشة تنتمي للمستخدم الحالي
// يرفع خطأ إذا حاول الوصول لدردشة شخص آخر
```

#### `addMessage(conversationId: string, role: 'user' | 'assistant', content: string, metadata?: object)`
```typescript
const message = await addMessage("conv_123", "user", "كيفك؟", {
  // metadata اختياري
  source: "web",
  sentiment: "neutral"
})
// {
//   id: "msg_...",
//   role: "user",
//   content: "كيفك؟"
// }

// يقوم بـ:
// 1. التحقق من أن الدردشة تنتمي للمستخدم
// 2. إضافة الرسالة
// 3. تحديث messageCount في الدردشة
```

#### `deleteConversation(conversationId: string)`
```typescript
await deleteConversation("conv_123")

// يقوم بـ:
// 1. التحقق من الملكية
// 2. حذف جميع الرسائل
// 3. حذف الدردشة
```

#### `archiveConversation(conversationId: string)`
```typescript
await archiveConversation("conv_123")

// يقوم بـ:
// 1. التحقق من الملكية
// 2. تعليم الدردشة كـ archived
// لا تظهر في getConversations() بعدها
```

---

## حدود الخطط (Plan Limits)

```typescript
const PLAN_LIMITS = {
  free: { conversations: 5, messagesPerDay: 20 },
  starter: { conversations: 20, messagesPerDay: 100 },
  pro: { conversations: 100, messagesPerDay: 1000 },
  vip: { conversations: 1000, messagesPerDay: 10000 }
}
```

---

## استخدام في المكونات

### في Server Component
```typescript
import { getCurrentUser } from '@/app/actions/users'
import { getConversations } from '@/app/actions/conversations'

export default async function MyPage() {
  const user = await getCurrentUser()
  const conversations = await getConversations()
  
  return <div>{/* ... */}</div>
}
```

### في Client Component
```typescript
'use client'

import { createConversation } from '@/app/actions/conversations'
import { useRouter } from 'next/navigation'

export function CreateConvBtn() {
  const router = useRouter()
  
  const handleCreate = async () => {
    try {
      const result = await createConversation("جديدة")
      router.push(`/app/chat/${result.id}`)
    } catch (error) {
      console.error('خطأ:', error.message)
    }
  }
  
  return <button onClick={handleCreate}>جديدة</button>
}
```

---

## معالجة الأخطاء

### الأخطاء الشائعة

#### "Unauthorized"
```
السبب: جلسة غير نشطة أو انتهت
الحل: أعد تسجيل الدخول
```

#### "No subscription found"
```
السبب: المستخدم ليس لديه اشتراك
الحل: يجب إنشاء اشتراك تلقائياً عند التسجيل
```

#### "Conversation not found"
```
السبب: الدردشة غير موجودة أو تنتمي لمستخدم آخر
الحل: تحقق من الـ conversationId
```

#### "You have reached the limit of X conversations"
```
السبب: تجاوز حد الدردشات المسموح بها
الحل: اطلب المستخدم الترقية للخطة الأعلى
```

---

## مثال عملي: سير العمل الكامل

```typescript
// 1. التسجيل
const { data } = await authClient.signUp.email({
  email: "user@example.com",
  password: "pass123",
  name: "أحمد"
})

// 2. الحصول على الاشتراك (ينشأ تلقائياً free)
const subscription = await getOrCreateSubscription()

// 3. إنشاء دردشة
const conv = await createConversation("حوار جديد")

// 4. إضافة رسائل
await addMessage(conv.id, "user", "السلام عليكم")
await addMessage(conv.id, "assistant", "وعليكم السلام")

// 5. الحصول على الدردشات
const conversations = await getConversations()

// 6. عند الحاجة: الترقية
// (تحديث subscription.plan = "pro")

// 7. عند الحاجة: أرشفة
await archiveConversation(conv.id)
```

---

## نقاط مهمة

1. **جميع الـ Actions تتطلب جلسة نشطة**
   - الخطوة الأولى في كل action التحقق من الجلسة

2. **User Scoping مطبق تلقائياً**
   - لا تحتاج إلى تمرير userId
   - يتم الحصول عليه من الجلسة تلقائياً

3. **معالجة الأخطاء يجب أن تكون واضحة**
   - استخدم `try-catch` في Client Components
   - اعرض رسائل خطأ مفيدة للمستخدم

4. **الـ Metadata اختياري**
   - استخدمه لتخزين بيانات إضافية عن الرسائل
   - مثل sentiment analysis أو source tracking

---

## API الخارجي (المستقبل)

### للدردشة الفعلية، يجب إضافة:

```typescript
// app/api/chat/route.ts
export async function POST(request: Request) {
  const { conversationId, message } = await request.json()
  
  // 1. التحقق من الجلسة
  // 2. التحقق من الحد اليومي
  // 3. استدعاء AI API (OpenAI/Claude/Groq)
  // 4. حفظ الرسالة بـ addMessage()
  // 5. إرسال الرد
  
  return Response.json(response)
}
```

---

## Debug Tips

```typescript
// لتتبع الأخطاء
console.log("[v0] getCurrentUser:", user)
console.log("[v0] getConversations:", conversations)
console.log("[v0] Error:", error.message)

// للتحقق من الجلسة
const session = await auth.api.getSession({ headers: await headers() })
console.log("[v0] Session user:", session?.user)
```

---

**آخر تحديث: Built with Neon + Better Auth + Drizzle**
