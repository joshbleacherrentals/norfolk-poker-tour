import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Header from "@/components/Header";
import TournamentCard from "@/components/TournamentCard";
import TournamentFilter from "@/components/TournamentFilter";
import TournamentDetailDialog from "@/components/TournamentDetailDialog";
import BulkRegistrationDialog from "@/components/BulkRegistrationDialog";
import NotificationSignupDialog from "@/components/NotificationSignupDialog";
import Leaderboard from "@/components/Leaderboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spade, Heart, Diamond, Club, Trophy, Bell, Users } from "lucide-react";
import { type Tournament, type NotificationSubscriber, insertNotificationSubscriberSchema } from "@shared/schema";
import { z } from "zod";
import pokerImage from "@assets/stock_images/poker_chips_cards_ca_64b82819.jpg";
import { useToast } from "@/hooks/use-toast";

type NotificationFormData = z.infer<typeof insertNotificationSubscriberSchema>;

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [formatFilter, setFormatFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showBulkRegistration, setShowBulkRegistration] = useState(false);
  const [showNotificationSignup, setShowNotificationSignup] = useState(false);
  const [showPastTournaments, setShowPastTournaments] = useState(false);
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["/api/tournaments"],
  });
  
  const { data: rulesData } = useQuery({
    queryKey: ["/api/rules"],
  });
  
  const tournaments = (data as Tournament[] | undefined) ?? [];
  const upcomingTournaments = tournaments.filter(
    tournament => new Date(tournament.date).getTime() > Date.now(),
  );
  const rules = rulesData as { sections: Array<{ title: string; icon: string; rules: Array<{ title: string; description: string }> }> } | undefined;

  const notificationMutation = useMutation({
    mutationFn: async (data: NotificationFormData) => {
      const res = await apiRequest("POST", "/api/notification-subscribers", data);
      return await res.json() as NotificationSubscriber;
    },
    onSuccess: () => {
      setShowNotificationSignup(false);
      toast({
        title: "Successfully Subscribed!",
        description: "You'll be notified when new tournaments are announced.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription Failed",
        description: error.message || "Unable to subscribe. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRegister = (id: string) => {
    const tournament = tournaments.find((t) => t.id === id);
    if (tournament) {
      setSelectedTournament(tournament);
      setShowDetailDialog(true);
    }
  };

  const handleSubmitNotification = (data: NotificationFormData) => {
    notificationMutation.mutate(data);
  };

  const filteredTournaments = tournaments
    .filter((tournament) => {
      const now = new Date();
      const tournamentDate = new Date(tournament.date);
      const isPastTournament = tournamentDate < now;
      const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFormat = formatFilter === "all" || tournament.format === formatFilter;
      
      // If showing past tournaments, show all; otherwise filter out past ones
      const shouldShow = showPastTournaments || !isPastTournament;
      
      return shouldShow && matchesSearch && matchesFormat;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "prize":
          return b.prizePool - a.prizePool;
        case "seats":
          return (b.maxSeats - b.registeredCount) - (a.maxSeats - a.registeredCount);
        case "buyin":
          return a.buyIn - b.buyIn;
        default:
          return 0;
      }
    });

  const tournamentsBySeason = filteredTournaments.reduce((groups, tournament) => {
    const date = new Date(tournament.date);
    const seasonStartYear = date.getMonth() >= 8 ? date.getFullYear() : date.getFullYear() - 1;
    const seasonLabel = `${seasonStartYear}/${String(seasonStartYear + 1).slice(-2)}`;
    const seasonTournaments = groups.get(seasonLabel) ?? [];
    seasonTournaments.push(tournament);
    groups.set(seasonLabel, seasonTournaments);
    return groups;
  }, new Map<string, Tournament[]>());

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={pokerImage}
            alt="Poker tournament atmosphere"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/95" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-center gap-3 mb-6">
              <Spade className="h-8 w-8 text-primary" />
              <Heart className="h-8 w-8 text-primary" />
              <Diamond className="h-8 w-8 text-primary" />
              <Club className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4" data-testid="text-hero-title">
              NPT - Norfolk Poker Tour
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8">
              Join the premier poker tournament series across Norfolk. Win big prizes and experience the thrill of competitive poker.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 bg-background/40 backdrop-blur-sm" 
                onClick={() => setShowNotificationSignup(true)}
                data-testid="button-notification-signup"
              >
                <Bell className="mr-2 h-5 w-5" />
                Get Notified
              </Button>
              <Button size="lg" className="text-lg px-8" data-testid="button-hero-cta">
                <Trophy className="mr-2 h-5 w-5" />
                Browse Tournaments
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      <Leaderboard />
      
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2" data-testid="text-page-title">
                {showPastTournaments ? "All Tournaments" : "Upcoming Tournaments"}
              </h2>
              <p className="text-muted-foreground">
                Browse and register for exciting poker tournaments
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {!showPastTournaments && upcomingTournaments.length > 0 && (
                <Button
                  onClick={() => setShowBulkRegistration(true)}
                  data-testid="button-register-all-tournaments"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Register for All Upcoming
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowPastTournaments(!showPastTournaments)}
                data-testid="button-toggle-past-tournaments"
              >
                {showPastTournaments ? "Hide Past Tournaments" : "Show Past Tournaments"}
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <TournamentFilter
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            formatFilter={formatFilter}
            onFormatChange={setFormatFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading tournaments...</p>
          </div>
        ) : filteredTournaments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground" data-testid="text-no-results">
              No tournaments found matching your criteria
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {Array.from(tournamentsBySeason.entries()).map(([season, seasonTournaments]) => (
              <section key={season} aria-label={`${season} tour schedule`}>
                <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="text-xl font-semibold">{season} Tour</h3>
                  <p className="text-sm text-muted-foreground">
                    {seasonTournaments.length} {seasonTournaments.length === 1 ? "event" : "events"}
                  </p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {seasonTournaments.map((tournament) => (
                    <TournamentCard
                      key={tournament.id}
                      {...tournament}
                      date={new Date(tournament.date)}
                      onRegister={handleRegister}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        {rules && rules.sections && rules.sections.length > 0 && (
          <section className="mt-20 mb-12">
            <h2 className="text-3xl font-bold mb-8 text-center" data-testid="text-rules-title">
              Tournament Rules & Guidelines
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {rules.sections.map((section, index) => {
                const IconComponent = 
                  section.icon === "Spade" ? Spade :
                  section.icon === "Heart" ? Heart :
                  section.icon === "Diamond" ? Diamond :
                  section.icon === "Club" ? Club :
                  Spade;

                return (
                  <Card key={index}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-primary" />
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {section.rules.map((rule, ruleIndex) => (
                        <div key={ruleIndex}>
                          <h4 className="font-semibold mb-1">{rule.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {rule.description}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>
        )}
      </main>

      <TournamentDetailDialog
        tournament={selectedTournament}
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
      />

      <BulkRegistrationDialog
        open={showBulkRegistration}
        onOpenChange={setShowBulkRegistration}
        tournaments={upcomingTournaments}
      />

      <NotificationSignupDialog
        open={showNotificationSignup}
        onClose={() => setShowNotificationSignup(false)}
        onSubmit={handleSubmitNotification}
      />
    </div>
  );
}
