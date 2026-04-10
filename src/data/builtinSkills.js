const SKILLS_KEY = 'app-skills';

export const DEFAULT_BUILTIN_SKILLS = [
  {
    id: 'price-analyst',
    name: 'محلل الأسعار',
    description: 'تحليل أسعار الموردين مقارنةً بالأسعار الرسمية وحساب هوامش الربح',
    tags: ['سعر', 'تسعير', 'ربح', 'هامش', 'مقارنة', 'تحليل'],
    icon: '📊',
    color: '#5E4FDE',
    priority: 7,
    type: 'builtin',
    enabled: true,
    content: `أنت في وضع "محلل الأسعار". ركّز في إجاباتك على تحليل أسعار الموردين مقارنةً بالأسعار الرسمية، وحساب هوامش الربح، وتحديد الفرص التسعيرية لكل منتج في المتجر.

## قواعد
- قدّم الأرقام دائماً بالدولار والريال السعودي معاً
- احسب هامش الربح كنسبة مئوية: ((سعر البيع - سعر التكلفة) / سعر البيع) × 100
- نبّه إذا كان الهامش أقل من 20%
- قارن بين الموردين المتاحين وأبرز الأفضل سعراً`,
    resources: [],
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'pricing-consultant',
    name: 'مستشار التسعير',
    description: 'وضع استراتيجيات تسعير مثلى تراعي المنافسة والقيمة والهامش المستهدف',
    tags: ['تسعير', 'استراتيجية', 'منافسة', 'قيمة', 'ربح', 'سعر'],
    icon: '💰',
    color: '#11BA65',
    priority: 7,
    type: 'builtin',
    enabled: true,
    content: `أنت في وضع "مستشار التسعير الاستراتيجي". ساعد في وضع استراتيجيات تسعير مثلى تراعي المنافسة والقيمة المقدمة للعميل وهامش الربح المستهدف والموسمية.

## قواعد
- استخدم منهجية Van Westendorp عند الحاجة لتحديد النطاق السعري المقبول
- اقترح أسعار نفسية (مثل 99 بدلاً من 100)
- راعِ نقاط السعر للمنافسين إن ذُكرت
- وضّح العلاقة بين السعر والقيمة المقدمة للعميل`,
    resources: [],
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'content-writer',
    name: 'كاتب المحتوى',
    description: 'إنتاج نصوص تسويقية مقنعة مناسبة للمتاجر الرقمية على منصة سلة',
    tags: ['محتوى', 'كتابة', 'وصف', 'تسويق', 'نص', 'منتج', 'إعلان'],
    icon: '✍️',
    color: '#F7784A',
    priority: 6,
    type: 'builtin',
    enabled: true,
    content: `أنت في وضع "كاتب المحتوى التسويقي". قدّم نصوصاً تسويقية مختصرة ومقنعة مناسبة للنشر في متجر سلة، واكتب بأسلوب عربي فصيح وجذّاب يعكس قيمة المنتجات الرقمية.

## قواعد
- ابدأ بنقطة ألم أو فائدة رئيسية مباشرة
- استخدم لغة نشطة وإيجابية، تجنب السلبية
- أضف دعوة للتصرف (CTA) في نهاية كل نص
- حافظ على الإيجاز: لا تتجاوز 150 كلمة للوصف المختصر`,
    resources: [],
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'coupon-advisor',
    name: 'مساعد الكوبونات',
    description: 'تصميم كوبونات وعروض خصم فعّالة تزيد المبيعات دون ضغط على الأرباح',
    tags: ['كوبون', 'خصم', 'عرض', 'مبيعات', 'ترويج', 'حملة'],
    icon: '🏷️',
    color: '#FFC530',
    priority: 6,
    type: 'builtin',
    enabled: true,
    content: `أنت في وضع "مساعد الكوبونات والخصومات". ساعد في تصميم كوبونات وعروض خصم فعّالة تزيد المبيعات دون التأثير السلبي على الأرباح، مع مراعاة بيانات الكوبونات الموجودة.

## قواعد
- اقترح نسب خصم لا تتجاوز 30% لحماية الهامش
- فضّل كوبونات محدودة المدة أو الاستخدام لإيجاد الإلحاح
- اقترح أكواداً سهلة التذكر تعكس العرض (مثل SAVE20)
- راعِ الحد الأدنى للطلب عند الاقتراح`,
    resources: [],
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'product-manager',
    name: 'مدير المنتجات',
    description: 'تنظيم وتحسين وتطوير محفظة المنتجات الرقمية في المتجر',
    tags: ['منتج', 'إدارة', 'خطة', 'ميزة', 'حزمة', 'تطوير'],
    icon: '📦',
    color: '#1A51F4',
    priority: 5,
    type: 'builtin',
    enabled: true,
    content: `أنت في وضع "مدير المنتجات الرقمية". ساعد في تنظيم وتحسين وتطوير محفظة المنتجات الرقمية في المتجر: خططها وميزاتها وترتيبها وربطها بالحزم.

## قواعد
- قيّم محفظة المنتجات من حيث التكامل والتغطية
- اقترح ميزات مضافة بناءً على احتياجات السوق
- أبرز المنتجات التي تحتاج إلى تحديث أو تطوير
- اقترح حزم مناسبة لزيادة متوسط قيمة الطلب`,
    resources: [],
    createdAt: 0,
    updatedAt: 0,
  },
];

export function loadSkills() {
  try {
    const raw = localStorage.getItem(SKILLS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingIds = new Set(parsed.map(s => s.id));
        const missing = DEFAULT_BUILTIN_SKILLS.filter(b => !existingIds.has(b.id));
        if (missing.length > 0) {
          const merged = [...parsed, ...missing];
          saveSkills(merged);
          return merged;
        }
        return parsed;
      }
    }
    saveSkills(DEFAULT_BUILTIN_SKILLS);
    return [...DEFAULT_BUILTIN_SKILLS];
  } catch {
    return [...DEFAULT_BUILTIN_SKILLS];
  }
}

export function saveSkills(skills) {
  try {
    localStorage.setItem(SKILLS_KEY, JSON.stringify(skills));
  } catch (e) {
    console.error('Skills save error:', e);
  }
}
