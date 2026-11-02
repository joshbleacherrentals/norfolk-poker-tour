import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/Home";
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import TournamentForm from "@/pages/TournamentForm";
import RulesEditor from "@/pages/RulesEditor";
import AdminUsers from "@/pages/AdminUsers";
import NotificationList from "@/pages/NotificationList";
import TournamentRegistrations from "@/pages/TournamentRegistrations";
import ChipStructureEditor from "@/pages/ChipStructureEditor";
import TournamentResults from "@/pages/TournamentResults";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/tournament/:id" component={TournamentForm} />
      <Route path="/admin/rules" component={RulesEditor} />
      <Route path="/admin/chip-structure" component={ChipStructureEditor} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/notifications" component={NotificationList} />
      <Route path="/admin/registrations/:id" component={TournamentRegistrations} />
      <Route path="/admin/tournament-results/:id" component={TournamentResults} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
