import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/hooks/use-auth";

import Login from "@/pages/Login";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import LeadsList from "@/pages/LeadsList";
import LeadCall from "@/pages/LeadCall";
import Diagnosis from "@/pages/Diagnosis";
import Production from "@/pages/Production";
import Support from "@/pages/Support";
import Templates from "@/pages/Templates";
import LeadGenerator from "@/pages/LeadGenerator";
import Deals from "@/pages/Deals";
import Reports from "@/pages/Reports";
import NotFound from "@/pages/not-found";
import { Loader2 } from "lucide-react";

function AuthenticatedApp() {
  const [location] = useLocation();
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If no user and not loading, auth hook will handle redirect logic or show Login
  // But for the structure, we'll assume valid session if we render this layout
  // (In reality, useAuth should probably redirect to /login if 401)
  
  if (!user) return <Login />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-8">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/leads" component={LeadsList} />
          <Route path="/leads/:id/call" component={LeadCall} />
          <Route path="/leads/:id/diagnosis" component={Diagnosis} />
          <Route path="/production" component={Production} />
          <Route path="/support" component={Support} />
          <Route path="/templates" component={Templates} />
          <Route path="/lead-generator" component={LeadGenerator} />
          <Route path="/deals" component={Deals} />
          <Route path="/landing" component={Landing} />
          <Route path="/reports" component={Reports} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  
  // Public landing page
  if (location === "/landing") return <Landing />;

  // Basic route protection handled by the auth check inside AuthenticatedApp or Login page
  return location === "/login" ? <Login /> : <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
