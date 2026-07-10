/**
 * lib/web-search-service.ts
 * خدمة البحث على الإنترنت لـ Melegy - للإجابات الحديثة والموثوقة
 */

export interface SearchResult {
  title: string
  url: string
  snippet: string
  source: string
}

export interface WebSearchResponse {
  query: string
  results: SearchResult[]
  shouldSearch: boolean
  reason: string
}

/**
 * كشف إذا كان السؤال يحتاج بحث حقيقي على الإنترنت
 */
export function shouldPerformWebSearch(query: string): boolean {
  const lower = query.toLowerCase()

  // كلمات تشير إلى أسئلة تحتاج بحث حقيقي
  const searchKeywords = [
    // وقت (أخبار، أحداث حالية)
    "آخر", "جديد", "اليوم", "أمس", "الآن", "حالي", "أخير", "recent",
    "latest", "today", "yesterday", "current",

    // تاريخ (بعد Nov 2023)
    "2024", "2025", "2026", "حديث", "جديد",

    // أخبار وأحداث
    "أخبار", "حدث", "عاجل", "كسر", "جديد", "news", "breaking", "event",

    // شركات وأسهم
    "سعر", "أسهم", "بورصة", "شركة", "stock", "price", "market",

    // رياضة
    "فريق", "لاعب", "نتيجة", "كأس", "دورة", "مباراة", "sports", "game",
    "score", "match",

    // الطقس
    "الطقس", "درجة", "حرارة", "مطر", "weather", "temperature",

    // الموقع
    "مصر", "قاهرة", "الإسكندرية", "الرياض", "دبي", "location", "city",

    // صحة وطب
    "مرض", "دواء", "علاج", "لقاح", "فيروس", "health", "medicine",

    // تعريفات منتجات جديدة
    "هاتف جديد", "تطبيق جديد", "إصدار جديد", "release", "launch",

    // احصائيات
    "إحصائية", "نسبة", "عدد", "كم", "statistics", "percentage",
  ]

  // تحقق من وجود أي كلمة من الكلمات المفتاحية
  return searchKeywords.some((keyword) => lower.includes(keyword))
}

/**
 * عمل بحث حقيقي على الإنترنت
 * (هذا سيتم استدعاؤه من API route الذي لديه إمكانية Web Search)
 */
export function buildSearchQuery(query: string): string {
  // أزيل "آخر" أو "جديد" من البداية إذا كانت موجودة
  const cleaned = query
    .replace(/^(آخر|جديد|الأخير)\s+/, "")
    .replace(/^(latest|recent|new)\s+/, "")

  return cleaned || query
}

/**
 * تنسيق نتائج البحث لـ Melegy مع دوائر مرجعية احترافية
 */
export function formatSearchResults(results: SearchResult[]): string {
  if (!results || results.length === 0) {
    return ""
  }

  // أعرض أول 3-5 نتائج
  const topResults = results.slice(0, 5)

  // بناء HTML للمراجع بشكل احترافي مع ref-badge class
  const references = topResults
    .map((result, index) => {
      const icon = getSourceIcon(result.source)
      const cleanTitle = result.title.substring(0, 30)
      return `<a href="${result.url}" target="_blank" rel="noopener noreferrer" class="ref-badge" title="${result.title}">
${icon} ${cleanTitle}...
</a>`
    })
    .join(" ")

  return `
<div class="web-search-references" style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
  ${references}
</div>
`
}

/**
 * اختيار emoji للمصدر
 */
function getSourceIcon(source: string): string {
  const sourceLower = source.toLowerCase()

  if (sourceLower.includes("wikipedia")) return "📚"
  if (sourceLower.includes("news") || sourceLower.includes("أخبار")) return "📰"
  if (sourceLower.includes("academic") || sourceLower.includes("scholar"))
    return "🎓"
  if (sourceLower.includes("github")) return "💻"
  if (sourceLower.includes("stackoverflow")) return "🔧"
  if (sourceLower.includes("youtube")) return "📹"
  if (sourceLower.includes("reddit")) return "🔗"

  return "🌐"
}

/**
 * CSS للمراجع الاحترافية
 */
export const REFERENCES_CSS = `
<style>
.web-search-references {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.ref-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 20px;
  color: #3b82f6;
  text-decoration: none;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s;
  cursor: pointer;
}

.ref-badge:hover {
  background: rgba(59, 130, 246, 0.2);
  border-color: rgba(59, 130, 246, 0.5);
  transform: translateY(-1px);
}

.ref-badge:active {
  transform: translateY(0);
}
</style>
`
