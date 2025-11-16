import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import InputMask from "react-input-mask";
import { Loader2, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StateSelector } from "@/components/state-selector";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Personnel, PersonnelType } from "@shared/schema";

// Phone number validation regex
const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
// Email validation regex
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
// SSN validation regex
const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;

const personnelFormSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    middleName: z.string().optional(),
    lastName: z.string().min(1, "Last name is required"),
    email: z
      .string()
      .min(1, "Email is required")
      .regex(emailRegex, "Invalid email address"),
    phone: z
      .string()
      .min(1, "Phone is required")
      .regex(phoneRegex, "Phone must be in format (XXX) XXX-XXXX"),
    ssn: z
      .string()
      .optional()
      .refine((val) => !val || val === "" || ssnRegex.test(val), {
        message: "SSN must be in format XXX-XX-XXXX",
      }),
    ssnConfirm: z.string().optional(),
    dob: z.string().optional(),
    address1: z.string().optional(),
    address2: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z
      .string()
      .optional()
      .refine((val) => !val || val === "" || /^\d{5}(-\d{4})?$/.test(val), {
        message: "Invalid ZIP code format",
      }),
    personnelTypeId: z.string().optional(),
    isActive: z.boolean().default(true),
    createUserAccount: z.boolean().default(true),
  })
  .refine(
    (data) => {
      // If SSN is provided, confirmation must match
      if (data.ssn && data.ssn !== data.ssnConfirm) {
        return false;
      }
      return true;
    },
    {
      message: "SSN confirmation does not match",
      path: ["ssnConfirm"],
    }
  );

type PersonnelFormData = z.infer<typeof personnelFormSchema>;

interface PersonnelFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personnel?: Personnel | null;
}

export function PersonnelFormDialog({
  open,
  onOpenChange,
  personnel,
}: PersonnelFormDialogProps) {
  const { toast } = useToast();
  const [showSSN, setShowSSN] = useState(false);

  // Fetch personnel types
  const { data: personnelTypes = [] } = useQuery<PersonnelType[]>({
    queryKey: ["/api/personnel-types"],
    enabled: open,
  });

  const form = useForm<PersonnelFormData>({
    resolver: zodResolver(personnelFormSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      phone: "",
      ssn: "",
      ssnConfirm: "",
      dob: "",
      address1: "",
      address2: "",
      city: "",
      state: "",
      zip: "",
      personnelTypeId: "",
      isActive: true,
      createUserAccount: true,
    },
  });

  // Reset form when personnel changes
  useEffect(() => {
    if (personnel) {
      form.reset({
        firstName: personnel.firstName,
        middleName: personnel.middleName || "",
        lastName: personnel.lastName,
        email: personnel.email,
        phone: personnel.phone || "",
        ssn: personnel.ssn || "",
        ssnConfirm: personnel.ssn || "",
        dob: personnel.dob || "",
        address1: personnel.address1 || "",
        address2: personnel.address2 || "",
        city: personnel.city || "",
        state: personnel.state || "",
        zip: personnel.zip || "",
        personnelTypeId: personnel.personnelTypeId || "",
        isActive: personnel.isActive,
        createUserAccount: false, // Don't create user for existing personnel
      });
    } else {
      form.reset();
    }
  }, [personnel, form]);

  const savePersonnelMutation = useMutation({
    mutationFn: async (data: PersonnelFormData) => {
      const { ssnConfirm, createUserAccount, ...personnelData } = data;
      const url = personnel
        ? `/api/personnel/${personnel.id}`
        : "/api/personnel";
      const method = personnel ? "PUT" : "POST";
      const body = personnel
        ? personnelData
        : { ...personnelData, createUserAccount };
      const res = await apiRequest(method, url, body);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/personnel"] });
      toast({
        title: "Success",
        description: personnel
          ? "Personnel updated successfully"
          : "Personnel created successfully",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save personnel",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PersonnelFormData) => {
    savePersonnelMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {personnel ? "Edit Personnel" : "Add Personnel"}
          </DialogTitle>
          <DialogDescription>
            {personnel
              ? "Update the personnel information below"
              : "Fill in the details to add a new personnel member"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Fields */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Personal Information</h3>
                <div className="grid grid-cols-3 gap-4">
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
                    name="middleName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Middle Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Optional"
                            data-testid="input-middle-name"
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
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="email"
                            placeholder="john.doe@example.com"
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
                        <FormLabel>Phone *</FormLabel>
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
                </div>

                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          data-testid="input-dob"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* SSN Fields */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Tax Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="ssn"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Social Security Number</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <InputMask
                              mask="999-99-9999"
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                            >
                              {(inputProps: any) => (
                                <Input
                                  {...inputProps}
                                  type={showSSN ? "text" : "password"}
                                  placeholder="XXX-XX-XXXX"
                                  className="pr-10"
                                  data-testid="input-ssn"
                                />
                              )}
                            </InputMask>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full"
                              onClick={() => setShowSSN(!showSSN)}
                            >
                              {showSSN ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Optional. Will be encrypted and stored securely.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ssnConfirm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm SSN</FormLabel>
                        <FormControl>
                          <InputMask
                            mask="999-99-9999"
                            value={field.value}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                          >
                            {(inputProps: any) => (
                              <Input
                                {...inputProps}
                                type="password"
                                placeholder="XXX-XX-XXXX"
                                data-testid="input-ssn-confirm"
                              />
                            )}
                          </InputMask>
                        </FormControl>
                        <FormDescription>
                          Re-enter SSN to confirm accuracy
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Address</h3>
                <FormField
                  control={form.control}
                  name="address1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 1</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="123 Main Street"
                          data-testid="input-address1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address Line 2</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Apt, Suite, etc."
                          data-testid="input-address2"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="New York"
                            data-testid="input-city"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <StateSelector
                            value={field.value || ""}
                            onValueChange={field.onChange}
                            placeholder="Select state"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="zip"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP Code</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="10001"
                            maxLength={10}
                            pattern="[0-9-]*"
                            data-testid="input-zip"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Type and Status */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Classification</h3>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="personnelTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Personnel Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-personnel-type">
                              <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {personnelTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-active"
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Active Personnel
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    {!personnel && (
                      <FormField
                        control={form.control}
                        name="createUserAccount"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                data-testid="checkbox-create-user"
                              />
                            </FormControl>
                            <div>
                              <FormLabel className="font-normal">
                                Create User Account
                              </FormLabel>
                              <FormDescription>
                                Automatically create login credentials
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={savePersonnelMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={savePersonnelMutation.isPending}
                  data-testid="button-submit"
                >
                  {savePersonnelMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {personnel ? "Updating..." : "Creating..."}
                    </>
                  ) : personnel ? (
                    "Update Personnel"
                  ) : (
                    "Create Personnel"
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