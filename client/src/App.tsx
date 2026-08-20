import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Redirect, Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LocaleProvider } from "./contexts/LocaleContext";
import Home from "./pages/Home";
import Updates from "./pages/Updates";
import UpdateDetail from "./pages/UpdateDetail";
import Opportunities from "./pages/Opportunities";
import Resources from "./pages/Resources";
import ManageWorkspace from "./pages/ManageWorkspace";

function Router() {
  return (
    <Switch>
      <Route path="/">{() => <Home />}</Route>
      <Route path="/updates" component={Updates} />
      <Route path="/updates/:id" component={UpdateDetail} />
      <Route path="/opportunities" component={Opportunities} />
      <Route path="/resources" component={Resources} />
      {/* The console is one session-protected route. The numeric id it used to
          carry was enumerable; this redirect keeps old bookmarks working. */}
      <Route path="/admin/1618">{() => <Redirect to="/admin" />}</Route>
      <Route path="/admin" component={ManageWorkspace} />
      <Route path="/admin/:section" component={ManageWorkspace} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <LocaleProvider>
        <ThemeProvider defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </LocaleProvider>
    </ErrorBoundary>
  );
}

export default App;
