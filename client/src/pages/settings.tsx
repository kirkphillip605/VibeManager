import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus, Settings as SettingsIcon, Edit, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  VenueType,
  PersonnelType,
  GigType,
  PaymentMethod,
  DocumentType,
  ContactRole,
} from "@shared/schema";

const lookupFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

type LookupFormData = z.infer<typeof lookupFormSchema>;

type LookupType = "venue-types" | "personnel-types" | "gig-types" | "payment-methods" | "document-types" | "contact-roles";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<LookupType>("venue-types");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const { toast } = useToast();

  // Fetch all lookup data
  const { data: venueTypes = [], isLoading: loadingVenueTypes } = useQuery<VenueType[]>({
    queryKey: ["/api/venue-types"],
  });

  const { data: personnelTypes = [], isLoading: loadingPersonnelTypes } = useQuery<PersonnelType[]>({
    queryKey: ["/api/personnel-types"],
  });

  const { data: gigTypes = [], isLoading: loadingGigTypes } = useQuery<GigType[]>({
    queryKey: ["/api/gig-types"],
  });

  const { data: paymentMethods = [], isLoading: loadingPaymentMethods } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
  });

  const { data: documentTypes = [], isLoading: loadingDocumentTypes } = useQuery<DocumentType[]>({
    queryKey: ["/api/document-types"],
  });

  const { data: contactRoles = [], isLoading: loadingContactRoles } = useQuery<ContactRole[]>({
    queryKey: ["/api/contact-roles"],
  });

  const form = useForm<LookupFormData>({
    resolver: zodResolver(lookupFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ type, data, id }: { type: LookupType; data: LookupFormData; id?: string }) => {
      const url = id ? `/api/${type}/${id}` : `/api/${type}`;
      const method = id ? "PUT" : "POST";
      const res = await apiRequest(method, url, data);
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/${variables.type}`] });
      toast({
        title: "Success",
        description: editingItem ? "Item updated successfully" : "Item created successfully",
      });
      setIsCreateOpen(false);
      setEditingItem(null);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save item",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: LookupType; id: string }) => {
      const res = await apiRequest("DELETE", `/api/${type}/${id}`);
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/${variables.type}`] });
      toast({
        title: "Success",
        description: "Item deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete item",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (item: any) => {
    setEditingItem(item);
    form.reset({ name: item.name });
    setIsCreateOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate({ type: activeTab, id });
  };

  const handleSubmit = (data: LookupFormData) => {
    saveMutation.mutate({
      type: activeTab,
      data,
      id: editingItem?.id,
    });
  };

  const renderTable = (items: any[], isLoading: boolean) => {
    if (isLoading) {
      return (
        <div className="space-y-2 p-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-12">
          <SettingsIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No items found</p>
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(item)}
                    data-testid={`button-edit-${item.id}`}
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(item.id)}
                    disabled={deleteMutation.isPending}
                    data-testid={`button-delete-${item.id}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const getTabData = () => {
    switch (activeTab) {
      case "venue-types":
        return { items: venueTypes, isLoading: loadingVenueTypes, title: "Venue Types" };
      case "personnel-types":
        return { items: personnelTypes, isLoading: loadingPersonnelTypes, title: "Personnel Types" };
      case "gig-types":
        return { items: gigTypes, isLoading: loadingGigTypes, title: "Gig Types" };
      case "payment-methods":
        return { items: paymentMethods, isLoading: loadingPaymentMethods, title: "Payment Methods" };
      case "document-types":
        return { items: documentTypes, isLoading: loadingDocumentTypes, title: "Document Types" };
      case "contact-roles":
        return { items: contactRoles, isLoading: loadingContactRoles, title: "Contact Roles" };
      default:
        return { items: [], isLoading: false, title: "" };
    }
  };

  const { items, isLoading, title } = getTabData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage system configurations and lookup tables
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Lookup Tables</CardTitle>
            <CardDescription>
              Configure dropdown options used throughout the application
            </CardDescription>
          </div>
          <Button
            onClick={() => {
              setEditingItem(null);
              form.reset();
              setIsCreateOpen(true);
            }}
            data-testid="button-create"
          >
            <Plus className="h-4 w-4" />
            Add New
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as LookupType)}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="venue-types" data-testid="tab-venue-types">
                Venues
              </TabsTrigger>
              <TabsTrigger value="personnel-types" data-testid="tab-personnel-types">
                Personnel
              </TabsTrigger>
              <TabsTrigger value="gig-types" data-testid="tab-gig-types">
                Gigs
              </TabsTrigger>
              <TabsTrigger value="payment-methods" data-testid="tab-payment-methods">
                Payment
              </TabsTrigger>
              <TabsTrigger value="document-types" data-testid="tab-document-types">
                Documents
              </TabsTrigger>
              <TabsTrigger value="contact-roles" data-testid="tab-contact-roles">
                Contacts
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {renderTable(items, isLoading)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setEditingItem(null);
            form.reset();
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit" : "Add"} {title.slice(0, -1)}
            </DialogTitle>
            <DialogDescription>
              {editingItem
                ? `Update the ${title.toLowerCase().slice(0, -1)} name`
                : `Create a new ${title.toLowerCase().slice(0, -1)} option`}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter name"
                        data-testid="input-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  data-testid="button-submit"
                >
                  {saveMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {editingItem ? "Updating..." : "Creating..."}
                    </>
                  ) : editingItem ? (
                    "Update"
                  ) : (
                    "Create"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}