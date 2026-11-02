import { useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm, useFieldArray } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Plus, Trash2 } from "lucide-react";
import { rulesSchema, type RulesData } from "@shared/schema";

export default function RulesEditor() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: session } = useQuery({
    queryKey: ["/api/auth/session"],
    retry: false,
  });

  const { data: rulesData } = useQuery({
    queryKey: ["/api/rules"],
  });

  const rules = rulesData as RulesData | undefined;

  const form = useForm<RulesData>({
    resolver: zodResolver(rulesSchema),
    defaultValues: {
      sections: [
        {
          title: "",
          icon: "Spade",
          rules: [{ title: "", description: "" }],
        },
      ],
    },
  });

  const { fields: sectionFields, append: appendSection, remove: removeSection } = useFieldArray({
    control: form.control,
    name: "sections",
  });

  useEffect(() => {
    if (rules) {
      form.reset(rules);
    }
  }, [rules, form]);

  useEffect(() => {
    if (!session) {
      setLocation("/admin/login");
    }
  }, [session, setLocation]);

  const updateMutation = useMutation({
    mutationFn: async (data: RulesData) => {
      const res = await apiRequest("PUT", "/api/admin/rules", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update rules");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rules"] });
      toast({
        title: "Rules Updated",
        description: "Tournament rules have been successfully updated.",
      });
      setLocation("/admin");
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update rules",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RulesData) => {
    updateMutation.mutate(data);
  };

  if (!session) {
    return null;
  }

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

        <Card className="max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle>Edit Tournament Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {sectionFields.map((sectionField, sectionIndex) => (
                  <Card key={sectionField.id}>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                      <CardTitle className="text-lg">Section {sectionIndex + 1}</CardTitle>
                      {sectionFields.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSection(sectionIndex)}
                          data-testid={`button-remove-section-${sectionIndex}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <FormField
                        control={form.control}
                        name={`sections.${sectionIndex}.title`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Section Title</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="General Rules"
                                data-testid={`input-section-title-${sectionIndex}`}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`sections.${sectionIndex}.icon`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Icon (Spade, Heart, Diamond, Club)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Spade"
                                data-testid={`input-section-icon-${sectionIndex}`}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <RulesFieldArray
                        sectionIndex={sectionIndex}
                        form={form}
                      />
                    </CardContent>
                  </Card>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    appendSection({
                      title: "",
                      icon: "Spade",
                      rules: [{ title: "", description: "" }],
                    })
                  }
                  data-testid="button-add-section"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Section
                </Button>

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
                    disabled={updateMutation.isPending}
                    className="flex-1"
                    data-testid="button-save"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {updateMutation.isPending ? "Saving..." : "Save Rules"}
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

function RulesFieldArray({ sectionIndex, form }: { sectionIndex: number; form: any }) {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `sections.${sectionIndex}.rules`,
  });

  return (
    <div className="space-y-4">
      <h4 className="font-medium">Rules</h4>
      {fields.map((field, ruleIndex) => (
        <div key={field.id} className="p-4 border rounded-md space-y-3">
          <div className="flex items-center justify-between">
            <h5 className="text-sm font-medium">Rule {ruleIndex + 1}</h5>
            {fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(ruleIndex)}
                data-testid={`button-remove-rule-${sectionIndex}-${ruleIndex}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>

          <FormField
            control={form.control}
            name={`sections.${sectionIndex}.rules.${ruleIndex}.title`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rule Title</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Player Registration"
                    data-testid={`input-rule-title-${sectionIndex}-${ruleIndex}`}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={`sections.${sectionIndex}.rules.${ruleIndex}.description`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="All players must register..."
                    data-testid={`input-rule-description-${sectionIndex}-${ruleIndex}`}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      ))}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => append({ title: "", description: "" })}
        data-testid={`button-add-rule-${sectionIndex}`}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Rule
      </Button>
    </div>
  );
}
