'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface SignupFormProps {
  onSuccess?: () => void
}

export function PhoneSignupForm({ onSuccess }: SignupFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form state
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Validate inputs
      if (!name.trim()) {
        setError('الاسم مطلوب')
        setLoading(false)
        return
      }

      if (!birthDate) {
        setError('تاريخ الميلاد مطلوب')
        setLoading(false)
        return
      }

      // Call login API
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          birthDate,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'فشل التسجيل')
      }

      // Set userId cookie
      if (data.userId) {
        document.cookie = `userId=${data.userId}; path=/; max-age=${30 * 24 * 60 * 60}`
      }

      setSuccess('تم التسجيل بنجاح!')
      
      // Redirect after short delay
      setTimeout(() => {
        router.push('/chat')
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">أنشئ حسابك</h2>
        <p className="text-muted-foreground">سجل دخول بسهولة مع اسمك وتاريخ ميلادك</p>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        {/* Name field */}
        <div>
          <Label htmlFor="name">الاسم الكامل</Label>
          <Input
            id="name"
            type="text"
            placeholder="أدخل اسمك الكامل"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            className="mt-2"
          />
        </div>

        {/* Birth Date field */}
        <div>
          <Label htmlFor="birthDate">تاريخ الميلاد</Label>
          <Input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            disabled={loading}
            className="mt-2"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-100 text-green-700 rounded-md text-sm">
            {success}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'جاري التسجيل...' : 'دخول'}
        </Button>
      </form>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        لا تحتاج إلى بريد إلكتروني أو هاتف - فقط اسمك وتاريخ ميلادك!
      </div>
    </div>
  )
}
