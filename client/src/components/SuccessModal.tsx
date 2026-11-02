import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Calendar, Mail, Phone, User } from "lucide-react";
import { formatTournamentDate } from "@/lib/tournamentTime";

interface SuccessModalProps {
  open: boolean;
  onClose: () => void;
  registrationId: string;
  tournamentName: string;
  tournamentDate: Date;
  playerName: string;
  playerEmail: string;
  playerPhone: string;
}

export default function SuccessModal({
  open,
  onClose,
  registrationId,
  tournamentName,
  tournamentDate,
  playerName,
  playerEmail,
  playerPhone,
}: SuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="modal-success">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-primary/10 p-3">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">
            Registration Confirmed!
          </DialogTitle>
          <DialogDescription className="text-center">
            You're all set for the tournament. We've sent a confirmation email to {playerEmail}
          </DialogDescription>
        </DialogHeader>

        <Card className="mt-4">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium" data-testid="text-tournament-name">
                    {tournamentName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatTournamentDate(tournamentDate, { weekday: "long", month: "long", day: "2-digit", year: "numeric" })} at{" "}
                    {formatTournamentDate(tournamentDate, { hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              <div className="h-px bg-border" />

              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm" data-testid="text-player-name">{playerName}</p>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm" data-testid="text-player-email">{playerEmail}</p>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm" data-testid="text-player-phone">{playerPhone}</p>
              </div>
            </div>

            <div className="bg-muted/50 rounded-md p-3">
              <p className="text-xs text-muted-foreground text-center">
                Registration ID
              </p>
              <p className="text-sm font-mono text-center mt-1" data-testid="text-registration-id">
                {registrationId}
              </p>
            </div>
          </CardContent>
        </Card>

        <Button onClick={onClose} className="w-full mt-4" data-testid="button-close">
          Back to Tournaments
        </Button>
      </DialogContent>
    </Dialog>
  );
}
