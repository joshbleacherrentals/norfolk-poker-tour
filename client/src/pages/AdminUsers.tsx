import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, UserPlus, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAdminSchema, type CreateAdmin } from "@shared/schema";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type AdminUser = {
  id: string;
  name: string;
  email: string;
};

export default function AdminUsers() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/auth/session"],
    retry: false,
  });

  const { data: adminsData, isLoading: adminsLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const admins = adminsData ?? [];

  const form = useForm<CreateAdmin>({
    resolver: zodResolver(createAdminSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const createAdminMutation = useMutation({
    mutationFn: async (data: CreateAdmin) => {
      const res = await apiRequest("POST", "/api/admin/users", data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create admin user");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Admin Created",
        description: "New admin user has been successfully created.",
      });
      form.reset();
      setShowAddForm(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create admin user",
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

  const onSubmit = (data: CreateAdmin) => {
    createAdminMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/admin")}
                data-testid="button-back-to-dashboard"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h1 className="text-xl font-semibold">Admin Users</h1>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-admin-users-title">
                Manage Admin Users
              </h2>
              <p className="text-muted-foreground mt-1">
                Add and manage users who can access the admin panel
              </p>
            </div>
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              data-testid="button-toggle-add-admin"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {showAddForm ? "Cancel" : "Add Admin"}
            </Button>
          </div>

          {showAddForm && (
            <Card>
              <CardHeader>
                <CardTitle>Add New Admin User</CardTitle>
                <CardDescription>
                  Create a new admin account with access to the admin panel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="John Doe"
                              data-testid="input-admin-name"
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
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="john@example.com"
                              data-testid="input-admin-email-new"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="••••••••"
                              data-testid="input-admin-password-new"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-3">
                      <Button
                        type="submit"
                        disabled={createAdminMutation.isPending}
                        data-testid="button-create-admin"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        {createAdminMutation.isPending ? "Creating..." : "Create Admin"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          form.reset();
                          setShowAddForm(false);
                        }}
                        data-testid="button-cancel-admin"
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Current Admin Users</CardTitle>
              <CardDescription>
                {admins.length} admin user{admins.length !== 1 ? "s" : ""} with access to the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {adminsLoading ? (
                <p className="text-muted-foreground text-center py-8">Loading admin users...</p>
              ) : admins.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No admin users found</p>
              ) : (
                <div className="space-y-3">
                  {admins.map((admin) => (
                    <div
                      key={admin.id}
                      className="flex items-center justify-between p-4 border rounded-md"
                      data-testid={`admin-item-${admin.id}`}
                    >
                      <div className="space-y-1">
                        <p className="font-medium" data-testid={`admin-name-${admin.id}`}>
                          {admin.name}
                        </p>
                        <p className="text-sm text-muted-foreground" data-testid={`admin-email-${admin.id}`}>
                          {admin.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
