# 🏗️ معمارية Melegy - البنية الكاملة

## المخطط العام

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js 16 Application                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐      ┌──────────────────┐             │
│  │   Client Layer   │      │   Server Layer   │             │
│  │                  │      │                  │             │
│  │ • Components     │      │ • Server Actions │             │
│  │ • Hooks          │      │ • API Routes     │             │
│  │ • Forms          │      │ • Database Ops   │             │
│  └────────┬─────────┘      └────────┬─────────┘             │
│           │                         │                        │
│           └────────────┬────────────┘                        │
│                        │                                     │
│              ┌─────────▼─────────┐                          │
│              │  Authentication   │                          │
│              │   (Better Auth)   │                          │
│              └─────────┬─────────┘                          │
│                        │                                     │
│              ┌─────────▼──────────┐                         │
│              │  Database Client   │                         │
│              │  (Drizzle ORM)     │                         │
│              └─────────┬──────────┘                         │
│                        │                                     │
└────────────────────────┼────────────────────────────────────┘
                         │
                ┌────────▼────────┐
                │ PostgreSQL DB   │
                │  (Neon)         │
                └─────────────────┘
```

---

## الطبقات (Layers)

### 1. Presentation Layer (العرض)

```typescript
// مكونات React
components/
├── auth-form.tsx          // نموذج المصادقة
├── chat-dashboard.tsx     // لوحة الدردشات
└── chat-window.tsx        // نافذة الدردشة

// صفحات Next.js
app/
├── sign-in/page.tsx       // صفحة الدخول
├── sign-up/page.tsx       // صفحة التسجيل
├── app/page.tsx           # لوحة التحكم (محمية)
└── app/chat/[id]/page.tsx # صفحة الدردشة (محمية)
```

### 2. Business Logic Layer (المنطق)

```typescript
// Server Actions
app/actions/
├── users.ts               // إدارة المستخدم والاشتراك
└── conversations.ts       // إدارة الدردشات

// API Routes
app/api/
└── auth/[...all]/         // نقاط نهاية Better Auth
```

### 3. Data Access Layer (الوصول للبيانات)

```typescript
// Database Client
lib/db/
├── index.ts               // إعداد Drizzle
└── schema.ts              // تعريف الجداول

// Authentication
lib/
├── auth.ts                // Better Auth Server
└── auth-client.ts         // Better Auth Client
```

### 4. Database Layer (قاعدة البيانات)

```sql
PostgreSQL (Neon)
├── Better Auth Tables
│   ├── user
│   ├── session
│   ├── account
│   └── verification
└── App Tables
    ├── subscription
    ├── conversation
    ├── message
    └── userPreference
```

---

## تدفق البيانات (Data Flow)

### 1. التسجيل الجديد

```
User Input (sign-up page)
    ↓
authClient.signUp.email()
    ↓
Better Auth Handler
    ↓
Database: Create user record
    ↓
Database: Create session cookie
    ↓
Redirect to /app
    ↓
Server Action: getOrCreateSubscription()
    ↓
Database: Create subscription (Free plan)
    ↓
Show Dashboard
```

### 2. إنشاء دردشة

```
User Action (Click "New Conversation")
    ↓
createConversation("Title")
    ↓
Server Action:
  1. Get current user from session
  2. Get user's subscription
  3. Check conversation limit
  4. If OK: Create in database
  5. If Limit: Throw error
    ↓
Return to UI
    ↓
Show conversation or error message
```

### 3. إضافة رسالة

```
User Types Message
    ↓
Submit Form
    ↓
addMessage(convId, "user", content)
    ↓
Server Action:
  1. Verify conversation ownership
  2. Insert message record
  3. Update conversation.messageCount
  4. Return message
    ↓
UI Updates:
  - Add message to display
  - Update count
  - Scroll to bottom
```

---

## معمارية المصادقة

### Better Auth Setup

```typescript
// server-side (lib/auth.ts)
export const auth = betterAuth({
  database: {
    db: db,                    // Drizzle client
    provider: "drizzle",       // Using Drizzle ORM
  },
  appName: "Melegy",
  emailAndPassword: {
    enabled: true,             // Email + password auth
  },
  socialProviders: {
    google: {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
  },
  secret: process.env.BETTER_AUTH_SECRET,
})

// client-side (lib/auth-client.ts)
export const authClient = createAuthClient()

// In Components
const { data, error } = await authClient.signUp.email({...})
const { data, error } = await authClient.signIn.email({...})
await authClient.signIn.social({ provider: 'google' })
```

---

## معمارية قاعدة البيانات

### Schema Definition

```typescript
// lib/db/schema.ts
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  // ... Better Auth fields
})

export const subscription = pgTable('subscription', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  plan: text('plan').default('free'),
  status: text('status').default('active'),
  // ...
})

export const conversation = pgTable('conversation', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull(),
  title: text('title'),
  messageCount: integer('messageCount').default(0),
  // ...
})

export const message = pgTable('message', {
  id: text('id').primaryKey(),
  conversationId: text('conversationId').notNull(),
  userId: text('userId').notNull(),
  role: text('role'),  // 'user' | 'assistant'
  content: text('content'),
  // ...
})
```

### Relations

```typescript
export const conversationRelations = relations(
  conversation,
  ({ one, many }) => ({
    user: one(user, {
      fields: [conversation.userId],
      references: [user.id],
    }),
    messages: many(message),
  })
)

export const messageRelations = relations(
  message,
  ({ one }) => ({
    conversation: one(conversation, {
      fields: [message.conversationId],
      references: [conversation.id],
    }),
    user: one(user, {
      fields: [message.userId],
      references: [user.id],
    }),
  })
)
```

---

## معمارية Server Actions

### Pattern المتبع

```typescript
'use server'

// 1. Helper function to get userId
async function getUserId() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user.id
}

// 2. Business Logic Function
export async function myServerAction(param: string) {
  try {
    // Get user from session
    const userId = await getUserId()
    
    // Query database
    const data = await db
      .select()
      .from(table)
      .where(eq(table.userId, userId))  // ✓ User scoping
    
    // Process
    // ...
    
    // Return
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// 3. Usage in Component
'use client'

export function MyComponent() {
  async function handleClick() {
    const result = await myServerAction('param')
    if (result.success) {
      // show data
    } else {
      // show error
    }
  }
}
```

---

## الأمان (Security Architecture)

### User Scoping Pattern

```typescript
// ✓ Correct - Every query filtered by userId
const data = await db
  .select()
  .from(conversation)
  .where(eq(conversation.userId, userId))

// ✗ Wrong - No user check
const data = await db
  .select()
  .from(conversation)
  // <- Missing where clause!

// ✓ Correct - Check ownership before operation
async function deleteConversation(convId: string) {
  const userId = await getUserId()
  
  const conv = await db
    .select()
    .from(conversation)
    .where(and(
      eq(conversation.id, convId),
      eq(conversation.userId, userId)  // ✓ Ownership check
    ))
    .then(res => res[0])
  
  if (!conv) throw new Error('Not found or not owned')
  
  // Safe to delete
  await db.delete(conversation).where(eq(conversation.id, convId))
}
```

### Session Protection

```typescript
// Cookies are HttpOnly and Secure
// Signed by BETTER_AUTH_SECRET
// Expire after 7 days
// Protected from CSRF attacks

// Verified on every request
const session = await auth.api.getSession({ headers })
if (!session?.user) redirect('/sign-in')
```

---

## حدود الخطط (Plan Limits)

### Implementation

```typescript
const PLAN_LIMITS = {
  free: { conversations: 5, messagesPerDay: 20 },
  starter: { conversations: 20, messagesPerDay: 100 },
  pro: { conversations: 100, messagesPerDay: 1000 },
  vip: { conversations: 1000, messagesPerDay: 10000 },
}

// In createConversation()
export async function createConversation(title?: string) {
  const userId = await getUserId()
  
  // Get subscription
  const sub = await db
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .then(res => res[0])
  
  // Get plan limits
  const limits = PLAN_LIMITS[sub.plan]
  
  // Count existing
  const count = await db
    .select()
    .from(conversation)
    .where(eq(conversation.userId, userId))
    .then(res => res.length)
  
  // Check limit
  if (count >= limits.conversations) {
    throw new Error(`Limit of ${limits.conversations} reached`)
  }
  
  // Create
  // ...
}
```

---

## معمارية الأخطاء

### Error Handling Strategy

```typescript
// 1. Server Level
async function serverAction() {
  try {
    // do something
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: 'Please sign in' }
    }
    if (error instanceof ValidationError) {
      return { error: 'Invalid input' }
    }
    return { error: 'Something went wrong' }
  }
}

// 2. Client Level
'use client'

export function Component() {
  const [error, setError] = useState<string | null>(null)
  
  async function handleAction() {
    try {
      const result = await serverAction()
      
      if (result.error) {
        setError(result.error)  // Show error
        return
      }
      
      // Success
    } catch (err) {
      setError('Unexpected error')
    }
  }
}

// 3. UI Display
{error && (
  <Alert className="bg-red-50 text-red-700">
    {error}
  </Alert>
)}
```

---

## Performance Considerations

### Optimization Strategies

```typescript
// 1. Query Optimization
// ✓ Select only needed fields
const convs = await db
  .select({
    id: conversation.id,
    title: conversation.title,
    messageCount: conversation.messageCount,
  })
  .from(conversation)
  .where(eq(conversation.userId, userId))

// 2. Database Indexes
// Better Auth indexes on (userId, createdAt)
// App tables indexed on userId for filtering

// 3. Caching Strategy
// Use SWR for client-side data fetching
// Revalidate on user actions
```

---

## Integration Points

### Authentication ↔ Database
```
signUp -> Create user record -> Create session
signIn -> Verify user -> Create session
signOut -> Invalidate session
```

### Business Logic ↔ Database
```
Server Actions -> Verify User -> Query DB -> Validate -> Update
```

### Client ↔ Server
```
Component -> Call Server Action -> Send Result -> Update UI
```

---

## Deployment Architecture

```
Vercel Edge
    ↓
    ├─ Next.js Functions
    ├─ API Routes
    ├─ Server Actions
    └─ Static Assets
    
    ↓ (Connection Pooling)
    
Neon PostgreSQL
    ├─ Primary Cluster
    └─ Replicas
```

---

**هذه المعمارية توفر:**
- ✅ أمان عالي (User scoping)
- ✅ قابلية الصيانة (Layered design)
- ✅ سهولة التوسع (Modular structure)
- ✅ أداء جيد (Optimized queries)
- ✅ reliability (Error handling)

---

*آخر تحديث: 11 يوليو 2025*
