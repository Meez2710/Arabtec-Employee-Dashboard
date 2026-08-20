import type { WorkspaceLocale } from "@/contexts/LocaleContext";

/**
 * Every employee- and console-facing string, in both languages.
 *
 * Copy rules (see docs/ACTION_PLAN.md): official, brief, human. Tell people what
 * changed and what to do. One empty-state sentence, reused everywhere — never
 * eight variations of "nothing here yet".
 */
export const copy = {
  brand: { en: "Arabtec", ar: "أرابتك" },
  workspace: { en: "Employee Workspace", ar: "مساحة عمل الموظفين" },
  tagline: { en: "Official updates and practical resources", ar: "التحديثات الرسمية والموارد العملية" },

  nav: {
    home: { en: "Home", ar: "الرئيسية" },
    updates: { en: "Updates", ar: "التحديثات" },
    opportunities: { en: "Opportunities", ar: "الفرص" },
    resources: { en: "Resources", ar: "الموارد" },
  },

  actions: {
    search: { en: "Search updates", ar: "البحث في التحديثات" },
    openSearch: { en: "Open search", ar: "فتح البحث" },
    closeSearch: { en: "Close search", ar: "إغلاق البحث" },
    switchLanguage: { en: "العربية", ar: "English" },
    switchLanguageLabel: { en: "Switch to Arabic", ar: "التبديل إلى الإنجليزية" },
    readMore: { en: "Read more", ar: "اقرأ المزيد" },
    openLink: { en: "Open link", ar: "فتح الرابط" },
    back: { en: "Back", ar: "رجوع" },
    backToUpdates: { en: "All updates", ar: "كل التحديثات" },
    acknowledge: { en: "Mark as read", ar: "وضع علامة مقروء" },
    acknowledged: { en: "Acknowledged", ar: "تم الاطلاع" },
    viewAll: { en: "View all", ar: "عرض الكل" },
    apply: { en: "Register interest", ar: "تسجيل الاهتمام" },
    signIn: { en: "Sign in", ar: "تسجيل الدخول" },
    retry: { en: "Try again", ar: "إعادة المحاولة" },
  },

  home: {
    goodMorning: { en: "Good morning", ar: "صباح الخير" },
    goodAfternoon: { en: "Good afternoon", ar: "مساء الخير" },
    goodEvening: { en: "Good evening", ar: "مساء الخير" },
    briefing: { en: "Daily briefing", ar: "الإحاطة اليومية" },
    needsYou: { en: "Needs your attention", ar: "يتطلب انتباهك" },
    thisWeek: { en: "This week", ar: "هذا الأسبوع" },
    today: { en: "Today", ar: "اليوم" },
    nothingToday: { en: "Nothing needs action today.", ar: "لا يوجد ما يتطلب إجراءً اليوم." },
    lastPublished: { en: "Last updated", ar: "آخر تحديث" },
  },

  pages: {
    updatesTitle: { en: "Updates", ar: "التحديثات" },
    updatesLede: { en: "Every official update, newest first.", ar: "جميع التحديثات الرسمية، الأحدث أولاً." },
    opportunitiesTitle: { en: "Internal opportunities", ar: "الفرص الداخلية" },
    opportunitiesLede: { en: "Roles open to Arabtec employees before they are advertised externally.", ar: "وظائف متاحة لموظفي أرابتك قبل الإعلان عنها خارجياً." },
    resourcesTitle: { en: "Policies and resources", ar: "السياسات والموارد" },
    resourcesLede: { en: "Policies, forms, handbooks and who to contact.", ar: "السياسات والنماذج والأدلة وجهات الاتصال." },
    updateNotFound: { en: "That update is no longer available.", ar: "هذا التحديث لم يعد متاحاً." },
  },

  sections: {
    announcement: { en: "Announcements", ar: "الإعلانات" },
    week_ahead: { en: "This week", ar: "هذا الأسبوع" },
    new_joiner: { en: "New joiners", ar: "المنضمون الجدد" },
    company_news: { en: "Company news", ar: "أخبار الشركة" },
    activity: { en: "Activities", ar: "الأنشطة" },
    industry_watch: { en: "Industry watch", ar: "متابعة القطاع" },
    opportunity: { en: "Internal opportunities", ar: "الفرص الداخلية" },
    resource: { en: "Policies & resources", ar: "السياسات والموارد" },
  },

  severity: {
    critical: { en: "Action required", ar: "إجراء مطلوب" },
    important: { en: "Important", ar: "مهم" },
    normal: { en: "For information", ar: "للعلم" },
  },

  resourceType: {
    policy: { en: "Policy", ar: "سياسة" },
    form: { en: "Form", ar: "نموذج" },
    handbook: { en: "Handbook", ar: "دليل" },
    template: { en: "Template", ar: "قالب" },
    contact: { en: "Contact", ar: "جهة اتصال" },
  },

  fields: {
    starts: { en: "Starts", ar: "يبدأ" },
    date: { en: "Date", ar: "التاريخ" },
    location: { en: "Location", ar: "الموقع" },
    function: { en: "Function", ar: "التخصص" },
    department: { en: "Department", ar: "القسم" },
    closes: { en: "Closes", ar: "يغلق" },
    source: { en: "Source", ar: "المصدر" },
    owner: { en: "Owner", ar: "المسؤول" },
    published: { en: "Published", ar: "نُشر" },
    updated: { en: "Updated", ar: "حُدّث" },
    type: { en: "Type", ar: "النوع" },
  },

  /** The one shared empty line. Do not add variants. */
  empty: {
    default: { en: "Nothing published here yet.", ar: "لا يوجد محتوى منشور هنا بعد." },
    search: { en: "No update matches that search.", ar: "لا يوجد تحديث يطابق هذا البحث." },
    adminHint: { en: "Publish from the Workspace console to fill this section.", ar: "انشر من وحدة التحكم لملء هذا القسم." },
  },

  states: {
    loading: { en: "Loading…", ar: "جارٍ التحميل…" },
    error: { en: "Something went wrong loading this page.", ar: "حدث خطأ أثناء تحميل هذه الصفحة." },
    offline: { en: "You appear to be offline. Showing the last content loaded.", ar: "يبدو أنك غير متصل. يتم عرض آخر محتوى تم تحميله." },
    notFound: { en: "Page not found.", ar: "الصفحة غير موجودة." },
    notFoundDetail: { en: "The page you asked for does not exist or has been moved.", ar: "الصفحة المطلوبة غير موجودة أو تم نقلها." },
    externalLink: { en: "Opens outside the Workspace", ar: "يفتح خارج مساحة العمل" },
    translationPending: { en: "Arabic translation pending — showing English.", ar: "الترجمة العربية قيد الإعداد — يتم عرض النص الإنجليزي." },
  },

  footer: {
    line: { en: "Arabtec Employee Workspace", ar: "مساحة عمل موظفي أرابتك" },
    detail: { en: "Internal communications · People & Culture", ar: "الاتصالات الداخلية · الموارد البشرية والثقافة" },
  },
} as const;

type Bilingual = { en: string; ar: string };

/** Reads one entry from the dictionary in the active locale. */
export function t(entry: Bilingual, locale: WorkspaceLocale): string {
  return entry[locale];
}
