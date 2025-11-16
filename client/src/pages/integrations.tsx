import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Settings,
  Plug,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const squareConfigSchema = z.object({
  accessToken: z.string().min(1, "Access token is required"),
  environment: z.enum(["sandbox", "production"]),
});

type SquareConfigData = z.infer<typeof squareConfigSchema>;

interface SquareConfig {
  id: string;
  accessToken: string;
  environment: string;
  isActive: boolean;
  lastTested?: string;
  testResult?: string;
  createdAt: string;
  updatedAt: string;
}

export default function IntegrationsPage() {
  const { toast } = useToast();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const { data: squareConfig, isLoading } = useQuery<SquareConfig>({
    queryKey: ["/api/integrations/square"],
    retry: false,
  });

  const form = useForm<SquareConfigData>({
    resolver: zodResolver(squareConfigSchema),
    defaultValues: {
      accessToken: squareConfig?.accessToken || "",
      environment: (squareConfig?.environment as "sandbox" | "production") || "sandbox",
    },
    values: squareConfig ? {
      accessToken: squareConfig.accessToken,
      environment: squareConfig.environment as "sandbox" | "production",
    } : undefined,
  });

  const saveSquareConfigMutation = useMutation({
    mutationFn: async (data: SquareConfigData) => {
      const method = squareConfig ? "PUT" : "POST";
      const url = squareConfig 
        ? `/api/integrations/square/${squareConfig.id}`
        : "/api/integrations/square";
      const res = await apiRequest(method, url, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/square"] });
      toast({
        title: "Success",
        description: "Square integration saved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save Square integration",
        variant: "destructive",
      });
    },
  });

  const testSquareConnectionMutation = useMutation({
    mutationFn: async () => {
      const data = form.getValues();
      const res = await apiRequest("POST", "/api/integrations/square/test", data);
      return await res.json();
    },
    onSuccess: (data) => {
      setTestResult({ success: true, message: data.message || "Connection successful!" });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations/square"] });
      toast({
        title: "Success",
        description: "Square connection test passed!",
      });
    },
    onError: (error: Error) => {
      setTestResult({ 
        success: false, 
        message: error.message || "Connection test failed. Please check your access token." 
      });
      toast({
        title: "Test Failed",
        description: error.message || "Connection test failed",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SquareConfigData) => {
    saveSquareConfigMutation.mutate(data);
  };

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    await testSquareConnectionMutation.mutateAsync();
    setIsTesting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Integrations
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage third-party integrations and API connections
        </p>
      </div>

      {/* Square Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Plug className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle>Square Integration</CardTitle>
                <CardDescription>
                  Connect to Square for payment processing and invoicing
                </CardDescription>
              </div>
            </div>
            {squareConfig?.isActive && (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>How to get your Square Access Token</AlertTitle>
            <AlertDescription className="space-y-2 mt-2">
              <ol className="list-decimal list-inside space-y-1">
                <li>
                  Log in to your{" "}
                  <a 
                    href="https://developer.squareup.com/apps" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center"
                  >
                    Square Developer Dashboard
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </li>
                <li>Select your application or create a new one</li>
                <li>Go to the "Credentials" tab</li>
                <li>Copy your Access Token (use Sandbox for testing, Production for live)</li>
                <li>Paste it below and test the connection</li>
              </ol>
              <div className="mt-3 p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">Important:</p>
                <ul className="text-sm list-disc list-inside mt-1 space-y-1">
                  <li>Keep your access token secure and never share it publicly</li>
                  <li>Use Sandbox environment for testing before going live</li>
                  <li>Square data is read-only in the VibeManager UI</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Configuration Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="environment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Environment</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-environment">
                          <SelectValue placeholder="Select environment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sandbox">Sandbox (Testing)</SelectItem>
                        <SelectItem value="production">Production (Live)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Use Sandbox for testing, Production for live transactions
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accessToken"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Token</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter your Square access token"
                        data-testid="input-access-token"
                      />
                    </FormControl>
                    <FormDescription>
                      Your Square API access token (will be encrypted)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Test Result */}
              {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"}>
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {testResult.success ? "Connection Successful" : "Connection Failed"}
                  </AlertTitle>
                  <AlertDescription>{testResult.message}</AlertDescription>
                </Alert>
              )}

              {/* Last Test Info */}
              {squareConfig?.lastTested && (
                <div className="text-sm text-muted-foreground">
                  Last tested: {new Date(squareConfig.lastTested).toLocaleString()}
                  {squareConfig.testResult && ` - ${squareConfig.testResult}`}
                </div>
              )}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleTest}
            disabled={isTesting || !form.getValues().accessToken}
            data-testid="button-test-connection"
          >
            {isTesting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Testing...
              </>
            ) : (
              "Test Connection"
            )}
          </Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={saveSquareConfigMutation.isPending}
            data-testid="button-save-config"
          >
            {saveSquareConfigMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Configuration"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
