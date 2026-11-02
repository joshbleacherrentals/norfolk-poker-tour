import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import RegistrationForm from "./RegistrationForm";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, DollarSign, Trophy, Users } from "lucide-react";
import { insertRegistrationSchema } from "@shared/schema";
import { z } from "zod";
import { formatTournamentDate } from "@/lib/tournamentTime";

type RegistrationFormData = z.infer<typeof insertRegistrationSchema>;

interface RegistrationDialogProps {
  open: boolean;
  onClose: () => void;
  tournament: {
    id: string;
    name: string;
    format: string;
    date: Date;
    buyIn: number;
    prizePool: number;
    maxSeats: number;
    registeredCount: number;
  } | null;
  onSubmit: (data: RegistrationFormData) => void;
}

export default function RegistrationDialog({
  open,
  onClose,
  tournament,
  onSubmit,
}: RegistrationDialogProps) {
  if (!tournament) return null;

  const seatsAvailable = tournament.maxSeats - tournament.registeredCount;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Tournament Registration</DialogTitle>
          <DialogDescription>
            Complete your registration for this exciting tournament
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          <div className="space-y-4">
            <RegistrationForm
              tournamentId={tournament.id}
              tournamentName={tournament.name}
              seatsAvailable={seatsAvailable}
              onSubmit={onSubmit}
              onCancel={onClose}
            />
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1" data-testid="text-selected-tournament">
                    {tournament.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{tournament.format}</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {formatTournamentDate(tournament.date, { weekday: "long", month: "long", day: "2-digit", year: "numeric" })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTournamentDate(tournament.date, { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">${tournament.buyIn}</p>
                      <p className="text-xs text-muted-foreground">Buy-in Fee</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                      <Trophy className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        ${tournament.prizePool.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">Total Prize Pool</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {seatsAvailable} of {tournament.maxSeats} seats available
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tournament.registeredCount} players registered
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-md p-4 mt-6">
                  <p className="text-xs text-muted-foreground mb-2">
                    Tournament Structure
                  </p>
                  <ul className="text-sm space-y-1">
                    <li>• Starting Stack: 10,000 chips</li>
                    <li>• Blind Levels: 20 minutes</li>
                    <li>• Late Registration: 6 levels</li>
                    <li>• Re-entry: Allowed until late reg closes</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
