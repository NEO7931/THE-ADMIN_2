import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";

// Pages
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Books from "@/pages/books";
import Borrow from "@/pages/borrow";
import Reservation from "@/pages/reservation";
import History from "@/pages/history";
import Admin from "@/pages/admin";
import Notifications from "@/pages/notifications";
import Fines from "@/pages/fines";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,         // data stays fresh 30 seconds
      gcTime: 1000 * 60 * 5,        // cache kept 5 minutes
      retry: 1,
      refetchOnWindowFocus: true,    // refresh when user switches back to tab
      refetchOnMount: true,          // refresh when component mounts
    },
  },
});

function ProtectedRoute({ component: Component, adminOnly = false, staffOnly = false, ...rest }: any) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!user) setLocation("/login");
    else if (adminOnly && user.role !== "admin") setLocation("/");
    else if (staffOnly && user.role !== "admin" && user.role !== "librarian") setLocation("/");
  }, [user, adminOnly, staffOnly, setLocation, isLoading]);

  if (isLoading) return null;
  if (!user) return null;
  if (adminOnly && user.role !== "admin") return null;
  if (staffOnly && user.role !== "admin" && user.role !== "librarian") return null;

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/books" component={Books} />

      <Route path="/borrow">
        {(params) => <ProtectedRoute component={Borrow} {...params} />}
      </Route>
      <Route path="/reservation">
        {(params) => <ProtectedRoute component={Reservation} {...params} />}
      </Route>
      <Route path="/history">
        {(params) => <ProtectedRoute component={History} {...params} />}
      </Route>
      <Route path="/notifications">
        {(params) => <ProtectedRoute component={Notifications} {...params} />}
      </Route>
      <Route path="/fines">
        {(params) => <ProtectedRoute component={Fines} {...params} />}
      </Route>
      <Route path="/admin">
        {(params) => <ProtectedRoute component={Admin} staffOnly {...params} />}
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;