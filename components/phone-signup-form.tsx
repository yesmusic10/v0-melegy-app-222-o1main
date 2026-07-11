'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface PhoneSignupFormProps {
  onSuccess?: () => void
}

export function PhoneSignupForm({ onSuccess }: PhoneSignupFormProps) {
  const router = useRouter()
  const [step, setStep] = useState<'signup' | 'verify'>('signup')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [otp, setOtp] = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Format phone number
      const formattedPhone = phone.replace(/\D/g, '')
      if (formattedPhone.length < 10) {
        setError('رقم الهاتف غير صحيح')
        setLoading(false)
        return
      }

      const response = await fetch('/api/auth/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          name,
          birthDate,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'فشل إرسال الكود')
      }

      setStep('verify')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (otp.length !== 6) {
        setError('الكود يجب أن يكون 6 أرقام')
        setLoading(false)
        return
      }

      const formattedPhone = phone.replace(/\D/g, '')
      const response = await fetch('/api/auth/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: formattedPhone,
          otp,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'فشل التحقق من الكود')
      }

      // Store session token
      if (data.token) {
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('userId', data.userId)
        localStorage.setItem('subscriptionPlan', data.subscriptionPlan)
      }

      onSuccess?.()
      router.push('/subscription-plans')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  const signupTranslations = {
    ar: {
      title: 'أنشئ حسابك',
      phone: 'رقم الهاتف',
      name: 'الاسم الكامل',
      birthDate: 'تاريخ الميلاد',
      sendCode: 'إرسال الكود',
      verifyTitle: 'تحقق من الكود',
      verifyDesc: 'أدخل الكود المرسل إلى هاتفك',
      otp: 'الكود',
      verify: 'تحقق',
      back: 'العودة',
      error: 'خطأ',
    },
    en: {
      title: 'Create Your Account',
      phone: 'Phone Number',
      name: 'Full Name',
      birthDate: 'Date of Birth',
      sendCode: 'Send Code',
      verifyTitle: 'Verify Code',
      verifyDesc: 'Enter the code sent to your phone',
      otp: 'Code',
      verify: 'Verify',
      back: 'Back',
      error: 'Error',
    },
  }

  const t = signupTranslations.ar // Default to Arabic

  if (step === 'verify') {
    return (
      <div className="w-full max-w-md mx-auto p-6 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">{t.verifyTitle}</h2>
          <p className="text-muted-foreground">{t.verifyDesc}</p>
        </div>

        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div>
            <Label htmlFor="otp">{t.otp}</Label>
            <Input
              id="otp"
              type="text"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.slice(0, 6))}
              maxLength={6}
              disabled={loading}
              className="text-center text-2xl tracking-widest"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'جاري التحقق...' : t.verify}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => setStep('signup')}
            disabled={loading}
            className="w-full"
          >
            {t.back}
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t.title}</h2>
      </div>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <Label htmlFor="name">{t.name}</Label>
          <Input
            id="name"
            type="text"
            placeholder="أحمد محمود"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div>
          <Label htmlFor="birthDate">{t.birthDate}</Label>
          <Input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div>
          <Label htmlFor="phone">{t.phone}</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+20 123 456 7890"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'جاري الإرسال...' : t.sendCode}
        </Button>
      </form>
    </div>
  )
}
