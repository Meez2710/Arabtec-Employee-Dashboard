import type { WorkspaceLocale } from "@/contexts/LocaleContext";

/**
 * Console copy, in both languages.
 *
 * Tone is operational, not marketing: say what the control does and what will
 * happen. Arabic here is the administrative register used by People & Culture,
 * not a literal word-for-word rendering of the English.
 */
export function consoleText(locale: WorkspaceLocale) {
  const t = (en: string, ar: string) => (locale === "ar" ? ar : en);

  return {
    brand: t("Workspace console", "وحدة تحكم مساحة العمل"),
    signedIn: t("Signed in", "مُسجَّل الدخول"),
    noAccess: t("no access", "بدون صلاحية"),
    sectionsNav: t("Console sections", "أقسام وحدة التحكم"),
    switchLanguage: t("العربية", "English"),
    switchLanguageLabel: t("Switch the console to Arabic", "تبديل وحدة التحكم إلى الإنجليزية"),

    nav: {
      overview: t("Overview", "نظرة عامة"),
      content: t("Content", "المحتوى"),
      layout: t("Layout", "التخطيط"),
      media: t("Media", "الوسائط"),
      sections: t("Sections", "الأقسام"),
      people: t("People & access", "الأشخاص والصلاحيات"),
      audit: t("Audit log", "سجل التدقيق"),
      settings: t("Settings", "الإعدادات"),
    },

    roles: {
      user: t("Employee", "موظف"),
      viewer: t("Viewer", "مطّلع"),
      editor: t("Editor", "محرّر"),
      publisher: t("Publisher", "ناشر"),
      admin: t("Administrator", "مسؤول"),
    },

    status: {
      draft: t("Draft", "مسودة"),
      in_review: t("In review", "قيد المراجعة"),
      approved: t("Approved", "معتمد"),
      scheduled: t("Scheduled", "مجدول"),
      published: t("Published", "منشور"),
      unpublished: t("Unpublished", "غير منشور"),
      archived: t("Archived", "مؤرشف"),
    },

    slots: {
      announcement: t("Announcement", "إعلان"),
      week_ahead: t("This week", "هذا الأسبوع"),
      new_joiner: t("New joiner", "منضم جديد"),
      company_news: t("Company news", "أخبار الشركة"),
      activity: t("Activity", "نشاط"),
      industry_watch: t("Industry watch", "متابعة القطاع"),
      opportunity: t("Opportunity", "فرصة"),
      resource: t("Resource", "مورد"),
    },

    sizes: {
      "1x1": t("Original", "الحجم الأصلي"),
      "2x1": t("Double width", "عرض مضاعف"),
      "1x2": t("Double height", "ارتفاع مضاعف"),
    },

    overview: {
      title: t("Overview", "نظرة عامة"),
      allClear: t("Nothing needs attention right now.", "لا يوجد ما يتطلب انتباهك الآن."),
      needsAttention: (count: number) =>
        locale === "ar"
          ? `${count} عنصر يتطلب انتباهك.`
          : `${count} item${count === 1 ? "" : "s"} need attention.`,
      lastPublished: (when: string) => (locale === "ar" ? `آخر نشر ${when} (بتوقيت القاهرة)` : `Last published ${when} (Cairo)`),
      willAppearHere: t(
        "Overdue reviews, scheduled releases, expiring items, and missing Arabic will appear here.",
        "ستظهر هنا المراجعات المتأخرة والإصدارات المجدولة والعناصر المنتهية والمحتوى غير المترجم.",
      ),
      kpi: {
        live: t("Live", "منشور"),
        scheduled: t("Scheduled", "مجدول"),
        inReview: t("In review", "قيد المراجعة"),
        drafts: t("Drafts", "مسودات"),
        archived: t("Archived", "مؤرشف"),
      },
      groups: {
        expiredStillLive: t("Expired but still live", "منتهٍ ولا يزال منشوراً"),
        reviewOverdue: t("Review overdue", "المراجعة متأخرة"),
        goingLiveToday: t("Going live today", "ينشر اليوم"),
        expiringThisWeek: t("Expiring this week", "ينتهي هذا الأسبوع"),
        missingArabic: t("Missing Arabic", "الترجمة العربية ناقصة"),
        missingImageAlt: t("Image without a description", "صورة بدون وصف"),
      },
      notes: {
        expiredOn: (when: string) => (locale === "ar" ? `انتهى في ${when}` : `Expired ${when}`),
        dueOn: (when: string) => (locale === "ar" ? `مستحق في ${when}` : `Due ${when}`),
        arabicFallback: t("Arabic readers see English", "القارئ بالعربية يرى النص الإنجليزي"),
        altRequired: t("Alt text required", "وصف الصورة مطلوب"),
      },
    },

    content: {
      title: t("Content", "المحتوى"),
      lede: t(
        "Every action is reversible. Drafts stay private until someone confirms publication.",
        "كل إجراء قابل للتراجع. تبقى المسودات خاصة حتى يؤكد أحدهم النشر.",
      ),
      newItem: t("New item", "عنصر جديد"),
      searchPlaceholder: t("Search by title, section, or owner", "ابحث بالعنوان أو القسم أو المسؤول"),
      searchLabel: t("Search content", "البحث في المحتوى"),
      filterLabel: t("Filter by status", "التصفية حسب الحالة"),
      sortLabel: t("Sort", "الترتيب"),
      allStatuses: t("All statuses", "كل الحالات"),
      needsAttention: t("Needs attention", "يتطلب انتباهاً"),
      sort: {
        priority: t("Action priority", "أولوية الإجراء"),
        updated: t("Last updated", "آخر تحديث"),
        review: t("Review date", "تاريخ المراجعة"),
        golive: t("Go-live date", "تاريخ النشر"),
      },
      tableCaption: t(
        "All content items with status, go-live, owner, and review date",
        "جميع عناصر المحتوى مع الحالة وتاريخ النشر والمسؤول وتاريخ المراجعة",
      ),
      allContent: t("All content", "كل المحتوى"),
      columns: {
        select: t("Select", "تحديد"),
        item: t("Item", "العنصر"),
        status: t("Status", "الحالة"),
        goLive: t("Go live", "النشر"),
        owner: t("Owner", "المسؤول"),
        review: t("Review", "المراجعة"),
        actions: t("Actions", "الإجراءات"),
      },
      selectItem: (title: string) => (locale === "ar" ? `تحديد ${title}` : `Select ${title}`),
      loading: t("Loading content…", "جارٍ تحميل المحتوى…"),
      noMatches: t("Nothing matches these filters.", "لا يوجد ما يطابق هذه التصفية."),
      notLive: t("Not live", "غير منشور"),
      notSet: t("Not set", "غير محدد"),
      unassigned: t("Unassigned", "غير مُسند"),
      reviewOverdue: t("Review overdue", "المراجعة متأخرة"),
      actions: {
        publish: t("Publish", "نشر"),
        unpublish: t("Unpublish", "إلغاء النشر"),
        archive: t("Archive", "أرشفة"),
        restore: t("Restore", "استعادة"),
        duplicate: t("Duplicate", "نسخ"),
      },
      bulkUnpublish: (count: number) => (locale === "ar" ? `إلغاء نشر ${count}` : `Unpublish ${count}`),
      bulkArchive: (count: number) => (locale === "ar" ? `أرشفة ${count}` : `Archive ${count}`),
      history: t("Item history", "سجل العنصر"),
      historyEmpty: t("No recorded changes yet.", "لا توجد تغييرات مسجلة بعد."),
      system: t("System", "النظام"),
    },

    editor: {
      edit: t("Edit item", "تعديل العنصر"),
      create: t("New draft", "مسودة جديدة"),
      untitled: t("Untitled item", "عنصر بلا عنوان"),
      label: t("Item editor", "محرر العنصر"),
      section: t("Section", "القسم"),
      owner: t("Owner", "المسؤول"),
      assignToMe: t("Assign to me when saved", "إسناده لي عند الحفظ"),
      accountLabel: (id: number) => (locale === "ar" ? `حساب ${id}` : `Account ${id}`),
      english: t("English", "الإنجليزية"),
      arabic: t("العربية", "العربية"),
      fieldLabel: t("Label", "التسمية"),
      fieldLabelAr: t("التسمية", "التسمية"),
      labelPlaceholder: t("For example: People and Culture", "مثال: الموارد البشرية والثقافة"),
      fieldTitle: t("Title", "العنوان"),
      fieldTitleAr: t("العنوان", "العنوان"),
      titlePlaceholder: t("Clear employee-facing headline", "عنوان واضح موجّه للموظفين"),
      fieldBody: t("Employee message", "رسالة الموظفين"),
      fieldBodyAr: t("الرسالة", "الرسالة"),
      bodyPlaceholder: t("What employees need to know", "ما يحتاج الموظفون معرفته"),
      severity: t("Severity", "درجة الأهمية"),
      requiresAck: t("Ask employees to acknowledge this notice", "اطلب من الموظفين تأكيد الاطلاع على هذا الإشعار"),
      startDate: t("Start date", "تاريخ المباشرة"),
      dateTime: t("Date and time", "التاريخ والوقت"),
      location: t("Location", "الموقع"),
      locationAr: t("الموقع", "الموقع"),
      department: t("Department", "القسم"),
      departmentAr: t("القسم", "القسم"),
      functionArea: t("Function", "التخصص"),
      functionAreaAr: t("التخصص", "التخصص"),
      closingDate: t("Closing date", "تاريخ الإغلاق"),
      owningDepartment: t("Owning department", "القسم المسؤول"),
      owningDepartmentAr: t("القسم المسؤول", "القسم المسؤول"),
      source: t("Source", "المصدر"),
      sourceAr: t("المصدر", "المصدر"),
      resourceType: t("Resource type", "نوع المورد"),
      chooseType: t("Choose a type", "اختر نوعاً"),
      externalUrl: t("External destination (optional)", "وجهة خارجية (اختياري)"),
      imageUrl: t("Image URL (optional)", "رابط الصورة (اختياري)"),
      imageUpload: t("Image", "الصورة"),
      chooseFile: t("Upload an image", "رفع صورة"),
      uploading: t("Uploading…", "جارٍ الرفع…"),
      replaceImage: t("Replace", "استبدال"),
      removeImage: t("Remove", "إزالة"),
      imageHint: t("JPEG, PNG or WebP, up to 5 MB.", "JPEG أو PNG أو WebP، بحد أقصى 5 ميجابايت."),
      orPasteUrl: t("or paste a URL", "أو الصق رابطاً"),
      uploadFailed: t("That image could not be uploaded.", "تعذّر رفع هذه الصورة."),
      wrongType: t("Use a JPEG, PNG or WebP image.", "استخدم صورة بصيغة JPEG أو PNG أو WebP."),
      tooLarge: t("That image is larger than 5 MB.", "حجم الصورة أكبر من 5 ميجابايت."),
      imagePreview: t("Selected image", "الصورة المختارة"),
      imageAlt: t("Image description (English)", "وصف الصورة (بالإنجليزية)"),
      imageAltAr: t("وصف الصورة", "وصف الصورة"),
      imageAltHint: t("Required whenever an image is attached.", "مطلوب كلما أُرفقت صورة."),
      cardSize: t("Card size on Home", "حجم البطاقة في الصفحة الرئيسية"),
      goLiveAt: t("Go live at (optional)", "وقت النشر (اختياري)"),
      expireAt: t("Expire at (optional)", "وقت الانتهاء (اختياري)"),
      reviewBy: t("Review by (optional)", "المراجعة بحلول (اختياري)"),
      cannotPublish: t("Cannot publish yet", "لا يمكن النشر بعد"),
      worthChecking: t("Worth checking", "يستحق المراجعة"),
      timezoneNote: t("All times are Africa/Cairo.", "جميع الأوقات بتوقيت أفريقيا/القاهرة."),
      saveDraft: t("Save draft", "حفظ المسودة"),
      saving: t("Saving…", "جارٍ الحفظ…"),
      previewAsEmployee: t("Preview as employee", "معاينة كموظف"),
      sendForReview: t("Send for review", "إرسال للمراجعة"),
      publishEllipsis: t("Publish…", "نشر…"),
    },

    layout: {
      title: t("Layout", "التخطيط"),
      lede: t(
        "Arrange the employee home. Reorder with the arrows, the keyboard, or by dragging. Nothing changes for employees until you save.",
        "رتّب الصفحة الرئيسية للموظفين. أعد الترتيب بالأسهم أو لوحة المفاتيح أو بالسحب. لا يتغير شيء للموظفين حتى تحفظ.",
      ),
      save: t("Save layout", "حفظ التخطيط"),
      saving: t("Saving…", "جارٍ الحفظ…"),
      cardOrder: t("Card order", "ترتيب البطاقات"),
      livePreview: t("Live preview", "معاينة مباشرة"),
      empty: t("Publish content to arrange it here.", "انشر محتوى لترتيبه هنا."),
      sizeFor: (title: string) => (locale === "ar" ? `حجم ${title}` : `Size for ${title}`),
      moveEarlier: (title: string) => (locale === "ar" ? `تقديم ${title}` : `Move ${title} earlier`),
      moveLater: (title: string) => (locale === "ar" ? `تأخير ${title}` : `Move ${title} later`),
    },

    sections: {
      title: t("Sections", "الأقسام"),
      lede: t(
        "Turn sections on or off and set the labels employees see in each language.",
        "فعّل الأقسام أو أوقفها، وحدد التسميات التي يراها الموظفون بكل لغة.",
      ),
      caption: t("Employee home sections", "أقسام الصفحة الرئيسية للموظفين"),
      section: t("Section", "القسم"),
      englishLabel: t("English label", "التسمية بالإنجليزية"),
      arabicLabel: t("Arabic label", "التسمية بالعربية"),
      defaultSize: t("Default size", "الحجم الافتراضي"),
      shownColumn: t("Shown", "الظهور"),
      shown: t("Shown", "ظاهر"),
      hidden: t("Hidden", "مخفي"),
      save: t("Save", "حفظ"),
      englishLabelFor: (slot: string) => (locale === "ar" ? `التسمية بالإنجليزية لـ ${slot}` : `English label for ${slot}`),
      arabicLabelFor: (slot: string) => (locale === "ar" ? `التسمية بالعربية لـ ${slot}` : `Arabic label for ${slot}`),
      defaultSizeFor: (slot: string) => (locale === "ar" ? `الحجم الافتراضي لـ ${slot}` : `Default size for ${slot}`),
      showOnHome: (slot: string) => (locale === "ar" ? `إظهار ${slot} في الصفحة الرئيسية` : `Show ${slot} on the employee home`),
    },

    people: {
      title: t("People & access", "الأشخاص والصلاحيات"),
      lede: t(
        "Publishing is restricted by role. You cannot change your own access.",
        "النشر مقيّد حسب الدور. لا يمكنك تغيير صلاحيتك بنفسك.",
      ),
      caption: t("Accounts and their Workspace access", "الحسابات وصلاحياتها في مساحة العمل"),
      person: t("Person", "الشخص"),
      email: t("Email", "البريد الإلكتروني"),
      access: t("Access", "الصلاحية"),
      you: t("you", "أنت"),
      empty: t("No accounts yet.", "لا توجد حسابات بعد."),
      accessFor: (who: string) => (locale === "ar" ? `صلاحية ${who}` : `Access level for ${who}`),
      roleDetail: {
        user: t("No console access", "بدون صلاحية دخول لوحة التحكم"),
        viewer: t("Can read the console", "يمكنه الاطلاع فقط"),
        editor: t("Can write content, cannot publish", "يمكنه تحرير المحتوى دون نشره"),
        publisher: t("Can write and publish", "يمكنه التحرير والنشر"),
        admin: t("Everything, including access", "كل الصلاحيات، بما فيها إدارة الوصول"),
      },
    },

    audit: {
      title: t("Audit log", "سجل التدقيق"),
      lede: t(
        "Every publish-grade action, most recent first. Times are Africa/Cairo.",
        "كل إجراء يمس النشر، الأحدث أولاً. الأوقات بتوقيت أفريقيا/القاهرة.",
      ),
      caption: t("Workspace audit log", "سجل تدقيق مساحة العمل"),
      when: t("When", "الوقت"),
      who: t("Who", "المنفّذ"),
      action: t("Action", "الإجراء"),
      detail: t("Detail", "التفاصيل"),
      empty: t("No recorded actions yet.", "لا توجد إجراءات مسجلة بعد."),
    },

    media: {
      title: t("Media", "الوسائط"),
      lede: t(
        "Every image in use, and whether it has a description. Images without one cannot be published.",
        "كل صورة قيد الاستخدام، وما إذا كان لها وصف. لا يمكن نشر صورة بدون وصف.",
      ),
      empty: t("No images in use yet.", "لا توجد صور قيد الاستخدام بعد."),
      noDescription: t("No description", "بدون وصف"),
      openItem: t("Open item", "فتح العنصر"),
    },

    settings: {
      title: t("Settings", "الإعدادات"),
      lede: t("Workspace-wide configuration.", "إعدادات مساحة العمل."),
      timezone: t("Business timezone", "التوقيت المعتمد"),
      timezoneHelp: t(
        "Every “today”, “this week”, overdue, and expiry decision is made in Cairo, whatever timezone the reader is in.",
        "كل ما يتعلق بـ“اليوم” و“هذا الأسبوع” والتأخر والانتهاء يُحسب بتوقيت القاهرة، أياً كان توقيت القارئ.",
      ),
      sender: t("Review reminder sender", "مُرسِل تذكيرات المراجعة"),
      senderConfigured: t("Owners receive one email per overdue review.", "يتلقى المسؤولون رسالة واحدة عن كل مراجعة متأخرة."),
      senderMissing: t(
        "Overdue reviews are flagged on the Overview. Email delivery stays off until an approved sender is provisioned.",
        "تُعلَّم المراجعات المتأخرة في صفحة النظرة العامة. يبقى إرسال البريد متوقفاً حتى يُعتمد مُرسِل.",
      ),
      configuredSender: t("Configured sender", "مُرسِل معتمد"),
      notConfigured: t("Not configured", "غير معد"),
    },

    confirm: {
      kicker: t("Confirm publication", "تأكيد النشر"),
      readyPublish: (title: string) => (locale === "ar" ? `هل أنت جاهز لنشر “${title}”؟` : `Ready to publish “${title}”?`),
      readySchedule: (title: string) => (locale === "ar" ? `هل أنت جاهز لجدولة “${title}”؟` : `Ready to schedule “${title}”?`),
      lede: t(
        "Employees see the item exactly as it appears in the employee preview.",
        "سيرى الموظفون العنصر تماماً كما يظهر في معاينة الموظف.",
      ),
      audience: t("Audience", "الجمهور"),
      allEmployees: t("All Arabtec employees", "جميع موظفي أرابتك"),
      section: t("Section", "القسم"),
      goLive: t("Go live", "النشر"),
      immediately: t("Immediately after confirmation", "فور التأكيد"),
      expires: t("Expires", "ينتهي"),
      owner: t("Owner", "المسؤول"),
      ownerYou: t("You will be recorded as owner", "سيتم تسجيلك كمسؤول"),
      notSet: t("Not set", "غير محدد"),
      missingArabic: t(
        "No Arabic version. Arabic readers will see the English text.",
        "لا توجد نسخة عربية. سيرى القارئ بالعربية النص الإنجليزي.",
      ),
      keepEditing: t("Keep editing", "متابعة التحرير"),
      confirmPublish: t("Confirm and publish", "تأكيد ونشر"),
      confirmSchedule: t("Confirm schedule", "تأكيد الجدولة"),
      confirming: t("Confirming…", "جارٍ التأكيد…"),
      archiveItem: t(
        "Archive this item? It stops appearing for employees and can be restored later.",
        "هل تريد أرشفة هذا العنصر؟ سيتوقف ظهوره للموظفين ويمكن استعادته لاحقاً.",
      ),
      bulk: (action: "archive" | "unpublish", count: number) =>
        locale === "ar"
          ? `${action === "archive" ? "أرشفة" : "إلغاء نشر"} ${count} عنصر؟`
          : `${action === "archive" ? "Archive" : "Unpublish"} ${count} item(s)?`,
    },

    preview: {
      label: t("Employee preview", "معاينة الموظف"),
      note: t("This is the real employee page.", "هذه هي صفحة الموظف الفعلية."),
      desktop: t("Desktop", "سطح المكتب"),
      tablet: t("Tablet", "لوحي"),
      mobile: t("Mobile", "جوال"),
      viewInArabic: t("عرض بالعربية", "عرض بالعربية"),
      viewInEnglish: t("View in English", "View in English"),
      close: t("Close", "إغلاق"),
      previewKicker: t("Preview", "معاينة"),
    },

    access: {
      signInTitle: t("Sign in to open the Workspace console.", "سجّل الدخول لفتح وحدة تحكم مساحة العمل."),
      signInDetail: t(
        "Publishing, scheduling, and content history are available only to authorised Workspace users.",
        "النشر والجدولة وسجل المحتوى متاحة فقط للمستخدمين المصرّح لهم.",
      ),
      deniedTitle: t("Console access is required.", "مطلوب صلاحية دخول وحدة التحكم."),
      deniedDetail: (role: string) =>
        locale === "ar"
          ? `أنت مسجّل الدخول بصلاحية ${role}. اطلب من مسؤول مساحة العمل منحك الصلاحية.`
          : `You are signed in as ${role}. Ask a Workspace administrator to grant access.`,
      signIn: t("Sign in", "تسجيل الدخول"),
    },

    toasts: {
      draftSaved: t("Draft saved. Publishing still needs confirmation.", "تم حفظ المسودة. النشر ما زال يتطلب تأكيداً."),
      needLabelTitle: t("Add both a label and a title before saving.", "أضف التسمية والعنوان قبل الحفظ."),
      saveFailed: t("The item could not be saved.", "تعذّر حفظ العنصر."),
      actionFailed: t("That action could not be completed.", "تعذّر إتمام هذا الإجراء."),
      unpublished: t("Item unpublished", "تم إلغاء نشر العنصر"),
      archived: t("Item archived", "تمت أرشفة العنصر"),
      restored: t("Item restored as a draft", "تمت استعادة العنصر كمسودة"),
      duplicated: t("Draft copy created", "تم إنشاء نسخة مسودة"),
      submitted: t("Item submitted for review", "تم إرسال العنصر للمراجعة"),
      published: t("Item published", "تم نشر العنصر"),
      scheduled: t("Item scheduled", "تمت جدولة العنصر"),
      bulkApplied: t("Bulk action applied", "تم تطبيق الإجراء الجماعي"),
      layoutSaved: t("Layout saved", "تم حفظ التخطيط"),
      sectionSaved: t("Section saved", "تم حفظ القسم"),
      accessUpdated: t("Access updated", "تم تحديث الصلاحية"),
    },
  };
}

export type ConsoleText = ReturnType<typeof consoleText>;
