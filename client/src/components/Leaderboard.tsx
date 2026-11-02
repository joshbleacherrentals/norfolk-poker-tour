import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Crown, Medal, ChevronDown, ChevronUp } from "lucide-react";

interface LeaderboardEntry {
  playerName: string;
  totalWins: number;
  totalWinnings: number;
  tournamentsPlayed: number;
}

export default function Leaderboard() {
  const [showAll, setShowAll] = useState(false);
  const [season, setSeason] = useState("2025/26");

  const { data: leaderboard, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/leaderboard", season, showAll ? "all" : "top10"],
    queryFn: async () => {
      const limit = showAll ? 0 : 10;
      const response = await fetch(`/api/leaderboard?limit=${limit}&season=${encodeURIComponent(season)}`);
      if (!response.ok) throw new Error("Failed to fetch leaderboard");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-primary" />
                Leaderboard
              </CardTitle>
              <CardDescription>Loading top performers...</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-primary" />
                  {showAll ? "All Money Winners" : "Leaderboard - Top 10"} · {season === "all-time" ? "All-Time" : season}
                </CardTitle>
                <CardDescription>
                  {showAll ? "Everyone who has won prize money" : "Our most successful tournament champions"}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={season} onValueChange={setSeason}>
                  <SelectTrigger className="w-[140px]" aria-label="Leaderboard season">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025/26">2025/26</SelectItem>
                    <SelectItem value="2026/27">2026/27</SelectItem>
                    <SelectItem value="all-time">All-Time</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAll(!showAll)}
                  data-testid="button-toggle-leaderboard"
                >
                  {showAll ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Show Top 10
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show All Winners
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {!leaderboard?.length ? (
                <p className="py-8 text-center text-muted-foreground">
                  {isLoading ? "Loading leaderboard..." : `No results recorded for ${season === "all-time" ? "all time" : season} yet.`}
                </p>
              ) : leaderboard.map((entry, index) => {
                const rank = index + 1;
                let icon = null;
                let iconColor = "";

                if (rank === 1) {
                  icon = <Crown className="h-6 w-6" />;
                  iconColor = "text-yellow-500";
                } else if (rank === 2) {
                  icon = <Medal className="h-6 w-6" />;
                  iconColor = "text-gray-400";
                } else if (rank === 3) {
                  icon = <Medal className="h-6 w-6" />;
                  iconColor = "text-orange-600";
                } else {
                  icon = (
                    <div className="w-6 h-6 flex items-center justify-center">
                      <span className="text-lg font-bold text-muted-foreground">{rank}</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={entry.playerName}
                    className="flex items-center justify-between p-4 border rounded-md hover-elevate"
                    data-testid={`leaderboard-${rank}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={iconColor}>{icon}</div>
                      <div>
                        <p className="font-semibold text-lg" data-testid={`text-player-${rank}`}>
                          {entry.playerName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {entry.totalWins} {entry.totalWins === 1 ? "win" : "wins"} · {entry.tournamentsPlayed} {entry.tournamentsPlayed === 1 ? "game placed" : "games placed"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-primary" data-testid={`text-prizes-${rank}`}>
                        ${(entry.totalWinnings || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Prizes</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
