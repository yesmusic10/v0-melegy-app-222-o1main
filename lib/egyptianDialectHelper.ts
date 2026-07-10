/**
 * Egyptian Dialect Helper - Transforms formal Arabic into Egyptian Colloquial Arabic
 * Simulates native Shubra resident speaking style
 */

const EGYPTIAN_TRANSFORMATIONS: Record<string, string> = {
  // Common formal to Egyptian conversions
  'أنا': 'أنا',
  'أنت': 'إنت',
  'أنتم': 'انتو',
  'هو': 'هو',
  'هي': 'هي',
  'هم': 'هما',
  'ماذا': 'إيه',
  'ماهو': 'ايه',
  'لماذا': 'ليه',
  'كيف': 'إزاي',
  'كيفك': 'إزايك',
  'ما': 'ما',
  'ليس': 'مش',
  'ليست': 'مش',
  'هل': '',
  'أو': 'ولا',
  'و': 'و',
  'في': 'في',
  'من': 'من',
  'إلى': 'ل',
  'على': 'على',
  'عن': 'عن',
  'بدون': 'بلاش',
  'أين': 'فين',
  'تمام': 'تمام',
  'حسناً': 'حاضر',
  'بالتأكيد': 'أكيد',
  'طبعاً': 'طبعاً',
  'شكراً': 'شكراً',
  'شكرا': 'شكرا',
  'من فضلك': 'من فضلك',
  'أرجوك': 'أرجوك',
  'لا': 'لا',
  'لا شيء': 'حاجة',
  'شيء': 'حاجة',
  'شي': 'حاجة',
  'هنا': 'هنا',
  'هناك': 'هناك',
  'هنالك': 'هنالك',
  'عندي': 'عندي',
  'عندك': 'عندك',
  'عنده': 'عنده',
  'عندها': 'عندها',
  'عندنا': 'عندنا',
  'عندكم': 'عندكو',
  'عندهم': 'عندهم',
  'الآن': 'دلوقتي',
  'الان': 'دلوقتي',
  'اليوم': 'النهاردة',
  'أمس': 'أمبارح',
  'غداً': 'بكرة',
  'غدا': 'بكرة',
  'الغد': 'بكرة',
  'البارحة': 'أمبارح',
  'أمس': 'أمبارح',
  'الأسبوع': 'الأسبوع',
  'الشهر': 'الشهر',
  'السنة': 'السنة',
  'السنوات': 'السنين',
  'أسف': 'آسف',
  'آسف': 'آسف',
  'متأسف': 'آسف',
  'مؤسف': 'حزين',
  'حزين': 'حزين',
  'سعيد': 'فرحان',
  'فرح': 'فرحان',
  'غاضب': 'زعلان',
  'غضب': 'زعل',
  'خائف': 'خايف',
  'خوف': 'خايف',
  'هادئ': 'هادي',
  'ساخن': 'حر',
  'بارد': 'برد',
  'جميل': 'جميل',
  'قبيح': 'وحش',
  'كبير': 'كبير',
  'صغير': 'صغير',
  'طويل': 'طويل',
  'قصير': 'قصير',
  'سريع': 'سريع',
  'بطيء': 'بطيء',
  'ثقيل': 'تقيل',
  'خفيف': 'خفيف',
  'مشغول': 'مشغول',
  'فارغ': 'فاضي',
  'نظيف': 'نظيف',
  'وسخ': 'وسخ',
  'حار': 'حر',
  'بارد': 'برد',
  'نعم': 'أيوه',
  'نعم نعم': 'أيوه أيوه',
  'كلا': 'لا',
  'نفي': 'لا',
}

const COLLOQUIAL_ADDITIONS = [
  'يا معلم',
  'يا عم',
  'يا صاح',
  'يا جماعة',
  'والله',
  'وربنا',
  'إن شاء الله',
  'بإذن الله',
  'تمام التمام',
  'حاضر يا معلم',
  'تمام؟',
  'تمام كويس؟',
  'ياااه',
  'الحمد لله',
  'يا سلام',
  'آه آه',
  'إيه الحكاية؟',
  'إيه اللي بيحصل؟',
]

const INFORMAL_SPELLINGS: Record<string, string> = {
  'أول': 'أول',
  'ثاني': 'ثاني',
  'ثالث': 'ثالث',
  'رابع': 'رابع',
  'خامس': 'خامس',
  'سادس': 'سادس',
  'ساعة': 'ساعة',
  'دقيقة': 'دقيقة',
  'ثانية': 'ثانية',
}

export function applyEgyptianDialect(text: string): string {
  if (!text) return text

  let result = text

  // Apply transformations (order matters - longer strings first)
  const sortedKeys = Object.keys(EGYPTIAN_TRANSFORMATIONS).sort((a, b) => b.length - a.length)
  
  for (const formalWord of sortedKeys) {
    const egyptianWord = EGYPTIAN_TRANSFORMATIONS[formalWord]
    const regex = new RegExp(`\\b${formalWord}\\b`, 'gi')
    result = result.replace(regex, egyptianWord)
  }

  // Add Egyptian colloquial expressions randomly at natural points
  // (but don't overdo it to keep it readable)
  if (Math.random() > 0.6 && !result.includes('يا معلم')) {
    const randomAddition = COLLOQUIAL_ADDITIONS[Math.floor(Math.random() * COLLOQUIAL_ADDITIONS.length)]
    if (result.includes('؟')) {
      result = result.replace('؟', ` يا معلم؟`)
    } else if (result.includes('!')) {
      result = result.replace('!', ` يا معلم!`)
    } else {
      result = `${result} يا معلم`
    }
  }

  return result
}

export function makeEgyptianFriendly(text: string): string {
  let result = applyEgyptianDialect(text)
  
  // Ensure it sounds like someone from Shubra speaking
  if (!result.toLowerCase().includes('تمام')) {
    result = result.replace(/\./, ' - تمام؟')
  }
  
  return result
}

export function validateEgyptianResponse(text: string): boolean {
  // Check if response has Egyptian markers
  const egyptianMarkers = ['يا معلم', 'إزاي', 'دلوقتي', 'ليه', 'مش', 'أيوه', 'لا', 'تمام']
  return egyptianMarkers.some(marker => text.includes(marker))
}
