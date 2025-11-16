import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Building,
  User,
  Mail,
  Phone,
  Calendar,
  Music,
  Users,
  MapPin,
  ChevronLeft,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Customer, Contact, Gig } from "@shared/schema";

export default function CustomerDetailPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const customerId = params.id;

  // Fetch customer details
  const { data: customer, isLoading: loadingCustomer } = useQuery<Customer>({
    queryKey: [`/api/customers/${customerId}`],
    enabled: !!customerId,
  });

  // Fetch customer contacts
  const { data: contacts = [], isLoading: loadingContacts } = useQuery<Contact[]>({
    queryKey: [`/api/customers/${customerId}/contacts`],
    enabled: !!customerId,
  });

  // Fetch customer gigs
  const { data: gigs = [], isLoading: loadingGigs } = useQuery<Gig[]>({
    queryKey: [`/api/customers/${customerId}/gigs`],
    enabled: !!customerId,
  });

  if (loadingCustomer) {
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

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-lg text-muted-foreground">Customer not found</p>
        <Button onClick={() => setLocation("/customers")}>
          <ChevronLeft className="h-4 w-4" />
          Back to Customers
        </Button>
      </div>
    );
  }

  const getCustomerName = () => {
    if (customer.type === "business") {
      return customer.businessName || "—";
    }
    return `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "—";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/customers")}
            data-testid="button-back"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {customer.type === "business" ? (
                <Building className="h-8 w-8 text-muted-foreground" />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
              {getCustomerName()}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">
                {customer.type === "business" ? "Business" : "Person"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Customer since {format(new Date(customer.createdAt), "MMM yyyy")}
              </span>
            </div>
          </div>
        </div>
        <Button onClick={() => setLocation(`/customers?edit=${customerId}`)}>
          <Edit className="h-4 w-4" />
          Edit Customer
        </Button>
      </div>

      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Primary Email</p>
              {customer.primaryEmail ? (
                <p className="flex items-center gap-1 mt-1">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {customer.primaryEmail}
                </p>
              ) : (
                <p className="text-muted-foreground">—</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Primary Phone</p>
              {customer.primaryPhone ? (
                <p className="flex items-center gap-1 mt-1">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {customer.primaryPhone}
                </p>
              ) : (
                <p className="text-muted-foreground">—</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Associated Contacts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Associated Contacts</CardTitle>
              <CardDescription>People connected to this customer</CardDescription>
            </div>
            <Badge variant="secondary">{contacts.length} contacts</Badge>
          </CardHeader>
          <CardContent>
            {loadingContacts ? (
              <div className="space-y-2">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : contacts.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No contacts associated</p>
              </div>
            ) : (
              <div className="space-y-3">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-start justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium">
                        {contact.firstName} {contact.lastName}
                      </p>
                      {contact.title && (
                        <p className="text-sm text-muted-foreground">{contact.title}</p>
                      )}
                      <div className="flex flex-col gap-1 mt-1">
                        {contact.email && (
                          <span className="text-sm text-muted-foreground">
                            <Mail className="inline h-3 w-3 mr-1" />
                            {contact.email}
                          </span>
                        )}
                        {contact.phone && (
                          <span className="text-sm text-muted-foreground">
                            <Phone className="inline h-3 w-3 mr-1" />
                            {contact.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Gigs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Gigs</CardTitle>
              <CardDescription>Events booked by this customer</CardDescription>
            </div>
            <Badge variant="secondary">{gigs.length} total</Badge>
          </CardHeader>
          <CardContent>
            {loadingGigs ? (
              <div className="space-y-2">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : gigs.length === 0 ? (
              <div className="text-center py-8">
                <Music className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No gigs booked yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {gigs.slice(0, 5).map((gig) => (
                  <a
                    key={gig.id}
                    href={`/gigs/${gig.id}`}
                    className="block p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                    data-testid={`link-gig-${gig.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{gig.name}</p>
                        <p className="text-sm text-muted-foreground">
                          <Calendar className="inline h-3 w-3 mr-1" />
                          {format(new Date(gig.startTime), "MMM d, yyyy h:mm a")}
                        </p>
                      </div>
                      {gig.status === "confirmed" ? (
                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                          Confirmed
                        </Badge>
                      ) : gig.status === "pending" ? (
                        <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                          Pending
                        </Badge>
                      ) : (
                        <Badge variant="outline">{gig.status}</Badge>
                      )}
                    </div>
                  </a>
                ))}
                {gigs.length > 5 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setLocation(`/gigs?customer=${customerId}`)}
                  >
                    View All Gigs ({gigs.length})
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}