import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  MapPin,
  Clock,
  Calendar,
  LogIn,
  LogOut,
  Music,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Gig, Venue, Customer } from "@shared/schema";

interface CheckIn {
  id: string;
  gigId: string;
  personnelId: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInLocation?: string;
  checkOutLocation?: string;
  notes?: string;
}

export default function CheckIn() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [checkInNotes, setCheckInNotes] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get current location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
        }
      );
    }
  }, []);

  // Fetch today's gigs for this personnel
  const { data: todaysGigs = [], isLoading: gigsLoading } = useQuery<Gig[]>({
    queryKey: ["/api/my-gigs/today"],
    enabled: !!user,
  });

  // Fetch venues
  const { data: venues = [] } = useQuery<Venue[]>({
    queryKey: ["/api/venues"],
  });

  // Fetch customers
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Fetch check-in status for today's gigs
  const { data: checkIns = [] } = useQuery<CheckIn[]>({
    queryKey: ["/api/my-check-ins"],
    enabled: !!user,
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (gigId: string) => {
      const res = await apiRequest("POST", `/api/gigs/${gigId}/check-in`, {
        checkInTime: new Date().toISOString(),
        checkInLocation: location ? `${location.lat},${location.lng}` : null,
        notes: checkInNotes,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-check-ins"] });
      toast({
        title: "Checked in successfully",
        description: "You have been checked in to the gig.",
      });
      setSelectedGig(null);
      setCheckInNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Check-in failed",
        description: error.message || "Failed to check in",
        variant: "destructive",
      });
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async (gigId: string) => {
      const res = await apiRequest("POST", `/api/gigs/${gigId}/check-out`, {
        checkOutTime: new Date().toISOString(),
        checkOutLocation: location ? `${location.lat},${location.lng}` : null,
        notes: checkInNotes,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-check-ins"] });
      toast({
        title: "Checked out successfully",
        description: "You have been checked out from the gig.",
      });
      setSelectedGig(null);
      setCheckInNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Check-out failed",
        description: error.message || "Failed to check out",
        variant: "destructive",
      });
    },
  });

  const getCheckInStatus = (gigId: string) => {
    const checkIn = checkIns.find(c => c.gigId === gigId);
    if (!checkIn) return "not-checked-in";
    if (checkIn.checkInTime && !checkIn.checkOutTime) return "checked-in";
    if (checkIn.checkInTime && checkIn.checkOutTime) return "checked-out";
    return "not-checked-in";
  };

  const getCheckInTime = (gigId: string) => {
    const checkIn = checkIns.find(c => c.gigId === gigId);
    return checkIn?.checkInTime ? new Date(checkIn.checkInTime) : null;
  };

  if (gigsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Gig Check-In</h1>
        <p className="text-muted-foreground">Check in and out of your assigned gigs</p>
      </div>

      {/* Location Status */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Your Location</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm" data-testid="text-location">
              {location ? "Location services enabled" : "Location services disabled"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Today's Gigs */}
      {todaysGigs.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No gigs scheduled for today</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {todaysGigs.map(gig => {
            const venue = venues.find(v => v.id === gig.venueId);
            const customer = customers.find(c => c.id === gig.customerId);
            const status = getCheckInStatus(gig.id);
            const checkInTime = getCheckInTime(gig.id);

            return (
              <Card key={gig.id} data-testid={`card-gig-${gig.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{gig.name}</CardTitle>
                      <CardDescription>
                        {customer && (customer.businessName || `${customer.firstName} ${customer.lastName}`)}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={status === "checked-in" ? "default" : status === "checked-out" ? "secondary" : "outline"}
                      data-testid={`badge-status-${gig.id}`}
                    >
                      {status === "checked-in" ? "Checked In" : 
                       status === "checked-out" ? "Completed" : 
                       "Not Checked In"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Gig Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{format(new Date(gig.startTime), "MMMM d, yyyy")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(gig.startTime), "h:mm a")} - 
                        {format(new Date(gig.endTime), "h:mm a")}
                      </span>
                    </div>
                    {venue && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <div className="font-medium">{venue.name}</div>
                          {venue.address && (
                            <div className="text-muted-foreground">
                              {venue.address}
                              {venue.city && venue.state && `, ${venue.city}, ${venue.state}`}
                              {venue.zip && ` ${venue.zip}`}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Check-in Time Display */}
                  {checkInTime && (
                    <div className="bg-muted rounded-lg p-3 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Checked in at {format(checkInTime, "h:mm a")}</span>
                      </div>
                    </div>
                  )}

                  {/* Check-in/out Form */}
                  {(status === "not-checked-in" || status === "checked-in") && (
                    <div className="space-y-3 pt-2 border-t">
                      <Textarea
                        placeholder="Add notes (optional)"
                        value={selectedGig?.id === gig.id ? checkInNotes : ""}
                        onChange={(e) => {
                          setCheckInNotes(e.target.value);
                          setSelectedGig(gig);
                        }}
                        className="min-h-[60px]"
                        data-testid={`input-notes-${gig.id}`}
                      />
                      
                      {status === "not-checked-in" ? (
                        <Button
                          className="w-full"
                          onClick={() => {
                            setSelectedGig(gig);
                            checkInMutation.mutate(gig.id);
                          }}
                          disabled={checkInMutation.isPending}
                          data-testid={`button-checkin-${gig.id}`}
                        >
                          {checkInMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Checking In...
                            </>
                          ) : (
                            <>
                              <LogIn className="h-4 w-4 mr-2" />
                              Check In
                            </>
                          )}
                        </Button>
                      ) : (
                        <Button
                          className="w-full"
                          variant="secondary"
                          onClick={() => {
                            setSelectedGig(gig);
                            checkOutMutation.mutate(gig.id);
                          }}
                          disabled={checkOutMutation.isPending}
                          data-testid={`button-checkout-${gig.id}`}
                        >
                          {checkOutMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Checking Out...
                            </>
                          ) : (
                            <>
                              <LogOut className="h-4 w-4 mr-2" />
                              Check Out
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}