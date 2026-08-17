/**
 * Arabtec Executive Briefing design reminder:
 * Editorial construction-site briefing: paper canvas, black rules, signal-red action rails, dense operational hierarchy, and RTL-safe logical layout.
 */
import { useState } from "react";
import { toast } from "sonner";
import { BriefingFooter } from "@/components/briefing/BriefingFooter";
import { BriefingHeader } from "@/components/briefing/BriefingHeader";
import { BriefingMetrics } from "@/components/briefing/BriefingMetrics";
import { DailyDigestPanel } from "@/components/briefing/DailyDigestPanel";
import { DecisionBoard } from "@/components/briefing/DecisionBoard";
import { ExecutiveHero } from "@/components/briefing/ExecutiveHero";
import { ReadinessPanel } from "@/components/briefing/ReadinessPanel";

type Filter = "all" | "action" | "people";
type DigestState = "ready" | "preview" | "queued";

export default function Home() {
  const [isArabic, setIsArabic] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [digestState, setDigestState] = useState<DigestState>("ready");
  const [resolvedActions, setResolvedActions] = useState<string[]>([]);

  const handleResolve = (id: string) => {
    setResolvedActions((current) => (current.includes(id) ? current : [...current, id]));
    toast.success(isArabic ? "تم تأكيد مراجعة البند" : "Action review confirmed", {
      description: isArabic ? "هذه معاينة تفاعلية للواجهة الأمامية." : "This is an interactive frontend demonstration.",
    });
  };

  const handleDigestAction = () => {
    if (digestState === "ready") {
      setDigestState("preview");
      toast.message(isArabic ? "تم فتح معاينة الجمهور" : "Audience preview opened");
      return;
    }

    if (digestState === "preview") {
      setDigestState("queued");
      toast.success(isArabic ? "تمت جدولة الملخص للعرض" : "Digest queued for demonstration", {
        description: isArabic ? "لن يتم إرسال أي بريد إلكتروني من هذه الواجهة." : "No email is sent from this frontend slice.",
      });
      return;
    }

    setDigestState("ready");
    toast.message(isArabic ? "تمت إعادة حالة الملخص إلى الجاهز" : "Digest reset to ready state");
  };

  return (
    <div className={`min-h-screen bg-paper text-ink ${isArabic ? "font-arabic" : "font-body"}`} dir={isArabic ? "rtl" : "ltr"}>
      <BriefingHeader isArabic={isArabic} onToggleLanguage={() => setIsArabic((value) => !value)} />
      <main>
        <ExecutiveHero isArabic={isArabic} filter={filter} onFilter={setFilter} />
        <BriefingMetrics isArabic={isArabic} />

        <div className="mx-auto grid max-w-[1440px] gap-10 px-4 py-10 md:px-8 lg:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)] lg:gap-12 lg:px-12 lg:py-14">
          <DecisionBoard isArabic={isArabic} filter={filter} resolvedActions={resolvedActions} onResolve={handleResolve} />
          <DailyDigestPanel isArabic={isArabic} digestState={digestState} onDigestAction={handleDigestAction} />
        </div>

        <div className="mx-auto max-w-[1440px] px-4 pb-12 md:px-8 lg:px-12 lg:pb-16">
          <ReadinessPanel isArabic={isArabic} />
        </div>
      </main>
      <BriefingFooter />
    </div>
  );
}
