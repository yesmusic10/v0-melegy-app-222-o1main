import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { AuthForm } from '@/components/auth-form'

export const metadata = {
  title: 'Sign In',
  description: 'Sign in to your account',
}

export default async function SignInPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (session?.user) {
    redirect('/')
  }

  return <AuthForm mode="sign-in" />
}
