import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import InputMask from "react-input-mask";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Customer } from "@shared/schema";

// Phone number validation regex
const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
// Email validation regex
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const customerFormSchema = z
  .object({
    type: z.enum(["business", "person"]),
    businessName: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    primaryEmail: z
      .string()
      .optional()
      .refine((val) => !val || val === "" || emailRegex.test(val), {
        message: "Invalid email address",
      }),
    primaryPhone: z
      .string()
      .min(1, "Primary phone is required")
      .regex(phoneRegex, "Phone must be in format (XXX) XXX-XXXX"),
  })
  .superRefine((data, ctx) => {
    if (data.type === "business" && !data.businessName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Business name is required for business customers",
        path: ["businessName"],
      });
    }
    if (data.type === "person" && !data.firstName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "First name is required for person customers",
        path: ["firstName"],
      });
    }
    if (data.type === "person" && !data.lastName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Last name is required for person customers",
        path: ["lastName"],
      });
    }
  });

type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
}: CustomerFormDialogProps) {
  const { toast } = useToast();

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      type: "business",
      businessName: "",
      firstName: "",
      lastName: "",
      primaryEmail: "",
      primaryPhone: "",
    },
  });

  const customerType = form.watch("type");

  // Reset form when customer changes
  useEffect(() => {
    if (customer) {
      form.reset({
        type: customer.type,
        businessName: customer.businessName || "",
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        primaryEmail: customer.primaryEmail || "",
        primaryPhone: customer.primaryPhone || "",
      });
    } else {
      form.reset();
    }
  }, [customer, form]);

  const saveCustomerMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const url = customer ? `/api/customers/${customer.id}` : "/api/customers";
      const method = customer ? "PUT" : "POST";
      const res = await apiRequest(method, url, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({
        title: "Success",
        description: customer
          ? "Customer updated successfully"
          : "Customer added successfully",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save customer",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CustomerFormData) => {
    saveCustomerMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit Customer" : "Add Customer"}</DialogTitle>
          <DialogDescription>
            {customer
              ? "Update the customer information below"
              : "Fill in the details to add a new customer"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Customer Type */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!!customer}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-customer-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="person">Person</SelectItem>
                      </SelectContent>
                    </Select>
                    {customer && (
                      <FormDescription>
                        Customer type cannot be changed after creation
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Business Name (for business type) */}
              {customerType === "business" && (
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="ABC Entertainment LLC"
                          data-testid="input-business-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Person Name (for person type) */}
              {customerType === "person" && (
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="John"
                            data-testid="input-first-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Doe"
                            data-testid="input-last-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Contact Information */}
              <FormField
                control={form.control}
                name="primaryEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="contact@example.com"
                        data-testid="input-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="primaryPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Phone *</FormLabel>
                    <FormControl>
                      <InputMask
                        mask="(999) 999-9999"
                        value={field.value}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                      >
                        {(inputProps: any) => (
                          <Input
                            {...inputProps}
                            placeholder="(555) 123-4567"
                            data-testid="input-phone"
                          />
                        )}
                      </InputMask>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={saveCustomerMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saveCustomerMutation.isPending}
                  data-testid="button-submit"
                >
                  {saveCustomerMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {customer ? "Updating..." : "Adding..."}
                    </>
                  ) : customer ? (
                    "Update Customer"
                  ) : (
                    "Add Customer"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}