import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Check, ChevronsUpDown, Loader2, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
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
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { DateTimePicker } from "@/components/ui/date-time-picker";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Gig, Customer, Venue, Personnel, GigType } from "@shared/schema";
import { CustomerFormDialog } from "@/components/customer-form-dialog";
import { VenueFormDialog } from "@/components/venue-form-dialog";

const gigFormSchema = z.object({
  name: z.string().min(1, "Gig name is required"),
  startTime: z.date({
    required_error: "Start time is required",
  }),
  endTime: z.date({
    required_error: "End time is required",
  }),
  customerId: z.string().min(1, "Customer is required"),
  venueId: z.string().min(1, "Venue is required"),
  gigTypeId: z.string().optional(),
  status: z.enum(["pending", "confirmed", "cancelled"]).default("pending"),
  notes: z.string().optional(),
  assignedPersonnel: z.array(z.string()).optional(),
  isRecurring: z.boolean().default(false),
  recurrenceFrequency: z.enum(["weekly", "monthly"]).optional(),
  recurrenceCount: z.number().min(1).max(52).optional(),
});

type GigFormData = z.infer<typeof gigFormSchema>;

interface GigFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gig?: Gig | null;
}

export function GigFormDialog({ open, onOpenChange, gig }: GigFormDialogProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [venueSearchOpen, setVenueSearchOpen] = useState(false);
  const [personnelSearchOpen, setPersonnelSearchOpen] = useState(false);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [venueDialogOpen, setVenueDialogOpen] = useState(false);

  // Fetch data for dropdowns
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    enabled: open,
  });

  const { data: venues = [] } = useQuery<Venue[]>({
    queryKey: ["/api/venues"],
    enabled: open,
  });

  const { data: personnel = [] } = useQuery<Personnel[]>({
    queryKey: ["/api/personnel"],
    enabled: open,
  });

  const { data: gigTypes = [] } = useQuery<GigType[]>({
    queryKey: ["/api/gig-types"],
    enabled: open,
  });

  const form = useForm<GigFormData>({
    resolver: zodResolver(gigFormSchema),
    defaultValues: {
      name: "",
      customerId: "",
      venueId: "",
      gigTypeId: "",
      status: "pending",
      notes: "",
      assignedPersonnel: [],
      isRecurring: false,
      recurrenceFrequency: "weekly",
      recurrenceCount: 4,
    },
  });

  // Reset form when gig changes
  useEffect(() => {
    if (gig) {
      form.reset({
        name: gig.name,
        startTime: new Date(gig.startTime),
        endTime: new Date(gig.endTime),
        customerId: gig.customerId,
        venueId: gig.venueId,
        gigTypeId: gig.gigTypeId || "",
        status: (gig.status as any) || "pending",
        notes: gig.notes || "",
        assignedPersonnel: [],
        isRecurring: false,
      });
    } else {
      form.reset();
    }
  }, [gig, form]);

  const createGigMutation = useMutation({
    mutationFn: async (data: GigFormData) => {
      // Convert Date objects to ISO strings for API
      const payload = {
        ...data,
        startTime: data.startTime.toISOString(),
        endTime: data.endTime.toISOString(),
      };
      const res = await apiRequest("POST", "/api/gigs", payload);
      return await res.json();
    },
    onSuccess: (data: Gig) => {
      queryClient.invalidateQueries({ queryKey: ["/api/gigs"] });
      toast({
        title: "Success",
        description: gig ? "Gig updated successfully" : "Gig created successfully",
      });
      onOpenChange(false);
      // Navigate to detail page for new gigs
      if (!gig && data?.id) {
        setLocation(`/gigs/${data.id}`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save gig",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: GigFormData) => {
    createGigMutation.mutate(data);
  };

  const isRecurring = form.watch("isRecurring");
  const selectedPersonnel = form.watch("assignedPersonnel") || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{gig ? "Edit Gig" : "Create New Gig"}</DialogTitle>
          <DialogDescription>
            {gig
              ? "Update the gig information below"
              : "Fill in the details to create a new gig"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Gig Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gig Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter gig name"
                        data-testid="input-gig-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Date and Time */}
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Start Date & Time</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          date={field.value}
                          setDate={field.onChange}
                          placeholder="Pick start date & time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>End Date & Time</FormLabel>
                      <FormControl>
                        <DateTimePicker
                          date={field.value}
                          setDate={field.onChange}
                          placeholder="Pick end date & time"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Customer and Venue */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Customer</FormLabel>
                      <div className="flex gap-2">
                        <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={customerSearchOpen}
                                className="justify-between flex-1"
                                data-testid="button-select-customer"
                              >
                                {field.value
                                  ? customers.find((c) => c.id === field.value)?.businessName ||
                                    customers.find((c) => c.id === field.value)?.firstName
                                  : "Select customer"}
                                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0">
                            <Command>
                              <CommandInput placeholder="Search customers..." />
                              <CommandEmpty>No customer found.</CommandEmpty>
                              <CommandGroup>
                                <ScrollArea className="h-[200px]">
                                  {customers.map((customer) => (
                                    <CommandItem
                                      key={customer.id}
                                      value={customer.businessName || customer.firstName || ""}
                                      onSelect={() => {
                                        field.onChange(customer.id);
                                        setCustomerSearchOpen(false);
                                      }}
                                    >
                                      {customer.businessName || 
                                       `${customer.firstName} ${customer.lastName}`}
                                      <Check
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          field.value === customer.id
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </ScrollArea>
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setCustomerDialogOpen(true)}
                          data-testid="button-new-customer"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="venueId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Venue</FormLabel>
                      <div className="flex gap-2">
                        <Popover open={venueSearchOpen} onOpenChange={setVenueSearchOpen}>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={venueSearchOpen}
                                className="justify-between flex-1"
                                data-testid="button-select-venue"
                              >
                                {field.value
                                  ? venues.find((v) => v.id === field.value)?.name
                                  : "Select venue"}
                                <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0">
                            <Command>
                              <CommandInput placeholder="Search venues..." />
                              <CommandEmpty>No venue found.</CommandEmpty>
                              <CommandGroup>
                                <ScrollArea className="h-[200px]">
                                  {venues.map((venue) => (
                                    <CommandItem
                                      key={venue.id}
                                      value={venue.name}
                                      onSelect={() => {
                                        field.onChange(venue.id);
                                        setVenueSearchOpen(false);
                                      }}
                                    >
                                      {venue.name}
                                      <Check
                                        className={cn(
                                          "ml-auto h-4 w-4",
                                          field.value === venue.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </ScrollArea>
                              </CommandGroup>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setVenueDialogOpen(true)}
                          data-testid="button-new-venue"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Gig Type and Status */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gigTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gig Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-gig-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {gigTypes.map((type) => (
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

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Assign Personnel */}
              <FormField
                control={form.control}
                name="assignedPersonnel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign Personnel</FormLabel>
                    <FormDescription>
                      Select DJs and staff for this gig
                    </FormDescription>
                    <Popover open={personnelSearchOpen} onOpenChange={setPersonnelSearchOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={personnelSearchOpen}
                            className="w-full justify-between"
                            data-testid="button-select-personnel"
                          >
                            {selectedPersonnel.length > 0 ? (
                              <div className="flex gap-1 flex-wrap">
                                {selectedPersonnel.map((id) => {
                                  const person = personnel.find((p) => p.id === id);
                                  return person ? (
                                    <Badge key={id} variant="secondary" className="text-xs">
                                      {person.firstName} {person.lastName}
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                            ) : (
                              "Select personnel"
                            )}
                            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput placeholder="Search personnel..." />
                          <CommandEmpty>No personnel found.</CommandEmpty>
                          <CommandGroup>
                            <ScrollArea className="h-[200px]">
                              {personnel.map((person) => (
                                <CommandItem
                                  key={person.id}
                                  value={`${person.firstName} ${person.lastName}`}
                                  onSelect={() => {
                                    const current = field.value || [];
                                    if (current.includes(person.id)) {
                                      field.onChange(
                                        current.filter((id) => id !== person.id)
                                      );
                                    } else {
                                      field.onChange([...current, person.id]);
                                    }
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedPersonnel.includes(person.id)
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {person.firstName} {person.lastName}
                                  {person.isActive ? (
                                    <Badge className="ml-auto" variant="outline">
                                      Active
                                    </Badge>
                                  ) : null}
                                </CommandItem>
                              ))}
                            </ScrollArea>
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Add any additional notes"
                        className="min-h-24"
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Recurring Options */}
              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-recurring"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Recurring Gig</FormLabel>
                      <FormDescription>
                        Create multiple gigs with the same details
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              {isRecurring && (
                <div className="grid grid-cols-2 gap-4 pl-6">
                  <FormField
                    control={form.control}
                    name="recurrenceFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Frequency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-frequency">
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recurrenceCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occurrences</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="1"
                            max="52"
                            placeholder="4"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-occurrences"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={createGigMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createGigMutation.isPending}
                  data-testid="button-submit-gig"
                >
                  {createGigMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {gig ? "Updating..." : "Creating..."}
                    </>
                  ) : gig ? (
                    "Update Gig"
                  ) : (
                    "Create Gig"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>

      {/* Customer creation dialog */}
      <CustomerFormDialog
        open={customerDialogOpen}
        onOpenChange={(isOpen) => {
          setCustomerDialogOpen(isOpen);
          if (!isOpen) {
            // Refresh customers list when dialog closes
            queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
          }
        }}
      />

      {/* Venue creation dialog */}
      <VenueFormDialog
        open={venueDialogOpen}
        onOpenChange={(isOpen) => {
          setVenueDialogOpen(isOpen);
          if (!isOpen) {
            // Refresh venues list when dialog closes
            queryClient.invalidateQueries({ queryKey: ["/api/venues"] });
          }
        }}
      />
    </Dialog>
  );
}