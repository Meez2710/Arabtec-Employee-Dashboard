import { useLocale } from "@/contexts/LocaleContext";

export function BriefingFooter() {
  const { locale } = useLocale();
  const copy = locale === "ar" ? { name: "مساحة عمل أرابتك", detail: "مساحة الموظفين · الاتصالات الداخلية" } : { name: "arabtec workspace", detail: "Employee workspace · internal communications" };
  return <footer className="mt-14 border-t-2 border-ink bg-ink px-4 py-6 text-paper md:px-8 lg:px-12"><div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4 text-[13px]"><p className="font-display text-[15px] font-bold tracking-normal">{copy.name}</p><p className="text-paper/80">{copy.detail}</p></div></footer>;
}
