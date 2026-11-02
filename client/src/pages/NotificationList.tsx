import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Download, Pencil, Trash2, Save, X, Mail, Users } from "lucide-react";
import { type NotificationSubscriber } from "@shared/schema";
import writeExcelFile from "write-excel-file/browser";

type CombinedEmail = {
  name: string;
  email: string;
  source: string;
};

export default function NotificationList() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "" });
  const [emailTarget, setEmailTarget] = useState<"subscribers" | "all">("all");

  const { data: session, isLoading: sessionLoading } = useQuery({
    queryKey: ["/api/auth/session"],
    retry: false,
  });

  const { data: subscribersData, isLoading: subscribersLoading } = useQuery<NotificationSubscriber[]>({
    queryKey: ["/api/admin/notifications"],
  });

  const { data: allEmailsData } = useQuery<CombinedEmail[]>({
    queryKey: ["/api/admin/all-emails"],
  });

  const subscribers = subscribersData ?? [];
  const allEmails = allEmailsData ?? [];

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NotificationSubscriber> }) => {
      const res = await apiRequest("PUT", `/api/admin/notifications/${id}`, data);
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to update subscriber");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-emails"] });
      toast({
        title: "Subscriber Updated",
        description: "Subscriber has been successfully updated.",
      });
      setEditingId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update subscriber",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/admin/notifications/${id}`, {});
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete subscriber");
      }
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/all-emails"] });
      toast({
        title: "Subscriber Deleted",
        description: "Subscriber has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete subscriber",
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

  const handleExportToExcel = async () => {
    if (subscribers.length === 0) {
      toast({
        title: "No Data",
        description: "There are no subscribers to export.",
        variant: "destructive",
      });
      return;
    }

    const fileName = `notification-list-${new Date().toISOString().split('T')[0]}.xlsx`;
    try {
      await writeExcelFile(
        [
          ["Name", "Email", "Phone"],
          ...subscribers.map(sub => [sub.name, sub.email, sub.phone]),
        ],
        { sheet: "Notification List" },
      ).toFile(fileName);

      toast({
        title: "Export Successful",
        description: `Notification list exported to ${fileName}`,
      });
    } catch {
      toast({
        title: "Export Failed",
        description: "The notification list could not be exported. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendMassEmail = () => {
    const targetEmails = emailTarget === "all" ? allEmails : subscribers;

    if (targetEmails.length === 0) {
      toast({
        title: "No Recipients",
        description: "There are no contacts to email.",
        variant: "destructive",
      });
      return;
    }

    const emails = targetEmails.map(contact => contact.email).join(',');
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&bcc=${encodeURIComponent(emails)}&su=${encodeURIComponent('NPT Tournament Update')}`;
    window.open(gmailUrl, '_blank');
    
    toast({
      title: "Gmail Opened",
      description: `Composing email to ${targetEmails.length} contacts.`,
    });
  };

  const handleEdit = (subscriber: NotificationSubscriber) => {
    setEditingId(subscriber.id);
    setEditForm({
      name: subscriber.name,
      email: subscriber.email,
      phone: subscriber.phone,
    });
  };

  const handleSaveEdit = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: editForm });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: "", email: "", phone: "" });
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this subscriber?")) {
      deleteMutation.mutate(id);
    }
  };

  const registrationOnlyCount = allEmails.filter(e => e.source === "registration").length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/admin")}
              data-testid="button-back-to-dashboard"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-semibold">Notification List</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email All Contacts
              </CardTitle>
              <CardDescription>
                Send a mass email via Gmail to your entire contact database
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <Button
                    variant={emailTarget === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEmailTarget("all")}
                    data-testid="button-target-all"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    All Contacts ({allEmails.length})
                  </Button>
                  <Button
                    variant={emailTarget === "subscribers" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEmailTarget("subscribers")}
                    data-testid="button-target-subscribers"
                  >
                    Subscribers Only ({subscribers.length})
                  </Button>
                </div>
                <Button
                  onClick={handleSendMassEmail}
                  data-testid="button-send-mass-email"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Open Gmail to Send
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <Badge variant="secondary">
                  {subscribers.length} notification subscribers
                </Badge>
                <Badge variant="outline">
                  {registrationOnlyCount} from tournament registrations
                </Badge>
                <Badge variant="outline">
                  {allEmails.length} unique emails total
                </Badge>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-2xl font-bold" data-testid="text-notification-list-title">
                Notification Subscribers
              </h2>
              <p className="text-muted-foreground mt-1">
                Manage notification list and export to Excel
              </p>
            </div>
            <Button
              onClick={handleExportToExcel}
              variant="outline"
              data-testid="button-export-excel"
            >
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Subscribers ({subscribers.length})</CardTitle>
              <CardDescription>
                Players who signed up for tournament notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {subscribersLoading ? (
                <p className="text-muted-foreground text-center py-8">Loading subscribers...</p>
              ) : subscribers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No subscribers yet</p>
              ) : (
                <div className="space-y-3">
                  {subscribers.map((subscriber) => (
                    <div
                      key={subscriber.id}
                      className="flex items-center gap-4 p-4 border rounded-md"
                      data-testid={`subscriber-item-${subscriber.id}`}
                    >
                      {editingId === subscriber.id ? (
                        <>
                          <div className="flex-1 grid grid-cols-3 gap-3">
                            <Input
                              value={editForm.name}
                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                              placeholder="Name"
                              data-testid={`input-edit-name-${subscriber.id}`}
                            />
                            <Input
                              value={editForm.email}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              placeholder="Email"
                              type="email"
                              data-testid={`input-edit-email-${subscriber.id}`}
                            />
                            <Input
                              value={editForm.phone}
                              onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                              placeholder="Phone"
                              data-testid={`input-edit-phone-${subscriber.id}`}
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleSaveEdit}
                              disabled={updateMutation.isPending}
                              data-testid={`button-save-${subscriber.id}`}
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                              data-testid={`button-cancel-${subscriber.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 grid grid-cols-3 gap-4">
                            <div>
                              <p className="font-medium" data-testid={`subscriber-name-${subscriber.id}`}>
                                {subscriber.name}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground" data-testid={`subscriber-email-${subscriber.id}`}>
                                {subscriber.email}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground" data-testid={`subscriber-phone-${subscriber.id}`}>
                                {subscriber.phone}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(subscriber)}
                              data-testid={`button-edit-${subscriber.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDelete(subscriber.id)}
                              data-testid={`button-delete-${subscriber.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
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
