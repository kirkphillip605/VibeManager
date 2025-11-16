import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

export default function Home() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // Not logged in - redirect to login
        setLocation("/login");
      } else {
        // Logged in - redirect based on role
        if (user.role === "owner" || user.role === "manager") {
          setLocation("/dashboard");
        } else if (user.role === "personnel") {
          setLocation("/my-gigs");
        } else {
          // Fallback for unknown roles
          setLocation("/login");
        }
      }
    }
  }, [user, isLoading, setLocation]);

  // Show loading state while checking authentication
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
