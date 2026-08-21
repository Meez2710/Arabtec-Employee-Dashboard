import { Link } from "wouter";
import { useLocale } from "@/contexts/LocaleContext";
import { copy } from "@/lib/workspaceCopy";
import { Kicker } from "@/components/workspace/Primitives";

export default function NotFound() {
  const { locale } = useLocale();
  return (
    <main className="ws-centered">
      <section className="ws-centered__panel">
        <Kicker>{copy.workspace[locale]}</Kicker>
        <h1>{copy.states.notFound[locale]}</h1>
        <p>{copy.states.notFoundDetail[locale]}</p>
        <Link href="/" className="ws-btn ws-btn--primary">{copy.nav.home[locale]}</Link>
      </section>
    </main>
  );
}
