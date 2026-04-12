export const DEFAULT_AGENCY_DATA = {
  agents: {
    scott: { provider: 'gemini', model: '', apiKey: '', skillId: '', style: 'يركز على الأرقام والبيانات والمقارنات السعرية', enabled: true },
    spark: { provider: 'gemini', model: '', apiKey: '', skillId: '', style: 'يركز على الإبداع والعاطفة وأسلوب الحياة', enabled: true },
    brill: { provider: 'gemini', model: '', apiKey: '', skillId: '', style: 'ينتج كاروسيل وبوستات مرئية منظمة', enabled: true },
    rami:  { provider: 'gemini', model: '', apiKey: '', skillId: '', style: 'يكتب سكريبتات فيديو بأسلوب سردي', enabled: true },
    lens:  { provider: 'gemini', model: '', apiKey: '', skillId: '', style: 'يفحص تطابق المحتوى مع هوية العلامة التجارية', enabled: true },
  },
  brandIdentity: {
    voice: '',
    forbiddenWords: '',
    checklistItems: [],
    brandColors: '',
    guidelines: '',
  },
  pipeline: [],
  chatHistory: [],
  schedule: { enabled: false, time: '08:00' },
};

export const AGENCY_STORAGE_KEY = 'miftah_content_agency';

export const AGENT_META = {
  scott: { name: 'Scott', nameAr: 'سكوت', role: 'منشئ الأفكار الرقمية', icon: '📊', color: '#3B82F6' },
  spark: { name: 'Spark', nameAr: 'سبارك', role: 'منشئ الأفكار الإبداعية', icon: '✨', color: '#F59E0B' },
  brill: { name: 'Brill', nameAr: 'بريل', role: 'منتجة الكاروسيل والبوستات', icon: '🎨', color: '#EC4899' },
  rami:  { name: 'Rami', nameAr: 'رامي', role: 'كاتب السكريبتات', icon: '🎬', color: '#10B981' },
  lens:  { name: 'Lens', nameAr: 'لينس', role: 'مفتشة الجودة', icon: '🔍', color: '#8B5CF6' },
  buffy: { name: 'Buffy', nameAr: 'بوفي', role: 'ناشرة السوشيال ميديا', icon: '📱', color: '#6B7280', comingSoon: true },
};

export const CONTENT_TYPES = [
  { id: 'carousel', label: 'كاروسيل', icon: '🖼️' },
  { id: 'post', label: 'بوست نصي', icon: '📝' },
  { id: 'script', label: 'سكريبت فيديو', icon: '🎬' },
];

export const PIPELINE_STAGES = ['ideation', 'approval', 'production', 'qa', 'done', 'rejected'];
