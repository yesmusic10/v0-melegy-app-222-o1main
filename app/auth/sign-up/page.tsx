import { PhoneSignupForm } from '@/components/phone-signup-form'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">ميليجي</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <PhoneSignupForm />
        </div>
      </div>
    </div>
  )
}
