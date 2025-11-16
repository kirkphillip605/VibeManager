import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { 
  TrendingUp, TrendingDown, Users, DollarSign, 
  Calendar, Music, Building2, AlertCircle 
} from "lucide-react";
import { useState } from "react";
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { Gig, Personnel, Customer, Venue } from "@shared/schema";

// Define color palette for charts
const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
}

function MetricCard({ title, value, description, icon, trend, trendLabel }: MetricCardProps) {
  const testId = title.toLowerCase().replace(/\s+/g, '-');
  return (
    <Card data-testid={`card-metric-${testId}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`value-${testId}`}>{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground" data-testid={`description-${testId}`}>{description}</p>
        )}
        {trend !== undefined && (
          <div className="flex items-center gap-1 mt-2" data-testid={`trend-${testId}`}>
            {trend > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span className={`text-xs font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(trend)}%
            </span>
            {trendLabel && (
              <span className="text-xs text-muted-foreground ml-1">{trendLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("6");

  interface AnalyticsSummary {
    totalRevenue: number;
    activePersonnel: number;
    monthlyRevenue: number;
    personnelWithGigCounts: Array<{ id: string; firstName: string; lastName: string; gigCount: number }>;
  }

  // Fetch all data
  const { data: gigs = [] } = useQuery<Gig[]>({
    queryKey: ["/api/gigs"],
  });

  const { data: personnel = [] } = useQuery<Personnel[]>({
    queryKey: ["/api/personnel"],
  });

  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: venues = [] } = useQuery<Venue[]>({
    queryKey: ["/api/venues"],
  });

  const { data: analyticsSummary } = useQuery<AnalyticsSummary>({
    queryKey: ["/api/analytics/summary"],
  });

  // Calculate date range
  const endDate = new Date();
  const startDate = subMonths(endDate, parseInt(timeRange));

  // Filter gigs within date range
  const filteredGigs = gigs.filter(gig => {
    const gigDate = new Date(gig.startTime);
    return gigDate >= startDate && gigDate <= endDate;
  });

  // Calculate metrics
  const totalRevenue = analyticsSummary?.totalRevenue || 0;
  const totalGigs = filteredGigs.length;
  const completedGigs = filteredGigs.filter(g => g.status === 'completed').length;
  const upcomingGigs = filteredGigs.filter(g => {
    const gigDate = new Date(g.startTime);
    return gigDate >= new Date() && g.status !== 'cancelled';
  }).length;
  const averageGigValue = totalGigs > 0 ? totalRevenue / totalGigs : 0;
  const completionRate = totalGigs > 0 ? (completedGigs / totalGigs) * 100 : 0;

  // Calculate personnel utilization from analytics summary
  const personnelUtilization = personnel.map(p => {
    const personnelData = analyticsSummary?.personnelWithGigCounts.find(pc => pc.id === p.id);
    const gigsAssigned = personnelData?.gigCount || 0;
    // Calculate utilization as percentage of total gigs in period
    const utilization = totalGigs > 0 ? Math.round((gigsAssigned / totalGigs) * 100) : 0;
    return {
      name: `${p.firstName} ${p.lastName}`,
      gigs: gigsAssigned,
      utilization,
    };
  });

  // Revenue by month
  // Note: This calculates gigs per month but revenue data requires invoice integration per month
  const monthlyRevenue = eachMonthOfInterval({
    start: startDate,
    end: endDate,
  }).map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const monthGigs = filteredGigs.filter(gig => {
      const gigDate = new Date(gig.startTime);
      return gigDate >= monthStart && gigDate <= monthEnd;
    });
    // Revenue per month would require fetching invoices by date range
    // For now showing 0 with note that invoice integration is needed
    const revenue = 0;
    return {
      month: format(month, 'MMM'),
      revenue,
      gigs: monthGigs.length,
    };
  });

  // Gigs by type
  const gigsByType = filteredGigs.reduce((acc, gig) => {
    const type = gig.gigTypeId || 'Unspecified';
    if (!acc[type]) {
      acc[type] = { name: type, value: 0 };
    }
    acc[type].value++;
    return acc;
  }, {} as Record<string, { name: string; value: number }>);

  const gigTypeData = Object.values(gigsByType);

  // Top customers by gig count (revenue requires invoice integration by customer)
  const customerRevenue = customers.map(customer => {
    const customerGigs = filteredGigs.filter(g => g.customerId === customer.id);
    // Revenue by customer would require aggregating invoices per customer
    const revenue = 0;
    return {
      name: customer.businessName || `${customer.firstName} ${customer.lastName}`,
      revenue,
      gigs: customerGigs.length,
    };
  }).sort((a, b) => b.gigs - a.gigs).slice(0, 5);

  // Top venues by gig count (revenue requires invoice integration by venue)
  const venueStats = venues.map(venue => {
    const venueGigs = filteredGigs.filter(g => g.venueId === venue.id);
    return {
      name: venue.name,
      gigs: venueGigs.length,
      // Revenue by venue would require aggregating invoices per venue
      revenue: 0,
    };
  }).sort((a, b) => b.gigs - a.gigs).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Monitor your business performance and insights</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40" data-testid="select-time-range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last Month</SelectItem>
            <SelectItem value="3">Last 3 Months</SelectItem>
            <SelectItem value="6">Last 6 Months</SelectItem>
            <SelectItem value="12">Last Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={totalRevenue > 0 ? `$${totalRevenue.toLocaleString()}` : "$0"}
          description={totalRevenue > 0 ? "From all completed gigs" : "No paid invoices yet"}
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Total Gigs"
          value={totalGigs}
          description={`${completedGigs} completed, ${upcomingGigs} upcoming`}
          icon={<Music className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Average Gig Value"
          value={averageGigValue > 0 ? `$${averageGigValue.toFixed(0)}` : "$0"}
          description={averageGigValue > 0 ? "Per event" : "No invoice data available"}
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard
          title="Completion Rate"
          value={`${completionRate.toFixed(1)}%`}
          description="Successfully completed gigs"
          icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      {/* Charts */}
      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue" data-testid="tab-revenue">Revenue</TabsTrigger>
          <TabsTrigger value="gigs" data-testid="tab-gigs">Gigs</TabsTrigger>
          <TabsTrigger value="customers" data-testid="tab-customers">Customers</TabsTrigger>
          <TabsTrigger value="venues" data-testid="tab-venues">Venues</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
                <CardDescription>
                  {totalRevenue > 0 
                    ? "Revenue trends over time" 
                    : "No revenue data available - add paid invoices to see trends"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {totalRevenue > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => `$${value.toLocaleString()}`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        name="Revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    <div className="text-center space-y-2">
                      <AlertCircle className="h-12 w-12 mx-auto opacity-20" />
                      <p className="text-sm">No revenue data to display</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gigs by Type</CardTitle>
                <CardDescription>Distribution of gig types</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={gigTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {gigTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gigs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Gigs Over Time</CardTitle>
              <CardDescription>Number of gigs per month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="gigs" fill="hsl(var(--primary))" name="Number of Gigs" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
              <CardDescription>By revenue generated</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerRevenue.map((customer, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        <span className="text-sm font-medium">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer.gigs} gigs
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${customer.revenue.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {customerRevenue.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No customer data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="venues" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Popular Venues</CardTitle>
              <CardDescription>Most frequently used venues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {venueStats.map((venue, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{venue.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {venue.gigs} events
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      ${venue.revenue.toLocaleString()}
                    </Badge>
                  </div>
                ))}
                {venueStats.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    No venue data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Insights */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personnel Performance</CardTitle>
            <CardDescription>Top performers this period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {personnelUtilization.length > 0 ? (
                personnelUtilization
                  .sort((a, b) => b.gigs - a.gigs)
                  .slice(0, 5)
                  .map((p) => {
                    const person = personnel.find(pers => `${pers.firstName} ${pers.lastName}` === p.name);
                    return (
                      <div key={person?.id || p.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium" data-testid={`text-personnel-${person?.id}`}>
                            {p.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" data-testid={`badge-gigs-${person?.id}`}>
                            {p.gigs} {p.gigs === 1 ? 'gig' : 'gigs'}
                          </Badge>
                          <span className="text-sm text-muted-foreground" data-testid={`text-utilization-${person?.id}`}>
                            {p.utilization}% utilization
                          </span>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No personnel data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <button className="flex items-center gap-2 p-3 rounded-lg hover-elevate text-left" data-testid="button-export-revenue">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">Export Revenue Report</span>
              </button>
              <button className="flex items-center gap-2 p-3 rounded-lg hover-elevate text-left" data-testid="button-export-gig">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Export Gig Schedule</span>
              </button>
              <button className="flex items-center gap-2 p-3 rounded-lg hover-elevate text-left" data-testid="button-export-personnel">
                <Users className="h-4 w-4" />
                <span className="text-sm">Personnel Utilization Report</span>
              </button>
              <button className="flex items-center gap-2 p-3 rounded-lg hover-elevate text-left" data-testid="button-export-customer">
                <Building2 className="h-4 w-4" />
                <span className="text-sm">Customer Analysis</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}