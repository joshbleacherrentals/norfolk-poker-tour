import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Users, Trophy } from "lucide-react";
import { formatTournamentDate } from "@/lib/tournamentTime";

interface TournamentCardProps {
  id: string;
  name: string;
  format: string;
  date: Date;
  buyIn: number;
  foodFee: number;
  registrationWindow: string;
  prizePool: number;
  maxSeats: number;
  registeredCount: number;
  rebuyAmount: number;
  rebuyChips: number;
  addonAmount: number;
  addonChips: number;
  onRegister: (id: string) => void;
}

export default function TournamentCard({
  id,
  name,
  format,
  date,
  buyIn,
  foodFee,
  registrationWindow,
  prizePool,
  maxSeats,
  registeredCount,
  rebuyAmount,
  rebuyChips,
  addonAmount,
  addonChips,
  onRegister,
}: TournamentCardProps) {
  const seatsAvailable = maxSeats - registeredCount;
  const seatPercentage = (registeredCount / maxSeats) * 100;
  
  const getSeatBadgeVariant = () => {
    if (seatsAvailable > 10) return "default";
    if (seatsAvailable > 5) return "secondary";
    return "destructive";
  };

  return (
    <Card className="hover-elevate transition-transform hover:-translate-y-1">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-xl font-semibold leading-tight" data-testid={`text-tournament-name-${id}`}>
            {name}
          </h3>
          <Badge variant="outline" data-testid={`badge-format-${id}`}>
            {format}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium" data-testid={`text-date-${id}`}>
                {formatTournamentDate(date, { month: "short", day: "2-digit", year: "numeric" })}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatTournamentDate(date, { hour: "numeric", minute: "2-digit" })}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium" data-testid={`text-buyin-${id}`}>
                ${buyIn}
              </p>
              <p className="text-xs text-muted-foreground">
                {foodFee > 0 ? `+$${foodFee} food` : "Buy-in"}
              </p>
            </div>
          </div>
          
          {prizePool > 0 && <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium" data-testid={`text-prize-${id}`}>
                ${prizePool.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Prize Pool</p>
            </div>
          </div>}
          
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <div className="text-sm">
              <p className="font-medium" data-testid={`text-seats-${id}`}>
                {seatsAvailable} left
              </p>
              <p className="text-xs text-muted-foreground">of {maxSeats} seats</p>
            </div>
          </div>
        </div>

        {registrationWindow && (
          <p className="text-sm text-muted-foreground">
            Registration: <span className="font-medium text-foreground">{registrationWindow}</span>
          </p>
        )}

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">Re-buy & Add-on Options</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="font-medium" data-testid={`text-rebuy-${id}`}>
                Re-buy: ${rebuyAmount}
              </p>
              <p className="text-muted-foreground">{rebuyChips} chips</p>
            </div>
            <div>
              <p className="font-medium" data-testid={`text-addon-${id}`}>
                Add-on: ${addonAmount}
              </p>
              <p className="text-muted-foreground">{addonChips} chips</p>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Registration</span>
            <Badge variant={getSeatBadgeVariant()} data-testid={`badge-seats-${id}`}>
              {seatsAvailable} seats available
            </Badge>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${seatPercentage}%` }}
              data-testid={`progress-${id}`}
            />
          </div>
        </div>
      </CardContent>
      
      <CardFooter>
        <Button
          className="w-full"
          onClick={() => onRegister(id)}
          disabled={seatsAvailable === 0}
          data-testid={`button-register-${id}`}
        >
          {seatsAvailable === 0 ? "Sold Out" : "Register Now"}
        </Button>
      </CardFooter>
    </Card>
  );
}
