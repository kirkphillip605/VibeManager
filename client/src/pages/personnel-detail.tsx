import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PersonnelFormDialog } from "@/components/personnel-form-dialog";
import {
  Users,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Shield,
  ChevronLeft,
  Edit,
  FileText,
  DollarSign,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Personnel, PersonnelType } from "@shared/schema";

export default function PersonnelDetailPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const personnelId = params.id;
  const [showSSN, setShowSSN] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Fetch personnel details
  const { data: personnel, isLoading: loadingPersonnel } = useQuery<Personnel>({
    queryKey: [`/api/personnel/${personnelId}`],
    enabled: !!personnelId,
  });

  // Fetch personnel types
  const { data: personnelTypes = [] } = useQuery<PersonnelType[]>({
    queryKey: ["/api/personnel-types"],
  });

  // Fetch personnel statistics
  const { data: stats } = useQuery<{
    totalGigs: number;
    gigsThisMonth: number;
    totalEarnings: number;
    documentsUploaded: number;
  }>({
    queryKey: [`/api/personnel/${personnelId}/stats`],
    enabled: !!personnelId,
  });

  if (loadingPersonnel) {
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

  if (!personnel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <p className="text-lg text-muted-foreground">Personnel not found</p>
        <Button onClick={() => setLocation("/personnel")}>
          <ChevronLeft className="h-4 w-4" />
          Back to Personnel
        </Button>
      </div>
    );
  }

  const getPersonnelType = () => {
    if (!personnel.personnelTypeId) return null;
    const type = personnelTypes.find((t) => t.id === personnel.personnelTypeId);
    return type?.name;
  };

  const getAddress = () => {
    const parts = [
      personnel.address1,
      personnel.address2,
      personnel.city,
      personnel.state,
      personnel.zip,
    ].filter(Boolean);
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
            onClick={() => setLocation("/personnel")}
            data-testid="button-back"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Users className="h-8 w-8 text-muted-foreground" />
              {personnel.firstName} {personnel.middleName} {personnel.lastName}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {getPersonnelType() && <Badge variant="outline">{getPersonnelType()}</Badge>}
              {personnel.isActive ? (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Active
                </Badge>
              ) : (
                <Badge className="bg-red-500/10 text-red-600 border-red-500/20">
                  <XCircle className="h-3 w-3 mr-1" />
                  Inactive
                </Badge>
              )}
            </div>
          </div>
        </div>
        <Button onClick={() => setEditDialogOpen(true)}>
          <Edit className="h-4 w-4" />
          Edit Personnel
        </Button>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Contact</p>
                <div className="space-y-1 mt-1">
                  <p className="flex items-center gap-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {personnel.email}
                  </p>
                  {personnel.phone && (
                    <p className="flex items-center gap-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {personnel.phone}
                    </p>
                  )}
                </div>
              </div>
              {personnel.dob && (
                <div>
                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                  <p className="flex items-center gap-1 mt-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    {format(new Date(personnel.dob), "MMMM d, yyyy")}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              {getAddress() && (
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="flex items-start gap-1 mt-1">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    {getAddress()}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">System Information</p>
                {personnel.ssn ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 mt-1 cursor-pointer hover:bg-accent/50 rounded p-1 transition-colors">
                          <Shield className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            SSN: {showSSN ? personnel.ssn : "•••-••-••••"}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={() => setShowSSN(!showSSN)}
                          >
                            {showSSN ? (
                              <EyeOff className="h-3 w-3" />
                            ) : (
                              <Eye className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Click the eye icon to {showSSN ? "hide" : "show"} SSN</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <p className="text-sm mt-1">
                    <Shield className="inline h-3 w-3 text-muted-foreground mr-1" />
                    SSN: Not provided
                  </p>
                )}
                <p className="text-sm mt-1">
                  Member since {format(new Date(personnel.createdAt), "MMMM yyyy")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gigs</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalGigs || 0}
            </div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.gigsThisMonth || 0}
            </div>
            <p className="text-xs text-muted-foreground">Gigs scheduled</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earned</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats?.totalEarnings || 0}
            </div>
            <p className="text-xs text-muted-foreground">All payouts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.documentsUploaded || 0}
            </div>
            <p className="text-xs text-muted-foreground">Files uploaded</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for this personnel</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button
              className="justify-start"
              onClick={() => setLocation(`/gigs?personnel=${personnelId}`)}
            >
              <Calendar className="h-4 w-4" />
              View Assigned Gigs
            </Button>
            <Button
              className="justify-start"
              variant="outline"
              onClick={() => setLocation(`/personnel/${personnelId}/payouts`)}
            >
              <DollarSign className="h-4 w-4" />
              View Payout History
            </Button>
            <Button
              className="justify-start"
              variant="outline"
              onClick={() => setLocation(`/personnel/${personnelId}/documents`)}
            >
              <FileText className="h-4 w-4" />
              View Documents
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span>Assigned to "Birthday Party" gig</span>
                <span className="text-muted-foreground ml-auto">2 days ago</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-blue-500" />
                <span>Payout processed: $250</span>
                <span className="text-muted-foreground ml-auto">5 days ago</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-yellow-500" />
                <span>W-4 document uploaded</span>
                <span className="text-muted-foreground ml-auto">1 week ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Personnel Dialog */}
      <PersonnelFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        personnel={personnel}
      />
    </div>
  );
}