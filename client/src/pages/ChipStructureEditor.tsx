import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { chipStructureSchema, type ChipStructureData } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

export default function ChipStructureEditor() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/auth/session"],
    retry: false,
  });

  const { data: chipStructureData, isLoading: structureLoading } = useQuery<ChipStructureData>({
    queryKey: ["/api/chip-structure"],
  });

  const form = useForm<ChipStructureData>({
    resolver: zodResolver(chipStructureSchema),
    defaultValues: chipStructureData || {
      startingStack: 500,
      startingSmallBlind: 1,
      startingBigBlind: 2,
      blindLevelMinutes: 40,
      breakFrequency: 3,
      breakDurationMinutes: 15,
      rebuyAmount: 100,
      rebuyChips: 500,
      rebuyLimit: "unlimited",
      rebuyDeadline: "dinner break",
      addonAmount: 100,
      addonChips: 500,
      addonAvailable: "at dinner break",
      lateRegistrationLevels: 6,
      blindSchedule: []
    },
  });

  useEffect(() => {
    if (chipStructureData) {
      form.reset(chipStructureData);
    }
  }, [chipStructureData, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: ChipStructureData) => {
      const res = await apiRequest("PUT", "/api/admin/chip-structure", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update chip structure");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chip-structure"] });
      toast({
        title: "Success!",
        description: "Chip structure updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

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

  const handleSubmit = (data: ChipStructureData) => {
    updateMutation.mutate(data);
  };

  const blindSchedule = form.watch("blindSchedule");

  const addBlindLevel = () => {
    const currentSchedule = form.getValues("blindSchedule");
    const nextLevel = currentSchedule.length + 1;
    const lastBlind = currentSchedule[currentSchedule.length - 1];
    
    form.setValue("blindSchedule", [
      ...currentSchedule,
      {
        level: nextLevel,
        smallBlind: lastBlind ? lastBlind.bigBlind : 1,
        bigBlind: lastBlind ? lastBlind.bigBlind * 2 : 2,
      }
    ]);
  };

  const removeBlindLevel = (index: number) => {
    const currentSchedule = form.getValues("blindSchedule");
    form.setValue("blindSchedule", currentSchedule.filter((_, i) => i !== index));
  };

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
            <h1 className="text-xl font-semibold">Edit Chip Structure</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto">
          {structureLoading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Starting Stack & Blinds</CardTitle>
                    <CardDescription>Configure the initial tournament setup</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="startingStack"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Starting Stack (chips)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-starting-stack" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startingSmallBlind"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Starting Small Blind</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-small-blind" />
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
                              <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-big-blind" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="blindLevelMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Blind Level Duration (minutes)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-blind-duration" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="breakFrequency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Break Every (levels)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-break-frequency" />
                            </FormControl>
                            <FormDescription>Set to 0 for no breaks</FormDescription>
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
                              <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-break-duration" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="lateRegistrationLevels"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Late Registration (levels)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-late-reg" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Re-buys & Add-ons</CardTitle>
                    <CardDescription>Configure rebuy and addon options</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="rebuyAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rebuy Amount ($)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-rebuy-amount" />
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
                              <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-rebuy-chips" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="rebuyLimit"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rebuy Limit</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., unlimited" data-testid="input-rebuy-limit" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="rebuyDeadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rebuy Deadline</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., dinner break, 6 levels" data-testid="input-rebuy-deadline" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="addonAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Add-on Amount ($)</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-addon-amount" />
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
                              <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid="input-addon-chips" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="addonAvailable"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Add-on Available</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., at dinner break" data-testid="input-addon-available" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Blind Schedule</CardTitle>
                        <CardDescription>Configure blind levels for the tournament</CardDescription>
                      </div>
                      <Button type="button" size="sm" onClick={addBlindLevel} data-testid="button-add-blind-level">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Level
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {blindSchedule.map((_, index) => (
                        <div key={index} className="flex items-end gap-4">
                          <FormField
                            control={form.control}
                            name={`blindSchedule.${index}.level`}
                            render={({ field }) => (
                              <FormItem className="w-20">
                                <FormLabel>Level</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid={`input-level-${index}`} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`blindSchedule.${index}.smallBlind`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel>Small Blind</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid={`input-sb-${index}`} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`blindSchedule.${index}.bigBlind`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel>Big Blind</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} data-testid={`input-bb-${index}`} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`blindSchedule.${index}.ante`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel>Ante (optional)</FormLabel>
                                <FormControl>
                                  <Input type="number" {...field} value={field.value || ""} onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} data-testid={`input-ante-${index}`} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button 
                            type="button" 
                            variant="outline" 
                            size="icon"
                            onClick={() => removeBlindLevel(index)}
                            data-testid={`button-remove-level-${index}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}

                      {blindSchedule.length === 0 && (
                        <p className="text-muted-foreground text-center py-4">
                          No blind levels added yet. Click "Add Level" to get started.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <div className="flex gap-4">
                  <Button type="button" variant="outline" onClick={() => setLocation("/admin")} className="flex-1" data-testid="button-cancel">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending} className="flex-1" data-testid="button-save">
                    {updateMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </main>
    </div>
  );
}
