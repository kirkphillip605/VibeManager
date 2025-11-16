import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  MapPin,
  Phone,
  Globe,
  Users as UsersIcon,
  Calendar,
  Music,
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
import { Venue, VenueType, Contact, Gig } from "@shared/schema";

export default function VenueDetailPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const venueId = params.id;

  // Fetch venue details
  const { data: venue, isLoading: loadingVenue } = useQuery<Venue>({
    queryKey: [`/api/venues/${venueId}`],
    enabled: !!venueId,
  });

  // Fetch venue types
  const { data: venueTypes = [] } = useQuery<VenueType[]>({
    queryKey: ["/api/venue-types"],
  });

  // Fetch venue contacts
  const { data: contacts = [], isLoading: loadingContacts } = useQuery<Contact[]>({
    queryKey: [`/api/venues/${venueId}/contacts`],
    enabled: !!venueId,
  });

  // Fetch venue gigs
  const { data: gigs = [], isLoading: loadingGigs } = useQuery<Gig[]>({
    queryKey: [`/api/venues/${venueId}/gigs`],
    enabled: !!venueId,
  });

  if (loadingVenue) {
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

  if (!venue) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-lg text-muted-foreground">Venue not found</p>
        <Button onClick={() => setLocation("/venues")}>
          <ChevronLeft className="h-4 w-4" />
          Back to Venues
        </Button>
      </div>
    );
  }

  const getVenueType = () => {
    if (!venue.venueTypeId) return null;
    const type = venueTypes.find((t) => t.id === venue.venueTypeId);
    return type?.name;
  };

  const getAddress = () => {
    const parts = [venue.address, venue.city, venue.state, venue.zip].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/venues")}
            data-testid="button-back"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8 text-muted-foreground" />
              {venue.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {getVenueType() && <Badge variant="outline">{getVenueType()}</Badge>}
              {venue.occupancy && (
                <Badge variant="secondary">
                  <UsersIcon className="h-3 w-3 mr-1" />
                  Capacity: {venue.occupancy}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button onClick={() => setLocation(`/venues?edit=${venueId}`)}>
          <Edit className="h-4 w-4" />
          Edit Venue
        </Button>
      </div>

      {/* Venue Information */}
      <Card>
        <CardHeader>
          <CardTitle>Venue Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Location</p>
              {getAddress() ? (
                <p className="flex items-start gap-1 mt-1">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  {getAddress()}
                </p>
              ) : (
                <p className="text-muted-foreground">—</p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contact</p>
              <div className="space-y-1 mt-1">
                {venue.phone ? (
                  <p className="flex items-center gap-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {venue.phone}
                  </p>
                ) : null}
                {venue.website ? (
                  <p className="flex items-center gap-1">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <a
                      href={venue.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      Website
                    </a>
                  </p>
                ) : null}
                {!venue.phone && !venue.website && (
                  <p className="text-muted-foreground">—</p>
                )}
              </div>
            </div>
          </div>
          {venue.notes && (
            <div>
              <p className="text-sm text-muted-foreground">Notes</p>
              <p className="mt-1">{venue.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Venue Contacts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Venue Contacts</CardTitle>
              <CardDescription>People associated with this venue</CardDescription>
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
                <UsersIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
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
                            {contact.email}
                          </span>
                        )}
                        {contact.phone && (
                          <span className="text-sm text-muted-foreground">
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

        {/* Upcoming Gigs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Gigs at this Venue</CardTitle>
              <CardDescription>Scheduled performances</CardDescription>
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
                <p className="text-sm text-muted-foreground">No gigs scheduled</p>
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
                    onClick={() => setLocation(`/gigs?venue=${venueId}`)}
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