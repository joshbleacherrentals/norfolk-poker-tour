import { useState } from "react";
import { useLocation, useParams, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trophy, Trash2 } from "lucide-react";
import { type Tournament, type TournamentResult } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function TournamentResults() {
  const params = useParams();
  const tournamentId = params.id as string;
  const [, setLocation] = useLocation();
  const [, navigate] = useRoute("/admin/tournament-results/:id");
  const { toast } = useToast();

  // Form state
  const [playerName, setPlayerName] = useState("");
  const [placement, setPlacement] = useState<number>(1);
  const [prizeAmount, setPrizeAmount] = useState<number>(0);
  
  // Delete confirmation state
  const [deleteResultId, setDeleteResultId] = useState<string | null>(null);

  // Fetch tournament details
  const { data: tournament, isLoading: tournamentLoading } = useQuery<Tournament>({
    queryKey: ["/api/tournaments", tournamentId],
  });

  // Fetch existing results
  const { data: results, isLoading: resultsLoading } = useQuery<TournamentResult[]>({
    queryKey: ["/api/admin/tournament-results", tournamentId],
  });

  // Create result mutation
  const createResultMutation = useMutation({
    mutationFn: async (data: { tournamentId: string; playerName: string; placement: number; prizeAmount: number }) => {
      const res = await apiRequest("POST", "/api/admin/tournament-results", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create result");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tournament-results", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      toast({
        title: "Result Added",
        description: "Tournament result has been added successfully.",
      });
      // Reset form
      setPlayerName("");
      setPlacement(1);
      setPrizeAmount(0);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add result",
        variant: "destructive",
      });
    },
  });

  // Delete result mutation
  const deleteResultMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/tournament-results/${id}`);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete result");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/tournament-results", tournamentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/leaderboard"] });
      toast({
        title: "Result Deleted",
        description: "Tournament result has been deleted.",
      });
      setDeleteResultId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete result",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      toast({
        title: "Validation Error",
        description: "Player name is required",
        variant: "destructive",
      });
      return;
    }
    if (placement < 1) {
      toast({
        title: "Validation Error",
        description: "Placement must be at least 1",
        variant: "destructive",
      });
      return;
    }
    createResultMutation.mutate({ tournamentId, playerName, placement, prizeAmount });
  };

  if (tournamentLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-muted-foreground">Tournament not found</p>
          <Button onClick={() => setLocation("/admin")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const sortedResults = results ? [...results].sort((a, b) => a.placement - b.placement) : [];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button
          variant="ghost"
          onClick={() => setLocation("/admin")}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Tournament Results</h2>
          <p className="text-muted-foreground">
            {tournament.name} - {new Date(tournament.date).toLocaleDateString()}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add Result</CardTitle>
              <CardDescription>Enter player placement and prize information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="playerName">Player Name</Label>
                  <Input
                    id="playerName"
                    placeholder="John Doe"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    data-testid="input-player-name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="placement">Placement</Label>
                  <Input
                    id="placement"
                    type="number"
                    min="1"
                    value={placement}
                    onChange={(e) => setPlacement(parseInt(e.target.value) || 1)}
                    data-testid="input-placement"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="prizeAmount">Prize Amount ($)</Label>
                  <Input
                    id="prizeAmount"
                    type="number"
                    min="0"
                    value={prizeAmount}
                    onChange={(e) => setPrizeAmount(parseInt(e.target.value) || 0)}
                    data-testid="input-prize-amount"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createResultMutation.isPending}
                  data-testid="button-add-result"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {createResultMutation.isPending ? "Adding..." : "Add Result"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>Tournament placements and prizes</CardDescription>
            </CardHeader>
            <CardContent>
              {resultsLoading ? (
                <p className="text-muted-foreground text-sm">Loading results...</p>
              ) : sortedResults.length === 0 ? (
                <p className="text-muted-foreground text-sm" data-testid="text-no-results">
                  No results added yet. Add the first result using the form on the left.
                </p>
              ) : (
                <div className="space-y-3">
                  {sortedResults.map((result) => (
                    <div
                      key={result.id}
                      className="flex items-center justify-between p-3 border rounded-md"
                      data-testid={`result-${result.id}`}
                    >
                      <div className="flex items-center gap-3">
                        {result.placement === 1 && (
                          <Trophy className="h-5 w-5 text-yellow-500" />
                        )}
                        {result.placement === 2 && (
                          <Trophy className="h-5 w-5 text-gray-400" />
                        )}
                        {result.placement === 3 && (
                          <Trophy className="h-5 w-5 text-orange-600" />
                        )}
                        {result.placement > 3 && (
                          <span className="text-sm font-semibold text-muted-foreground w-5">
                            {result.placement}
                          </span>
                        )}
                        <div>
                          <p className="font-semibold" data-testid={`text-player-${result.id}`}>
                            {result.playerName}
                          </p>
                          <p className="text-sm text-muted-foreground" data-testid={`text-prize-${result.id}`}>
                            ${result.prizeAmount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteResultId(result.id)}
                        data-testid={`button-delete-${result.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={deleteResultId !== null} onOpenChange={(open) => !open && setDeleteResultId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Result?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tournament result? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteResultId && deleteResultMutation.mutate(deleteResultId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
