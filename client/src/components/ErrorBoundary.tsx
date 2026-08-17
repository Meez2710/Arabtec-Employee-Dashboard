import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, type ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  render() {
    if (!this.state.hasError) return this.props.children;
    return <main className="error-boundary-page"><section className="error-boundary-panel"><AlertTriangle size={36} aria-hidden="true" /><p className="dash-eyebrow">Workspace error</p><h1>Something needs attention.</h1><p>Reload the Workspace to restore the latest operational information.</p>{this.state.error?.stack && <pre className="error-boundary-details">{this.state.error.stack}</pre>}<button type="button" onClick={() => window.location.reload()} className="dash-red-button"><RotateCcw size={16} /> Reload Workspace</button></section></main>;
  }
}

export default ErrorBoundary;
