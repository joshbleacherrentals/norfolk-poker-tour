import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, CheckCircle, Clock, HelpCircle, Trash2 } from "lucide-react";
import { type Tournament, type Registration } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TournamentRegistrations() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/auth/session"],
    retry: false,
  });

  const { data: tournamentData } = useQuery<Tournament>({
    queryKey: [`/api/tournaments`],
  });

  const { data: registrationsData, isLoading: registrationsLoading } = useQuery<Registration[]>({
    queryKey: [`/api/admin/registrations/${params.id}`],
  });

  const updateRegistrationMutation = useMutation({
    mutationFn: async ({ id, registrationType }: { id: string; registrationType: string }) => {
      const res = await apiRequest("PUT", `/api/admin/registrations/${id}`, { registrationType });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/registrations/${params.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/registrations", params.id] });
      toast({
        title: "Status Updated",
        description: "Registration status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update registration status.",
        variant: "destructive",
      });
    },
  });

  const deleteRegistrationMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/registrations/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/registrations/${params.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/registrations", params.id] });
      toast({
        title: "Registration Deleted",
        description: "Registration has been deleted successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete registration.",
        variant: "destructive",
      });
    },
  });

  const tournaments = Array.isArray(tournamentData) ? tournamentData : [];
  const tournament = tournaments.find(t => t.id === params.id);
  const registrations = registrationsData ?? [];
  
  // Group registrations by type
  const confirmedRegistrations = registrations.filter(r => r.registrationType === "confirmed");
  const waitlistRegistrations = registrations.filter(r => r.registrationType === "waitlist");
  const maybeRegistrations = registrations.filter(r => r.registrationType === "maybe");

  const handleStatusChange = (registrationId: string, newStatus: string) => {
    updateRegistrationMutation.mutate({ id: registrationId, registrationType: newStatus });
  };

  const handleDeleteRegistration = (registrationId: string, registrationName: string) => {
    if (confirm(`Are you sure you want to delete ${registrationName}'s registration?`)) {
      deleteRegistrationMutation.mutate(registrationId);
    }
  };

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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/admin")}
              data-testid="button-back-to-dashboard"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-semibold">Tournament Registrations</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {tournament && (
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-tournament-name">
                {tournament.name}
              </h2>
              <p className="text-muted-foreground mt-1">
                {tournament.registeredCount} / {tournament.maxSeats} seats filled
              </p>
            </div>
          )}

          {registrationsLoading ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-muted-foreground text-center">Loading registrations...</p>
              </CardContent>
            </Card>
          ) : registrations.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-muted-foreground text-center">No registrations yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Confirmed Registrations */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <CardTitle>Confirmed Players ({confirmedRegistrations.length})</CardTitle>
                  </div>
                  <CardDescription>
                    Players who have confirmed their attendance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {confirmedRegistrations.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No confirmed registrations</p>
                  ) : (
                    <div className="space-y-3">
                      {confirmedRegistrations.map((registration, index) => (
                        <div
                          key={registration.id}
                          className="flex items-center justify-between p-4 border rounded-md gap-4"
                          data-testid={`registration-item-${registration.id}`}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <span className="text-sm font-medium text-primary">
                                {index + 1}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="font-medium" data-testid={`registration-name-${registration.id}`}>
                                {registration.name}
                              </p>
                              <div className="flex gap-4 mt-1">
                                <p className="text-sm text-muted-foreground" data-testid={`registration-email-${registration.id}`}>
                                  {registration.email}
                                </p>
                                <p className="text-sm text-muted-foreground" data-testid={`registration-phone-${registration.id}`}>
                                  {registration.phone}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select
                              value={registration.registrationType}
                              onValueChange={(value) => handleStatusChange(registration.id, value)}
                              data-testid={`select-status-${registration.id}`}
                            >
                              <SelectTrigger className="w-[150px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="waitlist">Waitlist</SelectItem>
                                <SelectItem value="maybe">Maybe</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRegistration(registration.id, registration.name)}
                              data-testid={`button-delete-${registration.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Waitlist */}
              {waitlistRegistrations.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-500" />
                      <CardTitle>Waitlist ({waitlistRegistrations.length})</CardTitle>
                    </div>
                    <CardDescription>
                      Players on the waiting list
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {waitlistRegistrations.map((registration, index) => (
                        <div
                          key={registration.id}
                          className="flex items-center justify-between p-4 border rounded-md gap-4"
                          data-testid={`waitlist-item-${registration.id}`}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500/10">
                              <span className="text-sm font-medium text-orange-500">
                                {index + 1}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium" data-testid={`waitlist-name-${registration.id}`}>
                                  {registration.name}
                                </p>
                                <Badge variant="outline" className="text-orange-500 border-orange-500">
                                  Waitlist
                                </Badge>
                              </div>
                              <div className="flex gap-4 mt-1">
                                <p className="text-sm text-muted-foreground" data-testid={`waitlist-email-${registration.id}`}>
                                  {registration.email}
                                </p>
                                <p className="text-sm text-muted-foreground" data-testid={`waitlist-phone-${registration.id}`}>
                                  {registration.phone}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select
                              value={registration.registrationType}
                              onValueChange={(value) => handleStatusChange(registration.id, value)}
                              data-testid={`select-status-${registration.id}`}
                            >
                              <SelectTrigger className="w-[150px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="waitlist">Waitlist</SelectItem>
                                <SelectItem value="maybe">Maybe</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRegistration(registration.id, registration.name)}
                              data-testid={`button-delete-${registration.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Maybe Attending */}
              {maybeRegistrations.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-blue-500" />
                      <CardTitle>Maybe Attending ({maybeRegistrations.length})</CardTitle>
                    </div>
                    <CardDescription>
                      Players who are interested but not confirmed
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {maybeRegistrations.map((registration, index) => (
                        <div
                          key={registration.id}
                          className="flex items-center justify-between p-4 border rounded-md gap-4"
                          data-testid={`maybe-item-${registration.id}`}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10">
                              <span className="text-sm font-medium text-blue-500">
                                {index + 1}
                              </span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium" data-testid={`maybe-name-${registration.id}`}>
                                  {registration.name}
                                </p>
                                <Badge variant="outline" className="text-blue-500 border-blue-500">
                                  Maybe
                                </Badge>
                              </div>
                              <div className="flex gap-4 mt-1">
                                <p className="text-sm text-muted-foreground" data-testid={`maybe-email-${registration.id}`}>
                                  {registration.email}
                                </p>
                                <p className="text-sm text-muted-foreground" data-testid={`maybe-phone-${registration.id}`}>
                                  {registration.phone}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Select
                              value={registration.registrationType}
                              onValueChange={(value) => handleStatusChange(registration.id, value)}
                              data-testid={`select-status-${registration.id}`}
                            >
                              <SelectTrigger className="w-[150px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="confirmed">Confirmed</SelectItem>
                                <SelectItem value="waitlist">Waitlist</SelectItem>
                                <SelectItem value="maybe">Maybe</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteRegistration(registration.id, registration.name)}
                              data-testid={`button-delete-${registration.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
