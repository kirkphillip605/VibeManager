import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Music,
  Users,
  DollarSign,
  FileText,
  ChevronLeft,
  Edit,
  Plus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Gig,
  Customer,
  Venue,
  Personnel,
  PersonnelPayout,
  GigInvoice,
  PaymentMethod,
} from "@shared/schema";

const payoutFormSchema = z.object({
  personnelId: z.string().min(1, "Personnel is required"),
  amount: z.string().min(1, "Amount is required"),
  datePaid: z.string().min(1, "Date is required"),
  paymentMethodId: z.string().min(1, "Payment method is required"),
  notes: z.string().optional(),
});

const invoiceFormSchema = z.object({
  externalInvoiceId: z.string().min(1, "Invoice ID is required"),
  externalInvoiceUrl: z.string().optional(),
  amount: z.string().min(1, "Amount is required"),
  status: z.enum(["sent", "paid", "void"]),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
});

type PayoutFormData = z.infer<typeof payoutFormSchema>;
type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

export default function GigDetailPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const gigId = params.id;
  const { toast } = useToast();

  const [isPayoutOpen, setIsPayoutOpen] = useState(false);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // Fetch gig details
  const { data: gig, isLoading: loadingGig } = useQuery<Gig>({
    queryKey: [`/api/gigs/${gigId}`],
    enabled: !!gigId,
  });

  // Fetch related data
  const { data: customer } = useQuery<Customer>({
    queryKey: [`/api/customers/${gig?.customerId}`],
    enabled: !!gig?.customerId,
  });

  const { data: venue } = useQuery<Venue>({
    queryKey: [`/api/venues/${gig?.venueId}`],
    enabled: !!gig?.venueId,
  });

  // Fetch assigned personnel
  const { data: assignedPersonnel = [] } = useQuery<Personnel[]>({
    queryKey: [`/api/gigs/${gigId}/personnel`],
    enabled: !!gigId,
  });

  // Fetch payouts
  const { data: payouts = [] } = useQuery<PersonnelPayout[]>({
    queryKey: [`/api/gigs/${gigId}/payouts`],
    enabled: !!gigId,
  });

  // Fetch invoices
  const { data: invoices = [] } = useQuery<GigInvoice[]>({
    queryKey: [`/api/gigs/${gigId}/invoices`],
    enabled: !!gigId,
  });

  // Fetch payment methods
  const { data: paymentMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
  });

  const payoutForm = useForm<PayoutFormData>({
    resolver: zodResolver(payoutFormSchema),
    defaultValues: {
      personnelId: "",
      amount: "",
      datePaid: format(new Date(), "yyyy-MM-dd"),
      paymentMethodId: "",
      notes: "",
    },
  });

  const invoiceForm = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      externalInvoiceId: "",
      externalInvoiceUrl: "",
      amount: "",
      status: "sent",
      issueDate: format(new Date(), "yyyy-MM-dd"),
      dueDate: "",
    },
  });

  const addPayoutMutation = useMutation({
    mutationFn: async (data: PayoutFormData) => {
      const res = await apiRequest("POST", `/api/gigs/${gigId}/payouts`, {
        ...data,
        amount: parseFloat(data.amount),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/gigs/${gigId}/payouts`] });
      toast({ title: "Success", description: "Payout added successfully" });
      setIsPayoutOpen(false);
      payoutForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add payout",
        variant: "destructive",
      });
    },
  });

  const addInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const res = await apiRequest("POST", `/api/gigs/${gigId}/invoices`, {
        ...data,
        amount: parseFloat(data.amount),
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/gigs/${gigId}/invoices`] });
      toast({ title: "Success", description: "Invoice added successfully" });
      setIsInvoiceOpen(false);
      invoiceForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add invoice",
        variant: "destructive",
      });
    },
  });

  if (loadingGig) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-lg text-muted-foreground">Gig not found</p>
        <Button onClick={() => setLocation("/gigs")}>
          <ChevronLeft className="h-4 w-4" />
          Back to Gigs
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            Confirmed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
            Pending
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(num);
  };

  const totalPayouts = payouts.reduce((sum, p) => sum + parseFloat(p.amount), 0);
  const totalInvoices = invoices.reduce((sum, i) => sum + parseFloat(i.amount || "0"), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/gigs")}
            data-testid="button-back"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Music className="h-8 w-8 text-muted-foreground" />
              {gig.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(gig.status || "pending")}
              <span className="text-sm text-muted-foreground">
                Created {format(new Date(gig.createdAt), "MMM d, yyyy")}
              </span>
            </div>
          </div>
        </div>
        <Button onClick={() => setLocation(`/gigs?edit=${gigId}`)}>
          <Edit className="h-4 w-4" />
          Edit Gig
        </Button>
      </div>

      {/* Gig Information */}
      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Date & Time</p>
                <p className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(gig.startTime), "EEEE, MMMM d, yyyy")}
                </p>
                <p className="flex items-center gap-2 mt-1">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  {format(new Date(gig.startTime), "h:mm a")} -{" "}
                  {format(new Date(gig.endTime), "h:mm a")}
                </p>
              </div>
              {customer && (
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <a
                    href={`/customers/${customer.id}`}
                    className="flex items-center gap-2 mt-1 hover:underline text-primary"
                  >
                    {customer.type === "business"
                      ? customer.businessName
                      : `${customer.firstName} ${customer.lastName}`}
                  </a>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {venue && (
                <div>
                  <p className="text-sm text-muted-foreground">Venue</p>
                  <a
                    href={`/venues/${venue.id}`}
                    className="flex items-start gap-2 mt-1 hover:underline text-primary"
                  >
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <div>
                      <p>{venue.name}</p>
                      {venue.address && (
                        <p className="text-sm text-muted-foreground">
                          {venue.address}, {venue.city}, {venue.state} {venue.zip}
                        </p>
                      )}
                    </div>
                  </a>
                </div>
              )}
              {gig.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="mt-1">{gig.notes}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assigned Personnel */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Personnel</CardTitle>
          <CardDescription>DJs and staff assigned to this gig</CardDescription>
        </CardHeader>
        <CardContent>
          {assignedPersonnel.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No personnel assigned yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedPersonnel.map((person) => (
                <div
                  key={person.id}
                  className="flex items-center gap-3 p-3 rounded-lg border"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {person.firstName} {person.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{person.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financials */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Payouts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Payouts</CardTitle>
              <CardDescription>Payments to personnel</CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsPayoutOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Payout
            </Button>
          </CardHeader>
          <CardContent>
            {payouts.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No payouts recorded</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Personnel</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payouts.map((payout) => {
                      const person = assignedPersonnel.find(
                        (p) => p.id === payout.personnelId
                      );
                      return (
                        <TableRow key={payout.id}>
                          <TableCell>
                            {person
                              ? `${person.firstName} ${person.lastName}`
                              : "Unknown"}
                          </TableCell>
                          <TableCell>
                            {format(new Date(payout.datePaid), "MMM d")}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(payout.amount)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="font-medium">Total Payouts</span>
                    <span className="font-semibold">{formatCurrency(totalPayouts)}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Invoices</CardTitle>
              <CardDescription>Square invoices for this gig</CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsInvoiceOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Invoice
            </Button>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No invoices recorded</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">
                          {invoice.externalInvoiceId}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={invoice.status === "paid" ? "default" : "outline"}
                          >
                            {invoice.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(invoice.amount || 0)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="font-medium">Total Invoiced</span>
                    <span className="font-semibold">{formatCurrency(totalInvoices)}</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Payout Dialog */}
      <Dialog open={isPayoutOpen} onOpenChange={setIsPayoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payout</DialogTitle>
            <DialogDescription>Record a payment to personnel for this gig</DialogDescription>
          </DialogHeader>
          <Form {...payoutForm}>
            <form
              onSubmit={payoutForm.handleSubmit((data) =>
                addPayoutMutation.mutate(data)
              )}
              className="space-y-4"
            >
              <FormField
                control={payoutForm.control}
                name="personnelId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personnel</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select personnel" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {assignedPersonnel.map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.firstName} {person.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={payoutForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" placeholder="100.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={payoutForm.control}
                name="datePaid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Paid</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={payoutForm.control}
                name="paymentMethodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentMethods.map((method) => (
                          <SelectItem key={method.id} value={method.id}>
                            {method.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsPayoutOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addPayoutMutation.isPending}>
                  {addPayoutMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Payout"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Invoice Dialog */}
      <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Invoice</DialogTitle>
            <DialogDescription>Record a Square invoice for this gig</DialogDescription>
          </DialogHeader>
          <Form {...invoiceForm}>
            <form
              onSubmit={invoiceForm.handleSubmit((data) =>
                addInvoiceMutation.mutate(data)
              )}
              className="space-y-4"
            >
              <FormField
                control={invoiceForm.control}
                name="externalInvoiceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Square Invoice ID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="INV-12345" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={invoiceForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step="0.01" placeholder="500.00" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={invoiceForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sent">Sent</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="void">Void</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsInvoiceOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addInvoiceMutation.isPending}>
                  {addInvoiceMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Invoice"
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