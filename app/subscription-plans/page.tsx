'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'

const PLANS = [
  {
    id: 'free',
    name: 'مجاني',
    price: '0',
    description: 'للمبتدئين',
    features: [
      '10 رسائل يومية',
      'محادثة واحدة',
      'دعم محدود',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '9.99',
    description: 'الأكثر شعبية',
    features: [
      '500 رسالة يومية',
      'محادثات غير محدودة',
      'دعم الأولوية',
      'تحليلات متقدمة',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    description: 'للشركات',
    features: [
      'استخدام غير محدود',
      'دعم مخصص 24/7',
      'تكامل API',
      'تحليلات شاملة',
    ],
  },
]

export default function SubscriptionPlansPage() {
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<string>('free')
  const [loading, setLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const id = localStorage.getItem('userId')
    setUserId(id)
  }, [])

  const handleSelectPlan = async (planId: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/subscriptions/select-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          plan: planId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to select plan')
      }

      localStorage.setItem('subscriptionPlan', planId)
      router.push('/chat')
    } catch (error) {
      console.error('[v0] Error selecting plan:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-slate-900">اختر خطتك</h1>
          <p className="text-lg text-slate-600">ابدأ مع ميليجي اليوم</p>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {PLANS.map((plan) => (
            <Card
              key={plan.id}
              className={`relative p-8 space-y-6 transition-all ${
                selectedPlan === plan.id
                  ? 'ring-2 ring-blue-500 shadow-lg'
                  : 'hover:shadow-md'
              }`}
            >
              {plan.id === 'pro' && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  الأشهر
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-sm text-slate-600">{plan.description}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== 'Custom' && <span className="text-slate-600">/شهر</span>}
                </div>
              </div>

              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex gap-3">
                    <svg className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={loading}
                variant={selectedPlan === plan.id ? 'default' : 'outline'}
                className="w-full"
              >
                {loading ? 'جاري المعالجة...' : 'اختر هذه الخطة'}
              </Button>
            </Card>
          ))}
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <p className="text-slate-700">
            يمكنك تغيير خطتك في أي وقت. لا توجد عقود طويلة الأمد.
          </p>
        </div>
      </div>
    </div>
  )
}
