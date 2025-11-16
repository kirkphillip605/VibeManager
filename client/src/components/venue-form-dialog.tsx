import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import InputMask from "react-input-mask";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Venue, VenueType } from "@shared/schema";

// Phone number validation regex
const phoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/;
// URL validation regex
const urlRegex = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;

const venueFormSchema = z.object({
  name: z.string().min(1, "Venue name is required"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip: z
    .string()
    .min(1, "ZIP code is required")
    .regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code format"),
  phone: z
    .string()
    .optional()
    .refine((val) => !val || val === "" || phoneRegex.test(val), {
      message: "Phone must be in format (XXX) XXX-XXXX",
    }),
  website: z
    .string()
    .optional()
    .refine((val) => !val || val === "" || urlRegex.test(val), {
      message: "Invalid website URL",
    }),
  occupancy: z.number().min(1).optional().or(z.literal("")),
  venueTypeId: z.string().min(1, "Venue type is required"),
  notes: z.string().optional(),
});

type VenueFormData = z.infer<typeof venueFormSchema>;

interface VenueFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venue?: Venue | null;
}

export function VenueFormDialog({
  open,
  onOpenChange,
  venue,
}: VenueFormDialogProps) {
  const { toast } = useToast();

  // Fetch venue types
  const { data: venueTypes = [] } = useQuery<VenueType[]>({
    queryKey: ["/api/venue-types"],
    enabled: open,
  });

  const form = useForm<VenueFormData>({
    resolver: zodResolver(venueFormSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      zip: "",
      phone: "",
      website: "",
      occupancy: "",
      venueTypeId: "",
      notes: "",
    },
  });

  // Reset form when venue changes
  useEffect(() => {
    if (venue) {
      form.reset({
        name: venue.name,
        address: venue.address || "",
        city: venue.city || "",
        state: venue.state || "",
        zip: venue.zip || "",
        phone: venue.phone || "",
        website: venue.website || "",
        occupancy: venue.occupancy || "",
        venueTypeId: venue.venueTypeId || "",
        notes: venue.notes || "",
      });
    } else {
      form.reset();
    }
  }, [venue, form]);

  const saveVenueMutation = useMutation({
    mutationFn: async (data: VenueFormData) => {
      const url = venue ? `/api/venues/${venue.id}` : "/api/venues";
      const method = venue ? "PUT" : "POST";
      const res = await apiRequest(method, url, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/venues"] });
      toast({
        title: "Success",
        description: venue
          ? "Venue updated successfully"
          : "Venue added successfully",
      });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save venue",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: VenueFormData) => {
    // Convert occupancy to number if provided
    const processedData = {
      ...data,
      occupancy: data.occupancy ? Number(data.occupancy) : undefined,
    };
    saveVenueMutation.mutate(processedData as VenueFormData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{venue ? "Edit Venue" : "Add Venue"}</DialogTitle>
          <DialogDescription>
            {venue
              ? "Update the venue information below"
              : "Fill in the details to add a new venue"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue Name *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Grand Ballroom"
                          data-testid="input-venue-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="venueTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-venue-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {venueTypes.map((type) => (
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
              </div>

              {/* Address */}
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Street Address *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="123 Event Street"
                        data-testid="input-address"
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
                      <FormLabel>City *</FormLabel>
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
                      <FormLabel>State *</FormLabel>
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
                      <FormLabel>ZIP Code *</FormLabel>
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

              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
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

                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          placeholder="https://example.com"
                          data-testid="input-website"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Additional Information */}
              <FormField
                control={form.control}
                name="occupancy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Occupancy Limit</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="1"
                        placeholder="500"
                        data-testid="input-occupancy"
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of people the venue can accommodate
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Add any additional notes about the venue"
                        className="min-h-24"
                        data-testid="textarea-notes"
                      />
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
                  disabled={saveVenueMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saveVenueMutation.isPending}
                  data-testid="button-submit"
                >
                  {saveVenueMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {venue ? "Updating..." : "Adding..."}
                    </>
                  ) : venue ? (
                    "Update Venue"
                  ) : (
                    "Add Venue"
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