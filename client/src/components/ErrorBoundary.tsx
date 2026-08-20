import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

/**
 * Last-resort boundary. It sits outside the locale provider so that a failure
 * inside that provider is still caught, which is why its copy is English only.
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error("[Workspace] Unhandled error:", error);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main className="ws-centered" dir="ltr" lang="en">
        <section className="ws-centered__panel">
          <AlertTriangle size={32} aria-hidden="true" color="var(--brand)" />
          <p className="ws-kicker">Arabtec Employee Workspace</p>
          <h1>Something needs attention.</h1>
          <p>Reload the Workspace to restore the latest published information. If this keeps happening, contact People &amp; Culture.</p>
          {/* Stack traces are for developers, not for employees. */}
          {import.meta.env.DEV && this.state.error?.stack && (
            <pre className="ws-diagnostic">{this.state.error.stack}</pre>
          )}
          <button type="button" onClick={() => window.location.reload()} className="ws-btn ws-btn--primary">
            <RotateCcw size={16} aria-hidden="true" /> Reload Workspace
          </button>
        </section>
      </main>
    );
  }
}

export default ErrorBoundary;
