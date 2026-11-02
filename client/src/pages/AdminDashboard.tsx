import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Plus, Pencil, Trash2, FileText, Trophy, Users, Bell, UserCheck, Coins, Award } from "lucide-react";
import { type Tournament } from "@shared/schema";
import { formatTournamentDate } from "@/lib/tournamentTime";

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/auth/session"],
    retry: false,
  });

  const { data: tournamentsData, isLoading: tournamentsLoading } = useQuery({
    queryKey: ["/api/tournaments"],
  });

  const tournaments = (tournamentsData as Tournament[] | undefined) ?? [];

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      setLocation("/admin/login");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/tournaments/${id}`, {});
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete tournament");
      }
      return await res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      await queryClient.refetchQueries({ queryKey: ["/api/tournaments"] });
      toast({
        title: "Tournament Deleted",
        description: "The tournament has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete tournament",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (!sessionLoading && !session) {
      setLocation("/admin/login");
    }
  }, [session, sessionLoading, setLocation]);

  if (sessionLoading || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this tournament?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
                <Trophy className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold">NPT Admin</h1>
                <p className="text-xs text-muted-foreground">Norfolk Poker Tour</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => logoutMutation.mutate()}
              data-testid="button-logout"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Admin Dashboard</h2>
          <p className="text-muted-foreground">
            Manage tournaments and tournament rules
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Button
            size="lg"
            onClick={() => setLocation("/admin/tournament/new")}
            className="h-24"
            data-testid="button-add-tournament"
          >
            <Plus className="mr-2 h-6 w-6" />
            Add New Tournament
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setLocation("/admin/rules")}
            className="h-24"
            data-testid="button-edit-rules"
          >
            <FileText className="mr-2 h-6 w-6" />
            Edit Tournament Rules
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setLocation("/admin/chip-structure")}
            className="h-24"
            data-testid="button-chip-structure"
          >
            <Coins className="mr-2 h-6 w-6" />
            Chip Structure
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setLocation("/admin/users")}
            className="h-24"
            data-testid="button-manage-admins"
          >
            <Users className="mr-2 h-6 w-6" />
            Manage Admin Users
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => setLocation("/admin/notifications")}
            className="h-24"
            data-testid="button-notification-list"
          >
            <Bell className="mr-2 h-6 w-6" />
            Notification List
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tournaments</CardTitle>
            <CardDescription>Manage all your poker tournaments</CardDescription>
          </CardHeader>
          <CardContent>
            {tournamentsLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading tournaments...</p>
            ) : tournaments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No tournaments yet</p>
            ) : (
              <div className="space-y-4">
                {tournaments.map((tournament) => (
                  <div
                    key={tournament.id}
                    className="flex items-center justify-between p-4 border rounded-md"
                    data-testid={`tournament-${tournament.id}`}
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{tournament.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {tournament.format} • {formatTournamentDate(tournament.date, { month: "short", day: "numeric", year: "numeric" })} • ${tournament.buyIn} buy-in
                        {tournament.foodFee > 0 ? ` + $${tournament.foodFee} food` : ""}
                        {tournament.registrationWindow ? ` • Registration ${tournament.registrationWindow}` : ""}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {tournament.registeredCount} / {tournament.maxSeats} registered
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/admin/registrations/${tournament.id}`)}
                        data-testid={`button-view-registrations-${tournament.id}`}
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Registrations
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/admin/tournament-results/${tournament.id}`)}
                        data-testid={`button-enter-results-${tournament.id}`}
                      >
                        <Award className="h-4 w-4 mr-1" />
                        Results
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/admin/tournament/${tournament.id}`)}
                        data-testid={`button-edit-${tournament.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(tournament.id)}
                        data-testid={`button-delete-${tournament.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
