/**
 * Egyptian Arabic Dialect Service
 * Converts formal Arabic to Egyptian colloquial (Aamiyah)
 * Makes the AI sound like a real person from Egypt
 */

// Egyptian dialect patterns and common phrases
const egyptianDictionary: Record<string, string> = {
  // Common formal to Egyptian conversions
  'السلام عليكم': 'السلام عليكم ورحمة الله',
  'كيف حالك': 'إزيك انت',
  'كيف حالك أنت': 'إزيك يا معلم',
  'شكراً': 'شكرا يا معلم',
  'من فضلك': 'لو سمحت',
  'أنا': 'أنا',
  'أنت': 'انت',
  'هو': 'هو',
  'هي': 'هي',
  'نحن': 'احنا',
  'أنتم': 'انتم',
  'هم': 'هم',
  'هؤلاء': 'دول',
  'ذاك': 'ده',
  'ذاتي': 'بتوعي',
  'ماذا': 'إيه',
  'متى': 'امتى',
  'أين': 'فين',
  'كيف': 'إزاي',
  'كم': 'كام',
  'لماذا': 'ليه',
  'هل': 'هل',
  'نعم': 'أيوه / أيه',
  'لا': 'لا / ما',
  'لكن': 'بس',
  'لذلك': 'علشان كده',
  'إذاً': 'يبقى',
  'سوف': 'هـ / رايح',
  'يمكن': 'ممكن',
  'يجب': 'لازم',
  'قال': 'قال',
  'ذهب': 'راح / قام',
  'جاء': 'جاي / طلع',
  'ذهبت': 'رحت',
  'جاءت': 'جاية / طلعت',
  'أستطيع': 'اقدر / أقدر',
  'تستطيع': 'تقدر / تقدري',
  'أريد': 'عايز / اعوز',
  'تريد': 'عايز / عايزة',
  'أحب': 'بحب',
  'يحب': 'بيحب',
  'أعرف': 'أعرف / عارف',
  'تعرف': 'تعرف / عارف',
  'أسمع': 'أسمع',
  'أرى': 'أشوف',
  'أشعر': 'حاسس',
  'أفكر': 'أفتكر / بفتكر',
  'أتذكر': 'أفتكر',
  'لا أتذكر': 'ما فتكرتش',
  'أسف': 'أسف / معلش',
  'شكراً جزيلاً': 'شكراً يا معلم',
  'من أين': 'من فين',
  'إلى أين': 'لفين',
  'أي شيء': 'حاجة إيه',
  'أي واحد': 'أي حد',
  'كل شيء': 'كل حاجة',
  'شيء': 'حاجة',
  'واحد': 'حد',
  'شخص': 'حد / راجل',
  'امرأة': 'بنت / سيدة',
  'رجل': 'راجل',
  'الآن': 'دلوقتي',
  'اليوم': 'النهاردة',
  'أمس': 'أمبارح',
  'غداً': 'بكرة',
  'أسبوع': 'أسبوع',
  'شهر': 'شهر',
  'سنة': 'سنة / سنين',
  'ساعة': 'ساعة',
  'دقيقة': 'دقيقة',
  'ثانية': 'ثانية',
  'جميل': 'حلو / تمام',
  'سيء': 'وحش / تمام التمام',
  'كبير': 'كبير',
  'صغير': 'صغير',
  'طويل': 'طويل',
  'قصير': 'قصير',
  'سريع': 'بسرعة',
  'بطيء': 'ببطء',
  'ساخن': 'شديد الحرارة',
  'بارد': 'بارد',
  'رطب': 'رطب',
  'جاف': 'جاف',
  'نظيف': 'نضيف',
  'وسخ': 'وسخ',
  'أبيض': 'أبيض',
  'أسود': 'أسود',
  'أحمر': 'أحمر',
  'أزرق': 'أزرق',
  'أخضر': 'أخضر',
  'أصفر': 'أصفر',
  'برتقالي': 'برتقالي',
  'بنفسجي': 'بنفسجي',
  'رمادي': 'رمادي',
  'بني': 'بني',
}

// Egyptian expressions and colloquialisms
const egyptianExpressions: Record<string, string> = {
  'يا سلام': 'يا سلام',
  'الحمد لله': 'الحمد لله',
  'ما شاء الله': 'ما شاء الله',
  'بارك الله فيك': 'بارك الله فيك',
  'السلام عليكم ورحمة الله': 'السلام عليكم ورحمة الله',
  'وعليكم السلام ورحمة الله': 'وعليكم السلام ورحمة الله',
  'صباح الخير': 'صباح الخير',
  'مساء الخير': 'مساء الخير',
  'تصبح على خير': 'تصبح على خير',
  'كيف أنت': 'إزيك انت يا معلم',
  'كيف حالك': 'إزيك',
  'بخير': 'تمام التمام',
  'أنا بخير': 'الحمد لله تمام',
  'شكراً جزيلاً': 'شكراً يا معلم',
  'من فضلك': 'لو سمحت يا معلم',
  'معاً': 'مع بعض',
  'دائماً': 'دايما',
  'أبداً': 'أبدا',
  'ربما': 'ممكن',
  'لعلّ': 'يا رب',
  'إن شاء الله': 'إن شاء الله',
  'والله': 'والله',
  'أيم الله': 'ايم الله',
  'أحلف بالله': 'أحلف بالله',
  'بحياتك': 'بحياتك',
  'بحياة ربنا': 'بحياة ربنا',
}

// Common Egyptian slang and interjections
const egyptianSlang: Record<string, string> = {
  'يا إلهي': 'يا إلهي',
  'يا خسارة': 'يا خسارة',
  'يا نهار': 'يا نهار',
  'يا شيخ': 'يا شيخ',
  'يا معلم': 'يا معلم',
  'يا بني': 'يا بني',
  'يا بنت': 'يا بنت',
  'يا رجل': 'يا رجل',
  'يا ستي': 'يا ستي',
  'يا حج': 'يا حج',
  'خلاص': 'خلاص',
  'تمام': 'تمام',
  'ماشي': 'ماشي',
  'حاضر': 'حاضر',
  'أيه كده': 'أيه كده',
  'هاي': 'هاي',
  'آآه': 'آآه',
  'واو': 'واو',
}

export function convertToEgyptian(text: string): string {
  let result = text

  // Replace formal words with Egyptian equivalents
  for (const [formal, egyptian] of Object.entries(egyptianDictionary)) {
    const regex = new RegExp(`\\b${formal}\\b`, 'gi')
    result = result.replace(regex, egyptian)
  }

  // Replace expressions
  for (const [formal, egyptian] of Object.entries(egyptianExpressions)) {
    const regex = new RegExp(`\\b${formal}\\b`, 'gi')
    result = result.replace(regex, egyptian)
  }

  return result
}

export function addEgyptianFlavor(text: string): string {
  // Add Egyptian personality
  let result = text

  // Add common Egyptian interjections naturally
  const interjections = ['يا معلم', 'يا شيخ', 'تمام التمام', 'ما فيش مشكلة']
  
  // Randomly add personality touches
  if (Math.random() > 0.7 && !result.includes('يا')) {
    result = interjections[Math.floor(Math.random() * interjections.length)] + ' ' + result
  }

  // Convert to Egyptian dialect
  result = convertToEgyptian(result)

  return result
}

export function isEgyptianArabic(text: string): boolean {
  // Detect if text is already in Egyptian dialect
  const egyptianMarkers = ['إزيك', 'دلوقتي', 'احنا', 'يا معلم', 'دول', 'ليه', 'ماشي']
  return egyptianMarkers.some(marker => text.includes(marker))
}

export function normalizeEgyptianText(text: string): string {
  // Normalize Egyptian dialect variations
  const normalizations: Record<string, string> = {
    'إزيك': 'إزيك',
    'ازيك': 'إزيك',
    'ايزيك': 'إزيك',
    'دلوقتي': 'دلوقتي',
    'دلوقت': 'دلوقتي',
    'ديلوقتي': 'دلوقتي',
    'احنا': 'احنا',
    'احن': 'احنا',
    'احنى': 'احنا',
    'ليه': 'ليه',
    'لي': 'ليه',
    'لية': 'ليه',
    'فين': 'فين',
    'في': 'فين',
    'ماشي': 'ماشي',
    'ماشى': 'ماشي',
    'تمام': 'تمام',
    'تمام التمام': 'تمام التمام',
  }

  let result = text
  for (const [variation, correct] of Object.entries(normalizations)) {
    const regex = new RegExp(`\\b${variation}\\b`, 'gi')
    result = result.replace(regex, correct)
  }

  return result
}
