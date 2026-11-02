import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { CalendarDays, Users } from "lucide-react";
import { type Tournament } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatTournamentDate } from "@/lib/tournamentTime";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const bulkRegistrationSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name"),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z.string().trim().min(10, "Please enter a valid phone number"),
});

type BulkRegistrationFormData = z.infer<typeof bulkRegistrationSchema>;
type BulkRegistrationResult = {
  registrations: Array<{ tournamentId: string; registrationType: string }>;
  alreadyRegisteredTournamentIds: string[];
};

interface BulkRegistrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournaments: Tournament[];
}

export default function BulkRegistrationDialog({
  open,
  onOpenChange,
  tournaments,
}: BulkRegistrationDialogProps) {
  const { toast } = useToast();
  const form = useForm<BulkRegistrationFormData>({
    resolver: zodResolver(bulkRegistrationSchema),
    defaultValues: { name: "", email: "", phone: "" },
  });

  useEffect(() => {
    if (!open) form.reset();
  }, [open, form]);

  const registrationMutation = useMutation({
    mutationFn: async (data: BulkRegistrationFormData) => {
      const response = await apiRequest("POST", "/api/registrations/bulk", {
        ...data,
        tournamentIds: tournaments.map(tournament => tournament.id),
      });
      return await response.json() as BulkRegistrationResult;
    },
    onSuccess: async result => {
      await queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      const waitlistedCount = result.registrations.filter(
        registration => registration.registrationType === "waitlist",
      ).length;
      const addedCount = result.registrations.length;
      const skippedCount = result.alreadyRegisteredTournamentIds.length;
      const message = addedCount === 0
        ? "You were already registered for every upcoming tournament."
        : `${addedCount} event${addedCount === 1 ? "" : "s"} added${waitlistedCount ? `; ${waitlistedCount} waitlisted` : ""}${skippedCount ? `; ${skippedCount} already registered` : ""}.`;

      toast({
        title: "Tour Registration Complete",
        description: message,
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Unable to register for the tour. Please try again.",
        variant: "destructive",
      });
    },
  });

  const totalEntryCost = tournaments.reduce(
    (total, tournament) => total + tournament.buyIn + tournament.foodFee,
    0,
  );

  const submit = (data: BulkRegistrationFormData) => registrationMutation.mutate(data);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register for All Upcoming Tournaments</DialogTitle>
          <DialogDescription>
            Enter your details once to register for each upcoming event.
            Full events will add you to their waitlists.
          </DialogDescription>
        </DialogHeader>

        <Card>
          <CardContent className="pt-5">
            <div className="mb-3 flex items-center gap-2 font-medium">
              <CalendarDays className="h-4 w-4 text-primary" />
              {tournaments.length} upcoming {tournaments.length === 1 ? "event" : "events"}
            </div>
            <ul className="space-y-2 text-sm">
              {tournaments.map(tournament => (
                <li key={tournament.id} className="flex items-start justify-between gap-3">
                  <span>
                    {tournament.name}
                    <span className="block text-xs text-muted-foreground">
                      {formatTournamentDate(tournament.date, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </span>
                  <span className="shrink-0 text-muted-foreground">
                    ${tournament.buyIn + tournament.foodFee}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t pt-3 text-sm text-muted-foreground">
              Listed entry and food total: <strong className="text-foreground">${totalEntryCost}</strong>.
              {" "}Payment is collected at the events; nothing is charged online.
            </p>
          </CardContent>
        </Card>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl><Input autoComplete="name" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl><Input type="email" autoComplete="email" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl><Input type="tel" autoComplete="tel" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
                disabled={registrationMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={registrationMutation.isPending || tournaments.length === 0}
              >
                <Users className="mr-2 h-4 w-4" />
                {registrationMutation.isPending ? "Registering..." : "Register for All"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
