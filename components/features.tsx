"use client"

import { ImageIcon } from "lucide-react"
import { useApp } from "@/lib/contexts/AppContext"

export function Features() {
  const { translations, language } = useApp()

  const features = [
    { icon: "🖼️", key: "imageAnalysis" as const },
    { icon: "🔍", key: "deepSearch" as const },
    { icon: "🧠", key: "mindMaps" as const },
    { icon: "✨", key: "ideaToPrompt" as const },
    { icon: "💬", key: "adaptiveCommunication" as const },
    { icon: "💡", key: "creativeSolving" as const },
    { icon: "🎨", key: "imageGeneration" as const },
    { icon: "📊", key: "spreadsheets" as const },
    { icon: "🤔", key: "deepThinking" as const },
  ]

  return (
    <section className="container mx-auto px-6 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
        {features.map((feature, index) => {
          const featureText = translations.features[feature.key]
          return (
            <div
              key={index}
              className="group relative bg-white border border-gray-200 rounded-2xl p-8 hover:border-blue-400 transition-all duration-300 hover:scale-105"
              style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)' }}
            >
              <div className="text-5xl mb-4">
                {feature.icon === "🖼️" ? <ImageIcon className="h-12 w-12 text-blue-500" /> : feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3" dir={language === "ar" ? "rtl" : "ltr"}>
                {featureText.title}
              </h3>
              <p className="text-gray-600 leading-relaxed" dir={language === "ar" ? "rtl" : "ltr"}>
                {featureText.description}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
