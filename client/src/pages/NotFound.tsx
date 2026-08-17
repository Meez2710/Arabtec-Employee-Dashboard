import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  return <main className="not-found-page"><section className="not-found-panel"><AlertCircle size={36} aria-hidden="true" /><p className="dash-eyebrow">Route unavailable</p><h1>Page not found.</h1><p>The requested Workspace page does not exist or is no longer available.</p><button type="button" onClick={() => setLocation("/")} className="dash-red-button"><Home size={16} /> Return to Workspace</button></section></main>;
}
