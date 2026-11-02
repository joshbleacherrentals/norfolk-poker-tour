import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Users, Trophy, Clock, Coffee, CheckCircle, UserCheck, UserX, CalendarPlus } from "lucide-react";
import { type Tournament, insertRegistrationSchema } from "@shared/schema";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import RegistrationForm from "./RegistrationForm";
import { generateGoogleCalendarLink } from "@/lib/calendar";
import { formatTournamentDate } from "@/lib/tournamentTime";

type RegistrationFormData = z.infer<typeof insertRegistrationSchema>;

interface TournamentDetailDialogProps {
  tournament: Tournament | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TournamentDetailDialog({
  tournament,
  open,
  onOpenChange,
}: TournamentDetailDialogProps) {
  const [showRegistration, setShowRegistration] = useState(false);
  const { toast } = useToast();

  const registrationMutation = useMutation({
    mutationFn: async (data: RegistrationFormData) => {
      const res = await apiRequest("POST", "/api/registrations", data);
      return await res.json();
    },
    onSuccess: (registration) => {
      queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/registrations", tournament?.id] });
      toast({
        title: "Registration Successful!",
        description: registration.registrationType === "confirmed" 
          ? "You have been registered for the tournament. Don't forget to add it to your calendar!"
          : registration.registrationType === "waitlist"
          ? "You have been added to the waitlist. Add it to your calendar so you don't miss updates!"
          : "You have been marked as maybe attending. Add it to your calendar to help you remember!",
      });
      setShowRegistration(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register. Please try again.",
        variant: "destructive",
      });
    },
  });

  const { data: registrations = [] } = useQuery<Array<{ name: string; registrationType: string }>>({
    queryKey: ["/api/registrations", tournament?.id],
    enabled: !!tournament?.id && open,
  });

  const { data: results = [] } = useQuery<Array<{ playerName: string; placement: number }>>({
    queryKey: [`/api/tournament-results/${tournament?.id}`],
    enabled: !!tournament?.id && open,
  });

  if (!tournament) return null;

  const seatsAvailable = tournament.maxSeats - tournament.registeredCount;
  const blindSchedule = JSON.parse(tournament.blindSchedule);

  const confirmedPlayers = registrations.filter(r => r.registrationType === "confirmed");
  const waitlistPlayers = registrations.filter(r => r.registrationType === "waitlist");
  const maybePlayers = registrations.filter(r => r.registrationType === "maybe");

  // Helper function to get placement for a player
  const getPlayerPlacement = (playerName: string): number | null => {
    const result = results.find(r => r.playerName === playerName);
    return result ? result.placement : null;
  };

  // Helper function to render placement badge
  const renderPlacementBadge = (placement: number | null) => {
    if (!placement) return null;
    
    const getPlacementDisplay = (p: number) => {
      if (p === 1) return { text: "1st", icon: "👑", variant: "default" as const };
      if (p === 2) return { text: "2nd", icon: "🥈", variant: "secondary" as const };
      if (p === 3) return { text: "3rd", icon: "🥉", variant: "secondary" as const };
      if (p === 4) return { text: "4th", icon: "4️⃣", variant: "outline" as const };
      if (p === 5) return { text: "5th", icon: "5️⃣", variant: "outline" as const };
      if (p === 6) return { text: "6th", icon: "6️⃣", variant: "outline" as const };
      return { text: `${p}th`, icon: null, variant: "outline" as const };
    };

    const display = getPlacementDisplay(placement);
    
    return (
      <Badge variant={display.variant} className="ml-auto flex-shrink-0" data-testid={`placement-badge-${placement}`}>
        {display.icon && <span className="mr-1">{display.icon}</span>}
        <span>{display.text}</span>
      </Badge>
    );
  };

  const handleSubmitRegistration = (data: RegistrationFormData) => {
    registrationMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-tournament-detail">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-2xl" data-testid="text-tournament-detail-name">
                {tournament.name}
              </DialogTitle>
              <Badge variant="outline" className="mt-2" data-testid="badge-tournament-detail-format">
                {tournament.format}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {!showRegistration ? (
          <div className="space-y-6">
            {/* Tournament Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium" data-testid="text-tournament-detail-date">
                    {formatTournamentDate(tournament.date, { month: "long", day: "2-digit", year: "numeric" })}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatTournamentDate(tournament.date, { hour: "numeric", minute: "2-digit" })}
                  </p>
                  {tournament.registrationWindow && (
                    <p className="text-sm text-muted-foreground">
                      Registration: {tournament.registrationWindow}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium" data-testid="text-tournament-detail-buyin">
                    ${tournament.buyIn} Buy-in
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {tournament.foodFee > 0
                      ? `+$${tournament.foodFee} food fee · $${tournament.buyIn + tournament.foodFee} total`
                      : tournament.prizePool > 0
                      ? `$${tournament.prizePool.toLocaleString()} Prize Pool`
                      : "Tournament entry"}
                  </p>
                  {tournament.foodFee > 0 && tournament.prizePool > 0 && (
                    <p className="text-sm text-muted-foreground">
                      ${tournament.prizePool.toLocaleString()} Prize Pool
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium" data-testid="text-tournament-detail-seats">
                    {seatsAvailable} Seats Available
                  </p>
                  <p className="text-sm text-muted-foreground">
                    of {tournament.maxSeats} total seats
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Trophy className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Starting Stack</p>
                  <p className="text-sm text-muted-foreground">
                    {tournament.startingStack} chips
                  </p>
                </div>
              </div>
            </div>

            {/* Re-buy & Add-on */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Re-buy & Add-on Options</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium" data-testid="text-tournament-detail-rebuy">
                    Re-buy: ${tournament.rebuyAmount}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {tournament.rebuyChips} chips - {tournament.rebuyLimit} ({tournament.rebuyDeadline})
                  </p>
                </div>
                <div>
                  <p className="font-medium" data-testid="text-tournament-detail-addon">
                    Add-on: ${tournament.addonAmount}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {tournament.addonChips} chips ({tournament.addonAvailable})
                  </p>
                </div>
              </div>
            </div>

            {/* Registered Players */}
            {registrations.length > 0 && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Registered Players</h3>
                <div className="space-y-3">
                  {/* Confirmed Players */}
                  {confirmedPlayers.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium">Confirmed ({confirmedPlayers.length})</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {confirmedPlayers.map((player, index) => {
                          const placement = getPlayerPlacement(player.name);
                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between gap-2 p-2 border rounded text-sm"
                              data-testid={`confirmed-player-${index}`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
                                  <span className="text-xs font-medium text-primary">
                                    {index + 1}
                                  </span>
                                </div>
                                <span className="text-sm">{player.name}</span>
                              </div>
                              {renderPlacementBadge(placement)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Waitlist Players */}
                  {waitlistPlayers.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <UserCheck className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">Waitlist ({waitlistPlayers.length})</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {waitlistPlayers.map((player, index) => {
                          const placement = getPlayerPlacement(player.name);
                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between gap-2 p-2 border rounded text-sm"
                              data-testid={`waitlist-player-${index}`}
                            >
                              <span className="text-sm text-muted-foreground">{player.name}</span>
                              {renderPlacementBadge(placement)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Maybe Players */}
                  {maybePlayers.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <UserX className="h-4 w-4 text-muted-foreground" />
                        <p className="text-sm font-medium text-muted-foreground">Maybe Attending ({maybePlayers.length})</p>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {maybePlayers.map((player, index) => {
                          const placement = getPlayerPlacement(player.name);
                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between gap-2 p-2 border rounded text-sm"
                              data-testid={`maybe-player-${index}`}
                            >
                              <span className="text-sm text-muted-foreground">{player.name}</span>
                              {renderPlacementBadge(placement)}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Blind Structure */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Blind Structure</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{tournament.blindLevelMinutes} minutes</p>
                    <p className="text-xs text-muted-foreground">Per blind level</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Coffee className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Every {tournament.breakFrequency} levels</p>
                    <p className="text-xs text-muted-foreground">{tournament.breakDurationMinutes} min breaks</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium">Late Registration</p>
                  <p className="text-xs text-muted-foreground">Until level {tournament.lateRegistrationLevels}</p>
                </div>
              </div>

              {/* Blind Schedule */}
              <div className="border rounded-md p-4" data-testid="section-blind-schedule">
                <h4 className="font-medium mb-3">Blind Schedule</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {blindSchedule.map((level: any, index: number) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-2 border rounded text-sm"
                      data-testid={`blind-level-${level.level}`}
                    >
                      <span className="font-medium">Level {level.level}</span>
                      <span className="text-muted-foreground">
                        {level.smallBlind}/{level.bigBlind}
                        {level.ante ? ` (${level.ante})` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Registration and Calendar Buttons */}
            <div className="border-t pt-4 space-y-3">
              <Button
                className="w-full"
                onClick={() => setShowRegistration(true)}
                disabled={seatsAvailable === 0}
                data-testid="button-show-registration"
              >
                {seatsAvailable === 0 ? "Sold Out" : "Register for Tournament"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                asChild
                data-testid="button-add-to-calendar"
              >
                <a href={generateGoogleCalendarLink(tournament)} target="_blank" rel="noopener noreferrer">
                  <CalendarPlus className="h-4 w-4 mr-2" />
                  Add to Google Calendar
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Button
              variant="outline"
              onClick={() => setShowRegistration(false)}
              className="mb-4"
              data-testid="button-back-to-details"
            >
              ← Back to Details
            </Button>
            <RegistrationForm
              tournamentId={tournament.id}
              tournamentName={tournament.name}
              seatsAvailable={seatsAvailable}
              onSubmit={handleSubmitRegistration}
              onCancel={() => setShowRegistration(false)}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
