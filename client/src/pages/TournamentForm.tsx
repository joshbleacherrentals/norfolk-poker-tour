import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { parseTorontoDateTimeLocal, toTorontoDateTimeLocal } from "@/lib/tournamentTime";
import { ArrowLeft, Save } from "lucide-react";
import { type Tournament, insertTournamentSchema } from "@shared/schema";
import { z } from "zod";

const formSchema = insertTournamentSchema.extend({
  date: z.string(),
});

type FormData = z.infer<typeof formSchema>;

export default function TournamentForm() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const isEdit = params.id && params.id !== "new";

  const { data: session } = useQuery({
    queryKey: ["/api/auth/session"],
    retry: false,
  });

  const { data: tournamentData } = useQuery({
    queryKey: [`/api/tournaments/${params.id}`],
    enabled: !!isEdit,
  });

  const { data: chipStructureData } = useQuery({
    queryKey: ["/api/chip-structure"],
  });

  const tournament = tournamentData as Tournament | undefined;
  const chipStructure = chipStructureData as any;

  const getDefaultValues = () => {
    if (chipStructure) {
      return {
        name: "",
        format: "Texas Hold'em",
        date: "",
        buyIn: 0,
        foodFee: 0,
        registrationWindow: "",
        prizePool: 0,
        maxSeats: 100,
        registeredCount: 0,
        rebuyAmount: chipStructure.rebuyAmount,
        rebuyChips: chipStructure.rebuyChips,
        addonAmount: chipStructure.addonAmount,
        addonChips: chipStructure.addonChips,
        startingStack: chipStructure.startingStack,
        startingSmallBlind: chipStructure.startingSmallBlind,
        startingBigBlind: chipStructure.startingBigBlind,
        blindLevelMinutes: chipStructure.blindLevelMinutes,
        breakFrequency: chipStructure.breakFrequency || 3,
        breakDurationMinutes: chipStructure.breakDurationMinutes || 15,
        rebuyLimit: chipStructure.rebuyLimit,
        rebuyDeadline: chipStructure.rebuyDeadline,
        addonAvailable: chipStructure.addonAvailable,
        lateRegistrationLevels: chipStructure.lateRegistrationLevels,
        blindSchedule: typeof chipStructure.blindSchedule === 'string' 
          ? chipStructure.blindSchedule 
          : JSON.stringify(chipStructure.blindSchedule),
      };
    }
    return {
      name: "",
      format: "Texas Hold'em",
      date: "",
      buyIn: 0,
      foodFee: 0,
      registrationWindow: "",
      prizePool: 0,
      maxSeats: 100,
      registeredCount: 0,
      rebuyAmount: 0,
      rebuyChips: 500,
      addonAmount: 0,
      addonChips: 500,
      startingStack: 500,
      startingSmallBlind: 1,
      startingBigBlind: 2,
      blindLevelMinutes: 40,
      breakFrequency: 3,
      breakDurationMinutes: 15,
      rebuyLimit: "unlimited",
      rebuyDeadline: "dinner break",
      addonAvailable: "at dinner break",
      lateRegistrationLevels: 6,
      blindSchedule: JSON.stringify([
        { level: 1, smallBlind: 1, bigBlind: 2 },
        { level: 2, smallBlind: 2, bigBlind: 4 },
        { level: 3, smallBlind: 3, bigBlind: 6 },
        { level: 4, smallBlind: 5, bigBlind: 10 },
        { level: 5, smallBlind: 10, bigBlind: 20 },
        { level: 6, smallBlind: 15, bigBlind: 30 },
        { level: 7, smallBlind: 25, bigBlind: 50 },
        { level: 8, smallBlind: 50, bigBlind: 100 },
        { level: 9, smallBlind: 75, bigBlind: 150 },
        { level: 10, smallBlind: 100, bigBlind: 200 },
      ]),
    };
  };

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(),
  });

  useEffect(() => {
    if (tournament && isEdit) {
      form.reset({
        name: tournament.name,
        format: tournament.format,
        date: toTorontoDateTimeLocal(tournament.date),
        buyIn: tournament.buyIn,
        foodFee: tournament.foodFee,
        registrationWindow: tournament.registrationWindow,
        prizePool: tournament.prizePool,
        maxSeats: tournament.maxSeats,
        registeredCount: tournament.registeredCount,
        rebuyAmount: tournament.rebuyAmount,
        rebuyChips: tournament.rebuyChips,
        addonAmount: tournament.addonAmount,
        addonChips: tournament.addonChips,
        startingStack: tournament.startingStack,
        startingSmallBlind: tournament.startingSmallBlind,
        startingBigBlind: tournament.startingBigBlind,
        blindLevelMinutes: tournament.blindLevelMinutes,
        breakFrequency: tournament.breakFrequency,
        breakDurationMinutes: tournament.breakDurationMinutes,
        rebuyLimit: tournament.rebuyLimit,
        rebuyDeadline: tournament.rebuyDeadline,
        addonAvailable: tournament.addonAvailable,
        lateRegistrationLevels: tournament.lateRegistrationLevels,
        blindSchedule: tournament.blindSchedule,
      });
    }
  }, [tournament, isEdit, form]);

  useEffect(() => {
    // When chip structure loads for new tournaments ONLY, reset form with chip structure defaults
    // CRITICAL: Only run when NOT editing (isEdit must be false)
    if (chipStructure && !isEdit) {
      form.reset({
        name: "",
        format: "Texas Hold'em",
        date: "",
        buyIn: 0,
        foodFee: 0,
        registrationWindow: "",
        prizePool: 0,
        maxSeats: 100,
        registeredCount: 0,
        rebuyAmount: chipStructure.rebuyAmount,
        rebuyChips: chipStructure.rebuyChips,
        addonAmount: chipStructure.addonAmount,
        addonChips: chipStructure.addonChips,
        startingStack: chipStructure.startingStack,
        startingSmallBlind: chipStructure.startingSmallBlind,
        startingBigBlind: chipStructure.startingBigBlind,
        blindLevelMinutes: chipStructure.blindLevelMinutes,
        breakFrequency: chipStructure.breakFrequency || 3,
        breakDurationMinutes: chipStructure.breakDurationMinutes || 15,
        rebuyLimit: chipStructure.rebuyLimit,
        rebuyDeadline: chipStructure.rebuyDeadline,
        addonAvailable: chipStructure.addonAvailable,
        lateRegistrationLevels: chipStructure.lateRegistrationLevels,
        blindSchedule: typeof chipStructure.blindSchedule === 'string' 
          ? chipStructure.blindSchedule 
          : JSON.stringify(chipStructure.blindSchedule),
      });
    }
  }, [chipStructure, isEdit, form]);

  useEffect(() => {
    if (!session) {
      setLocation("/admin/login");
    }
  }, [session, setLocation]);

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const tournamentData = {
        ...data,
        date: parseTorontoDateTimeLocal(data.date),
      };
      const res = await apiRequest("POST", "/api/admin/tournaments", tournamentData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create tournament");
      }
      return await res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      await queryClient.refetchQueries({ queryKey: ["/api/tournaments"] });
      toast({
        title: "Tournament Created",
        description: "The tournament has been successfully created.",
      });
      setLocation("/admin");
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create tournament",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const tournamentData = {
        ...data,
        date: parseTorontoDateTimeLocal(data.date),
      };
      const res = await apiRequest("PUT", `/api/admin/tournaments/${params.id}`, tournamentData);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update tournament");
      }
      return await res.json();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/tournaments"] });
      await queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${params.id}`] });
      await queryClient.refetchQueries({ queryKey: ["/api/tournaments"] });
      toast({
        title: "Tournament Updated",
        description: "The tournament has been successfully updated.",
      });
      setLocation("/admin");
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update tournament",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (!session) {
    return null;
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/admin")}
            data-testid="button-back"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>
              {isEdit ? "Edit Tournament" : "Add New Tournament"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tournament Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Friday Night Championship" data-testid="input-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="format"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Format</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-format">
                            <SelectValue placeholder="Select format" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Texas Hold'em">Texas Hold'em</SelectItem>
                          <SelectItem value="Omaha">Omaha</SelectItem>
                          <SelectItem value="Seven Card Stud">Seven Card Stud</SelectItem>
                          <SelectItem value="Mixed Games">Mixed Games</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" data-testid="input-date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="buyIn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Buy-In ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            data-testid="input-buyin"
                            value={field.value}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="foodFee"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Food Fee ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            data-testid="input-food-fee"
                            value={field.value}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="registrationWindow"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Time Window</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="5:00 PM – 6:00 PM"
                          data-testid="input-registration-window"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="rebuyAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rebuy Amount ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            data-testid="input-rebuy-amount"
                            value={field.value}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rebuyChips"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Rebuy Chips</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            data-testid="input-rebuy-chips"
                            value={field.value}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="addonAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Add-on Amount ($)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            data-testid="input-addon-amount"
                            value={field.value}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="addonChips"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Add-on Chips</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            data-testid="input-addon-chips"
                            value={field.value}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-4">Chip Structure</h3>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="startingStack"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Starting Stack</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              data-testid="input-starting-stack"
                              value={field.value}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="startingSmallBlind"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Starting Small Blind</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              data-testid="input-starting-small-blind"
                              value={field.value}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="startingBigBlind"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Starting Big Blind</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              data-testid="input-starting-big-blind"
                              value={field.value}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="blindLevelMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Blind Level (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              data-testid="input-blind-level-minutes"
                              value={field.value}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="breakFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Break Every (levels)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              data-testid="input-break-frequency"
                              value={field.value}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="breakDurationMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Break Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              data-testid="input-break-duration"
                              value={field.value}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="rebuyLimit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rebuy Limit</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-rebuy-limit"
                              {...field}
                              placeholder="e.g. unlimited, 3, none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="rebuyDeadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rebuy Deadline</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-rebuy-deadline"
                              {...field}
                              placeholder="e.g. dinner break, 6 levels"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="addonAvailable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Add-on Available</FormLabel>
                          <FormControl>
                            <Input
                              data-testid="input-addon-available"
                              {...field}
                              placeholder="e.g. at dinner break, none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lateRegistrationLevels"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Late Registration (levels)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              data-testid="input-late-registration"
                              value={field.value}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="blindSchedule"
                    render={({ field }) => (
                      <FormItem className="mt-4">
                        <FormLabel>Blind Schedule (JSON)</FormLabel>
                        <FormControl>
                          <textarea
                            data-testid="input-blind-schedule"
                            {...field}
                            className="w-full min-h-[200px] p-3 border rounded-md font-mono text-sm"
                            placeholder='[{"level":1,"smallBlind":1,"bigBlind":2},{"level":2,"smallBlind":2,"bigBlind":4}]'
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground mt-1">
                          Enter blind schedule as JSON array. Each level should have: level, smallBlind, bigBlind (and optionally ante)
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="maxSeats"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Seats</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          data-testid="input-maxseats"
                          value={field.value}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setLocation("/admin")}
                    className="flex-1"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isPending}
                    className="flex-1"
                    data-testid="button-save"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {isPending ? "Saving..." : isEdit ? "Update" : "Create"} Tournament
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
