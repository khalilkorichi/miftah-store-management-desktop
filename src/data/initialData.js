export const DEFAULT_EXCHANGE_RATE = 3.75;

export const DEFAULT_CATEGORIES = [
  { id: 'cat_ai', name: 'الذكاء الاصطناعي', color: '#5E4FDE', icon: '🤖' },
  { id: 'cat_entertainment', name: 'الترفيه والإعلام', color: '#F7784A', icon: '🎬' },
  { id: 'cat_education', name: 'التعليم والتطوير', color: '#1A51F4', icon: '📚' },
  { id: 'cat_business', name: 'الأعمال والتسويق', color: '#11BA65', icon: '💼' },
  { id: 'cat_security', name: 'الأمن والحماية', color: '#F94B60', icon: '🔒' },
  { id: 'cat_design', name: 'تصميم وإبداع', color: '#EC4899', icon: '🎨' },
  { id: 'cat_productivity', name: 'الإنتاجية', color: '#FFC530', icon: '⚡' },
  { id: 'cat_cloud', name: 'التخزين السحابي', color: '#0EA5E9', icon: '☁️' },
];

export const DEFAULT_COSTS = [
  { id: 'salla_commission', name: 'عمولة سلة', type: 'percentage', value: 2, applyTo: 'all', active: true },
  { id: 'marketing', name: 'الحملات الإعلانية', type: 'percentage', value: 5, applyTo: 'all', active: true },
  { id: 'payment_fees', name: 'رسوم الدفع الإلكتروني', type: 'percentage', value: 1.75, applyTo: 'all', active: true },
];

export const DEFAULT_BUNDLES = [];
export const DEFAULT_COUPONS = [];
export const DEFAULT_PRICING_DATA = {}; // { productId: { primarySupplierId: number, strategy: string, margin: number, competitivePrices: [], psmData: {} } }

export const DEFAULT_TASKS = [];
export const DEFAULT_ACTIVATION_GUIDES = [];

export const DEFAULT_AI_SETTINGS = {
  aiProvider: 'gemini',
  geminiApiKey: '',
  geminiModel: 'gemini-2.5-flash',
  openrouterApiKey: '',
  openrouterModel: 'anthropic/claude-sonnet-4.6',
  agentrouterApiKey: '',
  agentrouterModel: 'gpt-4o',
  aiCustomPrompt: '',
};


export const DEFAULT_ACTIVATION_METHODS = [
  {
    id: 'personal_account',
    label: 'حساب العميل الشخصي',
    icon: '👤',
    description: 'يتطلب بريد إلكتروني وكلمة مرور من العميل',
    color: '#5E4FDE',
  },
  {
    id: 'ready_account',
    label: 'حساب جاهز',
    icon: '📦',
    description: 'نرسل للعميل بيانات حساب جاهز',
    color: '#11BA65',
  },
  {
    id: 'invite_link',
    label: 'رابط دعوة',
    icon: '✉️',
    description: 'إرسال رابط دعوة للبريد الإلكتروني للعميل',
    color: '#1A51F4',
  },
];

export const DEFAULT_DURATIONS = [
  { id: 'month_1', label: 'شهر', months: 1 },
  { id: 'month_3', label: '3 أشهر', months: 3 },
  { id: 'month_6', label: '6 أشهر', months: 6 },
  { id: 'month_12', label: 'سنة', months: 12 },
];

export const DEFAULT_SUPPLIERS = [
  { id: 1, name: 'المورد الأول', whatsapp: '', telegram: '', g2g: '' },
  { id: 2, name: 'المورد الثاني', whatsapp: '', telegram: '', g2g: '' },
  { id: 3, name: 'المورد الثالث', whatsapp: '', telegram: '', g2g: '' },
  { id: 4, name: 'المورد الرابع', whatsapp: '', telegram: '', g2g: '' },
];

export const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: 'ChatGPT Plus',
    plans: [
      { id: 1, durationId: 'month_1', prices: { 1: 20, 2: 22, 3: 19, 4: 21 } },
      { id: 2, durationId: 'month_12', prices: { 1: 200, 2: 220, 3: 190, 4: 210 } },
    ],
  },
  {
    id: 2,
    name: 'Spotify Premium',
    plans: [
      { id: 1, durationId: 'month_1', prices: { 1: 10, 2: 11, 3: 9.5, 4: 10.5 } },
      { id: 2, durationId: 'month_3', prices: { 1: 28, 2: 30, 3: 27, 4: 29 } },
      { id: 3, durationId: 'month_12', prices: { 1: 100, 2: 110, 3: 95, 4: 105 } },
    ],
  },
  {
    id: 3,
    name: 'YouTube Premium',
    plans: [
      { id: 1, durationId: 'month_1', prices: { 1: 14, 2: 15, 3: 13.5, 4: 14.5 } },
    ],
  },
  {
    id: 4,
    name: 'Netflix Standard',
    plans: [
      { id: 1, durationId: 'month_1', prices: { 1: 15.5, 2: 16, 3: 14.5, 4: 15 } },
    ],
  },
  {
    id: 5,
    name: 'Canva Pro',
    plans: [
      { id: 1, durationId: 'month_1', prices: { 1: 13, 2: 14, 3: 12.5, 4: 13.5 } },
      { id: 2, durationId: 'month_12', prices: { 1: 120, 2: 130, 3: 115, 4: 125 } },
    ],
  },
  {
    id: 6,
    name: 'Adobe Creative Cloud',
    plans: [
      { id: 1, durationId: 'month_1', prices: { 1: 55, 2: 57, 3: 53, 4: 56 } },
      { id: 2, durationId: 'month_12', prices: { 1: 600, 2: 620, 3: 580, 4: 610 } },
    ],
  },
  {
    id: 7,
    name: 'Microsoft 365',
    plans: [
      { id: 1, durationId: 'month_1', prices: { 1: 10, 2: 11, 3: 9.5, 4: 10.5 } },
      { id: 2, durationId: 'month_12', prices: { 1: 100, 2: 110, 3: 95, 4: 105 } },
    ],
  },
  {
    id: 8,
    name: 'Apple Music',
    plans: [
      { id: 1, durationId: 'month_1', prices: { 1: 11, 2: 12, 3: 10.5, 4: 11.5 } },
    ],
  },
  {
    id: 9,
    name: 'iCloud+ 200GB',
    plans: [
      { id: 1, durationId: 'month_1', prices: { 1: 3, 2: 3.5, 3: 2.8, 4: 3.2 } },
    ],
  },
  {
    id: 10,
    name: 'Google One 2TB',
    plans: [
      { id: 1, durationId: 'month_1', prices: { 1: 10, 2: 11, 3: 9.5, 4: 10.5 } },
      { id: 2, durationId: 'month_12', prices: { 1: 100, 2: 110, 3: 95, 4: 105 } },
    ],
  },
];
