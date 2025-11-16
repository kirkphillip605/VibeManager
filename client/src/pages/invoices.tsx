import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarIcon,
  Plus,
  Eye,
  Send,
  Download,
  DollarSign,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Customer, Gig } from "@shared/schema";

// Invoice form schema
const invoiceFormSchema = z.object({
  customerId: z.string().min(1, "Customer is required"),
  gigId: z.string().optional(),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  amount: z.number().positive("Amount must be positive"),
  tax: z.number().min(0).optional(),
  issueDate: z.date(),
  dueDate: z.date(),
  items: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().positive(),
    rate: z.number().positive(),
    amount: z.number().positive(),
  })).optional(),
  notes: z.string().optional(),
});

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;

export default function Invoices() {
  const { toast } = useToast();
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([
    { description: "", quantity: 1, rate: 0, amount: 0 }
  ]);

  // Fetch invoices
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<any[]>({
    queryKey: ["/api/invoices"],
  });

  // Fetch customers
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Fetch gigs
  const { data: gigs = [] } = useQuery<Gig[]>({
    queryKey: ["/api/gigs"],
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (data: InvoiceFormData) => {
      const total = data.amount + (data.tax || 0);
      const res = await apiRequest("POST", "/api/invoices", {
        ...data,
        total,
        status: "draft",
        items: invoiceItems.filter(item => item.description),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Invoice created",
        description: "The invoice has been created successfully.",
      });
      setShowInvoiceForm(false);
      form.reset();
      setInvoiceItems([{ description: "", quantity: 1, rate: 0, amount: 0 }]);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating invoice",
        description: error.message || "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  // Update invoice status mutation
  const updateInvoiceStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PUT", `/api/invoices/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "Invoice updated",
        description: "The invoice status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating invoice",
        description: error.message || "Failed to update invoice",
        variant: "destructive",
      });
    },
  });

  const form = useForm<InvoiceFormData>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: `INV-${Date.now()}`,
      amount: 0,
      tax: 0,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  const onSubmit = (data: InvoiceFormData) => {
    createInvoiceMutation.mutate(data);
  };

  const addInvoiceItem = () => {
    setInvoiceItems([...invoiceItems, { description: "", quantity: 1, rate: 0, amount: 0 }]);
  };

  const updateInvoiceItem = (index: number, field: string, value: any) => {
    const updatedItems = [...invoiceItems];
    updatedItems[index][field] = value;
    
    // Calculate amount if quantity or rate changes
    if (field === "quantity" || field === "rate") {
      updatedItems[index].amount = updatedItems[index].quantity * updatedItems[index].rate;
    }
    
    setInvoiceItems(updatedItems);
    
    // Update total amount
    const total = updatedItems.reduce((sum, item) => sum + item.amount, 0);
    form.setValue("amount", total);
  };

  const removeInvoiceItem = (index: number) => {
    const updatedItems = invoiceItems.filter((_, i) => i !== index);
    setInvoiceItems(updatedItems);
    
    // Update total amount
    const total = updatedItems.reduce((sum, item) => sum + item.amount, 0);
    form.setValue("amount", total);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: { [key: string]: { variant: "default" | "secondary" | "destructive" | "outline"; label: string } } = {
      draft: { variant: "secondary", label: "Draft" },
      sent: { variant: "outline", label: "Sent" },
      paid: { variant: "default", label: "Paid" },
      overdue: { variant: "destructive", label: "Overdue" },
      cancelled: { variant: "secondary", label: "Cancelled" },
    };
    
    const config = statusConfig[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant} data-testid={`badge-status-${status}`}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Invoices</h1>
          <p className="text-muted-foreground">Manage and track customer invoices</p>
        </div>
        <Button 
          onClick={() => setShowInvoiceForm(true)}
          data-testid="button-new-invoice"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Invoice
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-outstanding">
              ${invoices
                .filter(i => i.status === "sent" || i.status === "overdue")
                .reduce((sum, i) => sum + parseFloat(i.total || i.amount || 0), 0)
                .toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-paid">
              ${invoices
                .filter(i => i.status === "paid")
                .reduce((sum, i) => sum + parseFloat(i.total || i.amount || 0), 0)
                .toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-overdue-count">
              {invoices.filter(i => i.status === "overdue").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="value-draft-count">
              {invoices.filter(i => i.status === "draft").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Invoices</CardTitle>
          <CardDescription>View and manage all invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoicesLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    Loading invoices...
                  </TableCell>
                </TableRow>
              ) : invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                invoices.map((invoice) => {
                  const customer = customers.find(c => c.id === invoice.customerId);
                  return (
                    <TableRow key={invoice.id} data-testid={`row-invoice-${invoice.id}`}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber || invoice.externalInvoiceId || "N/A"}
                      </TableCell>
                      <TableCell>
                        {customer ? (customer.businessName || `${customer.firstName} ${customer.lastName}`) : "Unknown"}
                      </TableCell>
                      <TableCell>
                        {invoice.issueDate ? format(new Date(invoice.issueDate), "MMM d, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell>
                        {invoice.dueDate ? format(new Date(invoice.dueDate), "MMM d, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell>
                        ${parseFloat(invoice.total || invoice.amount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.status || "draft")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedInvoice(invoice)}
                            data-testid={`button-view-${invoice.id}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {invoice.status === "draft" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateInvoiceStatusMutation.mutate({ id: invoice.id, status: "sent" })}
                              data-testid={`button-send-${invoice.id}`}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.status === "sent" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateInvoiceStatusMutation.mutate({ id: invoice.id, status: "paid" })}
                              data-testid={`button-paid-${invoice.id}`}
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invoice Form Dialog */}
      <Dialog open={showInvoiceForm} onOpenChange={setShowInvoiceForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Generate an invoice for a customer
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Number</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-invoice-number" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-customer">
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.businessName || `${customer.firstName} ${customer.lastName}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="button-issue-date"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                              data-testid="button-due-date"
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="gigId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Related Gig (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-gig">
                          <SelectValue placeholder="Select gig (optional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {gigs.map((gig) => (
                          <SelectItem key={gig.id} value={gig.id}>
                            {gig.name} - {format(new Date(gig.startTime), "MMM d, yyyy")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Invoice Items */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Invoice Items</label>
                {invoiceItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateInvoiceItem(index, "description", e.target.value)}
                      className="flex-1"
                      data-testid={`input-item-description-${index}`}
                    />
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateInvoiceItem(index, "quantity", parseFloat(e.target.value) || 0)}
                      className="w-20"
                      data-testid={`input-item-quantity-${index}`}
                    />
                    <Input
                      type="number"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={(e) => updateInvoiceItem(index, "rate", parseFloat(e.target.value) || 0)}
                      className="w-24"
                      data-testid={`input-item-rate-${index}`}
                    />
                    <div className="w-24 text-right">
                      ${item.amount.toFixed(2)}
                    </div>
                    {invoiceItems.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeInvoiceItem(index)}
                        data-testid={`button-remove-item-${index}`}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addInvoiceItem}
                  data-testid="button-add-item"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tax"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tax Amount</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-tax"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium">Total</label>
                  <div className="text-2xl font-bold">
                    ${((form.watch("amount") || 0) + (form.watch("tax") || 0)).toFixed(2)}
                  </div>
                </div>
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional notes..."
                        {...field}
                        data-testid="input-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInvoiceForm(false)}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createInvoiceMutation.isPending} data-testid="button-submit">
                  {createInvoiceMutation.isPending ? "Creating..." : "Create Invoice"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}