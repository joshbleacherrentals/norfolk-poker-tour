import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertRegistrationSchema } from "@shared/schema";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

type RegistrationFormData = z.infer<typeof insertRegistrationSchema>;

interface RegistrationFormProps {
  tournamentId: string;
  tournamentName: string;
  seatsAvailable: number;
  onSubmit: (data: RegistrationFormData) => void;
  onCancel: () => void;
}

export default function RegistrationForm({
  tournamentId,
  tournamentName,
  seatsAvailable,
  onSubmit,
  onCancel,
}: RegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isFull = seatsAvailable <= 0;

  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(insertRegistrationSchema),
    defaultValues: {
      tournamentId,
      name: "",
      email: "",
      phone: "",
      registrationType: isFull ? "waitlist" : "confirmed",
    },
  });

  const handleSubmit = async (data: RegistrationFormData) => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    onSubmit(data);
    setIsSubmitting(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register for Tournament</CardTitle>
        <CardDescription>
          Complete the form below to register for {tournamentName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="John Doe"
                      {...field}
                      data-testid="input-name"
                    />
                  </FormControl>
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
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      {...field}
                      data-testid="input-email"
                    />
                  </FormControl>
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
                  <FormControl>
                    <Input
                      type="tel"
                      placeholder="+1 (555) 123-4567"
                      {...field}
                      data-testid="input-phone"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isFull && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  This tournament is currently full. You can join the waitlist or mark yourself as "maybe attending".
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="registrationType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Registration Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      {!isFull && (
                        <FormItem className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="confirmed" data-testid="radio-confirmed" />
                          </FormControl>
                          <FormLabel className="font-normal cursor-pointer">
                            Confirmed - I will definitely attend
                          </FormLabel>
                        </FormItem>
                      )}
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="waitlist" data-testid="radio-waitlist" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Waitlist - Add me to the waiting list
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="maybe" data-testid="radio-maybe" />
                        </FormControl>
                        <FormLabel className="font-normal cursor-pointer">
                          Maybe Attending - I'm interested but not sure yet
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting}
                data-testid="button-submit"
              >
                {isSubmitting ? "Registering..." : "Complete Registration"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
