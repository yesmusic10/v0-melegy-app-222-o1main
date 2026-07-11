"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare, ArrowDown, Smartphone, Apple, X, Share, PlusSquare } from "lucide-react"
import { useRouter } from "next/navigation"
import { useApp } from "@/lib/contexts/AppContext"
import { useSession } from "@/lib/auth-client"

export function Hero() {
  const { translations, language } = useApp()
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [installed, setInstalled] = useState(false)
  const [showAppleGuide, setShowAppleGuide] = useState(false)

  const handleStartChat = () => {
    if (session?.user) {
      router.push("/chat")
    } else {
      router.push("/sign-in")
    }
  }

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e) }
    window.addEventListener("beforeinstallprompt", handler)
    window.addEventListener("appinstalled", () => setInstalled(true))
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  async function handleAndroidInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") setInstalled(true)
    setDeferredPrompt(null)
  }

  return (
    <section className="container mx-auto px-6 pt-32 pb-20 text-center">
      {/* Logo */}
      <div className="flex justify-center mb-12">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-400/20 dark:bg-blue-500/30 rounded-full blur-3xl" />
          <div
            className="relative w-48 h-48 rounded-3xl bg-white dark:bg-gray-900 flex items-center justify-center overflow-hidden"
            style={{
              boxShadow:
                'light' === 'light'
                  ? '0 8px 32px rgba(59,130,246,0.18), 0 2px 8px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.9)'
                  : '0 8px 32px rgba(59,130,246,0.25), 0 2px 8px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.1)',
            }}
          >
            <img
              src="/images/melegy-logo.png"
              alt="Melegy Logo"
              className="w-4/5 h-4/5 object-contain"
            />
          </div>
        </div>
      </div>

      {/* Heading */}
      <h1 className="text-6xl md:text-7xl font-bold text-blue-600 dark:text-blue-400 mb-6">
        {translations.heroTitle}
      </h1>

      {/* Subtitle */}
      <p
        className="text-2xl md:text-3xl text-gray-800 dark:text-white mb-4 font-semibold text-center"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        {translations.heroSubtitle}
      </p>

      {/* Version */}
      <p className="text-base text-blue-500 dark:text-white mb-8">{translations.heroVersion}</p>

      {/* Description */}
      <p
        className="text-lg text-gray-600 dark:text-white mb-12 max-w-3xl mx-auto text-center"
        dir={language === "ar" ? "rtl" : "ltr"}
      >
        {translations.heroDescription}
      </p>

      <div className="flex flex-col items-center gap-4">
        <Button
          size="lg"
          onClick={handleStartChat}
          disabled={isPending}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            boxShadow: '0 4px 14px rgba(59,130,246,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
          }}
        >
          <MessageSquare className={language === "ar" ? "ml-2 h-5 w-5" : "mr-2 h-5 w-5"} />
          {translations.startChat}
        </Button>

        {/* PWA Install Buttons */}
        <div className="flex gap-3 mt-1" dir="rtl">
          <button
            onClick={handleAndroidInstall}
            disabled={installed}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700 text-sm font-medium rounded-xl px-5 py-3 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <Smartphone className="w-4 h-4 text-blue-500 shrink-0" />
            {installed ? "تم التثبيت" : "تثبيت Android"}
          </button>
          <button
            onClick={() => setShowAppleGuide(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl px-5 py-3 transition-all"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <Apple className="w-4 h-4 text-gray-600 shrink-0" />
            تثبيت iPhone
          </button>
        </div>
      </div>

      {/* Apple Guide Modal */}
      {showAppleGuide && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          dir="rtl"
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm mx-4"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-gray-900 dark:text-white font-bold text-lg">تثبيت على iPhone</h3>
              <button
                onClick={() => setShowAppleGuide(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              {[
                { num: 1, title: "افتح الموقع في Safari", desc: "التثبيت بيشتغل من Safari بس على iPhone", icon: null },
                { num: 2, title: "اضغط زر المشاركة", desc: "الزرار ده في أسفل الشاشة", icon: <Share className="w-5 h-5 text-blue-500 shrink-0" /> },
                { num: 3, title: 'اختار "أضف إلى الشاشة الرئيسية"', desc: "Add to Home Screen", icon: <PlusSquare className="w-5 h-5 text-blue-500 shrink-0" /> },
                { num: 4, title: 'اضغط "إضافة"', desc: "الأداة هتتثبت على شاشتك زي أي تطبيق", icon: null },
              ].map(({ num, title, desc, icon }) => (
                <div key={num} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                    {num}
                  </div>
                  <div className="flex items-start gap-2 flex-1">
                    <div>
                      <p className="text-gray-800 dark:text-white text-sm font-medium">{title}</p>
                      <p className="text-gray-500 dark:text-white text-xs mt-0.5">{desc}</p>
                    </div>
                    {icon}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowAppleGuide(false)}
              className="w-full mt-5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-white rounded-xl py-3 text-sm font-medium transition-colors"
            >
              فهمت، شكراً
            </button>
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="mt-8 flex flex-col items-center gap-3">
        <p
          className="text-lg text-gray-700 dark:text-white font-medium text-center max-w-3xl"
          dir={language === "ar" ? "rtl" : "ltr"}
        >
          {translations.heroCta}
        </p>
        <p
          className="text-base text-gray-500 dark:text-white text-center"
          dir={language === "ar" ? "rtl" : "ltr"}
        >
          {translations.heroCtaSub}
        </p>
        <ArrowDown className="h-8 w-8 text-cyan-500 animate-bounce" />
      </div>
    </section>
  )
}
