import {
  Calendar,
  Users,
  Building2,
  UserCheck,
  Settings,
  Home,
  Music,
  FileText,
  DollarSign,
  LogOut,
  UserCircle,
  BarChart3,
  MapPin,
  FolderOpen,
  Loader2,
} from "lucide-react";
import { useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AppSidebar() {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();

  if (!user) return null;

  const isOwnerOrManager = user.role === "owner" || user.role === "manager";
  const isOwner = user.role === "owner";

  // Define menu items based on role
  const mainMenuItems = isOwnerOrManager
    ? [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: Home,
        },
        {
          title: "Calendar",
          url: "/calendar",
          icon: Calendar,
        },
      ]
    : [
        {
          title: "My Profile",
          url: "/profile",
          icon: UserCircle,
        },
        {
          title: "Check In/Out",
          url: "/check-in",
          icon: MapPin,
        },
        {
          title: "My Gigs",
          url: "/my-gigs",
          icon: Calendar,
        },
        {
          title: "My Payouts",
          url: "/my-payouts",
          icon: DollarSign,
        },
        {
          title: "My Documents",
          url: "/my-documents",
          icon: FileText,
        },
      ];

  const clientsGigsItems = isOwnerOrManager
    ? [
        {
          title: "Customers",
          url: "/customers",
          icon: UserCheck,
        },
        {
          title: "Contacts",
          url: "/contacts",
          icon: FileText,
        },
        {
          title: "Venues",
          url: "/venues",
          icon: Building2,
        },
        {
          title: "Gigs",
          url: "/gigs",
          icon: Music,
        },
      ]
    : [];

  const paymentsItems = isOwnerOrManager
    ? [
        {
          title: "Invoices",
          url: "/invoices",
          icon: DollarSign,
        },
      ]
    : [];

  const djItems = isOwnerOrManager
    ? [
        {
          title: "Personnel",
          url: "/personnel",
          icon: Users,
        },
      ]
    : [];

  const additionalItems = isOwnerOrManager
    ? [
        {
          title: "Analytics",
          url: "/analytics",
          icon: BarChart3,
        },
        {
          title: "Files",
          url: "/files",
          icon: FolderOpen,
        },
      ]
    : [];

  const adminItems = isOwner
    ? [
        {
          title: "Settings",
          url: "/settings",
          icon: Settings,
        },
      ]
    : [];

  const handleLogout = () => {
    logoutMutation.mutate();
    setLocation("/login");
  };

  const getUserInitials = () => {
    if (user.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email.slice(0, 2).toUpperCase();
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Music className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">DJ & Karaoke</h2>
            <p className="text-xs text-muted-foreground">Business Management</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            {isOwnerOrManager ? "Main Navigation" : "My Portal"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    data-active={location === item.url ? "true" : undefined}
                  >
                    <a href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {clientsGigsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Clients & Gigs</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {clientsGigsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      data-active={location === item.url ? "true" : undefined}
                    >
                      <a href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {paymentsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Payments/Payouts</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {paymentsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      data-active={location === item.url ? "true" : undefined}
                    >
                      <a href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {djItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>DJ's</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {djItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      data-active={location === item.url ? "true" : undefined}
                    >
                      <a href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {additionalItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Additional</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {additionalItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      data-active={location === item.url ? "true" : undefined}
                    >
                      <a href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {adminItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      data-active={location === item.url ? "true" : undefined}
                    >
                      <a href={item.url} data-testid={`link-${item.title.toLowerCase()}`}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="border-t p-4">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">{getUserInitials()}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name || "User"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="w-full"
          data-testid="button-logout"
        >
          {logoutMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          <span>Logout</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}