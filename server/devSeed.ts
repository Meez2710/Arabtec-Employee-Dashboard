import type { workspaceCards } from "../drizzle/schema";

type Card = typeof workspaceCards.$inferSelect;

/**
 * Local development content.
 *
 * Only ever returned when there is no database AND `WORKSPACE_DEV_SEED=1` AND
 * the process is not running in production. Production is official content only.
 */
export function isDevSeedEnabled(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.WORKSPACE_DEV_SEED === "1";
}

const hoursFromNow = (hours: number) => new Date(Date.now() + hours * 3_600_000);
const daysFromNow = (days: number) => new Date(Date.now() + days * 86_400_000);

const base = {
  linkUrl: null, imageUrl: null, imageMode: "none" as const, imageAlt: null, imageAltAr: null,
  eventEnd: null, closingDate: null, location: null, locationAr: null,
  functionArea: null, functionAreaAr: null, sourceName: null, sourceNameAr: null,
  resourceType: null, eventStart: null, severity: "normal" as const, requiresAck: 0,
  cardSize: "1x1" as const, active: 1, status: "published" as const,
  scheduledFor: null, expiresAt: null, reviewBy: null, ownerUserId: null,
  createdByUserId: null, archivedByUserId: null, archivedAt: null,
  reviewReminderSentAt: null, updatedByUserId: null,
  publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
};

/** Placeholder copy only. Deliberately role-based, never an invented person. */
export function devSeedCards(): Card[] {
  return [
    {
      ...base, id: 9001, slot: "announcement", sortOrder: 0, cardSize: "2x1",
      severity: "critical", requiresAck: 1,
      eyebrow: "People and Culture", title: "Updated site access procedure from Sunday",
      body: "All site personnel must enter through Gate 2 from Sunday. Gate 1 closes for resurfacing for three weeks. Bring your site pass; temporary passes are issued at the Gate 2 cabin between 06:00 and 08:00.",
      eyebrowAr: "الموارد البشرية والثقافة", titleAr: "تحديث إجراءات الدخول إلى الموقع اعتباراً من الأحد",
      bodyAr: "يجب على جميع العاملين في الموقع الدخول عبر البوابة 2 اعتباراً من يوم الأحد. تُغلق البوابة 1 لأعمال الرصف لمدة ثلاثة أسابيع.",
      publishedAt: hoursFromNow(-3),
    },
    {
      ...base, id: 9002, slot: "announcement", sortOrder: 1, severity: "important",
      eyebrow: "HSE", title: "Heat stress protocol active until September",
      body: "Outdoor works pause between 12:00 and 15:00. Supervisors must log rotation schedules daily.",
      eyebrowAr: "الصحة والسلامة", titleAr: "بروتوكول الإجهاد الحراري ساري حتى سبتمبر",
      bodyAr: "تتوقف الأعمال الخارجية بين الساعة 12:00 و15:00. على المشرفين تسجيل جداول التناوب يومياً.",
      publishedAt: hoursFromNow(-30),
    },
    {
      ...base, id: 9003, slot: "week_ahead", sortOrder: 2,
      eyebrow: "Operations", title: "Monthly HSE walkthrough", location: "New Capital site", locationAr: "موقع العاصمة الإدارية",
      eventStart: hoursFromNow(6), body: "Joint walkthrough with the client HSE team.",
      titleAr: "الجولة الشهرية للصحة والسلامة", bodyAr: "جولة مشتركة مع فريق الصحة والسلامة لدى العميل.",
    },
    {
      ...base, id: 9004, slot: "week_ahead", sortOrder: 3,
      eyebrow: "Commercial", title: "Q3 cost review submissions close", location: "Head office", locationAr: "المقر الرئيسي",
      eventStart: daysFromNow(2), body: "Package leads submit final cost reports.",
      titleAr: "إغلاق تقديمات مراجعة التكاليف للربع الثالث", bodyAr: "يقدّم قادة الحزم تقارير التكلفة النهائية.",
    },
    {
      ...base, id: 9005, slot: "company_news", sortOrder: 4, cardSize: "2x1",
      eyebrow: "Company news", title: "New Capital package reaches structural completion",
      body: "The delivery team closed out the final structural milestone this week, two weeks inside programme. Fit-out mobilisation begins next month.",
      titleAr: "حزمة العاصمة الإدارية تصل إلى الاكتمال الإنشائي",
      bodyAr: "أنهى فريق التنفيذ آخر مرحلة إنشائية هذا الأسبوع، قبل الجدول الزمني بأسبوعين.",
      publishedAt: hoursFromNow(-52),
    },
    {
      ...base, id: 9006, slot: "new_joiner", sortOrder: 5,
      eyebrow: "Project Delivery", title: "Senior Planning Engineer", functionArea: "Project Delivery", functionAreaAr: "تنفيذ المشاريع",
      eventStart: daysFromNow(-2), body: "Joining the New Capital delivery team, based on site.",
      titleAr: "مهندس تخطيط أول", bodyAr: "ينضم إلى فريق تنفيذ العاصمة الإدارية، مقره في الموقع.",
    },
    {
      ...base, id: 9007, slot: "activity", sortOrder: 6,
      eyebrow: "Workplace", title: "Blood donation drive", location: "Head office, ground floor", locationAr: "المقر الرئيسي، الدور الأرضي",
      eventStart: daysFromNow(4), body: "Organised with the Egyptian Blood Bank. Walk-ins welcome.",
      titleAr: "حملة التبرع بالدم", bodyAr: "بالتعاون مع بنك الدم المصري. الحضور مفتوح دون تسجيل مسبق.",
    },
    {
      ...base, id: 9008, slot: "industry_watch", sortOrder: 7,
      eyebrow: "Industry watch", title: "Egypt raises infrastructure spending for the coming fiscal year",
      sourceName: "Ministry of Planning", sourceNameAr: "وزارة التخطيط", linkUrl: "https://www.mped.gov.eg",
      body: "Relevant to our pipeline: transport and utilities packages take the largest share.",
      titleAr: "مصر ترفع الإنفاق على البنية التحتية للعام المالي المقبل",
      bodyAr: "ذو صلة بمشاريعنا: حزم النقل والمرافق تحصل على النصيب الأكبر.",
    },
    {
      ...base, id: 9009, slot: "opportunity", sortOrder: 8,
      eyebrow: "Internal mobility", title: "Lead Estimation Engineer",
      location: "Cairo — head office", locationAr: "القاهرة — المقر الرئيسي", functionArea: "Commercial", functionAreaAr: "التجاري", closingDate: daysFromNow(12),
      body: "Open to Arabtec employees with five years of estimation experience across civil, mechanical, or electrical packages.",
      titleAr: "مهندس تقدير تكاليف رئيسي", bodyAr: "متاحة لموظفي أرابتك ممن لديهم خمس سنوات خبرة في التقدير.",
    },
    {
      ...base, id: 9012, slot: "new_joiner", sortOrder: 5,
      eyebrow: "Commercial", title: "Quantity Surveyor", functionArea: "Commercial", functionAreaAr: "التجاري",
      eventStart: daysFromNow(-5), body: "Joining the cost management team at head office.",
      titleAr: "مساح كميات", bodyAr: "ينضم إلى فريق إدارة التكاليف في المقر الرئيسي.",
    },
    {
      ...base, id: 9013, slot: "new_joiner", sortOrder: 5,
      eyebrow: "HSE", title: "Safety Officer", functionArea: "HSE", functionAreaAr: "الصحة والسلامة",
      eventStart: daysFromNow(-1), body: "Joining the New Capital site HSE team.",
      titleAr: "مسؤول سلامة", bodyAr: "ينضم إلى فريق الصحة والسلامة في موقع العاصمة الإدارية.",
    },
    {
      ...base, id: 9014, slot: "company_news", sortOrder: 4, cardSize: "2x1",
      eyebrow: "Company news", title: "Second cooling plant handed over ahead of schedule",
      body: "The MEP team completed commissioning three weeks early, releasing the crew to the next package.",
      titleAr: "تسليم محطة التبريد الثانية قبل الموعد",
      bodyAr: "أنهى فريق الأعمال الكهروميكانيكية التشغيل التجريبي قبل ثلاثة أسابيع من الموعد.",
      publishedAt: hoursFromNow(-80),
    },
    {
      ...base, id: 9010, slot: "resource", sortOrder: 9,
      eyebrow: "People and Culture", title: "Annual leave policy", resourceType: "policy",
      sourceName: "People and Culture", sourceNameAr: "الموارد البشرية والثقافة", body: "Entitlement, carry-over rules, and how to request leave.",
      titleAr: "سياسة الإجازات السنوية", bodyAr: "الاستحقاق وقواعد الترحيل وكيفية طلب الإجازة.",
      updatedAt: daysFromNow(-20),
    },
    {
      ...base, id: 9011, slot: "resource", sortOrder: 10,
      eyebrow: "Finance", title: "Expense claim form", resourceType: "form",
      sourceName: "Finance", sourceNameAr: "المالية", body: "Submit within 30 days of the expense date.",
      titleAr: "نموذج المطالبة بالمصروفات", bodyAr: "يُقدَّم خلال 30 يوماً من تاريخ المصروف.",
      updatedAt: daysFromNow(-60),
    },
  ] as Card[];
}
