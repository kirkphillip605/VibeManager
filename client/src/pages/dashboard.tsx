import { useQuery } from "@tanstack/react-query";
import { format, addDays, isAfter, isBefore, startOfDay, endOfDay } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  AlertCircle,
  Music,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Gig } from "@shared/schema";

interface AnalyticsSummary {
  totalRevenue: number;
  activePersonnel: number;
  monthlyRevenue: number;
  personnelWithGigCounts: Array<{ id: string; firstName: string; lastName: string; gigCount: number }>;
}

export default function Dashboard() {
  const { user } = useAuth();
  const today = startOfDay(new Date());
  const sevenDaysFromNow = endOfDay(addDays(today, 7));

  // Fetch upcoming gigs
  const { data: upcomingGigs = [], isLoading: isLoadingUpcoming } = useQuery<Gig[]>({
    queryKey: ["/api/gigs/upcoming"],
  });

  // Fetch pending gigs
  const { data: pendingGigs = [], isLoading: isLoadingPending } = useQuery<Gig[]>({
    queryKey: ["/api/gigs/pending"],
  });

  // Fetch analytics summary
  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/analytics/summary"],
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>;
      case "cancelled":
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {getGreeting()}, {user?.name || "there"}!
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your business today
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gigs This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingGigs.length}</div>
            <p className="text-xs text-muted-foreground">Next 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Confirmations</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingGigs.length}</div>
            <p className="text-xs text-muted-foreground">Requires action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Personnel</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingAnalytics ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">{analytics?.activePersonnel ?? 0}</div>
                <p className="text-xs text-muted-foreground">Available DJs</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoadingAnalytics ? (
              <Skeleton className="h-8 w-24" />
            ) : analytics?.monthlyRevenue ? (
              <>
                <div className="text-2xl font-bold">
                  ${analytics.monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-muted-foreground">This month</p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold">$0</div>
                <p className="text-xs text-muted-foreground">No revenue data available</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upcoming Gigs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Gigs</CardTitle>
              <CardDescription>Next 7 days</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <a href="/gigs" data-testid="link-view-all-gigs">
                View all <ChevronRight className="h-4 w-4" />
              </a>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingUpcoming ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : upcomingGigs.length === 0 ? (
              <div className="text-center py-6">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No upcoming gigs scheduled</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingGigs.slice(0, 5).map((gig) => (
                  <div
                    key={gig.id}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Music className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-sm">{gig.name}</p>
                        {getStatusBadge(gig.status || "pending")}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(gig.startTime), "MMM d, h:mm a")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Gigs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pending Confirmations</CardTitle>
              <CardDescription>Requires your attention</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <a href="/gigs?status=pending" data-testid="link-pending-gigs">
                View all <ChevronRight className="h-4 w-4" />
              </a>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoadingPending ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                ))}
              </div>
            ) : pendingGigs.length === 0 ? (
              <div className="text-center py-6">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No pending confirmations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingGigs.slice(0, 5).map((gig) => (
                  <div
                    key={gig.id}
                    className="flex items-start space-x-3 p-3 rounded-lg hover:bg-accent/50 transition-colors border border-yellow-500/20"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="h-10 w-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                      </div>
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium text-sm">{gig.name}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(gig.startTime), "MMM d, h:mm a")}
                        </span>
                      </div>
                      <Button size="sm" className="mt-2" data-testid={`button-confirm-${gig.id}`}>
                        Confirm Gig
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}