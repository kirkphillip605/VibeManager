import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Music,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Gig } from "@shared/schema";

export default function MyGigsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch user's assigned gigs
  const { data: gigs = [], isLoading } = useQuery<Gig[]>({
    queryKey: ["/api/personnel/me/gigs"],
  });

  // Separate upcoming and past gigs
  const now = new Date();
  const upcomingGigs = useMemo(
    () => gigs.filter((gig) => new Date(gig.endTime) >= now),
    [gigs]
  );
  const pastGigs = useMemo(
    () => gigs.filter((gig) => new Date(gig.endTime) < now),
    [gigs]
  );

  // Pagination for past gigs
  const totalPages = Math.ceil(pastGigs.length / itemsPerPage);
  const paginatedPastGigs = pastGigs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">My Gigs</h1>
        <p className="text-muted-foreground mt-1">
          View your assigned performances and events
        </p>
      </div>

      {/* Upcoming Gigs */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Gigs</CardTitle>
          <CardDescription>
            Your scheduled performances for the coming days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingGigs.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No upcoming gigs assigned</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingGigs.map((gig) => (
                <div
                  key={gig.id}
                  className="flex items-start space-x-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Music className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-lg">{gig.name}</p>
                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(new Date(gig.startTime), "MMM d, yyyy h:mm a")} -{" "}
                            {format(new Date(gig.endTime), "h:mm a")}
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(gig.status || "pending")}
                    </div>
                    {gig.notes && (
                      <p className="text-sm text-muted-foreground">{gig.notes}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        data-testid={`button-view-${gig.id}`}
                      >
                        <a href={`/gigs/${gig.id}`}>View Details</a>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Past Gigs */}
      <Card>
        <CardHeader>
          <CardTitle>Past Gigs</CardTitle>
          <CardDescription>Your completed performances</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {pastGigs.length === 0 ? (
            <div className="text-center py-8">
              <Music className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No past gigs to display</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gig Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPastGigs.map((gig) => (
                    <TableRow key={gig.id}>
                      <TableCell className="font-medium">{gig.name}</TableCell>
                      <TableCell>{format(new Date(gig.startTime), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        {format(new Date(gig.startTime), "h:mm a")} -{" "}
                        {format(new Date(gig.endTime), "h:mm a")}
                      </TableCell>
                      <TableCell>{getStatusBadge(gig.status || "completed")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(currentPage * itemsPerPage, pastGigs.length)} of{" "}
                    {pastGigs.length} results
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}