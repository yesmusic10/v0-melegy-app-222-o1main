'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { useApp } from '@/lib/contexts/AppContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

const authTranslations = {
  ar: {
    welcome: 'أهلاً بك',
    signInDesc: 'سجل دخول لحسابك للمتابعة',
    signUpDesc: 'أنشئ حساب جديد',
    createAccount: 'إنشاء حساب',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    password: 'كلمة المرور',
    signIn: 'تسجيل الدخول',
    signUp: 'إنشاء حساب',
    or: 'أو',
    googleSignIn: 'الدخول عبر Google',
    noAccount: 'ليس لديك حساب؟',
    haveAccount: 'هل لديك حساب بالفعل؟',
    signUpLink: 'أنشئ واحد',
    signInLink: 'تسجيل الدخول',
    error: 'حدث خطأ',
    googleError: 'فشل تسجيل الدخول عبر Google',
  },
  en: {
    welcome: 'Welcome back',
    signInDesc: 'Sign in to your account to continue',
    signUpDesc: 'Create a new account',
    createAccount: 'Create an account',
    name: 'Name',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign in',
    signUp: 'Sign up',
    or: 'OR',
    googleSignIn: 'Sign in with Google',
    noAccount: "Don't have an account?",
    haveAccount: 'Already have an account?',
    signUpLink: 'Sign up',
    signInLink: 'Sign in',
    error: 'An error occurred',
    googleError: 'Google sign-in failed',
  },
}

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const { language, setLanguage } = useApp()
  const t = authTranslations[language]
  const isRTL = language === 'ar'
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isSignUp = mode === 'sign-up'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { error } = isSignUp
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password })

      if (error) {
        setError(error.message ?? 'Something went wrong')
        setLoading(false)
        return
      }

      router.push('/')
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setError(null)
    setLoading(true)
    try {
      await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/',
      })
    } catch (err) {
      setError(t.googleError)
      setLoading(false)
    }
  }

  return (
    <main className={`min-h-screen bg-background flex items-center justify-center px-4 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <Card className="w-full max-w-sm p-6">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {isSignUp ? t.createAccount : t.welcome}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isSignUp ? t.signUpDesc : t.signInDesc}
            </p>
          </div>
          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="px-3 py-1 text-xs font-medium border border-border rounded-md hover:bg-accent ml-4"
          >
            {language === 'ar' ? 'EN' : 'العربية'}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignUp && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">{t.name}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                disabled={loading}
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">{t.email}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">{t.password}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              disabled={loading}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading
              ? t.error
              : isSignUp
                ? t.signUp
                : t.signIn}
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-muted-foreground/20" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">{t.or}</span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className={`w-full flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {t.googleSignIn}
        </Button>

        <p className={`text-sm text-muted-foreground text-center mt-6 ${isRTL ? 'text-right' : 'text-left'}`}>
          {isSignUp ? t.haveAccount : t.noAccount}
          {' '}
          <Link
            href={isSignUp ? '/sign-in' : '/sign-up'}
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            {isSignUp ? t.signInLink : t.signUpLink}
          </Link>
        </p>
      </Card>
    </main>
  )
}
