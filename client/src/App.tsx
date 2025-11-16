import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";

// Pages
import Home from "@/pages/home";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Gigs from "@/pages/gigs";
import GigDetail from "@/pages/gig-detail";
import Calendar from "@/pages/calendar";
import Analytics from "@/pages/analytics";
import Invoices from "@/pages/invoices";
import CheckIn from "@/pages/check-in";
import Files from "@/pages/files";
import Personnel from "@/pages/personnel";
import PersonnelDetail from "@/pages/personnel-detail";
import Customers from "@/pages/customers";
import CustomerDetail from "@/pages/customer-detail";
import Venues from "@/pages/venues";
import VenueDetail from "@/pages/venue-detail";
import Contacts from "@/pages/contacts";
import Settings from "@/pages/settings";
import Profile from "@/pages/profile";
import MyGigs from "@/pages/my-gigs";
import MyPayouts from "@/pages/my-payouts";
import MyDocuments from "@/pages/my-documents";
import NotFound from "@/pages/not-found";

function AppLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  if (!user) {
    return <>{children}</>;
  }

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between px-6 py-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      {/* Root Route - redirects based on auth status */}
      <Route path="/" component={Home} />
      
      {/* Public Routes */}
      <Route path="/login" component={Login} />

      {/* Owner/Manager Routes */}
      <ProtectedRoute 
        path="/dashboard" 
        component={Dashboard}
        allowedRoles={["owner", "manager"]}
      />
      <ProtectedRoute 
        path="/gigs" 
        component={Gigs}
        allowedRoles={["owner", "manager"]}
      />
      <ProtectedRoute 
        path="/gigs/:id" 
        component={GigDetail}
        allowedRoles={["owner", "manager"]}
      />
      <ProtectedRoute 
        path="/calendar" 
        component={Calendar}
        allowedRoles={["owner", "manager"]}
      />
      <ProtectedRoute 
        path="/analytics" 
        component={Analytics}
        allowedRoles={["owner", "manager"]}
      />
      <ProtectedRoute 
        path="/invoices" 
        component={Invoices}
        allowedRoles={["owner", "manager"]}
      />
      <ProtectedRoute 
        path="/files" 
        component={Files}
        allowedRoles={["owner", "manager"]}
      />
      <ProtectedRoute 
        path="/personnel" 
        component={Personnel}
        allowedRoles={["owner", "manager"]}
      />
      <ProtectedRoute 
        path="/personnel/:id" 
        component={PersonnelDetail}
        allowedRoles={["owner", "manager"]}
      />
      <ProtectedRoute 
        path="/customers" 
        component={Customers}
        allowedRoles={["owner", "manager"]}
      />
      <ProtectedRoute 
        path="/customers/:id" 
        component={CustomerDetail}
        allowedRoles={["owner", "manager"]}
      />
      <ProtectedRoute 
        path="/venues" 
        component={Venues}
        allowedRoles={["owner", "manager"]}
      />
      <ProtectedRoute 
        path="/venues/:id" 
        component={VenueDetail}
        allowedRoles={["owner", "manager"]}
      />
      <ProtectedRoute 
        path="/contacts" 
        component={Contacts}
        allowedRoles={["owner", "manager"]}
      />
      
      {/* Owner Only Routes */}
      <ProtectedRoute 
        path="/settings" 
        component={Settings}
        allowedRoles={["owner"]}
      />
      
      {/* Personnel Routes */}
      <ProtectedRoute 
        path="/profile" 
        component={Profile}
        allowedRoles={["personnel"]}
      />
      <ProtectedRoute 
        path="/check-in" 
        component={CheckIn}
        allowedRoles={["personnel"]}
      />
      <ProtectedRoute 
        path="/my-gigs" 
        component={MyGigs}
        allowedRoles={["personnel"]}
      />
      <ProtectedRoute 
        path="/my-payouts" 
        component={MyPayouts}
        allowedRoles={["personnel"]}
      />
      <ProtectedRoute 
        path="/my-documents" 
        component={MyDocuments}
        allowedRoles={["personnel"]}
      />
      
      {/* Fallback */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppLayout>
            <Router />
          </AppLayout>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;